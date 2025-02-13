require("dotenv").config();
const nodemailer = require("nodemailer");
const Station = require("../db/schemas/onboarding/station.schema");
const User = require("../db/schemas/onboarding/user.schema");
const fs = require('fs');
const path = require('path');


// const transporter = nodemailer.createTransport({
//   port: 465,
//   service: "gmail",
//   secure: true,
//   auth: {
//     user: "kashyapshivram512@gmail.com",
//     pass: 'kmbc nqqe cavl eyma',
//   },
// });

require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587, // You can also try 465 for SSL
  secure: false, // Use true for port 465
  auth: {
    user: process.env.EMAIL_USER_ID,
    pass: process.env.EMAIL_PASSWORD,
  },
});



async function sendOtpByEmail(email, firstName, lastName) {

  const mailOptions = {
    from: 'Rento Bikes <support@rentobikes.com>',
    to: email,
    subject: "Welcome to RentoBikes!",
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
              Hi ${firstName} ${lastName},
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
                <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/cash+(1).png" class="CToWUd" data-bit="iit" alt="cashimage.">
                <br>
              <span style="color:#444;font-size:16px">Flexible Packages</span> <br>
              <span style="color:#999;font-size:14px">Grab daily, weekly, fortnight and monthly packages at
                discounted rates</span> <br>
            </td>
            <td style="padding:20px 20px;vertical-align:top">
              <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/bycicle+(1).png" class="CToWUd" data-bit="iit" alt="bikeimage">
              <br>
              <span style="color:#444;font-size:16px">Wide Range</span> <br>
              <span style="color:#999;font-size:14px">Looking for a particular brand or location? We have probably
                got it.</span> <br>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 20px 20px 10px;vertical-align:top">
              <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/WhatsApp+Image+2024-12-31+at+16.08.05_d37a3004.png" class="CToWUd" data-bit="iit" alt="scoterimage.">
              <br>
              <span style="color:#444;font-size:16px;padding-top:15px;display:inline-block">Highly Maintained
                Fleet</span> <br>
              <span style="color:#999;font-size:14px">Get high quality and serviced vehicles.</span> <br>
            </td>
            <td style="padding:20px 20px;vertical-align:top">
              <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/availability+(1).png" class="CToWUd" data-bit="iit" alt="availabilityimage.">
              <br>
              <span style="color:#444;font-size:16px;padding-top:15px;display:inline-block">24*7 At
                Service</span> <br>
              <span style="color:#999;font-size:14px">Day or night, rent a bike.</span> <br>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 20px 20px 10px;vertical-align:top">
              <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/rupee+(1).png" class="CToWUd" data-bit="iit" alt="rupeeimage.">
              <br>
              <span style="color:#444;font-size:16px;padding-top:15px;display:inline-block">Book Now, Pay
                later</span> <br>
              <span style="color:#999;font-size:14px">Flexibility to decide when and how to pay.</span> <br>
            </td>
            <td style="padding:20px 20px;vertical-align:top">
              <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/save+(1).png" class="CToWUd" data-bit="iit" alt="saveimage.">
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
                  <td style="background-color:#ddd;font-size:14px;color:#777;padding:30px 10px 30px 20px; width: 50%;">
                    <p style="text-align: center; width: 100%;"><strong>HELP &amp; SUPPORT</strong></p> <br>
                    <a href="mailto:support@rentobikes.com" style="color:#7a0;text-decoration:none;font-size:12px" target="_blank"><div style="width: 40px; margin-bottom: 10px; margin-left: auto; margin-right: auto;">
                      <img data-emoji="✉" class="an1" alt="✉" aria-label="✉" width="100%" draggable="false" src="https://fonts.gstatic.com/s/e/notoemoji/15.1/2709/72.png" loading="lazy">
                    </div>
                    <span style="display: block; text-align: center;">support@rentobikes.com</span></a>
                  </td>
                  <td style="background-color:#ddd;font-size:14px;color:#777;padding:30px 0px 30px 0px; width: 50%;">
                    <p style="text-align: center; width: 100%;"><strong>CALL US ON</strong></p><br>
                    <a href="tel:+91888448891" style="color:#7a0;text-decoration:none;font-size:12px" target="_blank"><div style="width: 40px; margin-bottom: 10px; margin-left: auto; margin-right: auto;">
                      <img data-emoji="☎" class="an1" alt="☎" aria-label="☎" width="100%" draggable="false" src="https://fonts.gstatic.com/s/e/notoemoji/15.1/260e/72.png" loading="lazy">
                    </div> <span style="display: block; text-align: center;">+91888448891</span></a>
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
            </table>    
          
          </td>
        </tr>
        </tbody>
      </table>
</body>
</html>`,
  }

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

async function sendOtpByEmailForBooking(body) {
  const { userId, stationId, stationMasterUserId, bookingId, vehicleImage, vehicleName, stationName, BookingStartDateAndTime, BookingEndDateAndTime, bookingPrice, vehicleBasic, } = body;
  try {
     console.log(userId, stationId,stationMasterUserId,vehicleImage)

    function convertDateString(dateString) {
      if (!dateString) return "Invalid date";

      const date = new Date(dateString);
      if (isNaN(date)) return "Invalid date";

      const options = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };

      return date.toLocaleString('en-US', options);
    }

    const { email, firstName, lastName, } = await User.findOne({ _id: userId });
    const { address, latitude, longitude } = await Station.findOne({ name: stationId });

    const station = await User.findOne({ _id: stationMasterUserId });
    // console.log(bookingPrice, vehicleBasic)
    const mapLink = "https://www.google.com/maps/search/?api=1&query="
      + latitude + "," + longitude;


    const totalPrice = bookingPrice?.totalPrice || 0;
    const userPaid = bookingPrice?.userPaid || 0;

    const mailOptions = {
      from: 'Rento Bikes <support@rentobikes.com>',
      to: email,
      subject: ` Booking Confirmed - Your RentoBikes Booking ID ${bookingId} has been confirmed!`,
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
          Booking Confirmed
        </td>
        <td style="text-align:right">
          <img src="https://admin.rentobikes.com/assets/rento-logo-2YTjnrFt.png" title="Rentobikes Logo" style="height:60px;width:auto;margin-right:20px" class="CToWUd" data-bit="iit">
        </td>
      </tr>

      
      <tr>
        <td colspan="2" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:30px 0;padding-top:10px;color:#767676">
          Hello ${firstName} ${lastName},
          <br><br>
          Thank you for choosing RentoBikes as your daily commute and adventure partner. Your Booking ID is
          #${bookingId}. Here are all the booking
          details you will be needing for your ride.
        </td>
      </tr>

      
      <tr>
        <td colspan="2" align="left" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:20px 30px 20px 30px;border-top:1px solid #ccc;background-color:#fff;color:#767676">
          <b>Booking Details</b>
        </td>
      </tr>
      <tr>
        <td style="padding-left:30px;width:50%" rowspan="3">
          <div style="width:70%">
            <img style="width:90%; height:auto;" src="${vehicleImage}" class="CToWUd" data-bit="iit" alt="${vehicleName}">
            
            <p style="text-align:center;margin:0px auto;color:#777;padding-top:5px;font-size:14px">
            ${vehicleName}</p>
          </div>
        </td>
        <td>
          <span style="color:#777;font-size:12px;color:#aaa;font-weight:bold">START TRIP</span><br>
          <span>${convertDateString(BookingStartDateAndTime)}</span>
        </td>
      </tr>
      <tr>
        <td>
          <span style="color:#777;font-size:12px;color:#aaa;font-weight:bold">END TRIP</span><br>
          <span>${convertDateString(BookingEndDateAndTime)}</span>
        </td>
      </tr>
      <tr>
        <td>
          <span style="color:#777;font-size:12px;color:#aaa;font-weight:bold">LOCATION</span><br>
          <span>${stationName}</span><br>
        </td>
      </tr>
      <tr style="height:20px"></tr>

      
      <tr>
        <td colspan="2" align="left" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:20px 30px 20px 30px;border-top:1px solid #ccc;background-color:#fff;color:#767676">
          <b>GoHub Details</b>
        </td>
      </tr>
      <tr>
        <td style="padding-left:30px;width:40%" rowspan="5">
          <div style="width:80%;padding-bottom:40px">
            <img href="${mapLink}" style="width:50%;height:auto;margin:auto;display:block" src="https://ci3.googleusercontent.com/meips/ADKq_NZeMWN9ixfuwh5eP3uBM7yhTc_NlUHm3gSgKr7uso4Z4CKLuEpEzABxsukyIOltdTeQ8CWfq-Mo4bniU8fvWFrGdj77_mxbOYIh9Rnq5lf1tncZ9iPRnrbC_MLgTmIB8eZ7=s0-d-e1-ft#https://RentoBikes-stage-public.s3.ap-south-1.amazonaws.com/static/map-logo.png" class="CToWUd" data-bit="iit">
            <p style="text-align:center;margin:0px auto;color:#777;padding-top:15px;font-size:14px">
              <a style="color:#e23844" href="${mapLink}" target="_blank" >View on Google Maps</a>
            </p>
          </div>
        </td>
        <td>
          <span style="height:14px;display:inline-block;color:#777;font-size:12px;color:#aaa;font-weight:bold">PICKUP
            LOCATION</span><br>
          <span style="display:inline-block;padding-bottom:8px">${address}</span>
        </td>
      </tr>
      <tr>
        <td>
          <span style="height:14px;display:inline-block;color:#777;font-size:12px;color:#aaa;font-weight:bold">LANDMARK</span><br>
          <span style="display:inline-block;padding-bottom:8px">${stationName}</span>
        </td>
      </tr>
      <tr>
        <td>
          <span style="height:14px;display:inline-block;color:#777;font-size:12px;color:#aaa;font-weight:bold">PHONE
            NUMBER</span><br>
          <span style="display:inline-block;padding-bottom:8px">${station.contact}</span>
        </td>
      </tr>
      <tr>
        <td>
        </td>
      </tr>
      <tr>
        <td>
        </td>
      </tr>
      <tr style="height:20px"></tr>

      

      
      <tr>
        <td colspan="2" align="left" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:20px 30px 20px 30px;border-top:1px solid #ccc;background-color:#fff;color:#767676">
          <b>Price Breakdown</b>
        </td>
      </tr>
      <tr>
        <td colspan="2" align="left" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:0px 30px 10px 30px;background-color:#fff;color:#767676">
          <table style="width:100%;color:#444;padding:20px;background-color:#fafafa;border:1px solid #eee;border-radius:4px;font-size:14px">
            <tbody><tr>
              <td style="color:#444">Bike Rental</td>
              <td style="font-weight:bold;text-align:right;width:80px">₹ ${bookingPrice.rentAmount}</td>
            </tr>
           
            <tr>
              <td style="color:#444;padding-top:5px">Discount</td>
              <td style="font-weight:bold;text-align:right;color:#e23844;padding-top:5px">- ₹
                ${bookingPrice.discountPrice}
              </td>
            </tr>
             <tr>
              <td style="color:#444;padding-top:5px">Tax</td>
              <td style="font-weight:bold;text-align:right;color:#e23844;padding-top:5px"> ₹
               ${bookingPrice.tax}</td>
            </tr>
            <tr>
              <td colspan="2" style="border-bottom:1px solid #777;padding:5px"></td>
            </tr>
            <tr>
              <td style="color:#444;padding-top:10px">Total Amount</td>
              <td style="font-weight:bold;text-align:right;padding-top:10px">₹
                ${bookingPrice.discountTotalPrice !== 0
          ? bookingPrice.discountTotalPrice
          : bookingPrice.totalPrice}
              </td>
            </tr>
            <tr>
              <td colspan="2" style="color:#999;font-size:12px">
                <span>&nbsp;&nbsp;Paid online</span>
                <span style="float:right"> ₹ ${bookingPrice.userPaid == undefined ? bookingPrice.discountTotalPrice !== 0
          ? bookingPrice.discountTotalPrice
          : bookingPrice.totalPrice : bookingPrice.userPaid}</span>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="color:#999;font-size:12px">
                <span>&nbsp;&nbsp;Remaining amount to be paid at the time of pickup</span>
                <span style="float:right"> ₹ ${bookingPrice.userPaid == undefined ? 0 : totalPrice - userPaid}</span>
              </td>
            </tr>
            <tr>
              <td style="color:#444;padding-top:5px">Refundable Deposit</td>
              <td style="font-weight:bold;text-align:right;padding-top:5px">₹
                ${vehicleBasic.refundableDeposit}</td>
            </tr>
            <tr>
              <td colspan="2" style="color:#999;font-size:12px">
                <i>
                  To be paid at the time of pickup and will
                  be refunded after the drop.
                </i>
              </td>
            </tr>
          </tbody></table>
        </td>
      </tr>
      <tr style="height:20px"></tr>

      
      <tr>
        <td colspan="2" align="left" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:20px 30px 20px 30px;border-top:1px solid #ccc;background-color:#fff;color:#767676">
          <b>Things to remember</b>
        </td>
      </tr>
      <tr>
        <td colspan="2" align="left" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:0px 30px 10px 30px;background-color:#fff;color:#767676">
          <table style="width:100%;color:#444;padding:20px;background-color:#fafafa;border:1px solid #eee;border-radius:4px;font-size:14px">
             <tbody> 
          <!--  <tr>
              <td style="color:#444">OTP</td>
              <td style="font-weight:bold;text-align:right">9687</td>
            </tr> -->
            <!-- <tr>
              <td colspan="2" style="color:#999;font-size:12px;padding-bottom:15px">
                <i>OTP to start your ride</i>
              </td>
            </tr> -->
            <tr>
              <td style="color:#444">Distance Limit</td>
              <td style="font-weight:bold;text-align:right">${vehicleBasic.freeLimit} Km/h</td>
            </tr>
            <tr>
              <td colspan="2" style="color:#999;font-size:12px;padding-bottom:15px">
                <i>Utilize the total distance limit of the package as per your will</i>
              </td>
            </tr>
            <tr>
              <td style="color:#444">Excess Charge</td>
              <td style="font-weight:bold;text-align:right">₹ ${vehicleBasic.extraKmCharge} / Km
              </td>
            </tr>
            <tr>
              <td colspan="2" style="color:#999;font-size:12px;padding-bottom:15px">
                <i>Extra charges are applicable if the distance limit exceeds the package </i>
              </td>
            </tr>
            <tr>
              <td style="color:#444">Late Drop Fee</td>
              <td style="font-weight:bold;text-align:right">₹ ${vehicleBasic.lateFee} / Hour
              </td>
            </tr>
            <tr>
              <td colspan="2" style="color:#999;font-size:12px;padding-bottom:15px">
                <i>Be sure to drop the vehicle in time to avoid any charges</i>
              </td>
            </tr>
            <tr>
              <td style="color:#444">Speed Limit</td>
              <td style="font-weight:bold;text-align:right">${vehicleBasic.speedLimit} Km/h
              </td>
            </tr>
            <tr>
              <td colspan="2" style="color:#999;font-size:12px;padding-bottom:15px">
                <i>Keep the speed within mentioned limits for safe travels.</i>
              </td>
            </tr>
          </tbody></table>
        </td>
      </tr>
      <tr style="height:20px"></tr>

      
      <tr>
        <td colspan="2" align="left" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:20px 30px 20px 30px;border-top:1px solid #ccc;background-color:#fff;color:#767676">
          <b>RentoBikes Terms and Conditions</b>
        </td>
      </tr>
      <tr>
        <td colspan="2" align="left" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:0px 30px 10px 30px;background-color:#fff;color:#767676">
          <div style="background-color:#fafafa;border:1px solid #eee;border-radius:4px;padding:15px 0">
            <ul style="margin:0">
              <li style="font-size:14px">Documents Required: Aadhar Card and Driving License. Digilocker documents will work.</li>
              <li style="font-size:14px">All Scooters are to use within the Bangalore City Limits.</li>
              <li style="font-size:14px"> In case the vehicle returned is found excessively dirty/muddy, the lessee will have to bear the charge of washing not exceeding Rs. 200. You must report such violations to a Lessor’s Representative as soon as possible.</li>
              <li style="font-size:14px">Fuel Charges are not included in the security deposit or rent.</li>
              <li style="font-size:14px">In case of any damage to the vehicle, the customer is liable to pay the repair charges plus the labour charges as per the Authorised Service Center.</li>
              <li style="font-size:14px"><a href="https://www.rentobikes.com/terms-and-conditions" target="_blank" >Other RentoBikes
                  Terms and Conditions</a></li>
            </ul>
          </div>
        </td>
      </tr>
      <tr style="height:20px"></tr>

      
      <tr>
        <td colspan="2" align="left" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:20px 30px 20px 30px;border-top:1px solid #ccc;background-color:#fff;color:#767676">
          <b>Cancellation Policy</b>
        </td>
      </tr>
      <tr>
        <td colspan="2" align="left" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:0px 30px 10px 30px;background-color:#fff;color:#767676">
          <div style="background-color:#fafafa;border:1px solid #eee;border-radius:4px;padding:15px;font-size:14px">
            Upon booking a bike with any of our dealers, they reserve the bike for the customer. In the case of
            cancellation, unnecessary inconvenience is caused to the dealer. To account for the potential
            financial loss, we withhold some amount as cancellation charges as follows:
            <ul style="margin:0">
              <li>No Show - 100% deduction.</li>
              <li>In case of partial payment - 100% deduction.</li>
              <li>In case of full payment:
                <ul>
                  <li>Before 72 hrs of the pickup time - 25% deduction.</li>
                  <li>Between 24-72 hrs of the pickup time - 75% deduction.</li>
                  <li>Between 0-24 hrs of the pickup time - 100% deduction. </li>
                </ul>
              </li>
              <li>Refund Policy for Early Drop-offs: To clarify, refunds will not be provided for cases of early
                drop-offs.</li>
            </ul>
          </div>
        </td>
      </tr>
      <tr style="height:20px"></tr>

      
      <tr>
        <td colspan="2">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" align="center">
            <tbody>
              
              <tr>
                <td style="background-color:#ddd;font-size:14px;color:#777;padding:30px 10px 30px 20px; width: 50%;">
                  <p style="text-align: center; width: 100%;"><strong>HELP &amp; SUPPORT</strong></p> <br>
                  <a href="mailto:support@rentobikes.com" style="color:#7a0;text-decoration:none;font-size:12px" target="_blank"><div style="width: 40px; margin-bottom: 10px; margin-left: auto; margin-right: auto;">
                    <img data-emoji="✉" class="an1" alt="✉" aria-label="✉" width="100%" draggable="false" src="https://fonts.gstatic.com/s/e/notoemoji/15.1/2709/72.png" loading="lazy">
                  </div>
                  <span style="display: block; text-align: center;">support@rentobikes.com</span></a>
                </td>
                <td style="background-color:#ddd;font-size:14px;color:#777;padding:30px 0px 30px 0px; width: 50%;">
                  <p style="text-align: center; width: 100%;"><strong>CALL US ON</strong></p><br>
                  <a href="tel:+91888448891" style="color:#7a0;text-decoration:none;font-size:12px" target="_blank"><div style="width: 40px; margin-bottom: 10px; margin-left: auto; margin-right: auto;">
                    <img data-emoji="☎" class="an1" alt="☎" aria-label="☎" width="100%" draggable="false" src="https://fonts.gstatic.com/s/e/notoemoji/15.1/260e/72.png" loading="lazy">
                  </div> <span style="display: block; text-align: center;">+91888448891</span></a>
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
    }

    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent: %s", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("Error sending OTP email:", error.message);
    return { success: false, error: error.message };
  }
}

async function sendEmailForBookingToStationMaster(userId, stationMasterUserId, vehicleName, BookingStartDateAndTime, BookingEndDateAndTime, bookingId,) {
  // const {userId, stationId,stationMasterUserId, bookingId, vehicleImage, vehicleName, stationName, BookingStartDateAndTime, BookingEndDateAndTime, bookingPrice, vehicleBasic,}=body;
  try {


    function convertDateString(dateString) {
      if (!dateString) return "Invalid date";

      const date = new Date(dateString);
      if (isNaN(date)) return "Invalid date";

      const options = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };

      return date.toLocaleString('en-US', options);
    }

    const user = await User.findOne({ _id: userId });


    const { email, firstName, lastName, } = await User.findOne({ _id: stationMasterUserId });

    const mailOptions = {
      from: 'Rento Bikes <support@rentobikes.com>',
      to: email,
      cc: 'support@rentobikes.com',
      subject: ` Booking Recceived- You have received booking Id ${bookingId} from RentoBikes `,
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
        Booking Confirmed
      </td>
      <td style="text-align:right">
        <img src="https://admin.rentobikes.com/assets/rento-logo-2YTjnrFt.png" title="Rentobikes Logo" style="height:60px;width:auto;margin-right:20px" class="CToWUd" data-bit="iit">
      </td>
    </tr>

    
    <tr>
      <td colspan="2" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:30px 0;padding-top:10px;color:#767676">
        Hello Station master ${firstName} ${lastName},
        
      <p>You have received a booking from RentoBikes. ${user.firstName} has booked ${vehicleName} with you. The ride has been scheduled from ${convertDateString(BookingStartDateAndTime)} to ${convertDateString(BookingEndDateAndTime)}. The Booking ID is ${bookingId} and the customer's contact number is ${user.contact}.
</p>
<p>We request you to check the dealer's app for more details.</p>

<p>Team RentoBikes.</p>
      </td>
    </tr>
    <tr>
      <td colspan="2" align="left" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:20px 30px 20px 30px;border-top:1px solid #ccc;background-color:#fff;color:#767676">
        <b>RentoBikes Terms and Conditions</b>
      </td>
    </tr>
    <tr>
      <td colspan="2" align="left" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:0px 30px 10px 30px;background-color:#fff;color:#767676">
        <div style="background-color:#fafafa;border:1px solid #eee;border-radius:4px;padding:15px 0">
          <ul style="margin:0">
            <li style="font-size:14px">Documents Required: Aadhar Card and Driving License. Digilocker documents will work.</li>
            <li style="font-size:14px">All Scooters are to use within the Bangalore City Limits.</li>
            <li style="font-size:14px"> In case the vehicle returned is found excessively dirty/muddy, the lessee will have to bear the charge of washing not exceeding Rs. 200. You must report such violations to a Lessor’s Representative as soon as possible.</li>
            <li style="font-size:14px">Fuel Charges are not included in the security deposit or rent.</li>
            <li style="font-size:14px">In case of any damage to the vehicle, the customer is liable to pay the repair charges plus the labour charges as per the Authorised Service Center.</li>
            <li style="font-size:14px"><a href="https://www.rentobikes.com/terms-and-conditions" target="_blank" >Other RentoBikes
                Terms and Conditions</a></li>
          </ul>
        </div>
      </td>
    </tr>
    <tr style="height:20px"></tr>

    
    <tr>
      <td colspan="2" align="left" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:20px 30px 20px 30px;border-top:1px solid #ccc;background-color:#fff;color:#767676">
        <b>Cancellation Policy</b>
      </td>
    </tr>
    <tr>
      <td colspan="2" align="left" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:0px 30px 10px 30px;background-color:#fff;color:#767676">
        <div style="background-color:#fafafa;border:1px solid #eee;border-radius:4px;padding:15px;font-size:14px">
          Upon booking a bike with any of our dealers, they reserve the bike for the customer. In the case of
          cancellation, unnecessary inconvenience is caused to the dealer. To account for the potential
          financial loss, we withhold some amount as cancellation charges as follows:
          <ul style="margin:0">
            <li>No Show - 100% deduction.</li>
            <li>In case of partial payment - 100% deduction.</li>
            <li>In case of full payment:
              <ul>
                <li>Before 72 hrs of the pickup time - 25% deduction.</li>
                <li>Between 24-72 hrs of the pickup time - 75% deduction.</li>
                <li>Between 0-24 hrs of the pickup time - 100% deduction. </li>
              </ul>
            </li>
            <li>Refund Policy for Early Drop-offs: To clarify, refunds will not be provided for cases of early
              drop-offs.</li>
          </ul>
        </div>
      </td>
    </tr>
    <tr style="height:20px"></tr>

    
    <tr>
      <td colspan="2">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" align="center">
          <tbody>
            
            <tr>
              <td style="background-color:#ddd;font-size:14px;color:#777;padding:30px 10px 30px 20px; width: 50%;">
                <p style="text-align: center; width: 100%;"><strong>HELP &amp; SUPPORT</strong></p> <br>
                <a href="mailto:support@rentobikes.com" style="color:#7a0;text-decoration:none;font-size:12px" target="_blank"><div style="width: 40px; margin-bottom: 10px; margin-left: auto; margin-right: auto;">
                  <img data-emoji="✉" class="an1" alt="✉" aria-label="✉" width="100%" draggable="false" src="https://fonts.gstatic.com/s/e/notoemoji/15.1/2709/72.png" loading="lazy">
                </div>
                <span style="display: block; text-align: center;">support@rentobikes.com</span></a>
              </td>
              <td style="background-color:#ddd;font-size:14px;color:#777;padding:30px 0px 30px 0px; width: 50%;">
                <p style="text-align: center; width: 100%;"><strong>CALL US ON</strong></p><br>
                <a href="tel:+91888448891" style="color:#7a0;text-decoration:none;font-size:12px" target="_blank"><div style="width: 40px; margin-bottom: 10px; margin-left: auto; margin-right: auto;">
                  <img data-emoji="☎" class="an1" alt="☎" aria-label="☎" width="100%" draggable="false" src="https://fonts.gstatic.com/s/e/notoemoji/15.1/260e/72.png" loading="lazy">
                </div> <span style="display: block; text-align: center;">+91888448891</span></a>
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
    }
    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent: %s", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("Error sending OTP email:", error.message);
    return { success: false, error: error.message };
  }
}

async function sendInvoiceByEmail({
  email,
  firstName,
  lastName,
  file
}) {
  //const {email, firstName, lastName, file}=body
  console.log(file)
  const mailOptions = {
    from: 'Rento Bikes <support@rentobikes.com>',
    to: email,
    subject: "Invoice for Your Recent RentoBikes Service!",
    html:`<!DOCTYPE html>
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
            Hi ${firstName} ${lastName},
          </td>
          <td style="text-align:right">
            <img src="https://admin.rentobikes.com/assets/rento-logo-2YTjnrFt.png" title="Rentobikes Logo" style="height:60px;width:auto;margin-right:20px" class="CToWUd a6T" data-bit="iit" tabindex="0"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 482.938px; top: 267.417px;"><span data-is-tooltip-wrapper="true" class="a5q" jsaction="JIbuQc:.CLIENT"><button class="VYBDae-JX-I VYBDae-JX-I-ql-ay5-ays CgzRE" jscontroller="PIVayb" jsaction="click:h5M12e; clickmod:h5M12e;pointerdown:FEiYhc;pointerup:mF5Elf;pointerenter:EX0mI;pointerleave:vpvbp;pointercancel:xyn4sd;contextmenu:xexox;focus:h06R8; blur:zjh6rb;mlnRJb:fLiPzd;" data-idom-class="CgzRE" data-use-native-focus-logic="true" jsname="hRZeKc" aria-label="Download attachment " data-tooltip-enabled="true" data-tooltip-id="tt-c33" data-tooltip-classes="AZPksf" id="" jslog="91252; u014N:cOuCgd,Kr2w4b,xr6bB; 4:WyIjbXNnLWY6MTgxOTkzMjY0MDE1NjkxNjM4MyJd; 43:WyJpbWFnZS9qcGVnIl0."><span class="OiePBf-zPjgPe VYBDae-JX-UHGRz"></span><span class="bHC-Q" jscontroller="LBaJxb" jsname="m9ZlFb" soy-skip="" ssk="6:RWVI5c"></span><span class="VYBDae-JX-ank-Rtc0Jf" jsname="S5tZuc" aria-hidden="true"><span class="notranslate bzc-ank" aria-hidden="true"><svg viewBox="0 -960 960 960" height="20" width="20" focusable="false" class=" aoH"><path d="M480-336L288-528l51-51L444-474V-816h72v342L621-579l51,51L480-336ZM263.72-192Q234-192 213-213.15T192-264v-72h72v72H696v-72h72v72q0,29.7-21.16,50.85T695.96-192H263.72Z"></path></svg></span></span><div class="VYBDae-JX-ano"></div></button><div class="ne2Ple-oshW8e-J9" id="tt-c33" role="tooltip" aria-hidden="true">Download</div></span></div>
          </td>
        </tr>

        
        <tr>
          <td colspan="2" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:30px 0;padding-top:10px;color:#767676;font-weight: bold;">
           
            <span style="font-size:16px">
             Thank you for being part of our journey at RentoBikes! We’re excited to have you with us.
             Attached is your invoice for the recent service. If you have any questions, feel free to reach out.
             We look forward to sharing more exciting offers and trips with you soon!
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
              <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/cash+(1).png" class="CToWUd" data-bit="iit" alt="cashimage.">
              <br>
            <span style="color:#444;font-size:16px">Flexible Packages</span> <br>
            <span style="color:#999;font-size:14px">Grab daily, weekly, fortnight and monthly packages at
              discounted rates</span> <br>
          </td>
          <td style="padding:20px 20px;vertical-align:top">
            <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/bycicle+(1).png" class="CToWUd" data-bit="iit" alt="bikeimage">
            <br>
            <span style="color:#444;font-size:16px">Wide Range</span> <br>
            <span style="color:#999;font-size:14px">Looking for a particular brand or location? We have probably
              got it.</span> <br>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 20px 20px 10px;vertical-align:top">
            <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/WhatsApp+Image+2024-12-31+at+16.08.05_d37a3004.png" class="CToWUd" data-bit="iit" alt="scoterimage.">
            <br>
            <span style="color:#444;font-size:16px;padding-top:15px;display:inline-block">Highly Maintained
              Fleet</span> <br>
            <span style="color:#999;font-size:14px">Get high quality and serviced vehicles.</span> <br>
          </td>
          <td style="padding:20px 20px;vertical-align:top">
            <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/availability+(1).png" class="CToWUd" data-bit="iit" alt="availabilityimage.">
            <br>
            <span style="color:#444;font-size:16px;padding-top:15px;display:inline-block">24*7 At
              Service</span> <br>
            <span style="color:#999;font-size:14px">Day or night, rent a bike.</span> <br>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 20px 20px 10px;vertical-align:top">
            <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/rupee+(1).png" class="CToWUd" data-bit="iit" alt="rupeeimage.">
            <br>
            <span style="color:#444;font-size:16px;padding-top:15px;display:inline-block">Book Now, Pay
              later</span> <br>
            <span style="color:#999;font-size:14px">Flexibility to decide when and how to pay.</span> <br>
          </td>
          <td style="padding:20px 20px;vertical-align:top">
            <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/save+(1).png" class="CToWUd" data-bit="iit" alt="saveimage.">
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
                  <td style="background-color:#ddd;font-size:14px;color:#777;padding:30px 10px 30px 20px; width: 50%;">
                    <p style="text-align: center; width: 100%;"><strong>HELP &amp; SUPPORT</strong></p> <br>
                    <a href="mailto:support@rentobikes.com" style="color:#7a0;text-decoration:none;font-size:12px" target="_blank"><div style="width: 40px; margin-bottom: 10px; margin-left: auto; margin-right: auto;">
                      <img data-emoji="✉" class="an1" alt="✉" aria-label="✉" width="100%" draggable="false" src="https://fonts.gstatic.com/s/e/notoemoji/15.1/2709/72.png" loading="lazy">
                    </div>
                    <span style="display: block; text-align: center;">support@rentobikes.com</span></a>
                  </td>
                  <td style="background-color:#ddd;font-size:14px;color:#777;padding:30px 0px 30px 0px; width: 50%;">
                    <p style="text-align: center; width: 100%;"><strong>CALL US ON</strong></p><br>
                    <a href="tel:+91888448891" style="color:#7a0;text-decoration:none;font-size:12px" target="_blank"><div style="width: 40px; margin-bottom: 10px; margin-left: auto; margin-right: auto;">
                      <img data-emoji="☎" class="an1" alt="☎" aria-label="☎" width="100%" draggable="false" src="https://fonts.gstatic.com/s/e/notoemoji/15.1/260e/72.png" loading="lazy">
                    </div> <span style="display: block; text-align: center;">+91888448891</span></a>
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
            </table>               </td>
        </tr>

      </tbody>
    </table>
</body>
</html>`,
    attachments: [
      {
        filename: file.originalname, // The name of the file (same as uploaded)
        content: file.buffer, // The file content as a buffer
        encoding: 'base64' // Specify the encoding if needed
      }
    ]
  }


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

async function sendReminderEmail(body) {

  function convertDateString(dateString) {
    if (!dateString) return "Invalid date";

    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid date";

    const options = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    };

    return date.toLocaleString('en-US', options);
  }
  const {userEmail, firstName, vehicleName, BookingStartDateAndTime, bookingId, stationName, bookingPrice, vehicleBasic, managerContact, contact}=body;

  const station = await Station.findOne({ stationName }).select("latitude longitude");
  if (!station) {
    console.error(`Station not found for stationName: ${stationName}`);
    return res.status(400).json({ status: 400, message: "Station not found" });
  }

  const { latitude, longitude } = station;
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  // Calculate total price
  const totalPrice = bookingPrice.discountTotalPrice > 0 
                      ? bookingPrice.discountTotalPrice 
                      : bookingPrice.totalPrice;
  const refundableDeposit = vehicleBasic.refundableDeposit;

  if (!userEmail || !firstName || !vehicleName || !BookingStartDateAndTime || !bookingId || !stationName || !mapLink || !managerContact || !totalPrice || !refundableDeposit) {
    console.log("Error: Some required fields are missing.");
    return { success: false, error: "Missing required fields" };
  }

 
 
  const mailOptions = {
    from: 'Rento Bikes <support@rentobikes.com>',
    to: userEmail,
    subject: "Reminder: Your Bike Booking is Confirmed!",
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
            Hi ${firstName},
          </td>
          <td style="text-align:right">
            <img src="https://admin.rentobikes.com/assets/rento-logo-2YTjnrFt.png" title="Rentobikes Logo" style="height:60px;width:auto;margin-right:20px" class="CToWUd a6T" data-bit="iit" tabindex="0"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 482.938px; top: 267.417px;"><span data-is-tooltip-wrapper="true" class="a5q" jsaction="JIbuQc:.CLIENT"><button class="VYBDae-JX-I VYBDae-JX-I-ql-ay5-ays CgzRE" jscontroller="PIVayb" jsaction="click:h5M12e; clickmod:h5M12e;pointerdown:FEiYhc;pointerup:mF5Elf;pointerenter:EX0mI;pointerleave:vpvbp;pointercancel:xyn4sd;contextmenu:xexox;focus:h06R8; blur:zjh6rb;mlnRJb:fLiPzd;" data-idom-class="CgzRE" data-use-native-focus-logic="true" jsname="hRZeKc" aria-label="Download attachment " data-tooltip-enabled="true" data-tooltip-id="tt-c33" data-tooltip-classes="AZPksf" id="" jslog="91252; u014N:cOuCgd,Kr2w4b,xr6bB; 4:WyIjbXNnLWY6MTgxOTkzMjY0MDE1NjkxNjM4MyJd; 43:WyJpbWFnZS9qcGVnIl0."><span class="OiePBf-zPjgPe VYBDae-JX-UHGRz"></span><span class="bHC-Q" jscontroller="LBaJxb" jsname="m9ZlFb" soy-skip="" ssk="6:RWVI5c"></span><span class="VYBDae-JX-ank-Rtc0Jf" jsname="S5tZuc" aria-hidden="true"><span class="notranslate bzc-ank" aria-hidden="true"><svg viewBox="0 -960 960 960" height="20" width="20" focusable="false" class=" aoH"><path d="M480-336L288-528l51-51L444-474V-816h72v342L621-579l51,51L480-336ZM263.72-192Q234-192 213-213.15T192-264v-72h72v72H696v-72h72v72q0,29.7-21.16,50.85T695.96-192H263.72Z"></path></svg></span></span><div class="VYBDae-JX-ano"></div></button><div class="ne2Ple-oshW8e-J9" id="tt-c33" role="tooltip" aria-hidden="true">Download</div></span></div>
          </td>
        </tr>

        
        <tr>
          <td colspan="2" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:10px 0;padding-top:10px;color:#767676;font-weight: bold;">
           
            <span style="font-size:16px">
              This is a friendly reminder about your upcoming bike booking ${vehicleName} with RentoBikes. We’re excited to be a part of your journey!

            </span>

          </td>
        </tr>
        <tr>
          <td colspan="2" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:10px 0;padding-top:10px;color:#767676;font-weight: bold;">
           
            <span style="font-size:16px">
              Your ride is scheduled from ${convertDateString(BookingStartDateAndTime)}.<br/>
              Booking ID: # ${bookingId}
              
            </span>

          </td>
        </tr>
        <tr>
          <td colspan="2" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:10px 0;padding-top:10px;color:#767676;font-weight: bold;">
           
            <span style="font-size:16px">
              Pickup Location Details: Landmark: ${stationName}<br/>
Map Link: ${mapLink}

              
            </span>

          </td>
        </tr>
        <tr>
          <td colspan="2" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:10px 0;padding-top:10px;color:#767676;font-weight: bold;">
           
            <span style="font-size:16px">
              For any booking-related queries, please contact the dealer at ${managerContact}<br/>

              Amount Paid: ₹ ${totalPrice}<br/>
              Security Deposit (Payable at Pickup): ₹ ${refundableDeposit} (Refundable after drop-off)
              

              
            </span>

          </td>
        </tr>
        <tr>
          <td colspan="2" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:10px 0;padding-top:10px;color:#767676;font-weight: bold;">
           
            <span style="font-size:16px">
              Please Remember: Carry the required documents (ID proof, driving license, etc.) for a smooth pickup process. Inspect the bike thoroughly before leaving the pickup location.<br/><br/>

Thank you for choosing RentoBikes as your partner for daily commutes and adventurous rides.<br/><br/>

Happy Riding! 

              
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
              <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/cash+(1).png" class="CToWUd" data-bit="iit" alt="cashimage.">
              <br>
            <span style="color:#444;font-size:16px">Flexible Packages</span> <br>
            <span style="color:#999;font-size:14px">Grab daily, weekly, fortnight and monthly packages at
              discounted rates</span> <br>
          </td>
          <td style="padding:20px 20px;vertical-align:top">
            <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/bycicle+(1).png" class="CToWUd" data-bit="iit" alt="bikeimage">
            <br>
            <span style="color:#444;font-size:16px">Wide Range</span> <br>
            <span style="color:#999;font-size:14px">Looking for a particular brand or location? We have probably
              got it.</span> <br>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 20px 20px 10px;vertical-align:top">
            <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/WhatsApp+Image+2024-12-31+at+16.08.05_d37a3004.png" class="CToWUd" data-bit="iit" alt="scoterimage.">
            <br>
            <span style="color:#444;font-size:16px;padding-top:15px;display:inline-block">Highly Maintained
              Fleet</span> <br>
            <span style="color:#999;font-size:14px">Get high quality and serviced vehicles.</span> <br>
          </td>
          <td style="padding:20px 20px;vertical-align:top">
            <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/availability+(1).png" class="CToWUd" data-bit="iit" alt="availabilityimage.">
            <br>
            <span style="color:#444;font-size:16px;padding-top:15px;display:inline-block">24*7 At
              Service</span> <br>
            <span style="color:#999;font-size:14px">Day or night, rent a bike.</span> <br>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 20px 20px 10px;vertical-align:top">
            <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/rupee+(1).png" class="CToWUd" data-bit="iit" alt="rupeeimage.">
            <br>
            <span style="color:#444;font-size:16px;padding-top:15px;display:inline-block">Book Now, Pay
              later</span> <br>
            <span style="color:#999;font-size:14px">Flexibility to decide when and how to pay.</span> <br>
          </td>
          <td style="padding:20px 20px;vertical-align:top">
            <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/save+(1).png" class="CToWUd" data-bit="iit" alt="saveimage.">
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
                  <td style="background-color:#ddd;font-size:14px;color:#777;padding:30px 10px 30px 20px; width: 50%;">
                    <p style="text-align: center; width: 100%;"><strong>HELP &amp; SUPPORT</strong></p> <br>
                    <a href="mailto:support@rentobikes.com" style="color:#7a0;text-decoration:none;font-size:12px" target="_blank"><div style="width: 40px; margin-bottom: 10px; margin-left: auto; margin-right: auto;">
                      <img data-emoji="✉" class="an1" alt="✉" aria-label="✉" width="100%" draggable="false" src="https://fonts.gstatic.com/s/e/notoemoji/15.1/2709/72.png" loading="lazy">
                    </div>
                    <span style="display: block; text-align: center;">support@rentobikes.com</span></a>
                  </td>
                  <td style="background-color:#ddd;font-size:14px;color:#777;padding:30px 0px 30px 0px; width: 50%;">
                    <p style="text-align: center; width: 100%;"><strong>CALL US ON</strong></p><br>
                    <a href="tel:+91888448891" style="color:#7a0;text-decoration:none;font-size:12px" target="_blank"><div style="width: 40px; margin-bottom: 10px; margin-left: auto; margin-right: auto;">
                      <img data-emoji="☎" class="an1" alt="☎" aria-label="☎" width="100%" draggable="false" src="https://fonts.gstatic.com/s/e/notoemoji/15.1/260e/72.png" loading="lazy">
                    </div> <span style="display: block; text-align: center;">+91888448891</span></a>
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
   
  }


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

async function sendCancelEmail(email,firstName,vehicleName,bookingId,BookingStartDateAndTime,stationName,totalPrice,managerContact) {

  function convertDateString(dateString) {
    if (!dateString) return "Invalid date";

    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid date";

    const options = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    };

    return date.toLocaleString('en-US', options);
  }
 // const {userEmail, firstName, vehicleName, BookingStartDateAndTime, bookingId, stationName, bookingPrice, vehicleBasic, managerContact, contact}=body;



  // if (!userEmail || !firstName || !vehicleName || !BookingStartDateAndTime || !bookingId || !stationName || !mapLink || !managerContact || !totalPrice || !refundableDeposit) {
  //   console.log("Error: Some required fields are missing.");
  //   return { success: false, error: "Missing required fields" };
  // }

 
 
  const mailOptions = {
    from: 'Rento Bikes <support@rentobikes.com>',
    to: email,
    subject: "Cancelled: Your Bike Booking is Cancelled!",
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
            Hi ${firstName},
          </td>
          <td style="text-align:right">
            <img src="https://admin.rentobikes.com/assets/rento-logo-2YTjnrFt.png" title="Rentobikes Logo" style="height:60px;width:auto;margin-right:20px" class="CToWUd a6T" data-bit="iit" tabindex="0"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 482.938px; top: 267.417px;"><span data-is-tooltip-wrapper="true" class="a5q" jsaction="JIbuQc:.CLIENT"><button class="VYBDae-JX-I VYBDae-JX-I-ql-ay5-ays CgzRE" jscontroller="PIVayb" jsaction="click:h5M12e; clickmod:h5M12e;pointerdown:FEiYhc;pointerup:mF5Elf;pointerenter:EX0mI;pointerleave:vpvbp;pointercancel:xyn4sd;contextmenu:xexox;focus:h06R8; blur:zjh6rb;mlnRJb:fLiPzd;" data-idom-class="CgzRE" data-use-native-focus-logic="true" jsname="hRZeKc" aria-label="Download attachment " data-tooltip-enabled="true" data-tooltip-id="tt-c33" data-tooltip-classes="AZPksf" id="" jslog="91252; u014N:cOuCgd,Kr2w4b,xr6bB; 4:WyIjbXNnLWY6MTgxOTkzMjY0MDE1NjkxNjM4MyJd; 43:WyJpbWFnZS9qcGVnIl0."><span class="OiePBf-zPjgPe VYBDae-JX-UHGRz"></span><span class="bHC-Q" jscontroller="LBaJxb" jsname="m9ZlFb" soy-skip="" ssk="6:RWVI5c"></span><span class="VYBDae-JX-ank-Rtc0Jf" jsname="S5tZuc" aria-hidden="true"><span class="notranslate bzc-ank" aria-hidden="true"><svg viewBox="0 -960 960 960" height="20" width="20" focusable="false" class=" aoH"><path d="M480-336L288-528l51-51L444-474V-816h72v342L621-579l51,51L480-336ZM263.72-192Q234-192 213-213.15T192-264v-72h72v72H696v-72h72v72q0,29.7-21.16,50.85T695.96-192H263.72Z"></path></svg></span></span><div class="VYBDae-JX-ano"></div></button><div class="ne2Ple-oshW8e-J9" id="tt-c33" role="tooltip" aria-hidden="true">Download</div></span></div>
          </td>
        </tr>

        
        <tr>
          <td colspan="2" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:10px 0;padding-top:10px;color:#767676;font-weight: bold;">
           
            <span style="font-size:16px">
              We regret to inform you that your booking with RentoBikes has been canceled.


            </span>

          </td>
        </tr>
        <tr>
          <td colspan="2" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:10px 0;padding-top:10px;color:#767676;font-weight: bold;">
           
            <span style="font-size:16px">
             Here are the details of your canceled booking: Bike Booked: ${vehicleName} Booking ID: #${bookingId} Scheduled Pickup Date & Time: ${convertDateString(BookingStartDateAndTime)} Pickup Location: Landmark: ${stationName} Booking Amount: ₹${totalPrice}

              
            </span>

          </td>
        </tr>
        <tr>
          <td colspan="2" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:10px 0;padding-top:10px;color:#767676;font-weight: bold;">
           
            <span style="font-size:16px">
              For any queries or further assistance, please contact the Manager at ${managerContact} .


              
            </span>

          </td>
        </tr>
        <tr>
          <td colspan="2" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:10px 0;padding-top:10px;color:#767676;font-weight: bold;">
           
            <span style="font-size:16px">
            Thank you for choosing RentoBikes as your partner for daily commutes and adventurous rides.

              

              
            </span>

          </td>
        </tr>
        <tr>
          <td colspan="2" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:10px 0;padding-top:10px;color:#767676;font-weight: bold;">
           
            <span style="font-size:16px">
            Happy Riding! 

              
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
              <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/cash+(1).png" class="CToWUd" data-bit="iit" alt="cashimage.">
              <br>
            <span style="color:#444;font-size:16px">Flexible Packages</span> <br>
            <span style="color:#999;font-size:14px">Grab daily, weekly, fortnight and monthly packages at
              discounted rates</span> <br>
          </td>
          <td style="padding:20px 20px;vertical-align:top">
            <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/bycicle+(1).png" class="CToWUd" data-bit="iit" alt="bikeimage">
            <br>
            <span style="color:#444;font-size:16px">Wide Range</span> <br>
            <span style="color:#999;font-size:14px">Looking for a particular brand or location? We have probably
              got it.</span> <br>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 20px 20px 10px;vertical-align:top">
            <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/WhatsApp+Image+2024-12-31+at+16.08.05_d37a3004.png" class="CToWUd" data-bit="iit" alt="scoterimage.">
            <br>
            <span style="color:#444;font-size:16px;padding-top:15px;display:inline-block">Highly Maintained
              Fleet</span> <br>
            <span style="color:#999;font-size:14px">Get high quality and serviced vehicles.</span> <br>
          </td>
          <td style="padding:20px 20px;vertical-align:top">
            <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/availability+(1).png" class="CToWUd" data-bit="iit" alt="availabilityimage.">
            <br>
            <span style="color:#444;font-size:16px;padding-top:15px;display:inline-block">24*7 At
              Service</span> <br>
            <span style="color:#999;font-size:14px">Day or night, rent a bike.</span> <br>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 20px 20px 10px;vertical-align:top">
            <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/rupee+(1).png" class="CToWUd" data-bit="iit" alt="rupeeimage.">
            <br>
            <span style="color:#444;font-size:16px;padding-top:15px;display:inline-block">Book Now, Pay
              later</span> <br>
            <span style="color:#999;font-size:14px">Flexibility to decide when and how to pay.</span> <br>
          </td>
          <td style="padding:20px 20px;vertical-align:top">
            <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/save+(1).png" class="CToWUd" data-bit="iit" alt="saveimage.">
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
                  <td style="background-color:#ddd;font-size:14px;color:#777;padding:30px 10px 30px 20px; width: 50%;">
                    <p style="text-align: center; width: 100%;"><strong>HELP &amp; SUPPORT</strong></p> <br>
                    <a href="mailto:support@rentobikes.com" style="color:#7a0;text-decoration:none;font-size:12px" target="_blank"><div style="width: 40px; margin-bottom: 10px; margin-left: auto; margin-right: auto;">
                      <img data-emoji="✉" class="an1" alt="✉" aria-label="✉" width="100%" draggable="false" src="https://fonts.gstatic.com/s/e/notoemoji/15.1/2709/72.png" loading="lazy">
                    </div>
                    <span style="display: block; text-align: center;">support@rentobikes.com</span></a>
                  </td>
                  <td style="background-color:#ddd;font-size:14px;color:#777;padding:30px 0px 30px 0px; width: 50%;">
                    <p style="text-align: center; width: 100%;"><strong>CALL US ON</strong></p><br>
                    <a href="tel:+91888448891" style="color:#7a0;text-decoration:none;font-size:12px" target="_blank"><div style="width: 40px; margin-bottom: 10px; margin-left: auto; margin-right: auto;">
                      <img data-emoji="☎" class="an1" alt="☎" aria-label="☎" width="100%" draggable="false" src="https://fonts.gstatic.com/s/e/notoemoji/15.1/260e/72.png" loading="lazy">
                    </div> <span style="display: block; text-align: center;">+91888448891</span></a>
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
   
  }


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

async function sendEmailForExtendOrVehicleChange(email,firstName, flag, bookingId, amount, link, managerContact ) {



 
 
  const mailOptions = {
    from: 'Rento Bikes <support@rentobikes.com>',
    to: email,
    subject: `${flag}: Your Bike Booking is Cancelled!`,
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
            Hi ${firstName},
          </td>
          <td style="text-align:right">
            <img src="https://admin.rentobikes.com/assets/rento-logo-2YTjnrFt.png" title="Rentobikes Logo" style="height:60px;width:auto;margin-right:20px" class="CToWUd a6T" data-bit="iit" tabindex="0"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 482.938px; top: 267.417px;"><span data-is-tooltip-wrapper="true" class="a5q" jsaction="JIbuQc:.CLIENT"><button class="VYBDae-JX-I VYBDae-JX-I-ql-ay5-ays CgzRE" jscontroller="PIVayb" jsaction="click:h5M12e; clickmod:h5M12e;pointerdown:FEiYhc;pointerup:mF5Elf;pointerenter:EX0mI;pointerleave:vpvbp;pointercancel:xyn4sd;contextmenu:xexox;focus:h06R8; blur:zjh6rb;mlnRJb:fLiPzd;" data-idom-class="CgzRE" data-use-native-focus-logic="true" jsname="hRZeKc" aria-label="Download attachment " data-tooltip-enabled="true" data-tooltip-id="tt-c33" data-tooltip-classes="AZPksf" id="" jslog="91252; u014N:cOuCgd,Kr2w4b,xr6bB; 4:WyIjbXNnLWY6MTgxOTkzMjY0MDE1NjkxNjM4MyJd; 43:WyJpbWFnZS9qcGVnIl0."><span class="OiePBf-zPjgPe VYBDae-JX-UHGRz"></span><span class="bHC-Q" jscontroller="LBaJxb" jsname="m9ZlFb" soy-skip="" ssk="6:RWVI5c"></span><span class="VYBDae-JX-ank-Rtc0Jf" jsname="S5tZuc" aria-hidden="true"><span class="notranslate bzc-ank" aria-hidden="true"><svg viewBox="0 -960 960 960" height="20" width="20" focusable="false" class=" aoH"><path d="M480-336L288-528l51-51L444-474V-816h72v342L621-579l51,51L480-336ZM263.72-192Q234-192 213-213.15T192-264v-72h72v72H696v-72h72v72q0,29.7-21.16,50.85T695.96-192H263.72Z"></path></svg></span></span><div class="VYBDae-JX-ano"></div></button><div class="ne2Ple-oshW8e-J9" id="tt-c33" role="tooltip" aria-hidden="true">Download</div></span></div>
          </td>
        </tr>

        
        <tr>
          <td colspan="2" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:30px 0;padding-top:10px;color:#767676;font-weight: bold;">
           
            <span style="font-size:16px">
              Thank you for your request to ${flag} with RentoBikes. To proceed, please complete the payment for the additional charges.
              Here are the details of your request: Booking ID: #${bookingId} Additional Charges: ₹${amount} Payment Link: ${link}<br/><br/>

              Please complete the payment at your earliest convenience to confirm your request. Once the payment is successful, we will update your booking and send you a confirmation.
              
            </span>

          </td>
        </tr>
        <tr>
          <td colspan="2" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:30px 0;padding-top:10px;color:#767676;font-weight: bold;">
           
            <span style="font-size:16px">
              If you have any questions or need assistance, feel free to contact us at ${managerContact}.<br/><br/>

              Thank you for choosing RentoBikes.<br/><br/>


              We look forward to serving you!
              
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
              <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/cash+(1).png" class="CToWUd" data-bit="iit" alt="cashimage.">
              <br>
            <span style="color:#444;font-size:16px">Flexible Packages</span> <br>
            <span style="color:#999;font-size:14px">Grab daily, weekly, fortnight and monthly packages at
              discounted rates</span> <br>
          </td>
          <td style="padding:20px 20px;vertical-align:top">
            <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/bycicle+(1).png" class="CToWUd" data-bit="iit" alt="bikeimage">
            <br>
            <span style="color:#444;font-size:16px">Wide Range</span> <br>
            <span style="color:#999;font-size:14px">Looking for a particular brand or location? We have probably
              got it.</span> <br>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 20px 20px 10px;vertical-align:top">
            <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/WhatsApp+Image+2024-12-31+at+16.08.05_d37a3004.png" class="CToWUd" data-bit="iit" alt="scoterimage.">
            <br>
            <span style="color:#444;font-size:16px;padding-top:15px;display:inline-block">Highly Maintained
              Fleet</span> <br>
            <span style="color:#999;font-size:14px">Get high quality and serviced vehicles.</span> <br>
          </td>
          <td style="padding:20px 20px;vertical-align:top">
            <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/availability+(1).png" class="CToWUd" data-bit="iit" alt="availabilityimage.">
            <br>
            <span style="color:#444;font-size:16px;padding-top:15px;display:inline-block">24*7 At
              Service</span> <br>
            <span style="color:#999;font-size:14px">Day or night, rent a bike.</span> <br>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 20px 20px 10px;vertical-align:top">
            <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/rupee+(1).png" class="CToWUd" data-bit="iit" alt="rupeeimage.">
            <br>
            <span style="color:#444;font-size:16px;padding-top:15px;display:inline-block">Book Now, Pay
              later</span> <br>
            <span style="color:#999;font-size:14px">Flexibility to decide when and how to pay.</span> <br>
          </td>
          <td style="padding:20px 20px;vertical-align:top">
            <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/save+(1).png" class="CToWUd" data-bit="iit" alt="saveimage.">
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
                  <td style="background-color:#ddd;font-size:14px;color:#777;padding:30px 10px 30px 20px; width: 50%;">
                    <p style="text-align: center; width: 100%;"><strong>HELP &amp; SUPPORT</strong></p> <br>
                    <a href="mailto:support@rentobikes.com" style="color:#7a0;text-decoration:none;font-size:12px" target="_blank"><div style="width: 40px; margin-bottom: 10px; margin-left: auto; margin-right: auto;">
                      <img data-emoji="✉" class="an1" alt="✉" aria-label="✉" width="100%" draggable="false" src="https://fonts.gstatic.com/s/e/notoemoji/15.1/2709/72.png" loading="lazy">
                    </div>
                    <span style="display: block; text-align: center;">support@rentobikes.com</span></a>
                  </td>
                  <td style="background-color:#ddd;font-size:14px;color:#777;padding:30px 0px 30px 0px; width: 50%;">
                    <p style="text-align: center; width: 100%;"><strong>CALL US ON</strong></p><br>
                    <a href="tel:+91888448891" style="color:#7a0;text-decoration:none;font-size:12px" target="_blank"><div style="width: 40px; margin-bottom: 10px; margin-left: auto; margin-right: auto;">
                      <img data-emoji="☎" class="an1" alt="☎" aria-label="☎" width="100%" draggable="false" src="https://fonts.gstatic.com/s/e/notoemoji/15.1/260e/72.png" loading="lazy">
                    </div> <span style="display: block; text-align: center;">+91888448891</span></a>
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
            </table>               </td>
        </tr>

      </tbody>
    </table>
</body>
</html>`,
   
  }


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




module.exports = { sendEmailForExtendOrVehicleChange,sendReminderEmail,sendOtpByEmail, sendCancelEmail,sendOtpByEmailForBooking, sendEmailForBookingToStationMaster, sendInvoiceByEmail };
