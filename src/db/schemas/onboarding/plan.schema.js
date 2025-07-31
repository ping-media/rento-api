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
    kmLimit: {
      type: Number,
      require: true,
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

planSchema.pre("save", function (next) {
  if (this.planName) {
    this.planName = this.planName.toLowerCase();
  }

  next();
});

const Plan = mongoose.model("Plan", planSchema);

module.exports = Plan;
