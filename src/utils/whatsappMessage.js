const axios = require("axios");
const Log = require("../db/schemas/onboarding/log");
require("dotenv").config();

// const url = "https://api.interakt.ai/v1/public/message/";

async function whatsappMessage(contacts, templateName, values) {
  const obj = { status: 200, message: "Message sent successfully" };

  if (!Array.isArray(contacts)) {
    contacts = [contacts];
  }

  if (!contacts.length || !templateName || !values || values.length === 0) {
    console.error(
      "Invalid input: contact, templateName, and values are required"
    );
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
  for (const contact of contacts) {
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

    // const requestBody = JSON.stringify(data);

    // const headers = {
    //   "Content-Type": "application/json",
    //   Authorization: `Basic ${process.env.whatsappApiKey}`,
    // };

    try {
      const response = await axios.post(
        "https://api.interakt.ai/v1/public/message/",
        data,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${process.env.whatsappApiKey}`,
          },
        }
      );

      obj.message = response.data.message;
      obj.result = response.data.result;

      console.log("API Response:", response.data);

      await Log({
        message: obj.message,
        functionName: "whatsapp message",
      });
      // const response = await fetch(
      //   "https://api.interakt.ai/v1/public/message/",
      //   {
      //     method: "POST",
      //     headers: headers,
      //     body: requestBody,
      //   }
      // );

      // if (!response.ok) {
      //   const errorMessage = await response.text();
      //   console.error("HTTP error:", response.status, response.statusText);
      //   console.error("Error details:", errorMessage);
      //   await Log({
      //     message: `Error: ${response.statusText}`,
      //     functionName: "whatsapp message",
      //   });
      //   return {
      //     status: response.status,
      //     message: `Error: ${response.statusText}`,
      //     details: errorMessage,
      //   };
      // }

      // Parse the response JSON
      // const responseData = await response.json();

      // obj.message = responseData.message;
      // obj.result = responseData.result;
      // await Log({
      //   message: obj.message,
      //   functionName: "whatsapp message",
      // });
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
  }

  return obj;
}

module.exports = { whatsappMessage };
