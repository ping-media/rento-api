import Booking from '../api/onboarding/models/booking.model'; // Your Booking model
import cron from "node-cron";


// Function to handle booking cancellation logic
async function cancelPendingPayments() {
  console.log("Running scheduler to cancel pending payments older than 1 hour...");

  try {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Find and update bookings with paymentStatus "pending" older than 1 hour
    const result = await Booking.updateMany(
      {
        paymentStatus: "pending",
        createdAt: { $lte: oneHourAgo },
        paymentMethod: { $ne: "cash" }
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
      console.log(`Canceled ${result.modifiedCount} bookings with pending payment.`);
    } else {
      console.log("No pending payments older than 1 hour to cancel.");
    }
  } catch (error) {
    console.error("Error in scheduler for canceling pending payments:", error.message);
  }
}

// Express.js route handler to trigger the cron job manually
// async function handler(req, res) {
//       await cancelPendingPayments();
//   res.status(200).send("Cron job is working (FROM ROUTE)");
// }

module.exports = { cancelPendingPayments };
