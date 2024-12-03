const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const otpLogSchema = new Schema({
    contact: { //
        type: String,
        unique: true,
        required: true
    },
    otp: { //
        type: String,
        required: true
    },
    obj: { //
        type: Object,
    },
   
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const OtpLog = mongoose.model('Otps', otpLogSchema);

module.exports = OtpLog;


