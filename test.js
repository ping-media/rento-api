// // let currentNumber = 1;

// // function generateInvoiceNumber() {
// //   const currentYear = new Date().getFullYear();
// //   const staticPrefix = "Inv";

 
// //   const invoiceNumber = `${staticPrefix}${currentYear}${String(currentNumber).padStart(5, "0")}`;

 
// //   currentNumber++;

// //   return invoiceNumber;
// // }


// // console.log(generateInvoiceNumber()); // inv202400001
// // //console.log(generateInvoiceNumber()); // inv202400002


// const dayjs = require('dayjs');

// const date = dayjs("2024-11-30T01:00:00").toDate();
// console.log(date); // Sat Nov 30 2024 01:00:00 GMT+your timezone offset

// function getMilliseconds(dateString) {
//     if (!dateString) return "Invalid date";
  
//     const date = new Date(dateString);
//     if (isNaN(date)) return "Invalid date";
  
//     return date.getTime(); // Returns the time in milliseconds since January 1, 1970
//   }

// const milliseconds = getMilliseconds(new Date());
// console.log(milliseconds)


// const makeDateTime = (datetimeString) => {
//   // Split the input into date and time
//   const [dateString, timeString] = datetimeString.split(" ");
  
//   // Extract day, month, and year from the date
//   const [day, month, year] = dateString.split("/");

//   // Extract hour and minute from the time
//   const [hour, minute] = timeString.split(":");

//   // Ensure all parts are zero-padded
//   const isoString = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00Z`;

//   return isoString;
// };

// console.log(makeDateTime("04/01/2025 13:00"));


const url = "https://api.interakt.ai/v1/public/message/";


// async function whatsappWelcomeMessage(name, contact) {
//   const obj = { status: 200, message: "Message sent successfully" };

//   // Validate input
//   if (!name || !contact) {
//     obj.status = 400;
//     obj.message = "Failed to send: name and contact are required";
//     return obj;
//   }

//   // Prepare request data
//   const data = {
//     countryCode: "+91",
//     phoneNumber: contact, 
//     type: "Template",
//     template: {
//         name: "welcome_customer", 
//         languageCode: "en",
//         // headerValues: [
//         //     "header_variable_value",
//         // ],
//         bodyValues: [ `${name}` ], 
//         // buttonValues: {
//         //     "1": {}
//         // }
//     }
// };

// const requestBody = JSON.stringify(data);

// const headers = {
//     "Content-Type": "application/json",
//     "Authorization": "Basic UTJpU0pmUXFXVExmbWY1S1JVSVotUjA4M0dhS2VHeGNXZFdoeUNaSU9pQTo="
// };
// console.log(data)
  
//   try {
//     const response = await fetch(url, {
//         method: "POST",
//         headers: headers,
//         body: requestBody
//     });

//     // Check if the response is OK
//     if (!response.ok) {
//       const errorMessage = await response.text(); 
//       console.error("HTTP error:", response.status, response.statusText);
//       console.error("Error details:", errorMessage);
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
// }



// const sendBookingConfirmation = async (
//   contact,
//   name,
//   vehicleName,
//   BookingStartDateAndTime,
//   bookingId,
//   stationName,
//   mapLink,
//   dealerContact,
//   userPaid,
//   payableAmount,
//   refundableDeposit
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

    

// // const user = await User.findOne({ _id: userId }); // Replace 'userId' with the actual field name, e.g., '_id' or another field.
// // if (!user) {
// //   obj.status = 404;
// //   obj.message = `User not found for userId: ${userId}`;
// //   await Log({
// //     message: obj.message,
// //     functionName: "whatsapp message",
// //   });
// //   console.error(obj.message);
// //   return obj;
// // }

// // const station = await User.findOne({ _id: stationMasterUserId }); 
// // if (!station) {
// //   obj.status = 404;
// //   obj.message = `Station master not found for stationMasterUserId: ${stationMasterUserId}`;
// //   await Log({
// //     message: obj.message,
// //     functionName: "whatsapp message",
// //   });
// //   console.error(obj.message);
// //   return obj;
// // }



//     // Extract required details
//     // const name = user.firstName || "Unknown Name";
//     // const contact = user.contact || "Unknown Contact";
//     // const dealerContact = station.contact || "Unknown Dealer Contact";
//     // const mapLink = "https://www.google.com/maps/search/?api=1&query="
//     // + station.latitude + "," + station.longitude;

//     // Debug: Log all inputs
//     // console.log(
//     //   "Inputs:",
//     //   { userId, name, contact, dealerContact, stationMasterUserId, vehicleName, BookingStartDateAndTime, bookingId, stationName, mapLink, userPaid, payableAmount, refundableDeposit }
//     // );

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
//       typeof userPaid !== "number" ||
//       typeof payableAmount !== "number" ||
//       typeof refundableDeposit !== "number"
//     ) {
//       obj.status = 400;
//       obj.message = "Failed to send: Missing or invalid required fields";
//       // await Log({
//       //   message: obj.message,
//       //   functionName: "whatsapp message",
      
//       // });
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
//           //refundableDeposit.toString(),
//         ],
//       },
//     };
  
//     const headers = {
//           "Content-Type": "application/json",
//           "Authorization": "Basic UTJpU0pmUXFXVExmbWY1S1JVSVotUjA4M0dhS2VHeGNXZFdoeUNaSU9pQTo="
//       };

//     const requestBody = JSON.stringify(data);

  
//     const response = await fetch(url, {
//         method: "POST",
//         headers: headers,
//         body: requestBody
//     });

//     if (!response.ok) {
//       const errorMessage = await response.text(); 
//       console.error("HTTP error:", response.status, response.statusText);
//       console.error("Error details:", errorMessage);
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



// const contact = "8433408211";
// const name = "Alice Smith";
// const vehicleName = "Hyundai Creta";
// const BookingStartDateAndTime = "2025-01-15T10:30:00Z";
// const bookingId = "BOOK12345";
// const stationName = "Main Street Charging Station";
// const mapLink = "https://maps.google.com/example";
// const dealerContact = "8433408211";
// const userPaid = 1500;
// const payableAmount = 5000;
// const refundableDeposit = 2000;

// // Generate and log the test data
// const testRequestData = sendBookingConfirmation(
//   contact,
//   name,
//   vehicleName,
//   BookingStartDateAndTime,
//   bookingId,
//   stationName,
//   mapLink,
//   dealerContact,
//   userPaid,
//   payableAmount,
//   refundableDeposit
// );



async function whatsappMessage(contact, templateName, values) {
  const obj = { status: 200, message: "Message sent successfully" };
  console.log("Contact:", contact, "TemplateName:", templateName, "Values:", values);

  // Validate inputs
  if (!contact || !templateName || !values || values.length === 0) {
    console.error("Invalid input: contact, templateName, and values are required");
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
    Authorization: process.env.apiKey,
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
      return {
        status: response.status,
        message: `Error: ${response.statusText}`,
        details: errorMessage,
      };
    }

    // Parse the response JSON
    const responseData = await response.json();
    console.log("Response Data:", responseData);

    obj.message = responseData.message;
    obj.result = responseData.result;

  } catch (error) {
    console.error("Fetch Error:", error.message);
    return {
      status: 500,
      message: "Internal server error",
      details: error.message,
    };
  }

  return obj;
}
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
console.log(convertDateString("2025-01-09T11:00:00Z"))

