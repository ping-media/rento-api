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
    mapLink: {
      type: String,
    },
    weekendPriceIncrease: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    weekendPercentage: {
      type: Number,
      default: 0,
    },
    extraAddOn: [
      {
        _id: { type: Schema.Types.ObjectId, auto: true },
        name: { type: String, trim: true, lowercase: true, required: true },
        amount: { type: Number, min: 0, default: 0 },
        maxAmount: { type: Number, min: 0, default: 0 },
        gstPercentage: {
          type: Number,
          default: 0,
          min: [0, "GST value cannot be negative"],
        },
        gstStatus: {
          type: String,
          enum: ["active", "inactive"],
          default: "active",
        },
        status: {
          type: String,
          enum: ["active", "inactive"],
          default: "active",
        },
      },
    ],
    payments: {
      online: {
        type: Boolean,
        default: true,
      },
      partiallyPay: {
        type: Boolean,
        default: true,
      },
      cash: {
        type: Boolean,
        default: false,
      },
    },
    isGstActive: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

const station = mongoose.model("station", stationSchema);

module.exports = station;
