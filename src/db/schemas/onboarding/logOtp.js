const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const otpLogSchema = new Schema({
  contact: {
    type: String,
    unique: true, // Enforce uniqueness
    required: true, // Ensure it is mandatory
  },
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});


const OtpLog = mongoose.model('Otps', otpLogSchema);

module.exports = OtpLog;


