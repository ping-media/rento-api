const nodemailer = require('nodemailer');
const ejs = require('ejs');
const fs = require('fs');

// Create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    //host: process.env.HOST,
    service: process.env.SERVICE,
    port: process.env.EMAIL_PORT,
    secure: true, // true for 465, false for other ports
    logger: true,
    secureConnection: false,
    auth: {
        user: process.env.EMAIL_USER_ID,
        pass: process.env.EMAIL_PASSWORD
    }
});

// const ejs = require('ejs');
// const fs = require('fs');

// Read the EJS template from file
// let template = fs.readFileSync('./templates/sendOtp/index.ejs', 'utf-8');

// Render the EJS template with the data
// let renderedTemplate = ejs.render(template, data);

// Set up the data to be rendered in the template
let data = {
  name: 'John Doe',
  message: 'This is a test email'
};





/**
* Sends an email using Nodemailer.
* @param {string} formEmailId - The email address of the sender.
* @param {string} toEmailId - The email address of the recipient.
* @param {string} subject - The subject of the email.
* @param {string} htmlTemplate - The HTML content of the email.
**/
async function sendEmail( toEmailId, subject, htmlTemplate) {
  
  // Set up the mail options
  let mailOptions = {
    from: process.env.EMAIL_USER_ID,
    to: toEmailId,
    subject: subject,
    html: htmlTemplate
  };
try{
// Send the email using Nodemailer
transporter.sendMail(mailOptions, function(error, info) {
  if (error) {
    throw new Error('Something is wrong with the AWS SES Email not send', error)
  } else {
    return 'Email Send Successfully'
  }
});
}catch(err){
  throw new Error('Something is wrong with the AWS SES Email not send', err)
}
  
}

module.exports = {
  sendEmail
}



