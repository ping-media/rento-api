const Booking = require("../db/schemas/onboarding/booking.schema");

const updateRideStartDetails = async ({
  booking,
  _id,
  OTP,
  PaymentMode,
  paymentStatus,
  startDateAndTime,
  newBookingStatus,
  paymentMethod,
}) => {
  if (paymentStatus === "partially_paid" || paymentStatus === "partiallyPay") {
    const AmountLeftAfterUserPaid =
      booking?.bookingPrice?.AmountLeftAfterUserPaid ||
      booking?.bookingPrice?.AmountLeftAfterUserPaid?.amount;

    let updatedAmountLeft = {};
    if (
      AmountLeftAfterUserPaid &&
      typeof AmountLeftAfterUserPaid === "object" &&
      !Array.isArray(AmountLeftAfterUserPaid)
    ) {
      updatedAmountLeft = {
        ...AmountLeftAfterUserPaid,
        status: "paid",
        paymentMethod: PaymentMode,
      };
    } else {
      updatedAmountLeft = {
        status: "paid",
        paymentMethod: PaymentMode,
        ...AmountLeftAfterUserPaid,
      };
    }

    return Booking.updateOne(
      { _id },
      {
        $set: {
          bookingStatus: newBookingStatus,
          "bookingPrice.isPickupImageAdded": true,
          rideStatus: "ongoing",
          "vehicleBasic.endRide": OTP,
          "bookingPrice.AmountLeftAfterUserPaid": updatedAmountLeft,
          "vehicleBasic.RideStart": Number(startDateAndTime) || "",
          paymentStatus: "paid",
        },
      },
      { new: true },
    );
  }

  if (paymentMethod?.toLowerCase() === "cash" && paymentStatus === "pending") {
    return Booking.updateOne(
      { _id },
      {
        $set: {
          bookingStatus: newBookingStatus,
          "bookingPrice.isPickupImageAdded": true,
          rideStatus: "ongoing",
          "vehicleBasic.endRide": OTP,
          "bookingPrice.payOnPickupMethod": PaymentMode,
          "vehicleBasic.RideStart": Number(startDateAndTime) || "",
          paymentStatus: "paid",
        },
      },
      { new: true },
    );
  }

  return Booking.updateOne(
    { _id },
    {
      $set: {
        bookingStatus: newBookingStatus,
        "bookingPrice.isPickupImageAdded": true,
        rideStatus: "ongoing",
        "vehicleBasic.endRide": OTP,
        "vehicleBasic.RideStart": Number(startDateAndTime) || "",
      },
    },
    { new: true },
  );
};

module.exports = { updateRideStartDetails };
