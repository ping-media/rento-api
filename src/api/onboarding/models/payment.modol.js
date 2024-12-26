const { query } = require("express");
const Booking = require("../../../db/schemas/onboarding/booking.schema");
const User = require("../../../db/schemas/onboarding/user.schema");

const paymentRec = async (req, res) => {
  try {

    const {bookingId, email, paymentStatus, paymentMethod, search, page = 1, limit = 10, }=req.query

    const filters = {};
    if (bookingId) filters.bookingId = bookingId;
    if (email) filters.email = email;
    if (paymentStatus) filters.paymentStatus = paymentStatus;
    if (paymentMethod) filters.paymentMethod = paymentMethod;

    if (search) {
      const searchRegex = new RegExp(search, "i"); 
      filters.$or = [
        { bookingId: searchRegex },
        { "userId.firstName": searchRegex }, // Populate field
        { "userId.lastName": searchRegex }, // Populate field
        { "userId.email": searchRegex }, // Populate field
        { paymentMethod: searchRegex },
        { paymentStatus: searchRegex },
        { payment_order_id: searchRegex },
        { paySuccessId: searchRegex },
      ];
    }

    
    const skip = (page - 1) * limit;
    // Fetch all bookings from the database
    const bookings = await Booking.find(filters, {
        userId: 1,
        bookingId: 1,
        bookingPrice:1,
        payInitFrom:1,
        payment_order_id: 1,
        paySuccessId: 1,
        payment_type: 1,
        paymentgatewayOrderId:1,
        paymentStatus:1,
        paymentMethod:1,
        paymentInitiatedDate: 1,
        createdAt:1,
        updatedAt:1
      }) .populate("userId", "firstName lastName contact email")
      .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(Number(limit));

      
    // Check if bookings exist
    if (!bookings || bookings.length === 0) {
      return res.json({
        status: 404,
        message: "No bookings found.",
      });
    }

    
    const totalRecords = await Booking.count(filters);
    const pagination = {
      // totalRecords,
      total: Math.ceil(totalRecords / limit),
      currentPage: Number(page),
      limit: Number(limit),
    };
    // Return the retrieved bookings and userIds
    return res.status(200).json({
      status: 200,
      message: "Bookings retrieved successfully.",
      data: bookings,
      pagination:pagination
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);

    // Return an error response
    return res.json({
      status: 500,
      message: "Failed to retrieve bookings.",
      error: error.message,
    });
  }
};

module.exports = { paymentRec };
