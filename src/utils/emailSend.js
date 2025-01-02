require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  port: 465,
  service: "gmail",
  secure: true,
  auth: {
    user: "kashyapshivram512@gmail.com",
    pass:  'kmbc nqqe cavl eyma',
  },
});



async function sendOtpByEmail(email, firstName, lastName) {
  try {
    const info = await transporter.sendMail({
      from: '"Rento-Moto Support" <support@rentobikes.com>',
      to: email,
      subject: "Your OTP Code - Welcome to RentoBikes!",
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RentoBikes</title >
        <link rel="shortcut icon" href="https://admin.rentobikes.com/assets/rento-logo-2YTjnrFt.png" type="image/png">
</head>
<body>
    <table width="100%" border="0" cellspacing="0" cellpadding="0" align="center" style="background-color:#fff;border:1px solid #ccc;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;margin:0px auto;max-width:600px;padding:40px;width:80%;overflow:hidden">
        <tbody>

          
          <tr>
            <td style="color:#e23844;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:20px;padding:30px;padding-left:0;font-weight:bold">
              Hi ,
            </td>
            <td style="text-align:right">
              <img src="https://admin.rentobikes.com/assets/rento-logo-2YTjnrFt.png" title="Rentobikes Logo" style="height:60px;width:auto;margin-right:20px" class="CToWUd a6T" data-bit="iit" tabindex="0"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 482.938px; top: 267.417px;"><span data-is-tooltip-wrapper="true" class="a5q" jsaction="JIbuQc:.CLIENT"><button class="VYBDae-JX-I VYBDae-JX-I-ql-ay5-ays CgzRE" jscontroller="PIVayb" jsaction="click:h5M12e; clickmod:h5M12e;pointerdown:FEiYhc;pointerup:mF5Elf;pointerenter:EX0mI;pointerleave:vpvbp;pointercancel:xyn4sd;contextmenu:xexox;focus:h06R8; blur:zjh6rb;mlnRJb:fLiPzd;" data-idom-class="CgzRE" data-use-native-focus-logic="true" jsname="hRZeKc" aria-label="Download attachment " data-tooltip-enabled="true" data-tooltip-id="tt-c33" data-tooltip-classes="AZPksf" id="" jslog="91252; u014N:cOuCgd,Kr2w4b,xr6bB; 4:WyIjbXNnLWY6MTgxOTkzMjY0MDE1NjkxNjM4MyJd; 43:WyJpbWFnZS9qcGVnIl0."><span class="OiePBf-zPjgPe VYBDae-JX-UHGRz"></span><span class="bHC-Q" jscontroller="LBaJxb" jsname="m9ZlFb" soy-skip="" ssk="6:RWVI5c"></span><span class="VYBDae-JX-ank-Rtc0Jf" jsname="S5tZuc" aria-hidden="true"><span class="notranslate bzc-ank" aria-hidden="true"><svg viewBox="0 -960 960 960" height="20" width="20" focusable="false" class=" aoH"><path d="M480-336L288-528l51-51L444-474V-816h72v342L621-579l51,51L480-336ZM263.72-192Q234-192 213-213.15T192-264v-72h72v72H696v-72h72v72q0,29.7-21.16,50.85T695.96-192H263.72Z"></path></svg></span></span><div class="VYBDae-JX-ano"></div></button><div class="ne2Ple-oshW8e-J9" id="tt-c33" role="tooltip" aria-hidden="true">Download</div></span></div>
            </td>
          </tr>

          
          <tr>
            <td colspan="2" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:30px 0;padding-top:10px;color:#767676;font-weight: bold;">
              <span >
                Welcome to the Rentobikes family! It's great to meet you! 
              </span>
              <br>
              <br>
              <span style="font-size:16px">
                We are excited to have you come along with us on our journey. As a
                young startup, we value each member dearly.
                <br>
                <br>
                We are committed to providing easy and hassle-free
                solutions
                to all your commuting problems here at RentoBikes. We promise to keep you updated on exciting offers and
                our thrilling trips pan-India.
              </span>

            </td>
          </tr>

          
          <tr style="height:1px;padding:0 80px">
            <td colspan="2">
              <div style="border-top:1px solid #ddd;width:100%;margin:auto"></div>
            </td>
          </tr>

          
          <tr>
            <td colspan="2" align="left" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:20px;padding:20px 30px 0px 0px;background-color:#fff;color:#767676">
              <b>Why choose RentoBikes</b>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 20px 20px 10px;vertical-align:top">
                <img style="height:80px;width:auto" src="../assets/cash.svg" class="CToWUd" data-bit="iit" alt="cash.image.">
                <br>
              <span style="color:#444;font-size:16px">Flexible Packages</span> <br>
              <span style="color:#999;font-size:14px">Grab daily, weekly, fortnight and monthly packages at
                discounted rates</span> <br>
            </td>
            <td style="padding:20px 20px;vertical-align:top">
              <img style="height:80px;width:auto" src="../assets/bycicle.svg" class="CToWUd" data-bit="iit">
              <br>
              <span style="color:#444;font-size:16px">Wide Range</span> <br>
              <span style="color:#999;font-size:14px">Looking for a particular brand or location? We have probably
                got it.</span> <br>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 20px 20px 10px;vertical-align:top">
              <img style="height:80px;width:auto" src="../assets/WhatsApp Image 2024-12-31 at 16.08.05_d37a3004.svg" class="CToWUd" data-bit="iit">
              <br>
              <span style="color:#444;font-size:16px;padding-top:15px;display:inline-block">Highly Maintained
                Fleet</span> <br>
              <span style="color:#999;font-size:14px">Get high quality and serviced vehicles.</span> <br>
            </td>
            <td style="padding:20px 20px;vertical-align:top">
              <img style="height:80px;width:auto" src="../assets/availability.svg" class="CToWUd" data-bit="iit">
              <br>
              <span style="color:#444;font-size:16px;padding-top:15px;display:inline-block">24*7 At
                Service</span> <br>
              <span style="color:#999;font-size:14px">Day or night, rent a bike.</span> <br>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 20px 20px 10px;vertical-align:top">
              <img style="height:80px;width:auto" src="../assets/rupee.svg" class="CToWUd" data-bit="iit">
              <br>
              <span style="color:#444;font-size:16px;padding-top:15px;display:inline-block">Book Now, Pay
                later</span> <br>
              <span style="color:#999;font-size:14px">Flexibility to decide when and how to pay.</span> <br>
            </td>
            <td style="padding:20px 20px;vertical-align:top">
              <img style="height:80px;width:auto" src="../assets/save.svg" class="CToWUd" data-bit="iit">
              <br>
              <span style="color:#444;font-size:16px;padding-top:15px;display:inline-block">Instant
                Refund</span> <br>
              <span style="color:#999;font-size:14px">Facing an issue while booking/pick up? We initiate instant
                refund.</span> <br>
            </td>
          </tr>

          
          <tr style="height:1px;padding:0 80px">
            <td colspan="2">
              <div style="border-bottom:1px solid #ddd;width:100%;margin:auto;padding-top:30px"></div>
            </td>
          </tr>

          
          <tr>
            <td colspan="2" align="center" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:20px;padding:20px 0px 0px 0px;background-color:#fff;color:#767676">
              <b>Book your ride now!</b>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:30px 0;color:#767676">
              <div style="text-align:center">
                <a href="https://www.rentobikes.com/" style="text-decoration:none;background-color:#e23844;color:#fff;border-radius:20px;font-weight:bold;font-size:16px;padding:10px 20px" target="_blank" >
                  BOOK NOW
                </a>
              </div>
              <br>
              <br>
              <div style="padding:0 20px">
                With a host of amazing features, we assure you that we will provide you the best services and the most
                delectable deals! <br>
                Book your ride now: <a href="https://www.rentobikes.com/" style="color:#e23844;text-decoration:none;font-weight:bold" target="_blank" >www.rentobikes.com</a>
              </div>
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
    });

    console.log("Email sent: %s", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("Error sending OTP email:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendOtpByEmail };
