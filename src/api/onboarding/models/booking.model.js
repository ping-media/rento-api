const Booking = require('../../../db/schemas/onboarding/booking.schema');
const User = require("../../../db/schemas/onboarding/user.schema");

// Get All Bookings with Filtering and Pagination
const getBookings = async (query) => {
  const obj = { status: 200, message: "Data fetched successfully", data: [] };

  try {
    const {
      _id,    
      bookingId,         
      bookingStatus,          
      userId,   
      paymentStatus,      
      page = 1,        
      limit = 10,      
    } = query;

    
    if (_id) {
      if (_id.length !== 24) {
        obj.status = 401;
        obj.message = "Invalid booking ID";
        return obj;
      }

      // Find booking by `_id`
      const booking = await Booking.findById(_id);
      if (!booking) {
        obj.status = 404;
        obj.message = "Booking not found";
        return obj;
      }

      obj.data = [booking];
      return obj;
    }

    // Build filter conditions dynamically
    const filters = {};
    if (bookingStatus) filters.bookingStatus = bookingStatus;
    if (userId) filters.userId = userId;
    if (bookingId) filters.bookingId = bookingId;
    if (paymentStatus) filters.paymentStatus = paymentStatus;

    
    const skip = (page - 1) * limit;

    const bookings = await Booking.find(filters)
      .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(Number(limit));

    // If no bookings found
    if (!bookings.length) {
      obj.message = "No records found";
      return obj;
    }

    // Add bookings to the response
    obj.data = bookings;

    // Include pagination metadata
    const totalRecords = await Booking.count(filters);
    obj.pagination = {
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: Number(page),
      pageSize: Number(limit),
    };
  } catch (error) {
    console.error("Error fetching bookings:", error);
    obj.status = 500;
    obj.message = "Internal server error";
  }

  return obj;
};

module.exports = { getBookings };
