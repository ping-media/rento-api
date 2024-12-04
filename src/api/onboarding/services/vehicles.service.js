const multer = require("multer");
const {
  createVehicle,
  createLocation,
  createStation,
  createInvoice,
  createPlan,
  discountCoupons,
  getVehicleMasterData,
  searchVehicle,
  getMessages,
  getAllBookingDuration,
  createOrder,
  createVehicleMaster,
  getOrders,
  booking,
  getAllVehicles,
  getLocations,
  createBookingDuration,
  getVehicleTblData,
  getStationData,
  getLocationData,
  getPlanData,
  getAllInvoice
  
} = require("../models/vehicles.model");

const { createCoupon, getCoupons } = require("../models/coupon.model");
const {getBookings}= require("../models/booking.model")
const {getVehicleBookrecode,VehicleBookrecode}= require("../models/Vehicle.Bookrecode.module");
const {fileUpload} = require("../models/locationUpload.model")

exports.getStationData = async (req, res) => {
  try {
    const result = await getStationData(req.query);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.getVehicleBookrecode = async (req, res) => {
  try {
    const result = await getVehicleBookrecode(req.query);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.getCoupons = async (req, res) => {
  try {
    const result = await getCoupons(req.query);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}


exports.getVehicleTblData = async (req, res) => {
  try {
    const result = await getVehicleTblData(req.query);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.getPlanData = async (req, res) => {
  try {
    const result = await getPlanData(req.query);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}
exports.getLocationData = async (req, res) => {
  try {
    const result = await getLocationData(req.query);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}


exports.createVehicle = async (req, res) => {
  try {
    const result = await createVehicle(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.createCoupon = async (req, res) => {
  try {
    const result = await createCoupon(req.query);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.VehicleBookrecode = async (req, res) => {
  try {
    const result = await VehicleBookrecode(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.createBookingDuration = async (req, res) => {
  try {
    const result = await createBookingDuration(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.searchVehicle = async (req, res) => {
  try {
    const result = await searchVehicle(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.getLocations = async (req, res) => {
  try {
    const result = await getLocations(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.getAllBookingDuration = async (req, res) => {
  try {
    const result = await getAllBookingDuration(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.getVehicleMasterData = async (req, res) => {
  try {
    const result = await getVehicleMasterData(req.query);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}



exports.getBookings = async (req, res) => {
  try {
    const result = await getBookings(req.query);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}


exports.booking = async (req, res) => {
  try {
    const result = await booking(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.createOrder = async (req, res) => {
  try {
    const result = await createOrder(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.createVehicleMaster = async (req, res) => {
  try {
    const result = await createVehicleMaster(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}


exports.getOrders = async (req, res) => {
  try {
    const result = await getOrders();
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.createLocation = async  (req, res) =>{
  try {
    // Check content type
    const contentType = req.headers["content-type"];

    if (contentType.includes("multipart/form-data")) {
      fileUpload(req, res)
    } else {
      return res.status(400).json({
        message: "Json data is not allowed",
        status: 400,
      });
    }
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}


exports.createLocation1 = async (req, res) => {
  const contentType = req.headers["content-type"];
  try {
    const result = await createLocation(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.createPlan = async (req, res) => {
  try {
    const result = await createPlan(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.discountCoupons = async (req, res) => {
  try {
    const result = await discountCoupons(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}



exports.createInvoice = async (req, res) => {
  try {
    const result = await createInvoice(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}


exports.createStation = async (req, res) => {
  try {
    const result = await createStation(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}





exports.getMessages = async (req, res) => {
  try {
    const result = await getMessages(req.params.chatId);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.getAllVehicles = async (req, res) => {
  try {
    const result = await getAllVehicles(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.getAllInvoice = async (req, res) => {
  try {
    const result = await getAllInvoice(req.query);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}




