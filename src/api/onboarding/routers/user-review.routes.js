const Authentication = require("../../../middlewares/Authentication");
const {
  rateUserForBooking,
  getUserReviews,
} = require("../models/user-review.model");
const router = require("express").Router();

router.post("/users/:userId/rate", Authentication, async (req, res) => {
  try {
    const { userId } = req.params;
    const { bookingId, stars, comment } = req.body;
    const ratedBy = req.user.id; // from your auth middleware

    const result = await rateUserForBooking({
      bookingId,
      userId,
      ratedBy,
      stars,
      comment,
    });

    res.json({ status: 200, success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/users/:userId/reviews", Authentication, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;

    const result = await getUserReviews({ userId, page });

    res.json({ status: 200, success: true, ...result });
  } catch (err) {
    res.json({ status: 500, success: false, message: err.message });
  }
});

module.exports = router;
