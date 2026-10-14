const express = require("express");

const loginRoute = require("./login.router");
const accountRoute = require("./account.routes");
const vehicleRoute = require("./vehicle.router");
const RazorPayRoute = require("./razorpay.routes");
const MobileTokenRoute = require("./mobile-token.routes");
const UserReviewRoute = require("./user-review.routes");
const AttendanceRoute = require("./attendance.routes");
const LogRoute = require("./log.routes");

const router = express();

router.use("/api", loginRoute);
router.use("/api", accountRoute);
router.use("/api", vehicleRoute);
router.use("/api", RazorPayRoute);
router.use("/api", MobileTokenRoute);
router.use("/api", UserReviewRoute);
router.use("/api", AttendanceRoute);
router.use("/api", LogRoute);

module.exports = router;
