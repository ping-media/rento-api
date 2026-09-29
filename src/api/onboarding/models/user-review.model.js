const UserReview = require("../../../db/schemas/onboarding/user-review.schema");
const User = require("../../../db/schemas/onboarding/user.schema");
const Booking = require("../../../db/schemas/onboarding/booking.schema");

const NEGATIVE_THRESHOLD = 2; // 1-2 stars = negative, 3+ = neutral/positive

async function rateUserForBooking({
  bookingId: _id,
  userId,
  ratedBy,
  stars,
  comment,
}) {
  const booking = await Booking.findById(_id);
  if (!booking) throw new Error("Booking not found");
  if (booking.isRated) throw new Error("This booking has already been rated");

  await UserReview.create({
    booking: _id,
    bookingId: booking.bookingId,
    user: userId,
    ratedBy,
    stars,
    comment,
  });

  const isNegative = stars <= NEGATIVE_THRESHOLD;

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $inc: {
        "rating.totalReviews": 1,
        ...(isNegative && { "rating.negativeReviews": 1 }),
      },
    },
    { new: true },
  );

  const rawAverage =
    5 - (user.rating.negativeReviews / user.rating.totalReviews) * 5;
  user.rating.average = Math.round(Math.max(0, rawAverage) * 10) / 10; // one decimal place
  await user.save();

  booking.isRated = true;
  await booking.save();

  return { rating: user.rating };
}

async function getUserReviews({ userId, page = 1, limit = 10 }) {
  const totalReviews = await UserReview.countDocuments({ user: userId });
  const reviews = await UserReview.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("ratedBy", "firstName lastName");

  return { page, totalReviews, hasMore: page * limit < totalReviews, reviews };
}

module.exports = { rateUserForBooking, getUserReviews };
