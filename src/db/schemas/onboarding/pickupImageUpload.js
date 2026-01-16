const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  imageUrl: { type: String, required: true },
});

const pickupImageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    bookingId: { type: String, ref: "Booking", required: true },
    files: { type: Map, of: fileSchema, required: true },
    data: { type: Object },
    startMeterReading: { type: Number },
    endMeterReading: { type: Number, default: 0 },
    rideEndDate: { type: String },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

const pickupImage = mongoose.model("pickupImage", pickupImageSchema);

module.exports = pickupImage;
