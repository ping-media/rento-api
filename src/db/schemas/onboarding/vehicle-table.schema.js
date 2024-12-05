const mongoose = require('mongoose');
const vehiclemasters = require("../../schemas/onboarding/vehicle-master.schema")
const Schema = mongoose.Schema;

const vehicleTableSchema = new Schema({
    vehicleMasterId: {
        type: Schema.Types.ObjectId,
        ref: 'vehiclemasters',
        required: true
    },
    vehicleBookingStatus: {
        type: String,
        enum: ["available", "booked"],
        required: true
    },
    vehicleStatus: {
        type: String,
        enum: ["active", "inActive"],
        required: true
    },
    freeKms: {
        type: String,
        required: true
    }, 
    extraKmsCharges: {
        type: String,
        required: true
    },
    stationId: {
        type: String,
        ref: 'station',
        required: true
    },
    vehicleNumber: {
        type: String,
        required: true
    },
    vehicleModel: {
        type: String,
        required: true
    },    
    vehicleColor: {
        
        type: String,
        required: true
    },
    vehiclePlan: {
        type: Schema.Types.ObjectId,
        ref: 'plan'
    },
    perDayCost: {
        type: String,
        required: true
    },
    lastServiceDate: {
        type: String,
        required: true
    },
    kmsRun: {
        type: String,
        required: true
    },
    isBooked: {
        type: String,
        required: true
    },
    locationId: {
        type: Schema.Types.ObjectId,
        ref: 'location',
        required: true
      },
    condition: {
        enum: ["old", "new"],
        type: String,
        required: true
    }
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const vehicleTable = mongoose.model('vehicleTable', vehicleTableSchema);

module.exports = vehicleTable;


