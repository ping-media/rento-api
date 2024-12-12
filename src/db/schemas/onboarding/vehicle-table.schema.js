const mongoose = require('mongoose');
const vehiclemasters = require("../../schemas/onboarding/vehicle-master.schema")
const Schema = mongoose.Schema;

const vehicleTableSchema = new Schema({
    vehicleMasterId: {
        type: Schema.Types.ObjectId,
        ref: 'vehiclemasters',
        required: true
    },
   
    vehicleNumber: {
        type: String,
        required: true
    },
    freeKms: {
        type: Number,
        required: true
    }, 
    extraKmsCharges: {
        type: Number,
        required: true
    },
    stationId: {
        type: Number,
        ref: 'station',
        required: true
    },
   
    vehicleModel: {
        type: Number,
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
        type: Number,
        required: true
    },
    refundableDeposit: {
        type: Number,
        default:"1000",
        required: true
    },
    lateFee: {
        type: Number,
        default:"100",
        required: true
    },
    speedLimit: {
        type: Number,
        default:"60",
        required: true
    },
    lastServiceDate: {
        type: String,
        required: true
    },
    kmsRun: {
        type: Number,
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


