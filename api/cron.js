const mongoose = require("mongoose");
const Log = require("../src/api/onboarding/models/Logs.model");

// Import your booking schema
const Booking = require("../src/db/schemas/onboarding/booking.schema");
const CronLock = require("../src/db/schemas/onboarding/cronLock.schema");
const {
  timelineFunctionServer,
} = require("../src/api/onboarding/models/timeline.model");
const {
  recoverUnpaidExtensions,
  razorpay,
} = require("../src/helper/recoverUnpaidExtensions");
require("dotenv").config();

async function ensureDBConnection() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve) => {
      mongoose.connection.once("connected", resolve);
    });
    return;
  }

  await mongoose.connect(process.env.DB_URL);
}

module.exports = async (req, res) => {
  // Verify the request is from Vercel Cron
  if (process.env.NODE_ENV !== "production") {
    console.log("Development mode: Skipping cron authorization");
  } else {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    console.log("Cron job started: Canceling pending payments...");

    // Connect to database
    await ensureDBConnection();

    // Prevent overlapping cron runs
    const lock = await CronLock.findOne({ name: "cancelPendingPayments" });
    if (lock?.isRunning) {
      console.log("Cron already running, skipping this run.");
      return res
        .status(200)
        .json({ success: true, message: "Cron already running, skipped." });
    }
    await CronLock.findOneAndUpdate(
      { name: "cancelPendingPayments" },
      { isRunning: true, startedAt: new Date() },
      { upsert: true },
    );

    try {
      // deleting the extension
      await recoverUnpaidExtensions();

      // main booking cancelling
      const rawExpiredBookings = await Booking.find({
        paymentStatus: "pending",
        bookingStatus: "pending",
        rideStatus: "pending",
        isConfirmed: false,
        createdAt: {
          $lt: new Date(Date.now() - 10 * 60 * 1000),
        },
      }).select("_id userId bookingId tempId paymentgatewayOrderId createdAt");

      // Filter out bookings where Razorpay already received payment
      // const verifiedExpired = [];
      // for (const booking of rawExpiredBookings) {
      //   if (booking.paymentgatewayOrderId) {
      //     try {
      //       const order = await razorpay.orders.fetch(
      //         booking.paymentgatewayOrderId,
      //       );
      //       // if (order?.status === "paid" || order?.status === "attempted") {
      //       //   console.log(
      //       //     `Skipping booking ${booking._id} — Razorpay status: ${order.status}`,
      //       //   );
      //       //   continue;
      //       // }
      //       if (order?.status === "paid") {
      //         console.log(`Skipping booking ${booking._id} — already paid`);
      //         continue;
      //       }

      //       // give attempted payments 15 min window before cancelling
      //       const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
      //       if (
      //         order?.status === "attempted" &&
      //         booking.createdAt.getTime() > fifteenMinutesAgo
      //       ) {
      //         console.log(
      //           `Skipping booking ${booking._id} — attempted within 15 min window`,
      //         );
      //         continue;
      //       }
      //     } catch (err) {
      //       console.error(
      //         `Razorpay check failed for booking ${booking._id}:`,
      //         err.message,
      //       );
      //       // don't cancel if we can't verify
      //       continue;
      //     }
      //   }
      //   verifiedExpired.push(booking);
      // }

      const verifiedExpired = [];
      const recovered = [];

      for (const booking of rawExpiredBookings) {
        if (booking.paymentgatewayOrderId) {
          try {
            const order = await razorpay.orders.fetch(
              booking.paymentgatewayOrderId,
            );

            // Payment done but webhook missed — recover it
            if (order?.status === "paid") {
              // console.log(
              //   `Recovering booking ${booking._id} — Razorpay paid but webhook missed`,
              // );
              await Log({
                message: `Recovering booking ${booking._id} — Razorpay paid but webhook missed`,
                functionName: "cancelPendingPaymentsCron",
              });
              const newBookingId = await generateBookingId();
              await Booking.findByIdAndUpdate(booking._id, {
                $set: {
                  bookingId: newBookingId,
                  tempId: null,
                  isConfirmed: true,
                  paymentStatus: "paid",
                  bookingStatus: "done",
                  rideStatus: "pending",
                },
              });
              recovered.push({ ...booking, bookingId: newBookingId });
              continue;
            }

            // Give attempted payments 15 min window
            const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
            if (
              order?.status === "attempted" &&
              booking.createdAt.getTime() > fifteenMinutesAgo
            ) {
              console.log(
                `Skipping booking ${booking._id} — attempted within 15 min window`,
              );
              continue;
            }

            // Razorpay says failed explicitly — safe to delete
            if (order?.status === "failed") {
              console.log(
                `Booking ${booking._id} — Razorpay failed, marking for deletion`,
              );
              verifiedExpired.push(booking);
              continue;
            }
          } catch (err) {
            await Log({
              message: `Razorpay check failed for booking ${booking._id}: ${err.message}`,
              functionName: "cancelPendingPaymentsCron",
            });
            // Can't verify — skip, don't delete
            continue;
          }
        }

        // No razorpay order attached — safe to delete
        verifiedExpired.push(booking);
      }

      const expiredBookings = verifiedExpired;

      if (verifiedExpired.length === 0 && recovered.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No pending bookings to process",
          recovered: 0,
          deleted: 0,
        });
      }

      // Hard delete unconfirmed expired bookings
      if (verifiedExpired.length > 0) {
        await Booking.deleteMany({
          _id: { $in: verifiedExpired.map((b) => b._id) },
          isConfirmed: false, // double safety check
        });
        console.log(
          `Deleted ${verifiedExpired.length} unconfirmed expired bookings`,
        );
      }

      // Add timeline only for recovered bookings
      if (recovered.length > 0) {
        await Promise.all(
          recovered.map((booking) =>
            timelineFunctionServer({
              currentBooking_id: booking._id,
              bookingId: booking.bookingId,
              userId: booking.userId,
              timeLine: [
                {
                  title: "Booking Recovered By System",
                  date: Date.now(),
                },
              ],
            }),
          ),
        );
        console.log(`Recovered ${recovered.length} bookings`);
      }

      return res.status(200).json({
        success: true,
        message: "Cron completed",
        recovered: recovered.length,
        deleted: verifiedExpired.length,
      });

      // if (expiredBookings.length === 0) {
      //   return res.status(200).json({
      //     success: true,
      //     message: "No pending bookings to cancel",
      //     count: 0,
      //   });
      // }

      // // Cancel all
      // await Booking.updateMany(
      //   { _id: { $in: expiredBookings.map((b) => b._id) } },
      //   {
      //     $set: {
      //       paymentStatus: "failed",
      //       bookingStatus: "canceled",
      //       rideStatus: "canceled",
      //     },
      //   },
      // );

      // // Add timeline for each
      // await Promise.all(
      //   expiredBookings.map((booking) =>
      //     timelineFunctionServer({
      //       currentBooking_id: booking._id,
      //       bookingId: booking.bookingId,
      //       userId: booking.userId,
      //       timeLine: [
      //         {
      //           title: "Booking Auto Cancelled By System",
      //           date: Date.now(),
      //         },
      //       ],
      //     }),
      //   ),
      // );

      // return res.status(200).json({
      //   success: true,
      //   message: `Canceled ${expiredBookings.length} bookings`,
      //   count: expiredBookings.length,
      // });
    } finally {
      await CronLock.findOneAndUpdate(
        { name: "cancelPendingPayments" },
        { isRunning: false },
      );
    }
  } catch (error) {
    await Log({
      message: `Cron job error: ${error.message}`,
      functionName: "cancelPendingPaymentsCron",
    });
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
