// api/cron.js
import { connectToDatabase } from '../../app'; // Your database connection utility
import Booking from '../api/onboarding/models/booking.model'; // Your Booking model

export default async function handler(req, res) {
 // if (req.method === "GET") {
    console.log("Running scheduler to cancel pending payments older than 1 hour...");

    try {
    //   const oneHourAgo = new Date();
    //   oneHourAgo.setMinutes(oneMinuteAgo.getMinute() - 1);

      // Find and update bookings with paymentStatus "pending" older than 1 hour
      const result = await Booking.updateMany(
        {
          paymentStatus: "pending",
         // createdAt: { $lte: oneHourAgo },
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
        console.log("No pending payments older than 1 hour to cancel.");
      }

      res.status(200).json({ message: "Scheduler executed successfully", result });
    } catch (error) {
      console.error("Error in scheduler for canceling pending payments:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
//   } else {
//     res.status(405).json({ error: "Method Not Allowed" });
//   }
}
