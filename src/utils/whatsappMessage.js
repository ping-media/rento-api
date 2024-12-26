const axios = require("axios");
require("dotenv").config();
const User = require("../db/schemas/onboarding/user.schema")
const Station = require("../db/schemas/onboarding/station.schema");
//const { findOne } = require("../db/schemas/onboarding/vehicle.schema");
const Log= require("../db/schemas/onboarding/log")


async function whatsapp(name, contact) {
  const obj = { status: 200, message: "Message sent successfully" };

  // Validate input
  if (!name || !contact) {
    obj.status = 400;
    obj.message = "Failed to send: name and contact are required";
    await Log({
      message: obj.message,
      functionName: "whatsapp message",
    
    });
    return obj;
  }

  // Prepare request data
  const data = {
    apiKey: process.env.apiKey,
    campaignName: process.env.campaignName,
    destination: `+91${contact}`,
    userName: `${name}`,
    templateParams: [`${name}`],

  };
console.log(data)
  try {
    const response = await axios.post("https://backend.aisensy.com/campaign/t1/api/v2", data);
    console.log("API response:", response.data);
  
    if (response?.data?.success !== true) {
      obj.status = 400;
      obj.message = response.data.message || "Failed to send: API response indicates failure";
      await Log({
        message: obj.message,
        functionName: "whatsapp message",
      
      });
      return obj;
    }
  } catch (error) {
    console.error("Error in whatsapp function:", error.response?.data || error.message);
    obj.status = error.response?.status || 500;
    obj.message = error.response?.data?.message || "Internal server error";
    await Log({
      message: obj.messagemessage,
      functionName: "whatsapp message",
    
    });
    return obj;
  }
  

  return obj;
}

const sendBookingConfirmation = async ({
  userId,
  stationId,
  
  
  bikeName,
  rideSchedule,
  orderId,
  landmark,
  mapLink,
  
  paidAmount,
  payableAmount,
  securityDeposit
}) => {
  const obj = { status: 200, message: "Message sent successfully" };
  
const user= await User.findOne({userId});
const station= await User.findOne(stationId)
const name=user.firstName;
const contact=user.contact;
const dealerContact=station.contact

  if (!name || !contact || !bikeName || !rideSchedule || !orderId || !landmark || !mapLink || !dealerContact || !paidAmount || !payableAmount || !securityDeposit) {
    obj.status = 400;
    obj.message = "Failed to send: Missing required fields";
    return obj;
  }

 
  const data = {
    apiKey: process.env.API_KEY, // Ensure this is set in your environment variables
    campaignName: "booking_confirmed_message",
    destination: `+91${contact}`,
    userName: name,
    templateParams: [
      name,         // {{1}}: User Name
      bikeName,     // {{2}}: Bike Name
      rideSchedule, // {{3}}: Ride Scheduled Time
      orderId,      // {{4}}: Order ID
      landmark,     // {{5}}: Landmark
      mapLink,      // {{6}}: Map Link
      dealerContact,// {{7}}: Dealer Contact
      paidAmount,   // {{8}}: Paid Amount
      payableAmount,// {{9}}: Payable Amount
      securityDeposit // {{10}}: Security Deposit
    ]
  };

  console.log("Sending data:", data);

  try {
    const response = await axios.post("https://backend.aisensy.com/campaign/t1/api/v2", data);
    console.log("API response:", response.data);

    if (response?.data?.success !== true) {
      obj.status = 400;
      obj.message = response.data.message || "Failed to send: API response indicates failure";
      return obj;
    }
  } catch (error) {
    console.error("Error in sendBookingConfirmation function:", error.response?.data || error.message);
    obj.status = error.response?.status || 500;
    obj.message = error.response?.data?.message || "Internal server error";
    return obj;
  }

  return obj;
};

module.exports = { whatsapp,sendBookingConfirmation };
