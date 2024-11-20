const { getTokens,verify, getAllUsers, getAllDataCount, sendOtp, getUserPeersData, earlyAccess, pushNotification, updateUser, saveUser, getUserProfile, createConfig, getConfig, getPreferences, updatePreferences, createPlan, searchUser, updateImage, getUserByContact } = require("../models/account.model");

exports.updateUser = async (req, res) => {
  try {
    //req.body['userId'] = req.user.id
    const result = await updateUser(req.body);
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

exports.getAllUsers = async (req, res) => {
  try {
    const result = await getAllUsers(req.query);
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


exports.getAllDataCount = async (req, res) => {
  try {
    const result = await getAllDataCount(req.body);
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



exports.saveUser = async (req, res) => {
  try {
    const result = await saveUser(req.body);
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

exports.updateImage = async (req, res) => {
  try {
    const result = await updateImage(req);
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

exports.getUserByContact = async (req, res) => {
  try {
    //req.body['userId'] = req.user.id
    const result = await getUserByContact(req.body);
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

exports.sendOtp = async (req, res) => {
  try {
    //req.body['userId'] = req.user.id
    const result = await sendOtp(req.body);
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

exports.verify = async (req, res) => {
  try {
    //req.body['userId'] = req.user.id
    const result = await verify(req.body);
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







exports.getUserProfile = async (req, res) => {
  try {
    const result = await getUserProfile(req.user.id);
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

exports.createConfig = async (req, res) => {
  try {
    const result = await createConfig(req.body);
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

exports.getConfig = async (req, res) => {
  try {
    const result = await getConfig(req.query.type);
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


exports.getPreferences = async (req, res) => {
  try {
    const result = await getPreferences(req.user.id);    
    return res.status(result.status).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.updatePreferences = async (req, res) => {
  try {
    req.body['userId'] = req.user.id
    const result = await updatePreferences(req.body);
    return res.status(result.status).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
}

exports.searchUser = async (req, res) => {
  try {
    //req.body['userId'] = req.user.id
    const result = await searchUser(req.body);
    return res.status(result.status).json(result);
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

exports.pushNotification = async (req, res) => {
  try {
    const result = await pushNotification(req.body);
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

exports.getTokens = async (req, res) => {
  try {
    const result = await getTokens();
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

exports.earlyAccess = async (req, res) => {
  try {
    const result = await earlyAccess(req.body);
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

exports.getUserPeersData = async (req, res) => {
  try {
    const result = await getUserPeersData(req.query);
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


