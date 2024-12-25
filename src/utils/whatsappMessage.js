const axios = require("axios");
require("dotenv").config();


async function whatsapp(name, contact) {
  const obj = { status: 200, message: "Message sent successfully" };

  // Validate input
  if (!name || !contact) {
    obj.status = 400;
    obj.message = "Failed to send: name and contact are required";
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
      return obj;
    }
  } catch (error) {
    console.error("Error in whatsapp function:", error.response?.data || error.message);
    obj.status = error.response?.status || 500;
    obj.message = error.response?.data?.message || "Internal server error";
    return obj;
  }
  

  return obj;
}

module.exports = { whatsapp };
