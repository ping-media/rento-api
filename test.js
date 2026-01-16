// {
//   "version": 2,

//   "builds": [
//     {
//       "src": "app.js",
//       "use": "@vercel/node"
//     },
//     {
//       "src": "api/**/*.js",
//       "use": "@vercel/node"
//     }
//   ],

//   "routes": [
//     {
//       "src": "^/api/(.*)$",
//       "dest": "/api/$1"
//     },
//     {
//       "src": "/(.*)",
//       "dest": "/app.js"
//     }
//   ],

//   "crons": [
//     {
//       "path": "/api/cron",
//       "schedule": "0 * * * *"
//     }
//   ]
// }

// {
//       "src": "/(.*)",
//       "dest": "/app.js"
//     }

// old corn code
// const Booking = require("../src/db/schemas/onboarding/booking.schema");
// const mongoose = require("mongoose");

// async function ensureDBConnection() {
//   if (mongoose.connection.readyState === 1) {
//     // Already connected
//     return;
//   }

//   if (mongoose.connection.readyState === 2) {
//     // Currently connecting, wait for it
//     await new Promise((resolve) => {
//       mongoose.connection.once("connected", resolve);
//     });
//     return;
//   }

//   // Not connected, connect now
//   await mongoose.connect(process.env.DB_URL);
//   console.log("MongoDB Connected (Cron)");
// }

// module.exports = async function handler(req, res) {
//   console.log("Cron job started: Canceling pending payments...");

//   try {
//     // Connect to database
//     await ensureDBConnection();

//     // const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
//     const now = new Date();

//     const result = await Booking.updateMany(
//       {
//         paymentStatus: "pending",
//         bookingStatus: "pending",
//         rideStatus: "pending",
//         $expr: {
//           $lt: [
//             {
//               $add: [
//                 { $toDate: "$BookingStartDateAndTime" },
//                 24 * 60 * 60 * 1000,
//               ],
//             },
//             now,
//           ],
//         },
//       },
//       {
//         $set: {
//           paymentStatus: "failed",
//           bookingStatus: "canceled",
//           rideStatus: "canceled",
//         },
//       }
//     );

//     if (result.modifiedCount > 0) {
//       console.log(`Canceled ${result.modifiedCount} pending bookings`);
//       return res.status(200).json({
//         success: true,
//         message: `Canceled ${result.modifiedCount} bookings`,
//         count: result.modifiedCount,
//       });
//     } else {
//       console.log("No pending payments to cancel");
//       return res.status(200).json({
//         success: true,
//         message: "No pending payments to cancel",
//         count: 0,
//       });
//     }
//   } catch (error) {
//     console.error("Cron job error:", error.message);
//     return res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };

function convertTo24Hour(timeString) {
  // Split the string into time and period (AM/PM)
  const [time, period] = timeString.split(" "); // "10:00 PM" -> ["10:00", "PM"]
  const [hour, minutes] = time.split(":"); // "10:00" -> ["10", "00"]

  // Convert hour to a number and adjust for PM/AM
  let hour24 = parseInt(hour, 10);
  if (period === "PM" && hour24 !== 12) {
    hour24 += 12; // Convert PM to 24-hour format
  } else if (period === "AM" && hour24 === 12) {
    hour24 = 0; // Convert 12 AM to 0
  }

  return hour24; // Return only the hour in 24-hour format
}

console.log(convertTo24Hour("10:00 PM"));

paymentUpdates: {
  extentend: {
    amount: 1232;
    paymentMode: "online";
  }
}

const getDurationInDaysAndHours = (date1Str, date2Str) => {
  // Parse the input strings into Date objects
  const date1 = new Date(date1Str);
  const date2 = new Date(date2Str);

  // Check if the dates are valid
  if (isNaN(date1) || isNaN(date2)) {
    return "Invalid date format";
  }

  // Get the difference between the two dates in milliseconds
  const differenceInMs = Math.abs(date2 - date1);

  // Convert milliseconds to days and hours
  const totalHours = Math.floor(differenceInMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24; // Remaining hours after full days

  return { days, hours };
};

const t = "2025-02-03" + 1;

console.log(t);
