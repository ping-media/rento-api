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
    fleetIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    stationName: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
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
    googleReviewLink: {
      type: String,
    },
    weekendPriceIncrease: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    weekendPriceType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
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
      partiallyPayPercentage: {
        type: Number,
        default: 20,
        min: 1,
        max: 100,
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
    attendanceRadiusMeters: {
      type: Number,
      default: 200,
      min: 20,
      max: 5000,
    },
    attendanceRules: {
      halfDayCheckInTime: {
        type: String,
        match: /^([01]\d|2[0-3]):[0-5]\d$/, // check-in after this = half day
      },
      halfDayCheckOutTime: {
        type: String,
        match: /^([01]\d|2[0-3]):[0-5]\d$/, // check-out before this = half day
      },
      fullDayHours: { type: Number, default: 12, min: 0, max: 24 }, // hour-based fallback, 0 = off
      checkInTime: {
        type: String,
        match: /^([01]\d|2[0-3]):[0-5]\d$/, // "10:00", leave empty to disable
      },
      lateGraceMinutes: { type: Number, default: 15, min: 0 },
      checkOutTime: {
        type: String,
        match: /^([01]\d|2[0-3]):[0-5]\d$/,
      },
      earlyLeaveGraceMinutes: { type: Number, default: 0, min: 0 },
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true },
);

// Location-based
stationSchema.index({ locationId: 1 });

// stationName
stationSchema.index({ stationName: 1 });

// Status filtering
stationSchema.index({ status: 1 });

// User ↔ station mapping
// stationSchema.index({ userId: 1 });
stationSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { "userId.0": { $exists: true } },
  },
);

stationSchema.index(
  { fleetIds: 1 },
  {
    unique: true,
    partialFilterExpression: { "fleetIds.0": { $exists: true } },
  },
);

// City dashboards
stationSchema.index({ city: 1, status: 1 });

// State dashboards (optional)
stationSchema.index({ state: 1, status: 1 });

// Admin listing
stationSchema.index({ status: 1, createdAt: -1 });

// weekendPriceType
stationSchema.index({ weekendPriceType: 1 });

stationSchema.pre("validate", function (next) {
  if (this.userId?.length && this.fleetIds?.length) {
    const managers = new Set(this.userId.map(String));
    if (this.fleetIds.some((id) => managers.has(String(id)))) {
      return next(new Error("Manager cannot also be added as fleet staff"));
    }
  }
  next();
});

const station = mongoose.model("station", stationSchema);

module.exports = station;
