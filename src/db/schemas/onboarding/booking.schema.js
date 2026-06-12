const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema(
  {
    vehicleMasterId: {
      type: Schema.Types.ObjectId,
      ref: "vehicleMaster",
      required: true,
    },
    vehicleTableId: {
      type: Schema.Types.ObjectId,
      ref: "vehicleTable",
      default: null,
    },
    vehicleAssigned: {
      type: Boolean,
      default: false,
    },
    bookingId: {
      type: String,
      required: true,
    },
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
    },
    stationId: {
      type: String,
      //default:"Na"
      // required: true
    },
    stationName: {
      type: String,
      required: true,
    },
    stationMasterUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    BookingStartDateAndTime: {
      type: String,
      required: true,
    },
    BookingEndDateAndTime: {
      type: String,
      required: true,
    },
    bookingPrice: {
      type: Object,
      required: true,
    },
    vehicleBasic: {
      type: Object,
      required: true,
    },

    payInitFrom: {
      type: String,
      // required: true,
      default: "cash",
    },
    paySuccessId: {
      type: String,
      default: "NA",
      // required: true
    },
    paymentgatewayOrderId: {
      type: String,
      default: "NA",
      // required: true
    },

    paymentgatewayReceiptId: {
      type: String,
      default: "NA",
      // required: true
    },
    paymentInitiatedDate: {
      type: String,
      default: "NA",
      // required: true
    },

    discountCuopon: {
      type: Object,
      // default:"NA"
      // required: true
    },

    notes: [
      {
        key: { type: String, required: true },
        value: { type: String, required: true },
        noteType: { type: String, required: true },
        createdAt: { type: Date },
      },
    ],

    paymentMethod: {
      type: String,
      enum: ["cash", "partiallyPay", "online"],
      required: true,
    },
    invoice: {
      type: Schema.Types.ObjectId,
      ref: "invoice-tbl",
    },
    bookedFrom: {
      type: String,
      enum: ["web", "app", "admin"],
      default: "web",
    },
    bookingStatus: {
      enum: ["pending", "done", "canceled", "extended"],
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "partiallyPay",
        "paid",
        "failed",
        "refunded",
        "refundInt",
        "partially_paid",
      ],
      required: true,
    },
    rideStatus: {
      enum: ["pending", "ongoing", "completed", "canceled"],
      type: String,
      required: true,
    },
    changeVehicle: {
      type: Object,
    },
    extendBooking: {
      type: Object,
    },
    paymentUpdates: {
      type: Object,
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } },
);

bookingSchema.pre("save", function (next) {
  if (this.payInitFrom) {
    this.payInitFrom = this.payInitFrom.toLowerCase();
  }
  if (this.stationName) {
    this.stationName = this.stationName.toLowerCase();
  }
  if (this.vehicleName) {
    this.vehicleName = this.vehicleName.toLowerCase();
  }
  if (this.vehicleBrand) {
    this.vehicleBrand = this.vehicleBrand.toLowerCase();
  }
  if (this.payInitFrom) {
    this.payInitFrom = this.payInitFrom.toLowerCase();
  }

  next();
});

bookingSchema.index({ vehicleMasterId: 1, stationId: 1 });

bookingSchema.index({
  vehicleMasterId: 1,
  stationId: 1,
  BookingEndDateAndTime: 1,
  BookingStartDateAndTime: 1,
});

bookingSchema.index({ vehicleTableId: 1, status: 1 });

// Unique booking lookup
bookingSchema.index({ bookingId: 1 }, { unique: true });

// User related
bookingSchema.index({ userId: 1, createdAt: -1 });

// Station dashboards
bookingSchema.index({ stationId: 1 });

// Payments
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ paymentMethod: 1 });

// Admin payment list (most important)
bookingSchema.index({
  stationId: 1,
  paymentStatus: 1,
  paymentMethod: 1,
  createdAt: -1,
});

// Sorting & pagination
bookingSchema.index({ createdAt: -1 });

// Optional
bookingSchema.index({ bookingStatus: 1 });
bookingSchema.index({ rideStatus: 1 });

const booking = mongoose.model("booking", bookingSchema);

module.exports = booking;
