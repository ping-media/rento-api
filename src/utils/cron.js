import Booking from "../api/onboarding/models/booking.model";
import cron from "node-cron";

let isCronScheduled = false;

async function cancelPendingPayments() {
  console.log("Running scheduler to cancel all pending payments...");

  try {
    const result = await Booking.updateMany(
      {
        paymentStatus: "pending",
        paymentMethod: { $ne: "cash" },
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
      console.log(`Canceled ${result.modifiedCount} pending bookings.`);
    } else {
      console.log("No pending bookings to cancel.");
    }
  } catch (error) {
    console.error(
      "Error in scheduler for canceling pending payments:",
      error.message
    );
  }
}

// Express.js route handler
async function handler(req, res) {
  if (!isCronScheduled) {
    cron.schedule("0 0 * * *", async () => {
      await cancelPendingPayments();
    });
    isCronScheduled = true;
    console.log("Cron job scheduled to run every day at 12:00 AM.");
  }

  console.log("Cron job is working (FROM ROUTE)");
  res.status(200).send("Cron job is working (FROM ROUTE)");
}

module.exports = { handler };
