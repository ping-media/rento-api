const mongoose = require("mongoose");

const policySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      enum: [
        "refund_policy",
        "terms_and_conditions",
        "privacy_policy",
        "booking_terms",
      ],
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

policySchema.index({ type: 1 });

module.exports = mongoose.model("Policy", policySchema);
