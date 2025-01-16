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
  getLocation,
  createBookingDuration,
  getVehicleTblData,
  getStationData,
  getLocationData,
  getPlanData,
  getAllInvoice,
  
  

  
  
} = require("../models/vehicles.model");

const { createCoupon, getCoupons, updateCouponCount, applyCoupon } = require("../models/coupon.model");
const {getBookings, getBooking}= require("../models/booking.model")
const {getVehicleBookrecode,VehicleBookrecode}= require("../models/Vehicle.Bookrecode.module");
const {fileUpload} = require("../models/locationUpload.model")
const {sendOtpByEmailForBooking,sendInvoiceByEmail}=require("../../../utils/emailSend")
const {whatsappMessage}=require("../../../utils/whatsappMessage")

exports.sendBookingDetailesTosocial = async (req, res) => {
  try {
    const result = await whatsappMessage(req.body,req.query,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

// exports.sendBookingDetailesTosocial = async (req, res) => {
//   try {
//     const result = await whatsappMessage(req.body,req.query,req.headers);
//     return res.status(200).json(result);
//   } catch (err) {
//     return res.json({
//       message: err.message,
//       name: err.name,
//       stack: err.stack,
//       status: 400,
//     });
//   }
// }


// exports.sendInvoiceByEmail = async (req, res) => {
//   try {
//     const result = await sendInvoiceByEmail(req.body,req.query,req.headers);
//     return res.status(200).json(result);
//   } catch (err) {
//     // return res.json({
//     //   message: err.message,
//     //   name: err.name,
//     //   stack: err.stack,
//     //   status: 400,
//     // });
//   }
// }


exports.getStationData = async (req, res) => {
  try {
    const result = await getStationData(req.query,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.getVehicleBookrecode = async (req, res) => {
  try {
    const result = await getVehicleBookrecode(req.query,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.getCoupons = async (req, res) => {
  try {
    const result = await getCoupons(req.query,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}


exports.getVehicleTblData = async (req, res) => {
  try {
    const result = await getVehicleTblData(req.query,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.getPlanData = async (req, res) => {
  try {
    const result = await getPlanData(req.query,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}
exports.getLocationData = async (req, res) => {
  try {
    const result = await getLocationData(req.query,req.headers);

    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}


exports.createVehicle = async (req, res) => {
  try {
    const result = await createVehicle(req.body,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.createCoupon = async (req, res) => {
  try {
    const result = await createCoupon(req.body,req.query);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.applyCoupon = async (req, res) => {
  try {
    const result = await applyCoupon(req.body,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.updateCouponCount = async (req, res) => {
  try {
    const result = await updateCouponCount(req.body,req.headers,req.query);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.VehicleBookrecode = async (req, res) => {
  try {
    const result = await VehicleBookrecode(req.body,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.createBookingDuration = async (req, res) => {
  try {
    const result = await createBookingDuration(req.body,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.searchVehicle = async (req, res) => {
  try {
    const result = await searchVehicle(req.body,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.getLocations = async (req, res) => {
  try {
    const result = await getLocations(req.body,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}
exports.getLocation = async (req, res) => {
  try {
    const result = await getLocation(req.body,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.getAllBookingDuration = async (req, res) => {
  try {
    const result = await getAllBookingDuration(req.body,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.getVehicleMasterData = async (req, res) => {
  try {
    const result = await getVehicleMasterData(req.query,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}



exports.getBookings = async (req, res) => {
  try {
    const result = await getBookings(req.query,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}
exports.getBooking = async (req, res) => {
  try {
    const result = await getBooking(req.query,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}


exports.booking = async (req, res) => {
  try {
    const result = await booking(req.body, req.headers);
    
    return res.status(200).json(result);
  } catch (err) {
    console.log(err.message)

    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.createOrder = async (req, res) => {
  try {
    const result = await createOrder(req.body,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.createVehicleMaster = async (req, res) => {
  try {
    const result = await createVehicleMaster(req.body,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}


exports.getOrders = async (req, res) => {
  try {
    const result = await getOrders(req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
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
      return res.json({
        message: "Json data is not allowed",
        status: 400,
      });
    }
  } catch (err) {
    return res.json({
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
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.createPlan = async (req, res) => {
  try {
    const result = await createPlan(req.body,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.discountCoupons = async (req, res) => {
  try {
    const result = await discountCoupons(req.body,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}



exports.createInvoice = async (req, res) => {
  try {
    const result = await createInvoice(req.body,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}


exports.createStation = async (req, res) => {
  try {
    const result = await createStation(req.body,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
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
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.getAllVehicles = async (req, res) => {
  try {
    const result = await getAllVehicles(req.body,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.getAllInvoice = async (req, res) => {
  try {
    const result = await getAllInvoice(req.query,req.headers);
    return res.status(200).json(result);
  } catch (err) {
    return res.json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}




