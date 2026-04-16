const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const locationSchema = new Schema(
  {
    locationName: {
      type: String,
      required: true,
    },
    locationImage: {
      type: String,
      required: true,
    },
    imageFileName: {
      type: String,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    radiusKm: {
      type: Number,
      default: 30, // detection radius in km — tune per city size
    },
    locationStatus: {
      type: String,
      default: "active",
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } },
);

locationSchema.pre("save", function (next) {
  if (this.locationName) {
    this.locationName = this.locationName.toLowerCase();
  }
  if (this.locationStatus) {
    this.locationStatus = this.locationStatus.toLowerCase();
  }

  next();
});

const location = mongoose.model("location", locationSchema);

module.exports = location;
