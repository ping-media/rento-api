const unirest = require("unirest");
const User = require("../../../db/schemas/onboarding/user.schema");
const Otp = require("../../../db/schemas/onboarding/logOtp");

async function optGernet(req, res) {
  try {
    const { contact } = req.body;

    if (!contact) {
      return res.status(400).json({
        status: 400,
        message: "Contact number is required",
      });
    }

    
   
    const user = await User.findOne({ contact });
    if (!user) {
      return res.status(400).json({
        status: 400,
        message: "User does not exist",
        success: false
      });
    }


    const excludedContacts = ["9389046742", "8433408211"]; 

    // Check if the contact is in the exclusion list
    if (excludedContacts.includes(contact)) {
      return res.status(200).json({
        status: 200,
        message: "Login allowed without OTP validation",
        //data:user
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
    const smsResponse = await sendOtpViaFast2Sms(contact, otp);
    if (smsResponse.error) {
      console.error(`Failed to send OTP to ${contact}:`, smsResponse.error);
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

function sendOtpViaFast2Sms(contact, otp) {
    return new Promise((resolve, reject) => {
      const req = unirest("POST", "https://www.fast2sms.com/dev/bulkV2");
  
      req.headers({
      "authorization": "BfpRMOEvrPt9eV2kdD7ln3Kicb8oFHS50jxhTLXJQ1aumYqAzZGydpUt9FRkCnjxbi4XWAmJ6PMrSuvK", // Ensure API key is stored in environment variables
});
  
      req.json({
        flash: "0",
        sender_id: "DNRJFN", // Replace with your DLT-approved sender ID
        message: "171382", // Replace with your DLT-approved template ID
        route: "dlt",
        numbers: contact,
        variables_values: otp,
      });
  
      req.end((res) => {
        if (res.error) {
          console.error("Error sending OTP via Fast2SMS:", res.error.message);
          return reject(res.error);
        }
      //  console.log("Fast2SMS Response:", res.body);
        return resolve(res.body);
      });
    });
  }

  async function verify(req, res) {
    try {
      const { contact, otp } = req.body;
  
      if (!contact || !otp) {
        return res.status(400).json({
          status: 400,
          message: "Contact number and OTP are required",
        });
      }

      if(contact=="9389046742" || contact=="8433408211"){
        if(otp=="123456"){
        const find = await User.findOne({contact})
        return res.status(200).json({
          status: 200,
          message: "OTP verified successfully",
          data: find
        });
      }
      }
     
      const record = await Otp.findOne({ contact });
      if (!record) {
        return res.status(404).json({
          status: 404,
          message: "No OTP found for the given contact number",
        });
      }
  
      
      // Verify OTP
      if (otp === record.otp) { 
        const find = await User.findOne({contact})
      
        if(find.isContactVerified == "no"){
         const _id= find._id;
         
          await User.findByIdAndUpdate(_id, find.isContactVerified = "yes", { new: true });
          //return { status: 200, message: "User updated successfully", data: userObj };
        }
        await Otp.deleteOne({ contact });
  
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
  
  
module.exports = {optGernet, verify};
