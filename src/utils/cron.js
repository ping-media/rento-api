import Booking from '../api/onboarding/models/booking.model'; // Your Booking model
import cron from "node-cron";



// Function to handle booking cancellation logic
async function cancelPendingPayments() {
  console.log("Running scheduler to cancel pending payments older than 5 minutes...");

  try {
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5); // Change to 5 minutes

    // Find and update bookings with paymentStatus "pending" older than 5 minutes
    const result = await Booking.updateMany(
      {
        paymentStatus: "pending",
        createdAt: { $lte: fiveMinutesAgo },
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
      console.log(` Canceled ${result.modifiedCount} bookings with pending payment.`);
    } else {
      console.log("ℹ️ No pending payments older than 5 minutes to cancel.");
    }
  } catch (error) {
    console.error(" Error in scheduler for canceling pending payments:", error.message);
  }
}

// Express.js route handler to trigger the cron job manually
async function handler(req, res) {
    
        await cancelPendingPayments();
        res.json({ message: "Cron job executed manually!" });
}

module.exports = { handler };
