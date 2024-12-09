const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const otpLogSchema = new Schema({
    contact: { //
        type: String,
        unique: true,
      //  required: true
    },
    email: { //
        type: String,
      //  unique: true,
      //  required: true
    },
    otp: { //
        type: String,
        required: true
    },
   
   
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const OtpLog = mongoose.model('Otps', otpLogSchema);

module.exports = OtpLog;


