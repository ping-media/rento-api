const nodemailer = require("nodemailer");
const Otp = require("../../../db/schemas/onboarding/logOtp");
const User = require("../../../db/schemas/onboarding/user.schema");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  port: 465,
  service: "gmail",
  secure: true,
  auth: {
    user: "kashyapshivram512@gmail.com",
    pass:  'kmbc nqqe cavl eyma',
  },
});

async function emailOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        status: 400,
        message: "A valid email is required",
      });
    }
    const contact = Math.floor(100000 + Math.random() * 900000).toString(); // Generate unique contact number

    const otp = Math.floor(100000 + Math.random() * 900000);

    await Otp.updateOne(
      { email },
      {
        email,
        otp,
        contact,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
      { upsert: true }
    );

    const mailResponse = await sendOtpByEmail(email, otp);
    if (!mailResponse.success) {
      return res.status(500).json({
        status: 500,
        message: "Failed to send OTP",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Error in emailOtp:", error.message);
    return res.status(500).json({
      status: 500,
      message: "An error occurred while sending OTP",
    });
  }
}

async function sendOtpByEmail(email, otp) {
  try {
    const info = await transporter.sendMail({
      from: '"Rento-Moto Support" <support@rentomoto.com>',
      to: email,
      subject: "Your OTP Code",
      html: `<p>Your OTP code is <strong>${otp}</strong>. This code is valid for 5 minutes.</p>`,
    });

    console.log("Email sent: %s", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("Error sending OTP email:", error.message);
    return { success: false, error: error.message };
  }
}

async function verify(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: 400,
        message: "Email and OTP are required",
      });
    }

    const record = await Otp.findOne({ email });
    if (!record) {
      return res.status(404).json({
        status: 404,
        message: "No OTP found for the given email",
      });
    }

    if (new Date() > record.expiresAt) {
      await Otp.deleteOne({ email });
      return res.status(404).json({
        status: 404,
        message: "OTP has expired",
      });
    }

    if (otp !== record.otp) {
      return res.status(401).json({
        status: 401,
        message: "Invalid OTP",
      });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { isEmailVerified: "yes" },
      { new: true }
    );

    await Otp.deleteOne({ email });

    return res.status(200).json({
      status: 200,
      message: "OTP verified successfully",
     
    });
  } catch (error) {
    console.error("Error in verify:", error.message);
    return res.status(500).json({
      status: 500,
      message: "An error occurred while verifying OTP",
    });
  }
}

module.exports = { emailOtp, verify };
