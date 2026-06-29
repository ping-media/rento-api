// const unirest = require("unirest");
const axios = require("axios");
const User = require("../../../db/schemas/onboarding/user.schema");
const Document = require("../../../db/schemas/onboarding/DocumentUpload.Schema");
const Otp = require("../../../db/schemas/onboarding/logOtp");
const Log = require("../../../db/schemas/onboarding/log");
const { mongoose } = require("mongoose");
const { updatePushToken } = require("../../../utils/updatePushToken");
const Booking = require("../../../db/schemas/onboarding/booking.schema");
require("dotenv").config();

// const ObjectId = mongoose.Types.ObjectId;

const DEMOACCOUNT = process.env.ENVIRONMENT;

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

async function otpGenerat(req, res) {
  try {
    const { contact, pushToken } = req.body;

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

    if (user?.isDeleted) {
      const message = "This account has been deleted";
      await createLog(message, "optGernet", user._id, 403);
      return res.json({ status: 403, message, success: false });
    }

    // this is for mobile devices when every user login this token will be store in db
    let errorMessage = "";

    if (pushToken) {
      const tokenResponse = await updatePushToken(user._id, pushToken);

      if (!tokenResponse.success) {
        errorMessage = tokenResponse.message || "Push token update failed";
      }
    }

    // if (pushToken && pushToken !== "") {
    //   const updateResult = await User.updateOne(
    //     { _id: user._id },
    //     {
    //       $set: {
    //         mobileToken: pushToken,
    //       },
    //     },
    //   );
    //   if (updateResult.modifiedCount === 0) {
    //     errorMessage = "Push token update failed: no document modified";
    //   }
    // }

    if (contact === DEMOACCOUNT) {
      const message = "Login allowed without OTP validation";
      await createLog(message, "optGernet", user._id, 200);
      return res
        .status(200)
        .json({ status: 200, message, error: errorMessage });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    await Otp.updateOne(
      { contact },
      {
        contact,
        otp,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
      { upsert: true },
    );

    if (process.env.NODE_ENV === "production") {
      const smsResponse = await sendOtpViaFast2Sms(contact, otp);
      if (smsResponse.error) {
        const message = `Failed to send OTP to ${contact}: ${smsResponse.error}`;
        await createLog(message, "optGernet", user._id, 500);
        return res.json({ status: 500, message: "Failed to send OTP" });
      }
    }

    const message = "OTP sent successfully";
    await createLog(message, "optGernet", user._id, 200);
    return res.status(200).json({ status: 200, message, error: errorMessage });
  } catch (error) {
    const message = `Error in optGernet: ${error.message}`;
    console.error(message);
    await createLog(message, "optGernet", null, 500);
    return res.status(500).json({
      status: 500,
      message: "An error occurred while processing the request",
    });
  }
}

async function softDeleteUser(req, res) {
  try {
    const { userId, reason } = req.body;

    if (!userId) {
      return res.json({ status: 400, message: "User ID is required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.json({ status: 404, message: "User not found" });
    }

    if (user.contact === process.env.ENVIRONMENT) {
      return res.json({
        status: 400,
        message: "Demo customer can't be deleted.",
      });
    }

    const blockingBooking = await Booking.exists({
      userId,
      $or: [
        { rideStatus: { $in: ["pending", "ongoing"] } },
        {
          paymentStatus: {
            $in: ["pending", "partiallyPay", "partially_paid"],
          },
        },
      ],
    });

    if (blockingBooking) {
      return res.json({
        status: 400,
        success: false,
        message:
          "Account cannot be deleted due to an active booking. Please contact support.",
      });
    }

    if (user.userType !== "customer") {
      return res.json({
        status: 403,
        message: "This account type cannot be deleted",
      });
    }

    if (user.isDeleted) {
      return res.json({ status: 400, message: "Account is already deleted" });
    }

    // Anonymize PII while keeping financial record structure intact
    const anonymizedId = user._id.toString();

    await User.updateOne(
      { _id: userId },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletionReason: reason || "Requested by user",
          status: "inactive",

          // Anonymize personal data
          firstName: "deleted",
          lastName: "user",
          email: `deleted_${anonymizedId}@removed.com`,
          contact: anonymizedId.slice(-10), // keeps uniqueness constraint intact
          altContact: null,
          dateofbirth: null,
          gender: "not specified",
          addresses: [],

          // Clear sensitive documents
          drivingLicence: null,
          idProof: null,
          addressProof: null,

          // Clear auth tokens
          otp: null,
          mobileToken: null,
          password: null,
        },
      },
    );

    await createLog("User account soft deleted", "softDeleteUser", userId, 200);

    return res.status(200).json({
      status: 200,
      success: true,
      message:
        "Your account has been deleted. Financial records are retained as required by law.",
    });
  } catch (error) {
    const message = `Error in softDeleteUser: ${error.message}`;
    console.error(message);
    await createLog(message, "softDeleteUser", null, 500);
    return res.status(500).json({
      status: 500,
      message: "An error occurred while processing the request",
    });
  }
}

async function sendOtpViaFast2Sms(contact, otp) {
  try {
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        flash: "0",
        sender_id: "RNTOBK",
        message: "178252",
        route: "dlt",
        numbers: contact,
        variables_values: otp,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error sending OTP via Fast2SMS:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

async function verify(req, res) {
  try {
    const { contact, otp } = req.body;

    if (!contact || !otp) {
      const message = "Contact number and OTP are required";
      await createLog(message, "verify", null, 400);
      return res.json({ status: 400, message });
    }

    if (contact === DEMOACCOUNT && otp === "123456") {
      const user = await User.findOne({ contact });
      const userDocument = await Document.findOne({ userId: user?._id });
      let profileImage = "";
      if (userDocument) {
        const file = userDocument.files?.filter((file) =>
          file?.fileName?.includes("Selfie"),
        );
        if (file) {
          profileImage = file[0]?.imageUrl || "";
        }
      }
      const message = "OTP verified successfully (Hardcoded logic)";
      await createLog(message, "verify", user._id, 200);
      const newData = { ...user?._doc, profileImage };
      return res.status(200).json({ status: 200, message, data: newData });
    }

    const otpRecord = await Otp.findOne({ contact });
    if (!otpRecord) {
      const message = "No OTP found for the given contact number";
      await createLog(message, "verify", null, 404);
      return res.json({ status: 404, message });
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      const message = "OTP has expired";
      await createLog(message, "verify", null, 400);
      await Otp.deleteOne({ contact }); // Clean up expired OTP
      return res.json({ status: 400, message });
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

    const userDocument = await Document.findOne({ userId: user?._id });
    let profileImage = "";
    if (userDocument) {
      const file = userDocument.files?.filter((file) =>
        file?.fileName?.includes("Selfie"),
      );
      if (file) {
        profileImage = file[0]?.imageUrl || "";
      }
    }

    if (user.isContactVerified === "no") {
      await User.findByIdAndUpdate(
        user._id,
        { isContactVerified: "yes" },
        { new: true },
      );
    }

    await Otp.deleteOne({ contact });

    const message = "OTP verified successfully";
    await createLog(message, "verify", user._id, 200);
    const newData = { ...user?._doc, profileImage };
    return res.status(200).json({ status: 200, message, data: newData });
  } catch (error) {
    const message = `Error in verify function: ${error.message}`;
    console.error(message);
    await createLog(message, "verify", null, 500);
    return res.status(500).json({
      status: 500,
      message: "An error occurred while processing the request",
    });
  }
}

module.exports = { otpGenerat, verify, softDeleteUser };
