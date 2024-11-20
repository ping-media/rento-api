// import files
const { sendEmail } = require("../../../utils/email/index");

// import packages
require("dotenv").config();
const JWT = require("jsonwebtoken");
const moment = require("moment");
const { mongoose } = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const { OTP_EXPIRY_TIME, BCRYPT_TOKEN } = process.env;
const num = parseInt(OTP_EXPIRY_TIME);

// import errors
const errorMessages = require("../errors/errors");
const { sendMessage } = require("../../../utils/Phone");
const User = require("../../../db/schemas/onboarding/user.schema");


async function loginUser({ contact, countryCode, email }) {
  // check user is exit or not in database
  const otp = Math.floor(1000 + Math.random() * 9000);
  let result = ""
  if (email) {
    result = await User.findOne({ email });
  } else {
    result = await User.findOne({ contact, countryCode });
  }
  if (!result) {
    if (email) {
      await sendEmail(email, "Viberzone login otp", "<b>Please use this otp to authenticate vibezone </b>" + otp);
    } else {
      await sendMessage(process.env.OTP_TEMPLATE, otp, contact, countryCode);
    }
    // create user
    const userData = {
      email: email || "",
      contact: contact || "",
      userType: "USER",
      countryCode: countryCode || "",
      otp,
      otpExpire: moment().add(num, "minutes"),
      createdAt: moment().toISOString(),
      updatedAt: moment().toISOString(),
    };
    const newUser = new User(userData);
    const savedUser = await newUser.save();
    return savedUser;
  }
  if (email) {
    await sendEmail(email, "Viberzone login otp", "<b>Please use this otp to authenticate vibezone </b>" + otp);
  } else {
    await sendMessage(process.env.OTP_TEMPLATE, otp, contact, countryCode);
  }
  // update user table

  const userData = {
    otp,
    otpExpire: moment().add(num, "minutes"),
    updatedAt: moment().toISOString(),
  };
  const updatedUser = await User.findByIdAndUpdate(result._id, userData, {
    new: true,
  });
  return updatedUser;

}

async function guestLogin({ ip }) {

  // create user
  const userData = {
    UserType: "GUEST",
    ip,
    otpExpire: moment().add(num, "minutes"),
    createdAt: moment().toISOString(),
    updatedAt: moment().toISOString(),
  };
  const newUser = new User(userData);
  const savedUser = await newUser.save();
  return savedUser;
}


async function adminLogin({ email, password }) {
  const obj = { status: 200, message: "Admin logged in successfully", data: [], token: "" }
  if(email && password){
    const result = await User.findOne({ email, password }, { password: 0 });
    if (!result) {
      obj.status = 401
      obj.message = "invalid credentials"
      return obj
    }
    const token = JWT.sign({ id: result._id }, BCRYPT_TOKEN);
    obj.data = result
    obj.token = token
  } else {
    obj.status = 401
    obj.message = "Invalid data or something is missing"
  }
  return obj
}

async function logOut({ email, password }) {
  const obj = { status: 200, message: "data fetched successfully", data: [], token: "" }
  if(email && password){
    const result = await User.findOne({ email, password }, { password: 0 });
    if (!result) {
      obj.status = 401
      obj.message = "invalid credentials"
      return obj
    }
    const token = JWT.sign({ id: result._id }, BCRYPT_TOKEN);
    obj.data = result
    obj.token = token
  } else {
    obj.status = 401
    obj.message = "Invalid data or something is missing"
  }
  return obj
}

async function verifyOtp({ otp, contact, email }) {
  let userCred = { contact }
  if (email) {
    userCred = { email }
  }
  const result = await User.findOne({ ...userCred, otp });
  if (!result) {
    throw new Error(errorMessages.USER_NOT_FOUND);
  }

  // check otp expire or not
  if (moment().isAfter(result.otpExpire)) {
    throw new Error(errorMessages.OTP_EXPIRED);
  }

  // check otp match or not
  if (result.otp !== otp) {
    throw new Error(errorMessages.OTP_NOT_MATCH);
  }

  // provide token
  const token = JWT.sign({ id: result._id }, BCRYPT_TOKEN);


  return {
    user: result,
    token,
    status: !result.name ? false : true
  }

}




async function resendOtp({ Contact, email }) {
  let userCred = { Contact };
  if (email) {
    userCred = { email }
  }
  const result = await User.findOne({ userCred });
  if (!result) {
    throw new Error(errorMessages.USER_NOT_FOUND);
  }

  // send otp to user
  const otp = Math.floor(1000 + Math.random() * 9000);
  // need to add country code
  if (email) {
    await sendEmail(email, "Viberzone login otp", "<b>Please use this otp to authenticate vibezone </b>" + otp);
  } else {
    await sendMessage(process.env.OTP_TEMPLATE, otp, Contact);
  }
  // update user table
  const userData = {
    otp,
    otpExpire: moment().add(num, "minutes"),
    updatedAt: moment().toISOString(),
  };

  const updatedUser = await User.findByIdAndUpdate(result._id, userData, {
    new: true,
  });
  return updatedUser;
}


module.exports = {
  loginUser,
  adminLogin,
  guestLogin,
  logOut,
  verifyOtp,
  resendOtp
};
