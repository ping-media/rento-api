const mongoose = require("mongoose");

const webhookLogSchema = new mongoose.Schema(
  {
    razorpayPaymentId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "failed", "mismatch", "error"],
      required: true,
    },
    verifiedStatus: String,
    bookingId: String,
    warning: Boolean,
    error: String,
    rawPayload: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

// Compound unique index to prevent duplicate webhook processing
webhookLogSchema.index(
  { razorpayPaymentId: 1, eventType: 1 },
  { unique: true }
);

module.exports = mongoose.model("WebhookLog", webhookLogSchema);
