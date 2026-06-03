const express = require("express");

const loginRoute = require("./login.router");
const accountRoute = require("./account.routes");
const vehicleRoute = require("./vehicle.router");
const RazorPayRoute = require("./razorpay.routes");
const DigilockerRoute = require("./digilocker.routes");
const MobileTokenRoute = require("./mobile-token.routes");
const LogRoute = require("./log.routes");

const router = express();

router.use("/api", loginRoute);
router.use("/api", accountRoute);
router.use("/api", vehicleRoute);
router.use("/api", RazorPayRoute);
router.use("/api", MobileTokenRoute);
router.use("/api", LogRoute);
// router.use("/api/digilocker", DigilockerRoute);

module.exports = router;
