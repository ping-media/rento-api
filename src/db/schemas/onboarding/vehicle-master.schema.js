const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const vehicleMasterSchema = new Schema({
    vehicleName: {
        type: String,
        required: true,
        unique: true
    },
    vehicleType: {
        enum: ["gear", "non-gear"],
        type: String,
        required: true
    }, 
    vehicleBrand: {
        type: String,
        required: true
    },
    vehicleImage: {
        type: String,
        required: true
    },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const vehicleMaster = mongoose.model('vehicleMaster', vehicleMasterSchema);

module.exports = vehicleMaster;


