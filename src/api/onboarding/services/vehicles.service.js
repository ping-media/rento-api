const {
  createVehicle,
  createLocation,
  createStation,
  createInvoice,
  createPlan,
  getBookings,
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
} = require("../models/vehicles.model");

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
    const result = await getPlanData(req.body);
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










exports.createLocation = async (req, res) => {
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


