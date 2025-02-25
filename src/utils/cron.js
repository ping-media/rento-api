const Booking = require ('../../src/db/schemas/onboarding/booking.schema'); 


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
      console.log(`Canceled ${result.modifiedCount} bookings with pending payment.`);
    } else {
      console.log("No pending payments older than 5 minutes to cancel.");
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
