const router = require("express").Router();
const vehiclesService = require("../services/vehicles.service");
const auth = require("../../../middlewares/auth/index");
const Booking=require("../../../api/./onboarding/./models/./booking.model")
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
require('dotenv').config();

const {fileUpload} = require ("../models/locationUpload.model")
const{VehicalfileUpload} = require ("../models/createVehicleMasterUpload")

// create messages
router.post("/createVehicle", async (req, res) => {
  vehiclesService.createVehicle(req, res);
})

router.post("/createBookingDuration", async (req, res) => {
  vehiclesService.createBookingDuration(req, res);
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

router.post("/createCoupon", async (req, res) => {
  vehiclesService.createCoupon(req, res);
})

router.post("/VehicleBookrecode", async (req, res) => {
  vehiclesService.VehicleBookrecode(req, res);
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

// router.post("/createVehicleMaster", async (req, res) => {
//   vehiclesService.createVehicleMaster(req, res);
// })

router.get("/getOrders", async (req, res) => {
  vehiclesService.getOrders(req, res);
})

//getCoupons bookingAvailability

router.get("/getCoupons", async (req, res) => {
  vehiclesService.getCoupons(req, res);
})

router.get("/getVehicleBookrecode", async (req, res) => {
  vehiclesService.getVehicleBookrecode(req, res);
})






// Configure Multer to use Memory Storage
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory for manual upload to S3
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB file size limit
});


router.post("/createLocation", upload.single('image'), async (req, res) => {
  if (!req.file) {
      return res.status(400).json({ message: 'File upload failed. No file provided.' });
  }
  fileUpload(req, res)
  // vehiclesService.createLocation(req, res);
})

router.post("/createVehicleMaster", upload.single('image'), async (req, res) => {
  if (!req.file) {
      return res.status(400).json({ message: 'File upload failed. No file provided.' });
  }
  VehicalfileUpload(req, res)
  // vehiclesService.createLocation(req, res);
})




module.exports = router;
