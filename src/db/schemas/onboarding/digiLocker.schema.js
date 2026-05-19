const mongoose = require("mongoose");

const digiLockerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one record per user
    },
    verification_id: { type: String },
    reference_id: { type: String },
    status: {
      type: String,
      enum: ["PENDING", "AUTHENTICATED", "EXPIRED", "CONSENT_DENIED"],
      default: "PENDING",
    },
    documents: {
      AADHAAR: { type: mongoose.Schema.Types.Mixed, default: null },
      PAN: { type: mongoose.Schema.Types.Mixed, default: null },
      DRIVING_LICENSE: { type: mongoose.Schema.Types.Mixed, default: null },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("DigiLocker", digiLockerSchema);
