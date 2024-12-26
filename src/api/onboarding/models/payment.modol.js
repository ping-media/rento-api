const Booking = require("../../../db/schemas/onboarding/booking.schema");
const User = require("../../../db/schemas/onboarding/user.schema");

const paymentRec = async (req, res) => {
  try {
    // Fetch all bookings from the database
    const bookings = await Booking.find({}, {
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
      }) .populate("userId", "firstName lastName contact email");

      
    // Check if bookings exist
    if (!bookings || bookings.length === 0) {
      return res.json({
        status: 404,
        message: "No bookings found.",
      });
    }

    

    // Return the retrieved bookings and userIds
    return res.status(200).json({
      status: 200,
      message: "Bookings retrieved successfully.",
      data: bookings,
      
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
