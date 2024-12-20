const Logs = require("../../../db/schemas/onboarding/log");
const axios = require ("axios")

async function Log({ message, functionName, userId }) {
    try {
        // if (!message || !functionName || !userId) {
        //     throw new Error("Missing required fields: message, functionName, userId");
        // }

        // Log incoming headers for debugging
//console.log("Incoming Headers:", header);

        // Extract IP address
        let ipAdd =  await axios.get("https://api.ipify.org/?format=json");

       
      const ipAddress= ipAdd.data;
      if(!ipAddress){
        ipAddress=null;
      }
        
        // Create the log object
        const logObj = { message, functionName, userId, ipAddress };

        // Save the log to the database
        const newLog = new Logs(logObj);
        await newLog.save();

        // Return success response
        console.log("Log Created:", newLog);
        return {
            status: 200,
            message: "Log created successfully",
            data: newLog,
        };
    } catch (error) {
        // Log the error
        console.error("Error in Log function:", error.message);

        // Return error response
        return {
            status: 500,
            message: "An error occurred while creating the log",
            error: error.message,
        };
    }
}

module.exports = Log;
