// // // // let currentNumber = 1;

// // // // function generateInvoiceNumber() {
// // // //   const currentYear = new Date().getFullYear();
// // // //   const staticPrefix = "Inv";

 
// // // //   const invoiceNumber = `${staticPrefix}${currentYear}${String(currentNumber).padStart(5, "0")}`;

 
// // // //   currentNumber++;

// // // //   return invoiceNumber;
// // // // }


// // // // console.log(generateInvoiceNumber()); // inv202400001
// // // // //console.log(generateInvoiceNumber()); // inv202400002


// // // const dayjs = require('dayjs');

// // // const date = dayjs("2024-11-30T01:00:00").toDate();
// // // console.log(date); // Sat Nov 30 2024 01:00:00 GMT+your timezone offset

// // // function getMilliseconds(dateString) {
// // //     if (!dateString) return "Invalid date";
  
// // //     const date = new Date(dateString);
// // //     if (isNaN(date)) return "Invalid date";
  
// // //     return date.getTime(); // Returns the time in milliseconds since January 1, 1970
// // //   }

// // // const milliseconds = getMilliseconds(new Date());
// // // console.log(milliseconds)


// // // const makeDateTime = (datetimeString) => {
// // //   // Split the input into date and time
// // //   const [dateString, timeString] = datetimeString.split(" ");
  
// // //   // Extract day, month, and year from the date
// // //   const [day, month, year] = dateString.split("/");

// // //   // Extract hour and minute from the time
// // //   const [hour, minute] = timeString.split(":");

// // //   // Ensure all parts are zero-padded
// // //   const isoString = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00Z`;

// // //   return isoString;
// // // };

// // // console.log(makeDateTime("04/01/2025 13:00"));


// // const url = "https://api.interakt.ai/v1/public/message/";


// // // async function whatsappWelcomeMessage(name, contact) {
// // //   const obj = { status: 200, message: "Message sent successfully" };

// // //   // Validate input
// // //   if (!name || !contact) {
// // //     obj.status = 400;
// // //     obj.message = "Failed to send: name and contact are required";
// // //     return obj;
// // //   }

// // //   // Prepare request data
// // //   const data = {
// // //     countryCode: "+91",
// // //     phoneNumber: contact, 
// // //     type: "Template",
// // //     template: {
// // //         name: "welcome_customer", 
// // //         languageCode: "en",
// // //         // headerValues: [
// // //         //     "header_variable_value",
// // //         // ],
// // //         bodyValues: [ `${name}` ], 
// // //         // buttonValues: {
// // //         //     "1": {}
// // //         // }
// // //     }
// // // };

// // // const requestBody = JSON.stringify(data);

// // // const headers = {
// // //     "Content-Type": "application/json",
// // //     "Authorization": "Basic UTJpU0pmUXFXVExmbWY1S1JVSVotUjA4M0dhS2VHeGNXZFdoeUNaSU9pQTo="
// // // };
// // // console.log(data)
  
// // //   try {
// // //     const response = await fetch(url, {
// // //         method: "POST",
// // //         headers: headers,
// // //         body: requestBody
// // //     });

// // //     // Check if the response is OK
// // //     if (!response.ok) {
// // //       const errorMessage = await response.text(); 
// // //       console.error("HTTP error:", response.status, response.statusText);
// // //       console.error("Error details:", errorMessage);
// // //       return;
// // //   }

// // //     // Parse the response JSON
// // //     const responseData = await response.json();
    
// // //     // Handle the response
// // //     const message = responseData.message;
// // //     const responseMsg = responseData.result;

// // //     console.log("Message:", message);
// // //     console.log("Result:", responseMsg);

    

// // // } catch (error) {
// // //     console.error("Fetch Error:", error.message);
// // // }

// // //   return obj;
// // // }



// // // const sendBookingConfirmation = async (
// // //   contact,
// // //   name,
// // //   vehicleName,
// // //   BookingStartDateAndTime,
// // //   bookingId,
// // //   stationName,
// // //   mapLink,
// // //   dealerContact,
// // //   userPaid,
// // //   payableAmount,
// // //   refundableDeposit
// // // ) => {
// // //   const obj = { status: 200, message: "Message sent successfully" };

// // //   try {

// // //     function convertDateString(dateString) {
// // //       if (!dateString) return "Invalid date";
    
// // //       const date = new Date(dateString);
// // //       if (isNaN(date)) return "Invalid date";
    
// // //       const options = { 
// // //         day: 'numeric', 
// // //         month: 'long', 
// // //         year: 'numeric', 
// // //         hour: 'numeric', 
// // //         minute: '2-digit', 
// // //         hour12: true 
// // //       };
    
// // //       return date.toLocaleString('en-US', options);
// // //     }
// // //     // Fetch user and station details

    

// // // // const user = await User.findOne({ _id: userId }); // Replace 'userId' with the actual field name, e.g., '_id' or another field.
// // // // if (!user) {
// // // //   obj.status = 404;
// // // //   obj.message = `User not found for userId: ${userId}`;
// // // //   await Log({
// // // //     message: obj.message,
// // // //     functionName: "whatsapp message",
// // // //   });
// // // //   console.error(obj.message);
// // // //   return obj;
// // // // }

// // // // const station = await User.findOne({ _id: stationMasterUserId }); 
// // // // if (!station) {
// // // //   obj.status = 404;
// // // //   obj.message = `Station master not found for stationMasterUserId: ${stationMasterUserId}`;
// // // //   await Log({
// // // //     message: obj.message,
// // // //     functionName: "whatsapp message",
// // // //   });
// // // //   console.error(obj.message);
// // // //   return obj;
// // // // }



// // //     // Extract required details
// // //     // const name = user.firstName || "Unknown Name";
// // //     // const contact = user.contact || "Unknown Contact";
// // //     // const dealerContact = station.contact || "Unknown Dealer Contact";
// // //     // const mapLink = "https://www.google.com/maps/search/?api=1&query="
// // //     // + station.latitude + "," + station.longitude;

// // //     // Debug: Log all inputs
// // //     // console.log(
// // //     //   "Inputs:",
// // //     //   { userId, name, contact, dealerContact, stationMasterUserId, vehicleName, BookingStartDateAndTime, bookingId, stationName, mapLink, userPaid, payableAmount, refundableDeposit }
// // //     // );

// // //     // Validate required fields
// // //     if (
// // //       !name ||
// // //       !contact ||
// // //       !dealerContact ||
// // //       !vehicleName ||
// // //       !BookingStartDateAndTime ||
// // //       !bookingId ||
// // //       !stationName ||
// // //       !mapLink ||
// // //       typeof userPaid !== "number" ||
// // //       typeof payableAmount !== "number" ||
// // //       typeof refundableDeposit !== "number"
// // //     ) {
// // //       obj.status = 400;
// // //       obj.message = "Failed to send: Missing or invalid required fields";
// // //       // await Log({
// // //       //   message: obj.message,
// // //       //   functionName: "whatsapp message",
      
// // //       // });
// // //       console.error(obj.message);
// // //       return obj;
// // //     }

// // //     // Prepare API payload
// // //     const data = {
// // //       countryCode: "+91",
// // //       phoneNumber: contact,
// // //       type: "Template",
// // //       template: {
// // //         name: "booking_confirm_paid", // Replace with the correct template name
// // //         languageCode: "en", // Adjust based on your template's language
// // //         bodyValues: [
// // //           name,
// // //           vehicleName,
// // //           convertDateString(BookingStartDateAndTime),
// // //           bookingId,
// // //           stationName,
// // //           mapLink,
// // //           dealerContact,
// // //           userPaid.toString(),
// // //           parseInt(payableAmount).toString(),
// // //           //refundableDeposit.toString(),
// // //         ],
// // //       },
// // //     };
  
// // //     const headers = {
// // //           "Content-Type": "application/json",
// // //           "Authorization": "Basic UTJpU0pmUXFXVExmbWY1S1JVSVotUjA4M0dhS2VHeGNXZFdoeUNaSU9pQTo="
// // //       };

// // //     const requestBody = JSON.stringify(data);

  
// // //     const response = await fetch(url, {
// // //         method: "POST",
// // //         headers: headers,
// // //         body: requestBody
// // //     });

// // //     if (!response.ok) {
// // //       const errorMessage = await response.text(); 
// // //       console.error("HTTP error:", response.status, response.statusText);
// // //       console.error("Error details:", errorMessage);
// // //       return;
// // //   }

// // //     // Parse the response JSON
// // //     const responseData = await response.json();
    
// // //     // Handle the response
// // //     const message = responseData.message;
// // //     const responseMsg = responseData.result;

// // //     console.log("Message:", message);
// // //     console.log("Result:", responseMsg);

    

// // // } catch (error) {
// // //     console.error("Fetch Error:", error.message);
// // // }

// // //   return obj;
// // // };



// // // const contact = "8433408211";
// // // const name = "Alice Smith";
// // // const vehicleName = "Hyundai Creta";
// // // const BookingStartDateAndTime = "2025-01-15T10:30:00Z";
// // // const bookingId = "BOOK12345";
// // // const stationName = "Main Street Charging Station";
// // // const mapLink = "https://maps.google.com/example";
// // // const dealerContact = "8433408211";
// // // const userPaid = 1500;
// // // const payableAmount = 5000;
// // // const refundableDeposit = 2000;

// // // // Generate and log the test data
// // // const testRequestData = sendBookingConfirmation(
// // //   contact,
// // //   name,
// // //   vehicleName,
// // //   BookingStartDateAndTime,
// // //   bookingId,
// // //   stationName,
// // //   mapLink,
// // //   dealerContact,
// // //   userPaid,
// // //   payableAmount,
// // //   refundableDeposit
// // // );



// // // async function whatsappMessage(contact, templateName, values) {
// // //   const obj = { status: 200, message: "Message sent successfully" };
// // //   console.log("Contact:", contact, "TemplateName:", templateName, "Values:", values);

// // //   // Validate inputs
// // //   if (!contact || !templateName || !values || values.length === 0) {
// // //     console.error("Invalid input: contact, templateName, and values are required");
// // //     return {
// // //       status: 400,
// // //       message: "Invalid input: contact, templateName, and values are required",
// // //     };
// // //   }

// // //   // Prepare request data
// // //   const data = {
// // //     countryCode: "+91",
// // //     phoneNumber: contact,
// // //     type: "Template",
// // //     template: {
// // //       name: templateName,
// // //       languageCode: "en",
// // //       bodyValues: values,
// // //     },
// // //   };

// // //   const requestBody = JSON.stringify(data);

// // //   const headers = {
// // //     "Content-Type": "application/json",
// // //     Authorization: process.env.apiKey,
// // //   };

// // //   console.log("Request Data:", data);

// // //   try {
// // //     const response = await fetch("https://api.interakt.ai/v1/public/message/", {
// // //       method: "POST",
// // //       headers: headers,
// // //       body: requestBody,
// // //     });

// // //     if (!response.ok) {
// // //       const errorMessage = await response.text();
// // //       console.error("HTTP error:", response.status, response.statusText);
// // //       console.error("Error details:", errorMessage);
// // //       return {
// // //         status: response.status,
// // //         message: `Error: ${response.statusText}`,
// // //         details: errorMessage,
// // //       };
// // //     }

// // //     // Parse the response JSON
// // //     const responseData = await response.json();
// // //     console.log("Response Data:", responseData);

// // //     obj.message = responseData.message;
// // //     obj.result = responseData.result;

// // //   } catch (error) {
// // //     console.error("Fetch Error:", error.message);
// // //     return {
// // //       status: 500,
// // //       message: "Internal server error",
// // //       details: error.message,
// // //     };
// // //   }

// // //   return obj;
// // // }
// // // function convertDateString(dateString) {
// // //   if (!dateString) return "Invalid date";

// // //   const date = new Date(dateString);
// // //   if (isNaN(date)) return "Invalid date";

// // //   const options = { 
// // //     day: 'numeric', 
// // //     month: 'long', 
// // //     year: 'numeric', 
// // //     hour: 'numeric', 
// // //     minute: '2-digit', 
// // //     hour12: true 
// // //   };

// // //   return date.toLocaleString('en-US', options);
// // // }
// // // console.log(convertDateString("2025-01-09T11:00:00Z"))

// // const nodemailer = require("nodemailer");
// // const { sendOtpByEmailForBooking } = require("./src/api/onboarding/services/vehicles.service");


// // const transporter = nodemailer.createTransport({
// //   host: "smtp-relay.brevo.com",
// //   port: 587,
// //   secure: false, // true for 465, false for other ports
// //   auth: {
// //     user: "82afd7001@smtp-brevo.com", // generated ethereal user
// //     pass: "V2FZcGrQbtPsEdYI", // generated ethereal password
// //     },
// //   });



// // async function sendOtpByEmail(email, firstName, lastName) {
// //   try {
// //     const info = await transporter.sendMail({
// //       from: '"Rento-Moto Support" <support@rentobikes.com>',
// //       to: email,
// //       subject: "Welcome to RentoBikes!",
// //       html: `<!DOCTYPE html>
// // <html lang="en">
// // <head>
// //     <meta charset="UTF-8">
// //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
// //     <title>RentoBikes</title >
// //         <link rel="shortcut icon" href="https://admin.rentobikes.com/assets/rento-logo-2YTjnrFt.png" type="image/png">
// // </head>
// // <body>
// //     <table width="100%" border="0" cellspacing="0" cellpadding="0" align="center" style="background-color:#fff;border:1px solid #ccc;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;margin:0px auto;max-width:600px;padding:40px;width:80%;overflow:hidden">
// //         <tbody>

          
// //           <tr>
// //             <td style="color:#e23844;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:20px;padding:30px;padding-left:0;font-weight:bold">
// //               Hi ${firstName} ${lastName},
// //             </td>
// //             <td style="text-align:right">
// //               <img src="https://admin.rentobikes.com/assets/rento-logo-2YTjnrFt.png" title="Rentobikes Logo" style="height:60px;width:auto;margin-right:20px" class="CToWUd a6T" data-bit="iit" tabindex="0"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 482.938px; top: 267.417px;"><span data-is-tooltip-wrapper="true" class="a5q" jsaction="JIbuQc:.CLIENT"><button class="VYBDae-JX-I VYBDae-JX-I-ql-ay5-ays CgzRE" jscontroller="PIVayb" jsaction="click:h5M12e; clickmod:h5M12e;pointerdown:FEiYhc;pointerup:mF5Elf;pointerenter:EX0mI;pointerleave:vpvbp;pointercancel:xyn4sd;contextmenu:xexox;focus:h06R8; blur:zjh6rb;mlnRJb:fLiPzd;" data-idom-class="CgzRE" data-use-native-focus-logic="true" jsname="hRZeKc" aria-label="Download attachment " data-tooltip-enabled="true" data-tooltip-id="tt-c33" data-tooltip-classes="AZPksf" id="" jslog="91252; u014N:cOuCgd,Kr2w4b,xr6bB; 4:WyIjbXNnLWY6MTgxOTkzMjY0MDE1NjkxNjM4MyJd; 43:WyJpbWFnZS9qcGVnIl0."><span class="OiePBf-zPjgPe VYBDae-JX-UHGRz"></span><span class="bHC-Q" jscontroller="LBaJxb" jsname="m9ZlFb" soy-skip="" ssk="6:RWVI5c"></span><span class="VYBDae-JX-ank-Rtc0Jf" jsname="S5tZuc" aria-hidden="true"><span class="notranslate bzc-ank" aria-hidden="true"><svg viewBox="0 -960 960 960" height="20" width="20" focusable="false" class=" aoH"><path d="M480-336L288-528l51-51L444-474V-816h72v342L621-579l51,51L480-336ZM263.72-192Q234-192 213-213.15T192-264v-72h72v72H696v-72h72v72q0,29.7-21.16,50.85T695.96-192H263.72Z"></path></svg></span></span><div class="VYBDae-JX-ano"></div></button><div class="ne2Ple-oshW8e-J9" id="tt-c33" role="tooltip" aria-hidden="true">Download</div></span></div>
// //             </td>
// //           </tr>

          
// //           <tr>
// //             <td colspan="2" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:30px 0;padding-top:10px;color:#767676;font-weight: bold;">
// //               <span >
// //                 Welcome to the Rentobikes family! It's great to meet you! 
// //               </span>
// //               <br>
// //               <br>
// //               <span style="font-size:16px">
// //                 We are excited to have you come along with us on our journey. As a
// //                 young startup, we value each member dearly.
// //                 <br>
// //                 <br>
// //                 We are committed to providing easy and hassle-free
// //                 solutions
// //                 to all your commuting problems here at RentoBikes. We promise to keep you updated on exciting offers and
// //                 our thrilling trips pan-India.
// //               </span>

// //             </td>
// //           </tr>

          
// //           <tr style="height:1px;padding:0 80px">
// //             <td colspan="2">
// //               <div style="border-top:1px solid #ddd;width:100%;margin:auto"></div>
// //             </td>
// //           </tr>

          
// //           <tr>
// //             <td colspan="2" align="left" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:20px;padding:20px 30px 0px 0px;background-color:#fff;color:#767676">
// //               <b>Why choose RentoBikes</b>
// //             </td>
// //           </tr>
// //           <tr>
// //             <td style="padding:20px 20px 20px 10px;vertical-align:top">
// //                 <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/cash+(1).png" class="CToWUd" data-bit="iit" alt="cashimage.">
// //                 <br>
// //               <span style="color:#444;font-size:16px">Flexible Packages</span> <br>
// //               <span style="color:#999;font-size:14px">Grab daily, weekly, fortnight and monthly packages at
// //                 discounted rates</span> <br>
// //             </td>
// //             <td style="padding:20px 20px;vertical-align:top">
// //               <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/bycicle+(1).png" class="CToWUd" data-bit="iit" alt="bikeimage">
// //               <br>
// //               <span style="color:#444;font-size:16px">Wide Range</span> <br>
// //               <span style="color:#999;font-size:14px">Looking for a particular brand or location? We have probably
// //                 got it.</span> <br>
// //             </td>
// //           </tr>
// //           <tr>
// //             <td style="padding:20px 20px 20px 10px;vertical-align:top">
// //               <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/WhatsApp+Image+2024-12-31+at+16.08.05_d37a3004.png" class="CToWUd" data-bit="iit" alt="scoterimage.">
// //               <br>
// //               <span style="color:#444;font-size:16px;padding-top:15px;display:inline-block">Highly Maintained
// //                 Fleet</span> <br>
// //               <span style="color:#999;font-size:14px">Get high quality and serviced vehicles.</span> <br>
// //             </td>
// //             <td style="padding:20px 20px;vertical-align:top">
// //               <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/availability+(1).png" class="CToWUd" data-bit="iit" alt="availabilityimage.">
// //               <br>
// //               <span style="color:#444;font-size:16px;padding-top:15px;display:inline-block">24*7 At
// //                 Service</span> <br>
// //               <span style="color:#999;font-size:14px">Day or night, rent a bike.</span> <br>
// //             </td>
// //           </tr>
// //           <tr>
// //             <td style="padding:20px 20px 20px 10px;vertical-align:top">
// //               <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/rupee+(1).png" class="CToWUd" data-bit="iit" alt="rupeeimage.">
// //               <br>
// //               <span style="color:#444;font-size:16px;padding-top:15px;display:inline-block">Book Now, Pay
// //                 later</span> <br>
// //               <span style="color:#999;font-size:14px">Flexibility to decide when and how to pay.</span> <br>
// //             </td>
// //             <td style="padding:20px 20px;vertical-align:top">
// //               <img style="height:80px;width:auto" src="https://rentos3.s3.ap-south-1.amazonaws.com/save+(1).png" class="CToWUd" data-bit="iit" alt="saveimage.">
// //               <br>
// //               <span style="color:#444;font-size:16px;padding-top:15px;display:inline-block">Instant
// //                 Refund</span> <br>
// //               <span style="color:#999;font-size:14px">Facing an issue while booking/pick up? We initiate instant
// //                 refund.</span> <br>
// //             </td>
// //           </tr>

          
// //           <tr style="height:1px;padding:0 80px">
// //             <td colspan="2">
// //               <div style="border-bottom:1px solid #ddd;width:100%;margin:auto;padding-top:30px"></div>
// //             </td>
// //           </tr>

          
// //           <tr>
// //             <td colspan="2" align="center" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:20px;padding:20px 0px 0px 0px;background-color:#fff;color:#767676">
// //               <b>Book your ride now!</b>
// //             </td>
// //           </tr>
// //           <tr>
// //             <td colspan="2" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:16px;padding:30px 0;color:#767676">
// //               <div style="text-align:center">
// //                 <a href="https://www.rentobikes.com/" style="text-decoration:none;background-color:#e23844;color:#fff;border-radius:20px;font-weight:bold;font-size:16px;padding:10px 20px" target="_blank" >
// //                   BOOK NOW
// //                 </a>
// //               </div>
// //               <br>
// //               <br>
// //               <div style="padding:0 20px">
// //                 With a host of amazing features, we assure you that we will provide you the best services and the most
// //                 delectable deals! <br>
// //                 Book your ride now: <a href="https://www.rentobikes.com/" style="color:#e23844;text-decoration:none;font-weight:bold" target="_blank" >www.rentobikes.com</a>
// //               </div>
// //             </td>
// //           </tr>

          
// //           <tr>
// //             <td colspan="2">
// //               <table width="100%" border="0" cellspacing="0" cellpadding="0" align="center">
// //                 <tbody>
                  
// //                   <tr>
// //                     <td style="background-color:#ddd;font-size:14px;color:#777;padding:30px 10px 30px 20px;min-width:162px">
// //                       <b>HELP &amp; SUPPORT</b> <br>
// //                       <a href="mailto:support@rentobikes.com" style="color:#7a0;text-decoration:none;font-size:12px" target="_blank"><img data-emoji="✉" class="an1" alt="✉" aria-label="✉" draggable="false" src="https://fonts.gstatic.com/s/e/notoemoji/15.1/2709/72.png" loading="lazy">
// //                         support@rentobikes.com</a>
// //                     </td>
// //                     <td style="background-color:#ddd;font-size:14px;color:#777;padding:30px 0px 30px 0px">
// //                       <b>CALL US ON</b><br>
// //                       <a href="tel:+91888448891" style="color:#7a0;text-decoration:none;font-size:12px" target="_blank"><img data-emoji="☎" class="an1" alt="☎" aria-label="☎" draggable="false" src="https://fonts.gstatic.com/s/e/notoemoji/15.1/260e/72.png" loading="lazy"> +91888448891</a>
// //                     </td>
// //                   </tr>
              
                  
// //                   <tr>
// //                     <td style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:12px;padding:5px;padding-left:20px;padding-top:20px;border-top:1px solid #ccc;background-color:#ddd;color:#767676;text-align:left">
// //                       <a style="text-decoration:none;color:#777" href="https://www.rentobikes.com/contact-us" target="_blank" >Contact
// //                         Us</a>
// //                     </td>
// //                     <td colspan="1" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:12px;padding:5px;padding-top:20px;border-top:1px solid #ccc;background-color:#ddd;color:#767676;text-align:left">
// //                     </td>
// //                   </tr>
// //                   <tr>
// //                     <td style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:12px;padding:5px;padding-left:20px;background-color:#ddd;color:#767676;text-align:left">
// //                       <a style="text-decoration:none;color:#777" href="https://www.rentobikes.com/privacy-policy" target="_blank" >Privacy Policy</a>
// //                     </td>
// //                     <td colspan="1" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:12px;padding:5px;background-color:#ddd;color:#767676;text-align:left">
                      
// //                     </td>
// //                   </tr>
// //                   <tr>
// //                     <td style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:12px;padding:5px;padding-left:20px;padding-bottom:20px;background-color:#ddd;color:#767676;text-align:left">
// //                       <a style="text-decoration:none;color:#777" href="https://www.rentobikes.com/terms-and-conditions" target="_blank" >Terms and
// //                         Conditions</a>
// //                     </td>
// //                     <td colspan="1" style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:12px;padding:5px;padding-bottom:20px;background-color:#ddd;color:#767676;text-align:left">
// //                     </td>
// //                   </tr>
              
                  
// //                   <tr style="background-color:#eaeaea">
// //                     <td align="left">
// //                       <img src="https://admin.rentobikes.com/assets/rento-logo-2YTjnrFt.png" title="RentoBikes Logo" style="height:50px;width:auto;margin-right:20px;padding-left:20px;padding-top:10px" class="CToWUd a6T" data-bit="iit" tabindex="0"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 198.469px; top: 1854.81px;"><span data-is-tooltip-wrapper="true" class="a5q" jsaction="JIbuQc:.CLIENT"><button class="VYBDae-JX-I VYBDae-JX-I-ql-ay5-ays CgzRE" jscontroller="PIVayb" jsaction="click:h5M12e; clickmod:h5M12e;pointerdown:FEiYhc;pointerup:mF5Elf;pointerenter:EX0mI;pointerleave:vpvbp;pointercancel:xyn4sd;contextmenu:xexox;focus:h06R8; blur:zjh6rb;mlnRJb:fLiPzd;" data-idom-class="CgzRE" data-use-native-focus-logic="true" jsname="hRZeKc" aria-label="Download attachment " data-tooltip-enabled="true" data-tooltip-id="tt-c34" data-tooltip-classes="AZPksf" id="" jslog="91252; u014N:cOuCgd,Kr2w4b,xr6bB; 4:WyIjbXNnLWY6MTgxOTkzMjY0MDE1NjkxNjM4MyJd; 43:WyJpbWFnZS9qcGVnIl0."><span class="OiePBf-zPjgPe VYBDae-JX-UHGRz"></span><span class="bHC-Q" jscontroller="LBaJxb" jsname="m9ZlFb" soy-skip="" ssk="6:RWVI5c"></span><span class="VYBDae-JX-ank-Rtc0Jf" jsname="S5tZuc" aria-hidden="true"><span class="notranslate bzc-ank" aria-hidden="true"><svg viewBox="0 -960 960 960" height="20" width="20" focusable="false" class=" aoH"><path d="M480-336L288-528l51-51L444-474V-816h72v342L621-579l51,51L480-336ZM263.72-192Q234-192 213-213.15T192-264v-72h72v72H696v-72h72v72q0,29.7-21.16,50.85T695.96-192H263.72Z"></path></svg></span></span><div class="VYBDae-JX-ano"></div></button><div class="ne2Ple-oshW8e-J9" id="tt-c34" role="tooltip" aria-hidden="true">Download</div></span></div>
// //                     </td>
// //                     <td align="right" colspan="1" style="padding:20px 20px 20px 0">
                     
// //                     </td>
// //                   </tr>
// //                 </tbody>
// //               </table>              </td>
// //           </tr>

// //         </tbody>
// //       </table>
// // </body>
// // </html>`,
// //     });

// //     console.log("Email sent: %s", info.messageId);
// //     return { success: true };
// //   } catch (error) {
// //     console.error("Error sending OTP email:", error.message);
// //     return { success: false, error: error.message };
// //   }
// // }


// // console.log(sendOtpByEmail("himanshu.masai@gmail.com","Himanshu","Jain"))


// function isAtLeast18(dob) {
//   const dobDate = new Date(dob); // Parse the DOB string into a Date object
//   const today = new Date();

//   // Debugging: Output the parsed date of birth and today's date
//   console.log("DOB Date: ", dobDate);
//   console.log("Today's Date: ", today);

//   // Calculate the difference in years
//   let age = today.getFullYear() - dobDate.getFullYear();

//   // Adjust if the birth date has not yet occurred this year
//   const hasHadBirthdayThisYear =
//     today.getMonth() > dobDate.getMonth() || 
//     (today.getMonth() === dobDate.getMonth() && today.getDate() >= dobDate.getDate());

//   if (!hasHadBirthdayThisYear) {
//     age -= 1; // If the birthday hasn't happened yet this year, subtract 1 year
//   }

//   console.log("Calculated Age: ", age); // Debugging the age

//   return age >= 18;
// }
// console.log(isAtLeast18("2009-12-09"))

function convertTo24Hour(timeString) {
  // Split the string into time and period (AM/PM)
  const [time, period] = timeString.split(" "); // "10:00 PM" -> ["10:00", "PM"]
  const [hour, minutes] = time.split(":"); // "10:00" -> ["10", "00"]

  // Convert hour to a number and adjust for PM/AM
  let hour24 = parseInt(hour, 10);
  if (period === "PM" && hour24 !== 12) {
    hour24 += 12; // Convert PM to 24-hour format
  } else if (period === "AM" && hour24 === 12) {
    hour24 = 0; // Convert 12 AM to 0
  }

  return hour24; // Return only the hour in 24-hour format
}

console.log(convertTo24Hour("10:00 PM"))

paymentUpdates:{
  extentend:{
    amount:1232
    paymentMode:"online"
  }
}

const getDurationInDaysAndHours = (date1Str, date2Str) => {
  // Parse the input strings into Date objects
  const date1 = new Date(date1Str);
  const date2 = new Date(date2Str);

  // Check if the dates are valid
  if (isNaN(date1) || isNaN(date2)) {
    return "Invalid date format";
  }

  // Get the difference between the two dates in milliseconds
  const differenceInMs = Math.abs(date2 - date1);

  // Convert milliseconds to days and hours
  const totalHours = Math.floor(differenceInMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24; // Remaining hours after full days

  return { days, hours };
};

const t=getDurationInDaysAndHours("2025-02-03T10:00:00Z","2025-02-04T10:00:00Z")

console.log(t)