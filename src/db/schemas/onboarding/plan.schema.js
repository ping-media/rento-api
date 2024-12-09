const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const planSchema = new Schema(
  {
    planName: {
      type: String,
      required: true,
      unique: true,
    },
    planDuration: {
      type: String,
      required: true,
    },
    planPrice: {
      type: String,
      required: true,
    },
    stationId: {
      type: String,
      ref: "station", // Reference the 'Station' model
      required: true,
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "location", // Reference the 'Location' model
      required: true,

    },
    vehicleMasterId: {
      type: Schema.Types.ObjectId,
      ref: 'vehicleMaster',
      required: true
  },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

const Plan = mongoose.model("Plan", planSchema);

module.exports = Plan;
