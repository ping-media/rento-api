const mongoose = require("mongoose");

const TempExtensionSchema = new mongoose.Schema({
  extendId: {
    type: String,
    required: true,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Booking",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  extendData: {
    type: Object,
    required: true,
  },
  firstName: {
    type: String,
  },
  managerContact: {
    type: String,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // expires: 3600 * 2, // auto-delete after 2 hours (optional)
  },
});

module.exports = mongoose.model("TempExtension", TempExtensionSchema);
