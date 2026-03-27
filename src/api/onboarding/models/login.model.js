// import files
const { sendEmail } = require("../../../utils/email/index");
const Station = require("../../../db/schemas/onboarding/station.schema");

// import packages
require("dotenv").config();
const JWT = require("jsonwebtoken");
const bcrypt = require("bcrypt");
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
  let result = "";
  if (email) {
    result = await User.findOne({ email });
  } else {
    result = await User.findOne({ contact, countryCode });
  }
  if (!result) {
    if (email) {
      await sendEmail(
        email,
        "Viberzone login otp",
        "<b>Please use this otp to authenticate vibezone </b>" + otp,
      );
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
    await sendEmail(
      email,
      "Viberzone login otp",
      "<b>Please use this otp to authenticate vibezone </b>" + otp,
    );
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
  const obj = {
    status: 200,
    message: "Admin logged in successfully",
    data: [],
    token: "",
    Station: [],
  };
  if (email && password) {
    // Find the user by email
    const result = await User.findOne({ email });
    let stationData;
    if (result) {
      const { userType, _id } = result;

      if (userType == "customer") {
        obj.status = 401;
        obj.message = "Invalid user";
        return obj;
      }

      if (userType == "manager") {
        stationData = await Station.findOne({ userId: _id }).select(
          " stationName stationId locationId",
        );
      }
    }
    if (!result) {
      obj.status = 401;
      obj.message = "Invalid credentials";
      return obj;
    }

    if (result.status == "inactive") {
      obj.status = 401;
      obj.message = "User not Active";
      return obj;
    }

    // Compare the provided password with the stored hash
    const isMatch = bcrypt.compareSync(password, result.password);

    if (!isMatch) {
      obj.status = 401;
      obj.message = "Invalid credentials";
      return obj;
    }

    const token = JWT.sign(
      { id: result._id, userType: result.userType },
      BCRYPT_TOKEN,
      {
        expiresIn: "43200m",
      },
    );

    const { password: dbPassword, ...rest } = result.toObject();
    obj.data = rest;
    obj.token = token;
    obj.Station = stationData || null;
  } else {
    obj.status = 401;
    obj.message = "Invalid data or something is missing";
  }
  return obj;
}

// async function adminLogin({ email, password }) {
//   const obj = {
//     status: 200,
//     message: "Admin logged in successfully",
//     data: [],
//     accessToken: "",
//     refreshToken: "",
//     Station: null,
//   };

//   if (!email || !password) {
//     obj.status = 400;
//     obj.message = "Email and password are required";
//     return obj;
//   }

//   // Generic message prevents user enumeration attacks
//   const invalidMsg = "Invalid credentials";

//   const result = await User.findOne({ email: email.toLowerCase().trim() });

//   if (!result) {
//     obj.status = 401;
//     obj.message = invalidMsg;
//     return obj;
//   }

//   if (result.userType === "customer") {
//     obj.status = 403;
//     obj.message = "Access denied";
//     return obj;
//   }

//   if (result.status === "inactive") {
//     obj.status = 403;
//     obj.message = "Account is inactive. Contact support.";
//     return obj;
//   }

//   const isMatch = await bcrypt.compare(password, result.password); // async compare
//   if (!isMatch) {
//     obj.status = 401;
//     obj.message = invalidMsg;
//     return obj;
//   }

//   // Short-lived access token
//   const accessToken = JWT.sign(
//     { id: result._id, userType: result.userType },
//     process.env.ACCESS_TOKEN_SECRET,
//     { expiresIn: "15m" },
//   );

//   // Long-lived refresh token
//   const refreshToken = JWT.sign(
//     { id: result._id },
//     process.env.REFRESH_TOKEN_SECRET,
//     { expiresIn: "7d" },
//   );

//   // Save hashed refresh token in DB
//   result.refreshToken = await bcrypt.hash(refreshToken, 10);
//   await result.save();

//   let stationData = null;
//   if (result.userType === "manager") {
//     stationData = await Station.findOne({ userId: result._id }).select(
//       "stationName stationId locationId",
//     );
//   }

//   const { password: _, refreshToken: __, ...rest } = result.toObject();
//   obj.data = rest;
//   obj.accessToken = accessToken;
//   obj.refreshToken = refreshToken;
//   obj.Station = stationData;

//   return obj;
// }

async function refreshToken({ refreshToken }) {
  const obj = {
    status: 200,
    message: "Token refreshed successfully",
    accessToken: "",
  };

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token" });
  }

  const decoded = JWT.verify(refreshToken, BCRYPT_TOKEN);

  // Verify it's a refresh token
  if (decoded.type !== "refresh") {
    obj.message = "Invalid refresh token";
    return res.status(403).json({ message: "Invalid refresh token" });
  }

  const user = await User.findOne({ _id: decoded.id });

  if (!user || user.status !== "active") {
    obj.message = "User not found or inactive";
    return res.status(403).json({ message: "Invalid refresh token" });
  }

  // Verify against stored hash
  const isValid = await bcrypt.compare(token, user.refreshToken);
  if (!isValid)
    return res.status(403).json({ message: "Invalid refresh token" });

  // Generate new access token
  const newToken = JWT.sign({ id: user._id }, BCRYPT_TOKEN, {
    expiresIn: "15m",
  });

  obj.token = newToken;
  return obj;
}
// async function refreshToken({ refreshToken }) {
//   const obj = {
//     status: 200,
//     message: "Token refreshed successfully",
//     token: "",
//   };

//   if (!refreshToken) {
//     return res.status(401).json({ message: "Refresh token is required" });
//   }

//   const decoded = JWT.verify(refreshToken, BCRYPT_TOKEN);

//   // Verify it's a refresh token
//   if (decoded.type !== "refresh") {
//     obj.message = "Invalid refresh token";
//     return obj;
//   }

//   const user = await User.findOne({ _id: decoded.id });

//   if (!user || user.status !== "active") {
//     obj.message = "User not found or inactive";
//     return obj;
//   }

//   // Generate new access token
//   const newToken = JWT.sign({ id: user._id }, BCRYPT_TOKEN, {
//     expiresIn: "10080m", // 7 days
//   });

//   obj.token = newToken;
//   return obj;
// }

async function logout({ refreshToken }) {
  // const token = req.cookies?.refreshToken;

  if (refreshToken) {
    // Clear refresh token from DB
    const decoded = JWT.verify(refreshToken, process.env.BCRYPT_TOKEN);
    await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
  }

  res.clearCookie("refreshToken");
  return { status: 200, message: "Logged out successfully" };
}

async function updateProfile({
  _id,
  firstName,
  lastName,
  email,
  contact,
  altContact,
  password,
}) {
  const obj = {
    status: 200,
    message: "Profile updated successfully",
    data: [],
    token: "",
    Station: null,
  };

  if (!_id) {
    obj.status = 400;
    obj.message = "User ID is required.";
    return obj;
  }

  const user = await User.findById(_id);
  if (!user) {
    obj.status = 404;
    obj.message = "User not found.";
    return obj;
  }

  if (user.status === "inactive") {
    obj.status = 403;
    obj.message = "User is not active.";
    return obj;
  }

  const updateFields = {};
  if (firstName) updateFields.firstName = firstName;
  if (lastName) updateFields.lastName = lastName;
  if (email) updateFields.email = email;
  if (contact) updateFields.contact = contact;
  if (altContact) updateFields.altContact = altContact;
  if (password) updateFields.password = bcrypt.hashSync(password, 10);

  const updatedUser = await User.findByIdAndUpdate(_id, updateFields, {
    new: true,
  });

  const { password: _, ...userData } = updatedUser.toObject();

  let stationData = null;
  if (user.userType === "manager") {
    stationData = await Station.findOne({ userId: _id }).select(
      "stationName stationId locationId",
    );
  }

  const token = JWT.sign({ id: _id }, BCRYPT_TOKEN, {
    expiresIn: "43200m",
  });

  obj.data = userData;
  obj.token = token;
  obj.Station = stationData;

  return obj;
}

async function logOut({ email, password }) {
  const obj = {
    status: 200,
    message: "data fetched successfully",
    data: [],
    token: "",
  };
  if (email && password) {
    const result = await User.findOne({ email, password }, { password: 0 });
    if (!result) {
      obj.status = 401;
      obj.message = "invalid credentials";
      return obj;
    }
    const token = JWT.sign({ id: result._id }, BCRYPT_TOKEN);
    obj.data = result;
    obj.token = token;
  } else {
    obj.status = 401;
    obj.message = "Invalid data or something is missing";
  }
  return obj;
}

async function verifyOtp({ otp, contact, email }) {
  let userCred = { contact };
  if (email) {
    userCred = { email };
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
    status: !result.name ? false : true,
  };
}

async function resendOtp({ Contact, email }) {
  let userCred = { Contact };
  if (email) {
    userCred = { email };
  }
  const result = await User.findOne({ userCred });
  if (!result) {
    throw new Error(errorMessages.USER_NOT_FOUND);
  }

  // send otp to user
  const otp = Math.floor(1000 + Math.random() * 9000);
  // need to add country code
  if (email) {
    await sendEmail(
      email,
      "Viberzone login otp",
      "<b>Please use this otp to authenticate vibezone </b>" + otp,
    );
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
  updateProfile,
  adminLogin,
  guestLogin,
  logout,
  logOut,
  verifyOtp,
  resendOtp,
  refreshToken,
};
