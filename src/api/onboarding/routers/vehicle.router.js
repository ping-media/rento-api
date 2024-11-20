const router = require("express").Router();
const vehiclesService = require("../services/vehicles.service");
const auth = require("../../../middlewares/auth/index");

// create messages
router.post("/createVehicle", async (req, res) => {
  vehiclesService.createVehicle(req, res);
})

router.post("/createBookingDuration", async (req, res) => {
  vehiclesService.createBookingDuration(req, res);
})

router.post("/createLocation", async (req, res) => {
  vehiclesService.createLocation(req, res);
})

router.post("/createPlan", async (req, res) => {
  vehiclesService.createPlan(req, res);
})

router.post("/createInvoice", async (req, res) => {
  vehiclesService.createInvoice(req, res);
})

router.post("/discountCoupons", async (req, res) => {
  vehiclesService.discountCoupons(req, res);
})

router.post("/createStation", async (req, res) => {
  vehiclesService.createStation(req, res);
})

router.post("/searchVehicle", async (req, res) => {
  vehiclesService.searchVehicle(req, res);
})

// get messages
router.get("/getMessages/:chatId", auth(), async (req, res) => {
  vehiclesService.getMessages(req, res);
})

router.post("/getAllVehicles", async (req, res) => {
  vehiclesService.getAllVehicles(req, res);
})

router.get("/getLocations", async (req, res) => {
  vehiclesService.getLocations(req, res);
})
router.get("/getLocationData", async (req, res) => {
  vehiclesService.getLocationData(req, res);
})
router.get("/getPlanData", async (req, res) => {
  vehiclesService.getPlanData(req, res);
})
router.get("/getVehicleTblData", async (req, res) => {
  vehiclesService.getVehicleTblData(req, res);
})
router.get("/getStationData", async (req, res) => {
  vehiclesService.getStationData(req, res);
})

router.get("/getAllBookingDuration", async (req, res) => {
  vehiclesService.getAllBookingDuration(req, res);
})

router.get("/getVehicleMasterData", async (req, res) => {
  vehiclesService.getVehicleMasterData(req, res);
})

router.post("/createBooking", async (req, res) => {
  vehiclesService.booking(req, res);
})

router.get("/getBookings", async (req, res) => {
  vehiclesService.getBookings(req, res);
})

router.post("/createOrder", async (req, res) => {
  vehiclesService.createOrder(req, res);
})

router.post("/createVehicleMaster", async (req, res) => {
  vehiclesService.createVehicleMaster(req, res);
})

router.get("/getOrders", async (req, res) => {
  vehiclesService.getOrders(req, res);
})



module.exports = router;
