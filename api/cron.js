const mongoose = require("mongoose");

// Import your booking schema
const Booking = require("../src/db/schemas/onboarding/booking.schema");
const {
  timelineFunctionServer,
} = require("../src/api/onboarding/models/timeline.model");
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

    // deleting the extension
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

    const bookingsWithUnpaidExtends = await Booking.find({
      "bookingPrice.extendAmount": {
        $elemMatch: {
          status: "unpaid",
          paymentInitiatedDate: { $lt: tenMinutesAgo },
        },
      },
    }).select("_id");

    if (bookingsWithUnpaidExtends.length > 0) {
      await Booking.updateMany(
        {
          _id: { $in: bookingsWithUnpaidExtends.map((b) => b._id) },
        },
        {
          $pull: {
            "bookingPrice.extendAmount": {
              status: "unpaid",
              paymentInitiatedDate: { $lt: tenMinutesAgo },
            },
          },
        },
      );

      console.log(`Deleted ${bookingsWithUnpaidExtends.length} unpaid extends`);
    }

    // main booking cancelling
    const expiredBookings = await Booking.find({
      paymentStatus: "pending",
      bookingStatus: "pending",
      rideStatus: "pending",
      createdAt: {
        // $lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        // change form 24 hour to 10 mins
        $lt: new Date(Date.now() - 10 * 60 * 1000),
      },
    }).select("_id userId bookingId");

    if (expiredBookings.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No pending payments to cancel",
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
  } catch (error) {
    console.error("Cron job error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
