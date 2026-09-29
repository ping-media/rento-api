const mongoose = require("mongoose");

const userReviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true, // one review per booking, enforced at DB level
    },
    bookingId: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // customer being rated
    },
    ratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // manager/admin who rated
    },
    stars: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4, 5],
    },
    comment: {
      type: String,
      minlength: 0,
      maxlength: 300,
      trim: true,
    },
  },
  { timestamps: true },
);

userReviewSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("UserReview", userReviewSchema);
