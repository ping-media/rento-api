const mongoose = require("mongoose");

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
        createdAt: {
          // $lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          // change form 24 hour to 10 mins
          $lt: new Date(Date.now() - 10 * 60 * 1000),
        },
      }).select("_id userId bookingId paymentgatewayOrderId");

      // Filter out bookings where Razorpay already received payment
      const verifiedExpired = [];
      for (const booking of rawExpiredBookings) {
        if (booking.paymentgatewayOrderId) {
          try {
            const order = await razorpay.orders.fetch(
              booking.paymentgatewayOrderId,
            );
            // if (order?.status === "paid" || order?.status === "attempted") {
            //   console.log(
            //     `Skipping booking ${booking._id} — Razorpay status: ${order.status}`,
            //   );
            //   continue;
            // }
            if (order?.status === "paid") {
              console.log(`Skipping booking ${booking._id} — already paid`);
              continue;
            }

            // give attempted payments 15 min window before cancelling
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
          } catch (err) {
            console.error(
              `Razorpay check failed for booking ${booking._id}:`,
              err.message,
            );
            // don't cancel if we can't verify
            continue;
          }
        }
        verifiedExpired.push(booking);
      }
      const expiredBookings = verifiedExpired;

      if (expiredBookings.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No pending bookings to cancel",
          count: 0,
        });
      }

      // Cancel all
      await Booking.updateMany(
        { _id: { $in: expiredBookings.map((b) => b._id) } },
        {
          $set: {
            paymentStatus: "failed",
            bookingStatus: "canceled",
            rideStatus: "canceled",
          },
        },
      );

      // Add timeline for each
      await Promise.all(
        expiredBookings.map((booking) =>
          timelineFunctionServer({
            currentBooking_id: booking._id,
            bookingId: booking.bookingId,
            userId: booking.userId,
            timeLine: [
              {
                title: "Booking Auto Cancelled By System",
                date: Date.now(),
              },
            ],
          }),
        ),
      );

      return res.status(200).json({
        success: true,
        message: `Canceled ${expiredBookings.length} bookings`,
        count: expiredBookings.length,
      });
    } finally {
      await CronLock.findOneAndUpdate(
        { name: "cancelPendingPayments" },
        { isRunning: false },
      );
    }
  } catch (error) {
    console.error("Cron job error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
