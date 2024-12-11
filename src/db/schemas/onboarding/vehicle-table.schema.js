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
        enum: ["active", "inactive"],
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

// Pre-save middleware to convert fields to lowercase
vehicleTableSchema.pre('save', function (next) {
    if (this.name) {
      this.name = this.name.toLowerCase(); 
    }
    if (this.brand) {
      this.brand = this.brand.toLowerCase(); 
    }
    if(this.vehicleColor){
        this.vehicleColor = this.vehicleColor.toLowerCase();
    }
    next();
  });

const vehicleTable = mongoose.model('vehicleTable', vehicleTableSchema);

module.exports = vehicleTable;


