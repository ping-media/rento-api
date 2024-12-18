import { connectToDatabase } from '../../app'; // Your database connection utility
import Booking from '../api/onboarding/models/booking.model'; // Your Booking model
import cron from "node-cron";

//connectToDatabase();

let isCronScheduled = false;

// Function to handle the actual booking cancellation logic
async function cancelPendingPayments() {
  console.log("Running scheduler to cancel pending payments older than 1 minute...");

  try {
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

    // Find and update bookings with paymentStatus "pending" older than 1 minute
    const result = await Booking.updateMany(
      {
        paymentStatus: "pending",
        createdAt: { $lte: oneMinuteAgo },
      },
      {
        $set: {
          paymentStatus: "canceled",
          bookingStatus: "canceled",
          rideStatus: "canceled",
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`Canceled ${result.modifiedCount} bookings with pending payment.`);
    } else {
      console.log("No pending payments older than 1 minute to cancel.");
    }
  } catch (error) {
    console.error("Error in scheduler for canceling pending payments:", error.message);
  }
}

// API Handler
function handler(req, res) {
  // Schedule the cron job only once
  if (!isCronScheduled) {
    cron.schedule("* * * * *", async () => {
      await cancelPendingPayments();
    });
    isCronScheduled = true; // Prevent duplicate scheduling
    console.log("Cron job scheduled to run every minute.");
  }

  res.status(200).json({ message: "Cron job is running and scheduled." });
}
 
module.exports={handler}