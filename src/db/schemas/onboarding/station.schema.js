const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const stationSchema = new Schema(
  {
    stationId: {
      type: String,
      required: true,
      unique: true,
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    userId: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    stationName: {
      type: String,
      required: true,
      lowercase: true,
    },
    address: {
      type: String,
      required: true,
      lowercase: true,
    },
    city: {
      type: String,
      required: true,
      lowercase: true,
    },
    state: {
      type: String,
      required: true,
      lowercase: true,
    },

    pinCode: {
      type: Number,
      required: true,
    },
    country: {
      type: String,
      required: true,
      lowercase: true,
    },
    openStartTime: {
      type: Number,
      required: true,
      default: 9,
    },
    openEndTime: {
      type: Number,
      required: true,
      default: 21,
    },

    latitude: {
      type: String,
    },
    longitude: {
      type: String,
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

const station = mongoose.model("station", stationSchema);

module.exports = station;
