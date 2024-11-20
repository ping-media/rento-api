const express = require("express");

const loginRoute = require("./login.router");
const accountRoute = require("./account.routes");
const vehicleRoute = require("./vehicle.router.js");

const router = express();

router.use("/api", loginRoute);
router.use("/api", accountRoute);
router.use("/api", vehicleRoute);


//Images routes
module.exports = router;
