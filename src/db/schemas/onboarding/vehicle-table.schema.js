const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const vehiclePlanSchema = new Schema({
  planId: {
    type: Schema.Types.ObjectId,
    ref: "Plan",
  },
  planPrice: {
    type: Number,
    min: [0, "Plan price must be a positive value"],
  },
  planName: {
    type: String,
  },
  planDuration: {
    type: Number,
    min: [0, "Plan duration must be a positive value"],
  },
  kmLimit: {
    type: Number,
    min: [0, "Km Limit must be a positive value"],
  },
});

const vehicleTableSchema = new Schema(
  {
    vehicleMasterId: {
      type: Schema.Types.ObjectId,
      ref: "vehiclemasters",
      required: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    freeKms: {
      type: Number,
      required: true,
    },
    extraKmsCharges: {
      type: Number,
      required: true,
    },
    stationId: {
      type: String,
      ref: "station",
      required: true,
    },

    vehicleModel: {
      type: Number,
      required: true,
    },
    vehiclePlan: [vehiclePlanSchema],
    perDayCost: {
      type: Number,
      required: [true, "Per day cost is required"],
      min: [0, "Per day cost must be a positive value"],
    },
    weekendCost: {
      type: Number,
      required: [true, "Weekend cost is required"],
      min: [0, "Weekend cost must be a positive value"],
    },
    weekendFreeKms: {
      type: Number,
      required: false,
      min: [0, "Weekend km limit must be a positive value"],
      default: null,
    },
    refundableDeposit: {
      type: Number,
      default: 1000,
      required: true,
    },
    lateFee: {
      type: Number,
      default: 100,
      required: true,
    },
    speedLimit: {
      type: Number,
      default: 60,
      required: true,
    },
    lastServiceDate: {
      type: String,
      required: true,
    },
    lastMeterReading: {
      type: Number,
      required: true,
    },
    kmsRun: {
      type: Number,
      required: true,
    },
    isBooked: {
      type: Boolean,
      default: false,
      required: true,
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "location",
      required: true,
    },
    condition: {
      enum: ["old", "new"],
      type: String,
      required: true,
    },
    vehicleBookingStatus: {
      type: String,
      enum: ["available", "booked"],
      required: true,
    },
    vehicleStatus: {
      type: String,
      enum: ["active", "inactive"],
      required: true,
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } },
);

// Unique vehicle number
vehiclePlanSchema.index({ vehicleNumber: 1 });

// Core relations
vehicleTableSchema.index({ vehicleMasterId: 1 });
vehicleTableSchema.index({ stationId: 1 });
vehicleTableSchema.index({ locationId: 1 });

// Status filters
vehicleTableSchema.index({ vehicleStatus: 1 });
vehicleTableSchema.index({ vehicleBookingStatus: 1 });

// Availability (MOST IMPORTANT)
vehicleTableSchema.index({
  stationId: 1,
  vehicleStatus: 1,
  vehicleBookingStatus: 1,
});

// Station dashboards
vehicleTableSchema.index({
  stationId: 1,
  createdAt: -1,
});

const vehicleTable = mongoose.model("vehicleTable", vehicleTableSchema);

module.exports = vehicleTable;
