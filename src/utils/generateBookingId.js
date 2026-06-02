const Booking = require("../db/schemas/onboarding/booking.schema");

async function generateBookingId(session = undefined) {
  const lastBooking = await Booking.findOne({})
    .sort({ createdAt: -1 })
    .select("bookingId")
    .session(session);

  let sequence = 1;
  if (lastBooking && lastBooking.bookingId) {
    sequence = parseInt(lastBooking.bookingId, 10) + 1;
  }

  return sequence.toString().padStart(6, "0");
}

module.exports = { generateBookingId };
