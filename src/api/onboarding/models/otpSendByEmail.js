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
  

    if (!email) {
      return res.status(400).json({
        status: 400,
        message: "email  is required",
      });
    }
     
  
      const otp = Math.floor(100000 + Math.random() * 900000);
  
  
      // Save OTP using upsert to avoid duplicates
      await Otp.updateOne(
        { email }, // Filter by contact
        { email, otp, createdAt: new Date(), expiresAt: new Date(Date.now() + 5 * 60 * 1000) }, // Update fields
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

  async function verify(req, res) {
    try {
      const { email, otp } = req.body;
  
      if ( !otp) {
        return res.status(400).json({
          status: 400,
          message: " OTP are required",
        });
      }

     
     
      const record = await Otp.findOne({ email });
      if (!record) {
        return res.status(404).json({
          status: 404,
          message: "No OTP found for the given email",
        });
      }
  
      
      // Verify OTP
      if (otp === record.otp) { 
        const find = await User.findOne({email})
      
        if(find.isContactVerified == "no"){
         const _id= find._id;
         
          await User.findByIdAndUpdate(_id, find.isEmailVerified = "yes", { new: true });
          //return { status: 200, message: "User updated successfully", data: userObj };
        }
        await Otp.deleteOne({ email });
  
        return res.status(200).json({
          status: 200,
          message: "OTP verified successfully",
          data: find
        });
      } else {
        return res.status(401).json({
          status: 401,
          message: "Invalid OTP",
        });
      }

     


    } catch (error) {
      console.error("Error in verify function:", error.message);
      return res.status(500).json({
        status: 500,
        message: "An error occurred while processing the request",
      });
    }
  }
  

  module.exports= {emailOtp, verify}