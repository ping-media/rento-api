const axios = require("axios");
require("dotenv").config();
const User = require("../db/schemas/onboarding/user.schema")
const Station = require("../db/schemas/onboarding/station.schema");
const Log= require("../db/schemas/onboarding/log");

const url = "https://api.interakt.ai/v1/public/message/";


// function extractInfo(data) {
//   if(!data) return
//     const {userId, stationMasterUserId, bookingId, vehicleName,stationName, BookingStartDateAndTime, bookingPrice, vehicleBasic, paymentMethod} = data;
//     const templateName = bookingPrice && bookingPrice?.userPaid && bookingPrice?.userPaid !== 0 ? "" : "booking_confirm_paid";
//     const totalPayment = bookingPrice && bookingPrice?.discountTotalPrice && bookingPrice?.discountTotalPrice !== 0 ? bookingPrice?.discountTotalPrice : bookingPrice?.totalPrice;
//     const userPaid = bookingPrice && bookingPrice?.userPaid;
//     const paymentBasedOnTemplate = templateName
//   return {
//     "contact": userId?.contact,
//     "templateName": templateName,
//     "values":[userId?.firstName,vehicleName,BookingStartDateAndTime,bookingId,stationName,"https://maps.google.com/example",stationMasterUserId?.contact,,vehicleBasic?.refundableDeposit]
//   }
// }

async function whatsappMessage(contact, templateName, values) {
 
  
   const obj = { status: 200, message: "Message sent successfully" };
   await Log({
    message: obj.message,
    functionName: "whatsapp message",
  });

 
  if (!contact || !templateName || !values || values.length === 0) {
    console.error("Invalid input: contact, templateName, and values are required");
    await Log({
          message: "Invalid input: contact, templateName, and values are required",
          functionName: "whatsapp message",
        });
    return {
      status: 400,
      message: "Invalid input: contact, templateName, and values are required",
    };
  }

  // Prepare request data
  const data = {
    countryCode: "+91",
    phoneNumber: contact,
    type: "Template",
    template: {
      name: templateName,
      languageCode: "en",
      bodyValues: values,
    },
  };

  const requestBody = JSON.stringify(data);

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Basic ${process.env.whatsappApiKey}` 
};

  console.log("Request Data:", data);

  try {
    const response = await fetch("https://api.interakt.ai/v1/public/message/", {
      method: "POST",
      headers: headers,
      body: requestBody,
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      console.error("HTTP error:", response.status, response.statusText);
      console.error("Error details:", errorMessage);
      await Log({
            message: `Error: ${response.statusText}`,
            functionName: "whatsapp message",
          });
      return {
        status: response.status,
        message: `Error: ${response.statusText}`,
        details: errorMessage,
      };
    }

    // Parse the response JSON
    const responseData = await response.json();
  //  console.log("Response Data:", responseData);

    obj.message = responseData.message;
    obj.result = responseData.result;
    console.log(obj)

  } catch (error) {
    console.error("Fetch Error:", error.message);
    await Log({
      message: `Error: ${error.message}`,
      functionName: "whatsapp message",
    });
    return {
      status: 500,
      message: "Internal server error",
      details: error.message,
    };
  }

  return obj;
}



// const sendBookingConfirmation = async (
//   userId,stationMasterUserId,vehicleName,BookingStartDateAndTime,bookingId,stationName,mapLink,userPaid,payableAmount,refundableDeposit) => {
//   const obj = { status: 200, message: "Message sent successfully" };

//   try {
//     // Fetch user and station details
//     const user = await User.findOne({ userId });
//     if (!user) {
//       obj.status = 404;
//       obj.message = `User not found for userId: ${userId}`;
//       console.error(obj.message);
//       return obj;
//     }

//     const station = await User.findOne({ userId: stationMasterUserId });
//     if (!station) {
//       obj.status = 404;
//       obj.message = `Station master not found for stationMasterUserId: ${stationMasterUserId}`;
//       console.error(obj.message);
//       return obj;
//     }

//     // Extract required details
//     const name = user.firstName;
//     const contact = user.contact;
//     const dealerContact = station.contact;

//     // Debug: Log the input data
//     console.log(
//       "Inputs:",
//       userId,
//       name,
//       contact,
//       dealerContact,
//       stationMasterUserId,
//       vehicleName,
//       BookingStartDateAndTime,
//       bookingId,
//       stationName,
//       mapLink,
//       userPaid,
//       payableAmount,
//       refundableDeposit
//     );

//     // Validate required fields
//     if (
//       !name ||
//       !contact ||
//       !dealerContact ||
//       !vehicleName ||
//       !BookingStartDateAndTime ||
//       !bookingId ||
//       !stationName ||
//       !mapLink ||
//       !userPaid ||
//       !payableAmount ||
//       !refundableDeposit
//     ) {
//       obj.status = 400;
//       obj.message = "Failed to send: Missing required fields";
//       console.error(obj.message);
//       return obj;
//     }

//     // Prepare API payload
//     const data = {
//       apiKey: process.env.API_KEY, // Ensure this is set in your environment variables
//       campaignName: "booking_confirmed_message",
//       destination: `+91${contact}`,
//       userName: name,
//       templateParams: [
//       name,
//       dealerContact,
//       // stationMasterUserId,
//       vehicleName,
//       BookingStartDateAndTime,
//       bookingId,
//       stationName,
//       mapLink,
//       userPaid,
//       payableAmount,
//       refundableDeposit
//       ],
//     };

//     console.log("Sending data:", data);

//     // Send the request
//     const response = await axios.post("https://backend.aisensy.com/campaign/t1/api/v2", data);
//     console.log("API response:", response.data);

//     if (response?.data?.success !== true) {
//       obj.status = 400;
//       obj.message = response.data.message || "Failed to send: API response indicates failure";
//       return obj;
//     }
//   } catch (error) {
//     console.error("Error in sendBookingConfirmation function:", error.response?.data || error.message);
//     obj.status = error.response?.status || 500;
//     obj.message = error.response?.data?.message || "Internal server error";
//     return obj;
//   }

//   return obj;
// };

// const sendBookingConfirmation = async (
 
// ) => {
//   const obj = { status: 200, message: "Message sent successfully" };

//   try {

//     function convertDateString(dateString) {
//       if (!dateString) return "Invalid date";
    
//       const date = new Date(dateString);
//       if (isNaN(date)) return "Invalid date";
    
//       const options = { 
//         day: 'numeric', 
//         month: 'long', 
//         year: 'numeric', 
//         hour: 'numeric', 
//         minute: '2-digit', 
//         hour12: true 
//       };
    
//       return date.toLocaleString('en-US', options);
//     }
//     // Fetch user and station details

    

// const user = await User.findOne({ _id: userId }); // Replace 'userId' with the actual field name, e.g., '_id' or another field.
// if (!user) {
//   obj.status = 404;
//   obj.message = `User not found for userId: ${userId}`;
//   await Log({
//     message: obj.message,
//     functionName: "whatsapp message",
//   });
//   console.error(obj.message);
//   return obj;
// }

// const station = await User.findOne({ _id: stationMasterUserId }); 
// if (!station) {
//   obj.status = 404;
//   obj.message = `Station master not found for stationMasterUserId: ${stationMasterUserId}`;
//   await Log({
//     message: obj.message,
//     functionName: "whatsapp message",
//   });
//   console.error(obj.message);
//   return obj;
// }



//     // Extract required details
//     const name = user.firstName || "Unknown Name";
//     const contact = user.contact || "Unknown Contact";
//     const dealerContact = station.contact || "Unknown Dealer Contact";
//     const mapLink = "https://www.google.com/maps/search/?api=1&query="
//     + station.latitude + "," + station.longitude;

   
//     if (
//       !name ||
//       !contact ||
//       !dealerContact ||
//       !vehicleName ||
//       !BookingStartDateAndTime ||
//       !bookingId ||
//       !stationName ||
//       !mapLink ||
//       typeof userPaid !== "number" ||
//       typeof payableAmount !== "number" ||
//       typeof refundableDeposit !== "number"
//     ) {
//       obj.status = 400;
//       obj.message = "Failed to send: Missing or invalid required fields";
//       await Log({
//         message: obj.message,
//         functionName: "whatsapp message",
      
//       });
//       console.error(obj.message);
//       return obj;
//     }

//     // Prepare API payload
//     const data = {
//       countryCode: "+91",
//       phoneNumber: contact,
//       type: "Template",
//       template: {
//         name: "booking_confirm_paid", // Replace with the correct template name
//         languageCode: "en", // Adjust based on your template's language
//         bodyValues: [
//           name,
//           vehicleName,
//           convertDateString(BookingStartDateAndTime),
//           bookingId,
//           stationName,
//           mapLink,
//           dealerContact,
//           userPaid.toString(),
//           parseInt(payableAmount).toString(),
//           refundableDeposit.toString(),
//         ],
//       },
//     };
  

//     const requestBody = JSON.stringify(data);
//     const headers = {
//       "Content-Type": "application/json",
//       "Authorization": process.env.apiKey
//   };
  
//     const response = await fetch(url, {
//         method: "POST",
//         headers: headers,
//         body: requestBody
//     });

//     if (!response.ok) {
//      // const errorMessage = await response.text(); 
//       console.error("HTTP error:", response.status, response.statusText);
//      // console.error("Error details:", errorMessage);
//       return;
//   }

//     // Parse the response JSON
//     const responseData = await response.json();
    
//     // Handle the response
//     const message = responseData.message;
//     const responseMsg = responseData.result;

//     console.log("Message:", message);
//     console.log("Result:", responseMsg);

    

// } catch (error) {
//     console.error("Fetch Error:", error.message);
// }

//   return obj;
// };

module.exports = { whatsappMessage };
