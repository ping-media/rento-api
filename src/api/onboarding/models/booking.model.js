// const booking = require("../../../db/./schemas/./onboarding/./booking.schema"); 

// const getBookings = async (query) => {
//   const obj = { status: 200, message: "Data fetched successfully", data: [] };
//   try {
//     const filter = req.query || {}; 
//     const bookings = await booking.find(filter); // Fetch bookings from DB

//     if (!bookings.length) {
//       return res.status(404).json({ message: "No bookings found" });
//     }

//     res.status(200).json({ status: "success", data: bookings });
//   } catch (error) {
//     console.error("Error fetching bookings:", error);
//     res.status(500).json({ status: "error", message: "Internal Server Error" });
//   }

// };

// module.exports = { getBookings };
