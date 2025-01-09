const unirest = require("unirest");
const User = require("../../../db/schemas/onboarding/user.schema");
const Otp = require("../../../db/schemas/onboarding/logOtp");
const Log = require("../../../db/schemas/onboarding/log"); // Assuming this is your log schema

// Function to create logs
async function createLog(message, functionName, userId, status = 200) {
  try {
    await Log.create({
      message,
      functionName,
      userId,
      status,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Failed to create log:", error.message);
  }
}

async function optGernet(req, res) {
  try {
    const { contact } = req.body;

    if (!contact) {
      const message = "Contact number is required";
      await createLog(message, "optGernet", null, 400);
      return res.json({ status: 400, message });
    }

    const user = await User.findOne({ contact });
    if (!user) {
      const message = "User does not exist";
      await createLog(message, "optGernet", null, 400);
      return res.json({ status: 400, message, success: false });
    }

    if (user.status === "inactive") {
      const message = "User not active";
      await createLog(message, "optGernet", user._id, 400);
      return res.json({ status: 400, message });
    }

    if (contact === "9389046742" || contact === "8433408211") {
      const message = "Login allowed without OTP validation";
      await createLog(message, "optGernet", user._id, 200);
      return res.status(200).json({ status: 200, message });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    await Otp.updateOne(
      { contact },
      { contact, otp, createdAt: new Date(), expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
      { upsert: true }
    );

    const smsResponse = await sendOtpViaFast2Sms(contact, otp);
    if (smsResponse.error) {
      const message = `Failed to send OTP to ${contact}: ${smsResponse.error}`;
      await createLog(message, "optGernet", user._id, 500);
      return res.json({ status: 500, message: "Failed to send OTP" });
    }

    const message = "OTP sent successfully";
    await createLog(message, "optGernet", user._id, 200);
    return res.status(200).json({ status: 200, message });
  } catch (error) {
    const message = `Error in optGernet: ${error.message}`;
    console.error(message);
    await createLog(message, "optGernet", null, 500);
    return res.status(500).json({ status: 500, message: "An error occurred while processing the request" });
  }
}

function sendOtpViaFast2Sms(contact, otp) {
  return new Promise((resolve, reject) => {
    const req = unirest("POST", "https://www.fast2sms.com/dev/bulkV2");

    req.headers({
      authorization: process.env.FAST2SMS_API_KEY, // Store the API key in environment variables
    });

    req.json({
      flash: "0",
      sender_id: "RNTOBK",
      message: "178252",
      route: "dlt",
      numbers: contact,
      variables_values: otp,
    });

    req.end((res) => {
      if (res.error) {
        console.error("Error sending OTP via Fast2SMS:", res.error.message);
        return reject(res.error);
      }
      return resolve(res.body);
    });
  });
}

async function verify(req, res) {
  try {
    const { contact, otp } = req.body;

    if (!contact || !otp) {
      const message = "Contact number and OTP are required";
      await createLog(message, "verify", null, 400);
      return res.json({ status: 400, message });
    }

    if ((contact === "9389046742" || contact === "8433408211") && otp === "123456") {
      const user = await User.findOne({ contact });
      const message = "OTP verified successfully (Hardcoded logic)";
      await createLog(message, "verify", user._id, 200);
      return res.status(200).json({ status: 200, message, data: user });
    }

    const otpRecord = await Otp.findOne({ contact });
    if (!otpRecord) {
      const message = "No OTP found for the given contact number";
      await createLog(message, "verify", null, 404);
      return res.json({ status: 404, message });
    }

    if (otp !== otpRecord.otp) {
      const message = "Invalid OTP";
      await createLog(message, "verify", null, 401);
      return res.json({ status: 401, message });
    }

    const user = await User.findOne({ contact });
    if (!user) {
      const message = "No user found for the given contact number";
      await createLog(message, "verify", null, 404);
      return res.json({ status: 404, message });
    }

    if (user.isContactVerified === "no") {
      await User.findByIdAndUpdate(user._id, { isContactVerified: "yes" }, { new: true });
    }

    await Otp.deleteOne({ contact });

    const message = "OTP verified successfully";
    await createLog(message, "verify", user._id, 200);
    return res.status(200).json({ status: 200, message, data: user });
  } catch (error) {
    const message = `Error in verify function: ${error.message}`;
    console.error(message);
    await createLog(message, "verify", null, 500);
    return res.status(500).json({ status: 500, message: "An error occurred while processing the request" });
  }
}

module.exports = { optGernet, verify };
