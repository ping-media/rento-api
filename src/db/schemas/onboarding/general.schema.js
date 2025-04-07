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
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

const general = mongoose.model("general", GeneralSchema);

module.exports = general;
