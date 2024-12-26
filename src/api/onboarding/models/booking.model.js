const Booking = require('../../../db/schemas/onboarding/booking.schema');
const User = require("../../../db/schemas/onboarding/user.schema");
const Log = require("../../../api/onboarding/models/Logs.model")


// Get All Bookings with Filtering and Pagination
const getBooking = async (query) => {
  const obj = { status: 200, message: "Data fetched successfully", data: [] };

  try {
    const {
      _id,    
      bookingId,         
      bookingStatus,          
      userId=null,   
      paymentStatus, 
      search,     
      page = 1,        
      limit = 10,      
    } = query;

    
    if (_id) {
      if (_id.length !== 24) {
        await Log({
          message: "Invalid booking ID",
          functionName: "booking",
          userId: userId || "Admin",
        });
        obj.status = 401;
        obj.message = "Invalid booking ID";
        return obj;
      }

      // Find booking by `_id`
      const booking = await Booking.findById(_id);
      if (!booking) {
        await Log({
          message: "Booking not found for the provided ID",
          functionName: "booking",
          userId: userId || "Admin",

        });
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

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, "i"); // Case-insensitive search
      filters.$or = [
        { bookingId: searchRegex },
        { vehicleName: searchRegex },
        { stationName: searchRegex },
        { bookingStatus: searchRegex },
        { paymentStatus: searchRegex },
        { paymentMethod: searchRegex },
      ];
    }

    const skip = (page - 1) * limit;

    const bookings = await Booking.find(filters)
      .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(Number(limit))
     // .select("bookingId vehicleName stationName bookingStartDateAndTime bookingEndDateAndTime bookingPrice bookingStatus rideStatus");

    // If no bookings found
    if (!bookings.length) {
      await Log({
        message: "No bookings found for the provided filters",
        functionName: "booking",
        userId: userId || "Admin",

      });
      obj.message = "No records found";
      obj.status= 200;
      return obj;
    }

    // Add bookings to the response
    obj.data = bookings;

    // Include pagination metadata
    const totalRecords = await Booking.count(filters);
    obj.pagination = {
     // totalRecords,
      total: Math.ceil(totalRecords / limit),
      currentPage: Number(page),
      limit: Number(limit),
    };
  } catch (error) {
    console.error("Error fetching bookings:", error);
    await Log({
      message: `Error fetching bookings: ${error.message}`,
      functionName: "booking",
    //  userId: userId || "Admin",

    });
    obj.status = 500;
    obj.message = "Internal server error";
  }

  return obj;
};


const getBookings = async (query) => {
  const obj = { status: 200, message: "Data fetched successfully", data: [] };

  try {
    const { _id, bookingId, bookingStatus, userId, paymentStatus, search } = query;

    // Handle fetching by `_id` directly
    if (_id) {
      if (_id.length !== 24) {
        await Log({
          message: "Invalid booking ID",
          functionName: "booking",
          userId: userId || null,
        });
        obj.status = 401;
        obj.message = "Invalid booking ID";
        return obj;
      }

      const booking = await Booking.findById(_id);
      if (!booking) {
        await Log({
          message: "Booking not found for the provided ID",
          functionName: "booking",
          userId: userId || null,
        });
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

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, "i"); // Case-insensitive search
      filters.$or = [
        { bookingId: searchRegex },
        { vehicleName: searchRegex },
        { stationName: searchRegex },
        { bookingStatus: searchRegex },
        { paymentStatus: searchRegex },
      ];
    }

    // Fetch bookings
    const bookings = await Booking.find(filters)
      .sort({ createdAt: -1 });

    // If no bookings found
    if (!bookings.length) {
      await Log({
        message: "No bookings found for the provided filters",
        functionName: "booking",
        userId: userId || null,
      });
      obj.message = "No records found";
      obj.status = 200;
      return obj;
    }

    // Add bookings to the response
    obj.data = bookings;
  } catch (error) {
    console.error("Error fetching bookings:", error);
    await Log({
      message: `Error fetching bookings: ${error.message}`,
      functionName: "booking",
      userId: userId || null,
    });
    obj.status = 500;
    obj.message = "Internal server error";
  }

  return obj;
};


module.exports = { getBookings, getBooking };
