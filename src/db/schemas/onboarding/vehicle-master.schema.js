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
    },
    vehicleName: {
      type: String,
      required: true,
      unique: true,
    },
    imageFileName: {
      type: String,
    },
    vehicleType: {
      enum: ["gear", "non-gear"],
      type: String,
      required: true,
    },
    status: {
      enum: ["active", "inactive"],
      type: String,
      default: "active",
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

vehicleMasterSchema.pre("save", function (next) {
  if (this.vehicleName) {
    this.vehicleName = this.vehicleName.toLowerCase();
  }
  if (this.vehicleBrand) {
    this.vehicleBrand = this.vehicleBrand.toLowerCase();
  }
  if (this.vehicleType) {
    this.vehicleType = this.vehicleType.toLowerCase();
  }
  next();
});

const vehicleMaster = mongoose.model("vehicleMaster", vehicleMasterSchema);

module.exports = vehicleMaster;
