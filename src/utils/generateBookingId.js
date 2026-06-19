const Booking = require("../db/schemas/onboarding/booking.schema");

// const generateBookingId = async (session) => {
//   const lastBooking = await Booking.findOne({})
//     .sort({ createdAt: -1 })
//     .select("bookingId")
//     .session(session);

//   const sequence =
//     lastBooking && lastBooking.bookingId
//       ? parseInt(lastBooking.bookingId, 10) + 1
//       : 1;

//   return sequence.toString().padStart(6, "0");
// };

const generateBookingId = async (session) => {
  const lastBooking = await Booking.findOne({
    $or: [
      { "bookingPrice.tempId": { $exists: false } },
      { "bookingPrice.isRealAssigned": true },
    ],
  })
    .sort({ createdAt: -1 })
    .select("bookingId")
    .session(session);

  const sequence =
    lastBooking && lastBooking.bookingId
      ? parseInt(lastBooking.bookingId, 10) + 1
      : 1;

  return sequence.toString().padStart(6, "0");
};

// const generateTempId = async (session) => {
//   const lastBooking = await Booking.findOne({ bookingId: /^9/ })
//     .sort({ createdAt: -1 })
//     .select("bookingId")
//     .session(session);

//   const last = lastBooking?.bookingId
//     ? parseInt(lastBooking.bookingId, 10)
//     : 899999;
//   return (last + 1).toString();
// };
const generateTempId = async (session) => {
  while (true) {
    try {
      const lastBooking = await Booking.findOne({
        "bookingPrice.tempId": { $exists: true },
      })
        .sort({ createdAt: -1 })
        .select("bookingPrice")
        .session(session);

      const lastTempId = lastBooking?.bookingPrice?.tempId;
      const last = lastTempId ? parseInt(lastTempId.replace("RN", ""), 10) : 0;
      const next = (last + 1).toString().padStart(6, "0");
      return `RN${next}`;
    } catch (err) {
      if (err.code === 11000) continue;
      throw err;
    }
  }
};

module.exports = { generateBookingId, generateTempId };
