const nodemailer = require("nodemailer");
const Otp = require("../../../db/schemas/onboarding/logOtp");
const User = require("../../../db/schemas/onboarding/user.schema");
require("dotenv").config();



const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587, // You can also try 465 for SSL
  secure: false, // Use true for port 465
  auth: {
  user: process.env.EMAIL_USER_ID, 
  pass: process.env.EMAIL_PASSWORD, 
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

    const user=await User.findOne({email})

    const {firstName, lastName}=user

    const contact = Math.floor(100000 + Math.random() * 900000).toString(); 

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

    const mailResponse = await sendOtpByEmail(email, otp, firstName, lastName);
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

// async function sendOtpByEmail(email, otp) {
//   try {
//     const info = await transporter.sendMail({
//       from: '"Rento Bikes" <support@rentomoto.com>',
//       to: email,
//       subject: "Your OTP Code from Rento Bikes",
//       html: `<p>Your OTP code is <strong>${otp}</strong>. This code is valid for 5 minutes.</p>`,
//     });

//     console.log("Email sent: %s", info.messageId);
//     return { success: true };
//   } catch (error) {
//     console.error("Error sending OTP email:", error.message);
//     return { success: false, error: error.message };
//   }
// }

async function sendOtpByEmail(email, otp, firstName, lastName) {
  const mailOptions = {
    from: 'support@rentobikes.com', 
    to: email, 
    subject: 'Your OTP Code from Rento Bikes',
    text: `Your OTP code is ${otp}. This code is valid for 5 minutes.`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RentoBikes</title>
  <link rel="shortcut icon" href="https://admin.rentobikes.com/assets/rento-logo-2YTjnrFt.png" type="image/png">

</head>
<body>
  <table width="100%" border="0" cellspacing="0" cellpadding="0" align="center" style="background-color:#fff;border:1px solid #ccc;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;margin:0px auto;max-width:600px;padding:40px;width:80%;overflow:hidden">
    <tbody>

      
      <tr>
        <td style="color:#e23844;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:20px;padding:30px;padding-left:0;font-weight:bold">
          OTP to Login
        </td>
        <td style="text-align:right">
          <img src="https://admin.rentobikes.com/assets/rento-logo-2YTjnrFt.png" title="Rentobikes Logo" style="height:60px;width:auto;margin-right:20px" class="CToWUd" data-bit="iit">
        </td>
      </tr>

      
      <tr>
        <td colspan="2" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:30px 0;padding-top:10px;color:#767676">
          Hello ${firstName} ${lastName},
          <br><br>
          <strong>${otp}</strong>
          <br><br>
         is your OTP for logging in Rento Bikes. This OTP will be valid  only for next 5 minutes.
        </td>
      </tr>
      <tr>
        <td colspan="2">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" align="center">
            <tbody>
              
              <tr>
                <td style="background-color:#ddd;font-size:14px;color:#777;padding:30px 10px 30px 20px;min-width:162px">
                  <b>HELP &amp; SUPPORT</b> <br>
                  <a href="mailto:support@rentobikes.com" style="color:#7a0;text-decoration:none;font-size:12px" target="_blank"><img data-emoji="✉" class="an1" alt="✉" aria-label="✉" draggable="false" src="https://fonts.gstatic.com/s/e/notoemoji/15.1/2709/72.png" loading="lazy">
                    support@rentobikes.com</a>
                </td>
                <td style="background-color:#ddd;font-size:14px;color:#777;padding:30px 0px 30px 0px">
                  <b>CALL US ON</b><br>
                  <a href="tel:+91888448891" style="color:#7a0;text-decoration:none;font-size:12px" target="_blank"><img data-emoji="☎" class="an1" alt="☎" aria-label="☎" draggable="false" src="https://fonts.gstatic.com/s/e/notoemoji/15.1/260e/72.png" loading="lazy"> +91888448891</a>
                </td>
              </tr>
          
              
              <tr>
                <td style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:12px;padding:5px;padding-left:20px;padding-top:20px;border-top:1px solid #ccc;background-color:#ddd;color:#767676;text-align:left">
                  <a style="text-decoration:none;color:#777" href="https://www.rentobikes.com/contact-us" target="_blank" >Contact
                    Us</a>
                </td>
                <td colspan="1" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:12px;padding:5px;padding-top:20px;border-top:1px solid #ccc;background-color:#ddd;color:#767676;text-align:left">
                </td>
              </tr>
              <tr>
                <td style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:12px;padding:5px;padding-left:20px;background-color:#ddd;color:#767676;text-align:left">
                  <a style="text-decoration:none;color:#777" href="https://www.rentobikes.com/privacy-policy" target="_blank" >Privacy Policy</a>
                </td>
                <td colspan="1" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:12px;padding:5px;background-color:#ddd;color:#767676;text-align:left">
                  
                </td>
              </tr>
              <tr>
                <td style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:12px;padding:5px;padding-left:20px;padding-bottom:20px;background-color:#ddd;color:#767676;text-align:left">
                  <a style="text-decoration:none;color:#777" href="https://www.rentobikes.com/terms-and-conditions" target="_blank" >Terms and
                    Conditions</a>
                </td>
                <td colspan="1" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:12px;padding:5px;padding-bottom:20px;background-color:#ddd;color:#767676;text-align:left">
                </td>
              </tr>
          
              
              <tr style="background-color:#eaeaea">
                <td align="left">
                  <img src="https://admin.rentobikes.com/assets/rento-logo-2YTjnrFt.png" title="RentoBikes Logo" style="height:50px;width:auto;margin-right:20px;padding-left:20px;padding-top:10px" class="CToWUd a6T" data-bit="iit" tabindex="0"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 198.469px; top: 1854.81px;"><span data-is-tooltip-wrapper="true" class="a5q" jsaction="JIbuQc:.CLIENT"><button class="VYBDae-JX-I VYBDae-JX-I-ql-ay5-ays CgzRE" jscontroller="PIVayb" jsaction="click:h5M12e; clickmod:h5M12e;pointerdown:FEiYhc;pointerup:mF5Elf;pointerenter:EX0mI;pointerleave:vpvbp;pointercancel:xyn4sd;contextmenu:xexox;focus:h06R8; blur:zjh6rb;mlnRJb:fLiPzd;" data-idom-class="CgzRE" data-use-native-focus-logic="true" jsname="hRZeKc" aria-label="Download attachment " data-tooltip-enabled="true" data-tooltip-id="tt-c34" data-tooltip-classes="AZPksf" id="" jslog="91252; u014N:cOuCgd,Kr2w4b,xr6bB; 4:WyIjbXNnLWY6MTgxOTkzMjY0MDE1NjkxNjM4MyJd; 43:WyJpbWFnZS9qcGVnIl0."><span class="OiePBf-zPjgPe VYBDae-JX-UHGRz"></span><span class="bHC-Q" jscontroller="LBaJxb" jsname="m9ZlFb" soy-skip="" ssk="6:RWVI5c"></span><span class="VYBDae-JX-ank-Rtc0Jf" jsname="S5tZuc" aria-hidden="true"><span class="notranslate bzc-ank" aria-hidden="true"><svg viewBox="0 -960 960 960" height="20" width="20" focusable="false" class=" aoH"><path d="M480-336L288-528l51-51L444-474V-816h72v342L621-579l51,51L480-336ZM263.72-192Q234-192 213-213.15T192-264v-72h72v72H696v-72h72v72q0,29.7-21.16,50.85T695.96-192H263.72Z"></path></svg></span></span><div class="VYBDae-JX-ano"></div></button><div class="ne2Ple-oshW8e-J9" id="tt-c34" role="tooltip" aria-hidden="true">Download</div></span></div>
                </td>
                <td align="right" colspan="1" style="padding:20px 20px 20px 0">
                 
                </td>
              </tr>
            </tbody>
          </table>              </td>
      </tr>


    </tbody>
  </table>
</body>
</html>`,
  };

  try {
    // Send email and wait for the result
    const info = await transporter.sendMail(mailOptions);

    // Log the response from the email sending
    console.log('Email sent: ' + info.response);
    return { success: true };
  } catch (error) {
    // Log any errors that occur
    console.log('Error occurred:', error);
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

   // console.log(user)

    await Otp.deleteOne({ email });

    return res.status(200).json({
      status: 200,
      message: "OTP verified successfully",
     data: user
    });
  } catch (error) {
    console.error("Error in verify:", error.message);
    return res.json({
      status: 500,
      message: "An error occurred while verifying OTP",
    });
  }
}

module.exports = { emailOtp, verify };
