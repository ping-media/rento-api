const nodemailer = require('nodemailer');
const Otp = require("../../../db/schemas/onboarding/logOtp");
const User = require("../../../db/schemas/onboarding/user.schema");



const transporter = nodemailer.createTransport({
    port: 465,
    service: "gmail",
    secure: true,
    auth: {
      user: 'kashyapshivram512@gmail.com',
      pass: 'kmbc nqqe cavl eyma'
    },
  });
  


  async function emailOtp(req, res) {
    try {
    const  contact = req.body.contact;
    const  email = req.body.email;
  
    
      const user = await User.findOne({ contact });
      if (user) {
        return res.status(404).json({
          status: 404,
          message: "User alredy  exist",
        });
      }
  
      const otp = Math.floor(100000 + Math.random() * 900000);
  
  
      // Save OTP using upsert to avoid duplicates
      await Otp.updateOne(
        { contact }, // Filter by contact
        { contact, otp, createdAt: new Date(), expiresAt: new Date(Date.now() + 5 * 60 * 1000) }, // Update fields
        { upsert: true } 
      );
  
  
      // Send OTP using Fast2SMS
      const smsResponse = await sendOtpByEmail(email, otp);
      if (smsResponse.error) {
        console.error(`Failed to send OTP to ${email}:`, smsResponse.error);
        return res.status(500).json({
          status: 500,
          message: "Failed to send OTP",
        });
      }
  
      return res.status(200).json({
        status: 200,
        message: "OTP sent successfully ",
      });
    } catch (error) {
      console.error("Error in optGernet:", error.message);
      return res.status(500).json({
        status: 500,
        message: "An error occurred while processing the request",
      });
    }
  }








async function sendOtpByEmail(email, otp) {
    try {
      // Send mail with defined transport object
      const info = await transporter.sendMail({
        from: '"Rento-Moto Support" <support@rentomoto.com>', // Sender address
        to: email, // Recipient's email
        subject: "Your OTP Code", // Email subject
        html: `<p>Your OTP code is <strong>${otp}</strong>. This code is valid for 5 minutes.</p>`, // HTML body
      });
  
      console.log("Message sent: %s", info.messageId);
      return {
        success: true,
        message: `OTP sent to ${email}`,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error("Error sending OTP email:", error.message);
      return {
        success: false,
        message: "Failed to send OTP",
        error: error.message,
      };
    }
  }

  module.exports= {emailOtp}