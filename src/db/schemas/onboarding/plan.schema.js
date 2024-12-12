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
      type: Number,
      required: true,
    },
    planPrice: {
      type: Number,
      required: true,
    },
    stationId: {
      type: Number,
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

planSchema.pre('save', function (next) {
  if (this.planName) {
    this.planName = this.planName.toLowerCase(); 
  }
  
 
  next();
});


const Plan = mongoose.model("Plan", planSchema);

module.exports = Plan;
