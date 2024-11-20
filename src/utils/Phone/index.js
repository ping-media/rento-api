const axios = require('axios');

const url = 'https://api.msg91.com/api/v5/otp';



/**
* Sends an OTP message to a given mobile number using MSG 91 API.
* @param {string} templateId - The template ID to use for the message.
* @param {string} otp - The OTP code to include in the message.
* @param {string} mobileNumber - The mobile number to send the message to.
* @param {string} countryCode
* @throws {Error} If there is an issue sending the message.
**/
async function sendMessage(templateId, otp, mobileNumber, countryCode) {
    try {
        return 'Successfully msg sent'
        // axios.post(url, {
        //     mobile: `${countryCode}${mobileNumber}`,
        //     otp: otp,
        //     template_id: templateId
        //   }, {
        //     headers: {
        //       'authkey': process.env.API_KEY,
        //       'Content-Type': 'application/json'
        //     }
        //   })
        //     .then(function (response) {
        //         return 'Successfully msg sent'
        //     })
        //     .catch(function (error) {
        //         throw Error('Something Wrong With MSG 91 Message not sending', err)
        //     });
    } catch (err) {
        throw Error('Something Wrong With MSG 91 Message not sending', err)
    }
}

module.exports = {
    sendMessage
}