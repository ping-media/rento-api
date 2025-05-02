const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GeneralSchema = new Schema(
  {
    weakend: {
      Price: { type: Number, default: 0 },
      PriceType: { type: String, enum: ["+", "-"], default: "+" },
    },
    specialDays: [
      {
        From: { type: String, required: true },
        Too: { type: String, required: true },
        Price: { type: Number, required: true },
        PriceType: { type: String, enum: ["+", "-"], default: "+" },
      },
    ],
    extraAddOn: [
      {
        _id: { type: Schema.Types.ObjectId, auto: true },
        name: { type: String, trim: true, lowercase: true, required: true },
        amount: { type: Number, min: 0, default: 0 },
        maxAmount: { type: Number, min: 0, default: 0 },
        status: {
          type: String,
          enum: ["active", "inactive"],
          default: "active",
        },
      },
    ],
  },
  { timestamps: true }
);

const general = mongoose.model("general", GeneralSchema);

module.exports = general;
