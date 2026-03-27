const Razorpay = require("razorpay");
const Booking = require("../db/schemas/onboarding/booking.schema");
const {
  timelineFunctionServer,
} = require("../api/onboarding/models/timeline.model");
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.VITE_RAZOR_KEY_ID,
  key_secret: process.env.VITE_RAZOR_KEY_SECRET,
});

const recoverUnpaidExtensions = async () => {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

  const bookingsWithUnpaidExtends = await Booking.find({
    "bookingPrice.extendAmount": {
      $elemMatch: {
        status: "unpaid",
        paymentInitiatedDate: { $lt: tenMinutesAgo },
      },
    },
  });

  for (const booking of bookingsWithUnpaidExtends) {
    for (const ext of booking.bookingPrice.extendAmount) {
      if (
        ext.status !== "unpaid" ||
        ext.paymentInitiatedDate >= tenMinutesAgo
      ) {
        continue;
      }

      let shouldDelete = true;

      if (ext.orderId && ext.orderId !== "") {
        try {
          const order = await razorpay.orders.fetch(ext.orderId);

          if (order?.status === "paid") {
            ext.status = "paid";
            ext.paymentMethod = "online";
            ext.transactionId = order.id;
            ext.paymentDate = new Date();

            booking.BookingEndDateAndTime =
              ext.bookingEndDateAndTime || ext.BookingEndDateAndTime;
            booking.bookingStatus = "extended";

            shouldDelete = false;

            await timelineFunctionServer({
              currentBooking_id: booking._id,
              timeLine: [
                {
                  title: "Booking Extended by User",
                  date: Date.now(),
                  paymentAmount: ext.amount || 0,
                  endDate: ext.bookingEndDateAndTime,
                  extended: true,
                },
              ],
            });

            console.log(
              `Recovered missed payment for booking ${booking._id}, extend id ${ext.id}`,
            );
          }
        } catch (err) {
          console.error(
            `Razorpay fetch failed for orderId ${ext.orderId}:`,
            err.message,
          );
          shouldDelete = false;
        }
      }

      if (shouldDelete) {
        booking.bookingPrice.extendAmount =
          booking.bookingPrice.extendAmount.filter((e) => e.id !== ext.id);
        console.log(
          `Deleted unpaid extend id ${ext.id} for booking ${booking._id}`,
        );
      }
    }

    booking.markModified("bookingPrice.extendAmount");
    booking.markModified("bookingPrice");
    await booking.save();
  }
};

module.exports = { recoverUnpaidExtensions };
