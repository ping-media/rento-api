const Booking = require('../../../db/schemas/onboarding/booking.schema')



//get All Booking 
const getBookings = async (query) => {
  const obj = { status: 200, message: "Data fetched successfully", data: [] };

  try {
   // console.log(query)
    // Check if _id is provided in the query
    if (query._id) {
      if (query._id.length !== 24) {
        obj.status = 401;
        obj.message = "Invalid booking ID";
        return obj;
      }

      // Find booking by _id
      const booking = await Booking.findById(query._id);
      if (!booking) {
        obj.status = 404;
        obj.message = "Booking not found";
        return obj;
      }

      obj.data = [booking]; // Return the single booking in an array for consistency
      return obj;
    }

    // If no _id is provided, fetch all bookings
    const bookings = await Booking.find();
    if (!bookings.length) {
      obj.message = "No records found";
      return obj;
    }

    obj.data = bookings;
  } catch (error) {
    console.error("Error fetching bookings:", error);
    obj.status = 500;
    obj.message = "Internal server error";
  }

  return obj;
};

  

  


  module.exports = {getBookings}