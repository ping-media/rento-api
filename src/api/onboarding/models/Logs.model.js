const Logs = require("../../../db/schemas/onboarding/log");

async function Log({ message, functionName, userId }) {
    try {
        if (!message || !functionName || !userId) {
            throw new Error("Missing required fields: message, functionName, userId");
        }

        // Create the log object
        const logObj = { message, functionName, userId };

        // Save the log to the database
        const newLog = new Logs(logObj);
        await newLog.save();

        // Return success response
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
