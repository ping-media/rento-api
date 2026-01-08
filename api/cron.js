const mongoose = require("mongoose");

// Import your booking schema
const Booking = require("../src/db/schemas/onboarding/booking.schema");
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

    // const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const now = new Date();

    const result = await Booking.updateMany(
      {
        paymentStatus: "pending",
        bookingStatus: "pending",
        rideStatus: "pending",
        $expr: {
          $lt: [
            {
              $add: [
                { $toDate: "$BookingStartDateAndTime" },
                24 * 60 * 60 * 1000,
              ],
            },
            now,
          ],
        },
      },
      {
        $set: {
          paymentStatus: "failed",
          bookingStatus: "canceled",
          rideStatus: "canceled",
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`Canceled ${result.modifiedCount} pending bookings`);
      return res.status(200).json({
        success: true,
        message: `Canceled ${result.modifiedCount} bookings`,
        count: result.modifiedCount,
      });
    } else {
      console.log("No pending payments to cancel");
      return res.status(200).json({
        success: true,
        message: "No pending payments to cancel",
        count: 0,
      });
    }
  } catch (error) {
    console.error("Cron job error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
