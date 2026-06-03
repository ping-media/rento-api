const { updateCouponCount } = require("../api/onboarding/models/coupon.model");
const Log = require("../api/onboarding/models/Logs.model");

const updateCouponUsage = async (bookingData) => {
  try {
    const couponId = bookingData?.discountCuopon?.couponId?.trim();

    if (couponId) {
      await updateCouponCount({
        _id: couponId,
      });
    }
  } catch (error) {
    console.error("Failed to update coupon usage:", error);

    await Log({
      message: error?.message,
      functionName: "updateCouponUsage",
    });
  }
};

module.exports = {
  updateCouponUsage,
};
