const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const couponSchema = new Schema(
  {
    couponName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    allowedUsersCount: {
      type: Number,
    },
    couponCount: {
      type: Number,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discount: {
      type: String,

      required: true,
    },
    isCouponActive: {
      type: String,
      enum: ["active", "inActive"],
      required: true,
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } },
);

// Apply coupon fast
couponSchema.index({
  couponName: 1,
  isCouponActive: 1,
});

// Active / inactive filtering
couponSchema.index({ isCouponActive: 1 });

// Admin listing
couponSchema.index({ createdAt: -1 });

const coupon = mongoose.model("coupon", couponSchema);

module.exports = coupon;
