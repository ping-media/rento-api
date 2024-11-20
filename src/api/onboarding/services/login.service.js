const {
  loginUser,
  guestLogin,
  verifyOtp,
  resendOtp,
  adminLogin,
  updateNotificationsSettings,
  getNotificationsSettings
} = require("../models/login.model");

exports.adminLogin = async (req, res) => {
  try {
    const result = await adminLogin(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
};


exports.loginUser = async (req, res) => {
  try {
    const result = await loginUser(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
};

exports.guestLogin = async (req, res) => {
  try {
      let ip = req.ip || req.connection.remoteAddress;
      
      // If the application is behind a proxy or load balancer like Nginx, use the `X-Forwarded-For` header
      ip = req.headers['x-forwarded-for'] || ip;
      
      // 'x-forwarded-for' header may return multiple IP addresses in the format: "client IP, proxy 1 IP, proxy 2 IP"
      // Therefore, the client IP is the first one in the list
      ip = ip.split(',')[0].trim();    
    const result = await guestLogin(ip);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const result = await verifyOtp(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
};


exports.resendOtp = async (req, res) => {
  try {
    const result = await resendOtp(req.body);
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

exports.updateNotificationsSettings = async (req, res) => {
  try {
    req.body['userId'] = req.user.id
    const result = await updateNotificationsSettings(req.body);
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

exports.getNotificationsSettings = async (req, res) => {
  try {
    const result = await getNotificationsSettings(req.user.id);
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