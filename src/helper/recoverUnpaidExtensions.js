const Razorpay = require("razorpay");
const Booking = require("../db/schemas/onboarding/booking.schema");
const {
  timelineFunctionServer,
} = require("../api/onboarding/models/timeline.model");
const Logs = require("../db/schemas/onboarding/log");
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.VITE_RAZOR_KEY_ID,
  key_secret: process.env.VITE_RAZOR_KEY_SECRET,
});

const recoverUnpaidExtensions = async () => {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;

  const bookingsWithUnpaidExtends = await Booking.find({
    "bookingPrice.extendAmount": {
      $elemMatch: {
        status: "unpaid",
        paymentInitiatedDate: { $lt: tenMinutesAgo },
      },
    },
  });

  for (const booking of bookingsWithUnpaidExtends) {
    // for (const ext of booking.bookingPrice.extendAmount) {
    const extendSnapshot = [...booking.bookingPrice.extendAmount];
    for (const ext of extendSnapshot) {
      if (
        ext.status !== "unpaid" ||
        ext.paymentInitiatedDate >= tenMinutesAgo
      ) {
        continue;
      }

      let shouldDelete = false;

      if (ext.orderId && ext.orderId !== "") {
        try {
          const order = await razorpay.orders.fetch(ext.orderId);

          if (
            order?.status === "attempted" &&
            ext.paymentInitiatedDate > fifteenMinutesAgo
          ) {
            console.log(
              `Skipping attempted extension ${ext.id} — within 15 min window`,
            );
            shouldDelete = false;
            continue;
          } else if (
            order?.status === "attempted" &&
            ext.paymentInitiatedDate <= fifteenMinutesAgo
          ) {
            console.log(
              `Deleting stuck attempted extension ${ext.id} — exceeded 15 min window`,
            );
            shouldDelete = true;
          } else if (order?.status === "paid") {
            if (ext.recoveredByCron) {
              console.log(
                `Extension ${ext.id} already recovered by cron, skipping.`,
              );
              shouldDelete = false;
              continue;
            }

            const payments = await razorpay.orders.fetchPayments(ext.orderId);
            const payment = payments?.items?.[0]; // latest payment for this order

            ext.status = "paid";
            ext.paymentMethod = "online";
            ext.recoveredByCron = true;
            ext.transactionId = order.id;
            ext.paymentDate = new Date();

            booking.BookingEndDateAndTime =
              ext.bookingEndDateAndTime || ext.BookingEndDateAndTime;

            ext.paymentInitiatedDate = new Date().getTime();

            if (payment?.acquirer_data?.rrn) {
              ext.rrnNumber = payment.acquirer_data.rrn;
            }

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
                  paymentId: order.id || "",
                  extended: true,
                },
              ],
            });

            console.log(
              `Recovered missed payment for booking ${booking._id}, extend id ${ext.id}`,
            );
          }
        } catch (err) {
          ext.razorpayFetchRetryCount = (ext.razorpayFetchRetryCount || 0) + 1;
          console.error(
            `Razorpay fetch failed for orderId ${ext.orderId} (attempt ${ext.razorpayFetchRetryCount}):`,
            err.message,
          );

          await Logs.create({
            message: `Razorpay fetch failed for extension`,
            functionName: "recoverUnpaidExtensions",
            otherInfo: {
              bookingId: booking._id,
              orderId: ext.orderId,
              extId: ext.id,
              retryCount: ext.razorpayFetchRetryCount,
              error: err.message,
            },
          });

          if (ext.razorpayFetchRetryCount >= 5) {
            console.error(
              `Extension ${ext.id} has failed Razorpay fetch 5 times — needs manual review`,
            );
            await Log.create({
              message: `ALERT: Extension stuck after 5 Razorpay fetch failures — manual review needed`,
              functionName: "recoverUnpaidExtensions",
              otherInfo: {
                bookingId: booking._id,
                extId: ext.id,
                orderId: ext.orderId,
              },
            });
          }

          shouldDelete = false;
        }
        // } catch (err) {
        //   console.error(
        //     `Razorpay fetch failed for orderId ${ext.orderId}:`,
        //     err.message,
        //   );
        //   shouldDelete = false;
        // }
      } else {
        // no orderId means payment was never initiated, safe to delete
        shouldDelete = true;
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

module.exports = { recoverUnpaidExtensions, razorpay };
