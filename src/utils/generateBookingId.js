const Booking = require("../db/schemas/onboarding/booking.schema");

const generateBookingId = async (session) => {
  const lastBooking = await Booking.findOne({})
    .sort({ createdAt: -1 })
    .select("bookingId")
    .session(session);

  const sequence =
    lastBooking && lastBooking.bookingId
      ? parseInt(lastBooking.bookingId, 10) + 1
      : 1;

  return sequence.toString().padStart(6, "0");
};

module.exports = { generateBookingId };
