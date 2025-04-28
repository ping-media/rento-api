const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const vehicleMasterSchema = new Schema(
  {
    vehicleImage: {
      type: String,
      required: true,
    },
    vehicleBrand: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    vehicleName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    imageFileName: {
      type: String,
    },
    vehicleType: {
      enum: ["gear", "non-gear"],
      type: String,
      required: true,
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

const vehicleMaster = mongoose.model("vehicleMaster", vehicleMasterSchema);

module.exports = vehicleMaster;
