const axios = require("axios");
const Log = require("../db/schemas/onboarding/log");
require("dotenv").config();

async function whatsappMessage(contacts, templateName, values, bookingId) {
  if (!Array.isArray(contacts)) contacts = [contacts];

  if (!contacts.length || !templateName || !values?.length) {
    console.error(
      "Invalid input: contact, templateName, and values are required"
    );
    await Log({
      message: "Invalid input: contact, templateName, and values are required",
      functionName: "whatsapp message",
    });
    return { status: 400, message: "Invalid input" };
  }

  const results = [];

  try {
    const requests = contacts.map(async (contact) => {
      const bookingUrl = bookingId
        ? `https://rentobikes.com/account/my-rides/summary/${bookingId}`
        : "https://rentobikes.com";

      const data = {
        messaging_product: "whatsapp",
        to: `91${contact}`,
        type: "template",
        template: {
          language: {
            policy: "deterministic",
            code: "en",
          },
          name: templateName,
          components: [
            {
              type: "body",
              parameters: values.map((v) => ({
                type: "text",
                text: v,
              })),
            },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [{ type: "text", text: bookingUrl }],
            },
          ],
        },
      };

      return axios
        .post("https://api.dovesoft.io/REST/directApi/message", data, {
          headers: {
            "Content-Type": "application/json",
            wabaNumber: process.env.whatsappApiNumber,
            key: process.env.whatsappApiKey,
          },
        })
        .then((res) => {
          results.push({ contact, status: "success", data: res.data });
          return Log({
            message: res.data.message,
            functionName: "whatsapp message",
          });
        })
        .catch((err) => {
          results.push({ contact, status: "error", error: err.message });
          return Log({
            message: `Error: ${err.message}`,
            functionName: "whatsapp message",
          });
        });
    });

    await Promise.all(requests);
    console.log("Whatsapp api:", JSON.stringify(results));
    return { status: 200, results };
  } catch (error) {
    console.error("Unexpected Error:", error.message);
    return { status: 500, message: "Internal server error" };
  }
}

async function oldWhatsappMessage(contacts, templateName, values) {
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
