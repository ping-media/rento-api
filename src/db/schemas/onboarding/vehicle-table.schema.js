const mongoose = require('mongoose');
const vehiclemasters = require("../../schemas/onboarding/vehicle-master.schema")
const Schema = mongoose.Schema;
const vehiclePlanSchema = new Schema({
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true, // Ensure the Plan ID is provided
    },
    planPrice: {
      type: Number,
    //  required: true, // Ensure the plan price is provided
      
      min: [0, 'Plan price must be a positive value'],
    },
  });

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
        type: String,
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
    vehiclePlan: [vehiclePlanSchema], // Use the sub-schema here
    perDayCost: {
      type: Number,
      required: [true, 'Per day cost is required'],
      min: [0, 'Per day cost must be a positive value'],
    },
    perDayCost: {
        type: Number,
        required: true
    },
    refundableDeposit: {
        type: Number,
        default:1000,
        required: true
    },
    lateFee: {
        type: Number,
        default:100,
        required: true
    },
    speedLimit: {
        type: Number,
        default:60,
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


