const Booking = require("../src/db/schemas/onboarding/booking.schema");
const mongoose = require("mongoose");

async function ensureDBConnection() {
  if (mongoose.connection.readyState === 1) {
    // Already connected
    return;
  }

  if (mongoose.connection.readyState === 2) {
    // Currently connecting, wait for it
    await new Promise((resolve) => {
      mongoose.connection.once("connected", resolve);
    });
    return;
  }

  // Not connected, connect now
  await mongoose.connect(process.env.DB_URL);
  console.log("MongoDB Connected (Cron)");
}

module.exports = async function handler(req, res) {
  console.log("Cron job started: Canceling pending payments...");

  try {
    // Connect to database
    await ensureDBConnection();

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await Booking.updateMany(
      {
        paymentStatus: "pending",
        bookingStatus: "pending",
        rideStatus: "pending",
        createdAt: { $lt: oneDayAgo },
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
    console.error("Cron job error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
