const bcrypt = require("bcrypt");
require("dotenv").config();
const { mongoose } = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { Auth } = require("two-step-auth");
const User = require("../../../db/schemas/onboarding/user.schema");
const Booking = require("../../../db/schemas/onboarding/booking.schema");
const Vehicle = require("../../../db/schemas/onboarding/vehicle.schema");
const Document = require("../../../db/schemas/onboarding/DocumentUpload.Schema");
const { contactValidation, emailValidation } = require("../../../constant");
const { whatsappMessage } = require("../../../utils/whatsappMessage");
const { sendOtpByEmail } = require("../../../utils/emailSend");

async function updateUser({
  _id,
  userType,
  firstName,
  contact,
  lastName,
  email,
}) {
  const o = { status: 200, message: "data fetched successfully", data: [] };
  try {
    const result = await User.findOne({ _id: ObjectId(_id) });
    if (result) {
      const obj = {
        userType: userType ? userType : "USER",
        firstName: firstName ? firstName : "",
        lastName: lastName ? lastName : "",
        contact: contact ? contact : "",
        email: email ? email : "",
      };
      await User.updateOne(
        { _id: ObjectId(_id) },
        {
          $set: obj,
        },
        { new: true }
      );
      o.message = "user updated successfully";
    } else {
      (o.message = "Invalid details"), (o.status = "401");
    }
    return "Updated Successfully";
  } catch (error) {
    throw new Error(error);
  }
}

async function addOrUpdateMobileToken({ _id, token }) {
  const o = {
    status: 200,
    success: true,
    message: "data fetched successfully",
    data: [],
  };
  try {
    if (!token || !token.trim()) {
      o.status = 400;
      o.message = "Token is required";
      return o;
    }

    const user = await User.findOne({ _id: ObjectId(_id) });

    if (!user) {
      o.status = 401;
      o.success = false;
      o.message = "Invalid user ID";
      return o;
    }

    if (user.mobileToken === token) {
      o.message = "Token already up-to-date";
      return o;
    }

    await User.updateOne(
      { _id: ObjectId(_id) },
      {
        $set: {
          mobileToken: token,
        },
      }
    );

    o.message = "Token updated successfully";
    return o;
  } catch (error) {
    throw new Error(error);
  }
}

const getAllUsers = async (query) => {
  const obj = {
    status: 200,
    message: "Data fetched successfully",
    data: [],
    pagination: {},
  };

  try {
    // Destructure query parameters with defaults
    const {
      _id,
      userType,
      firstName,
      lastName,
      email,
      contact,
      search,
      status,
      kycApproved,
      isEmailVerified,
      isContactVerified,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = query;

    // Validate and normalize inputs
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    if (isNaN(pageNumber) || pageNumber <= 0) {
      throw new Error("Invalid 'page' parameter");
    }
    if (isNaN(pageSize) || pageSize <= 0) {
      throw new Error("Invalid 'limit' parameter");
    }

    const filter = {};
    if (_id) {
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        throw new Error("Invalid '_id' format");
      }
      filter._id = mongoose.Types.ObjectId(_id);
    }
    if (firstName) filter.firstName = firstName;
    if (lastName) filter.lastName = lastName;
    if (email) filter.email = email;
    if (contact) filter.contact = contact;
    if (userType) filter.userType = userType;
    if (kycApproved) filter.kycApproved = kycApproved;
    if (isEmailVerified) filter.isEmailVerified = isEmailVerified;
    if (isContactVerified) filter.isContactVerified = isContactVerified;
    if (status) filter.status = status;

    // Handle search functionality
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { contact: { $regex: search, $options: "i" } },
        { userType: { $regex: search, $options: "i" } },
        { isDocumentVerified: { $regex: search, $options: "i" } },
        { isContactVerified: { $regex: search, $options: "i" } },
        { isEmailVerified: { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
        { kycApproved: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sortFields = ["createdAt", "firstName", "lastName", "email"];
    const sort = {};
    sort[sortBy] = sortFields.includes(sortBy)
      ? order === "asc"
        ? 1
        : -1
      : -1;

    // Pagination logic
    const skip = (pageNumber - 1) * pageSize;
    const totalRecords = await User.count(filter);

    // Fetch users with pagination and sorting
    const users = await User.find(filter, { otp: 0, password: 0 })
      .sort(sort)
      .skip(skip)
      .limit(pageSize);

    if (_id) {
      const user = await User.findById(_id).select("-otp -password");
      if (!user) {
        obj.status = 404;
        obj.message = "User not found";
        return obj;
      }

      const documents = await Document.find({ userId: user._id });
      const userWithDocs = {
        ...user.toObject(),
        documents: documents[0]?.files || [],
      };

      obj.data = [userWithDocs];
      obj.pagination = {
        totalPages: 1,
        currentPage: 1,
        limit: 1,
      };
      return obj;
    }

    if (users.length === 0) {
      obj.status = 404;
      obj.message = "No data found";
      return obj;
    }

    // Prepare response
    obj.data = users;
    obj.pagination = {
      totalPages: Math.ceil(totalRecords / pageSize),
      currentPage: pageNumber,
      limit,
    };
  } catch (error) {
    console.error("Error fetching users:", error.message);
    obj.status = 500;
    obj.message = `Server error: ${error.message}`;
  }

  return obj;
};

// async function getAllDataCount(query) {
//   try {
//     const obj = { status: 200, message: "Data fetched successfully", data: {} };
//     const { stationId, month, year } = query;

//     const now = new Date();

//     const targetMonth =
//       month && !isNaN(parseInt(month)) ? parseInt(month) - 1 : now.getMonth();
//     const targetYear =
//       year && !isNaN(parseInt(year)) ? parseInt(year) : now.getFullYear();

//     const startDate = new Date(targetYear, targetMonth, 1);

//     const isCurrentMonth =
//       targetMonth === now.getMonth() && targetYear === now.getFullYear();

//     const endDate = isCurrentMonth
//       ? now
//       : new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

//     const stationFilter = stationId ? { stationId } : {};
//     const dateFilter =
//       !isNaN(startDate) && !isNaN(endDate)
//         ? { createdAt: { $gte: startDate, $lte: endDate } }
//         : {};

//     // Fetch bookings and calculate totalAmount
//     const bookings = await Booking.find({ ...stationFilter, ...dateFilter });

//     const cancelBookings =
//       bookings?.length > 0
//         ? bookings.filter((booking) => booking.bookingStatus === "canceled")
//         : [];

//     const amount = bookings.reduce(
//       (acc, item) => {
//         if (
//           item.bookingStatus === "canceled" ||
//           item.bookingStatus === "pending" ||
//           item.bookingStatus === "refunded"
//         )
//           return acc;

//         const basePriceRaw =
//           item.bookingPrice.isDiscountZero === true ||
//           (item.bookingPrice.discountTotalPrice &&
//             item.bookingPrice.discountTotalPrice > 0)
//             ? item.bookingPrice.discountTotalPrice
//             : item.bookingPrice.totalPrice;

//         const basePrice = Number(basePriceRaw) || 0;

//         const extendTotal = Array.isArray(item.bookingPrice.extendAmount)
//           ? item.bookingPrice.extendAmount.reduce((sum, e) => {
//               return e.status === "paid"
//                 ? Number(sum) + (Number(e.amount) || 0)
//                 : Number(sum);
//             }, 0)
//           : 0;

//         const extendCount = Array.isArray(item.bookingPrice.extendAmount)
//           ? item.bookingPrice.extendAmount.reduce((count, e) => {
//               return e.status === "paid" ? count + 1 : count;
//             }, 0)
//           : 0;

//         const diffTotal = Array.isArray(item.bookingPrice.diffAmount)
//           ? item.bookingPrice.diffAmount.reduce((sum, d) => {
//               return d.status === "paid"
//                 ? Number(sum) + (Number(d.amount) || 0)
//                 : Number(sum);
//             }, 0)
//           : 0;

//         return {
//           total: acc.total + basePrice + extendTotal + diffTotal,
//           extendCount: acc.extendCount + extendCount,
//         };
//       },
//       { total: 0, extendCount: 0 }
//     );

//     let extendBookingCount = amount?.extendCount;
//     let Amount = amount?.total;

//     let bookingsCount = 0,
//       cancelBookingsCount = cancelBookings?.length;

//     if (stationId) {
//       // Fetch only station-specific counts
//       [bookingsCount] = await Promise.all([
//         Booking.countDocuments({ ...stationFilter, ...dateFilter }),
//       ]);
//     } else {
//       [bookingsCount] = await Promise.all([
//         Booking.countDocuments({ ...dateFilter }),
//       ]);
//     }

//     // Populate the data object
//     obj.data = {
//       bookingsCount,
//       cancelBookingsCount,
//       extendBookingCount,
//       Amount,
//     };

//     return obj;
//   } catch (error) {
//     return { status: 500, message: "An error occurred", error: error.message };
//   }
// }
async function getAllDataCount(query) {
  try {
    const obj = { status: 200, message: "Data fetched successfully", data: {} };
    const { stationId, month, year } = query;

    const matchFilter = {};

    // Apply stationId if present
    if (stationId) matchFilter.stationId = stationId;

    // Parse month name to number
    if (month && year) {
      const monthMap = {
        january: 1,
        february: 2,
        march: 3,
        april: 4,
        may: 5,
        june: 6,
        july: 7,
        august: 8,
        september: 9,
        october: 10,
        november: 11,
        december: 12,
      };

      const monthNum = monthMap[month.toLowerCase()];
      const yearNum = parseInt(year);

      if (monthNum && !isNaN(yearNum)) {
        matchFilter.$expr = {
          $and: [
            { $eq: [{ $month: "$createdAt" }, monthNum] },
            { $eq: [{ $year: "$createdAt" }, yearNum] },
          ],
        };
      }
    }

    const bookings = await Booking.find({
      ...matchFilter,
    });

    const cancelBookings = bookings.filter(
      (booking) => booking.bookingStatus === "canceled"
    );

    const nonCancelledBookings = bookings.filter(
      (booking) => booking.bookingStatus !== "canceled"
    );

    const payOnPickupCount = nonCancelledBookings.filter(
      (b) =>
        b.bookingPrice?.payOnPickupMethod !== undefined &&
        b.bookingPrice?.payOnPickupMethod !== null
    ).length;

    const amountLeftObjectCount = nonCancelledBookings.filter(
      (b) =>
        b.bookingPrice?.AmountLeftAfterUserPaid &&
        typeof b.bookingPrice.AmountLeftAfterUserPaid === "object" &&
        !Array.isArray(b.bookingPrice.AmountLeftAfterUserPaid) &&
        b.bookingPrice.AmountLeftAfterUserPaid?.status === "paid"
    ).length;

    const amount = bookings.reduce(
      (acc, item) => {
        if (
          item.bookingStatus === "canceled" ||
          item.bookingStatus === "pending" ||
          item.bookingStatus === "refunded"
        )
          return acc;

        const basePriceRaw =
          item.bookingPrice.isDiscountZero === true ||
          (item.bookingPrice.discountTotalPrice &&
            item.bookingPrice.discountTotalPrice > 0)
            ? item.bookingPrice.discountTotalPrice
            : item.bookingPrice.totalPrice;

        const basePrice = Number(basePriceRaw) || 0;

        const extendTotal = Array.isArray(item.bookingPrice.extendAmount)
          ? item.bookingPrice.extendAmount.reduce((sum, e) => {
              return e.status === "paid" ? sum + (Number(e.amount) || 0) : sum;
            }, 0)
          : 0;

        const extendCount = Array.isArray(item.bookingPrice.extendAmount)
          ? item.bookingPrice.extendAmount.reduce((count, e) => {
              return e.status === "paid" ? count + 1 : count;
            }, 0)
          : 0;

        const diffTotal = Array.isArray(item.bookingPrice.diffAmount)
          ? item.bookingPrice.diffAmount.reduce((sum, d) => {
              return d.status === "paid" ? sum + (Number(d.amount) || 0) : sum;
            }, 0)
          : 0;

        return {
          total: acc.total + basePrice + extendTotal + diffTotal,
          extendCount: acc.extendCount + extendCount,
        };
      },
      { total: 0, extendCount: 0 }
    );

    const extendBookingCount = amount.extendCount;
    const Amount = amount.total;
    const cancelBookingsCount = cancelBookings.length;

    const bookingsCount = await Booking.countDocuments({
      ...matchFilter,
    });

    obj.data = {
      bookingsCount,
      cancelBookingsCount,
      extendBookingCount,
      CashPaymentReceivedCount: payOnPickupCount + amountLeftObjectCount,
      Amount,
    };

    return obj;
  } catch (error) {
    return {
      status: 500,
      message: "An error occurred",
      error: error.message,
    };
  }
}

async function saveUser(userData) {
  const {
    _id,
    userType = "customer",
    status = "active",
    altContact,
    firstName,
    lastName,
    contact,
    email,
    password,
    deleteRec,
    kycApproved = "no",
    isEmailVerified = "no",
    isContactVerified = "no",
    isDocumentVerified = "no",
    drivingLicence,
    idProof,
    addressProof,
    dateofbirth = "Na",
    gender,
    otp,
  } = userData;

  const response = {
    status: 200,
    message: "Data processed successfully",
    data: [],
  };
  //console.log(userData)

  function isAtLeast18(dob) {
    const dobDate = new Date(dob); // Parse the DOB string into a Date object
    const today = new Date();

    // Calculate the difference in years
    const age = today.getFullYear() - dobDate.getFullYear();

    // Adjust if the birth date has not yet occurred this year
    const hasHadBirthdayThisYear =
      today.getMonth() > dobDate.getMonth() ||
      (today.getMonth() === dobDate.getMonth() &&
        today.getDate() >= dobDate.getDate());

    return hasHadBirthdayThisYear ? age >= 18 : age - 1 >= 18;
  }

  try {
    const validateId = (id) => id && id.length === 24;
    const isValidContact = (number) => contactValidation(number);
    const isValidEmail = (email) => emailValidation(email);
    const isValidEnum = (value, validList) => validList.includes(value);

    if (_id && !validateId(_id)) {
      return { status: 400, message: "Invalid _id" };
    }
    if (!_id) {
      if (userType == "manager" || userType == "admin") {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return { status: 409, message: "This email  already exists" };
        }
      }
    }

    if (contact) {
      if (!isValidContact(contact)) {
        return { status: 400, message: "Invalid phone number" };
      }
      if (!_id) {
        const existingUser = await User.findOne({ contact });
        if (existingUser) {
          return { status: 409, message: "This contact number already exists" };
        }
      }
    }

    if (altContact && !isValidContact(altContact)) {
      return { status: 400, message: "Invalid alternative contact number" };
    }

    const validUserTypes = ["manager", "customer", "admin"];
    if (!isValidEnum(userType, validUserTypes)) {
      return { status: 400, message: "Invalid user type" };
    }
    if ((userType === "admin" || userType === "manager") && !password && !_id) {
      return {
        status: 400,
        message: "Password is required for admin or manager",
      };
    }

    const validStatuses = ["active", "inactive"];
    if (!isValidEnum(status, validStatuses)) {
      return { status: 400, message: "Invalid user status" };
    }

    const validKycStatuses = ["yes", "no"];
    if (!isValidEnum(kycApproved, validKycStatuses)) {
      return { status: 400, message: "Invalid KYC approval status" };
    }
    if (!isValidEnum(isEmailVerified, validKycStatuses)) {
      return { status: 400, message: "Invalid email verification status" };
    }
    if (!isValidEnum(isContactVerified, validKycStatuses)) {
      return { status: 400, message: "Invalid contact verification status" };
    }

    if (email && !isValidEmail(email)) {
      return { status: 400, message: "Invalid email address" };
    }

    const userObj = {
      addressProof,
      drivingLicence,
      idProof,
      isContactVerified,
      isEmailVerified,
      isDocumentVerified,
      kycApproved,
      userType,
      status,
      altContact,
      firstName,
      lastName,
      contact,
      email,
      password,
      dateofbirth,
      gender,
    };
    if (password) {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
      if (!passwordRegex.test(password)) {
        return {
          status: 400,
          message:
            "Password must be 8–20 chars, with uppercase, lowercase, number & special.",
        };
      }
      userObj.password = bcrypt.hashSync(password, 8);
    }
    // Handle user update or creation
    if (_id) {
      const existingUser = await User.findById(_id);
      if (!existingUser) {
        return { status: 404, message: "User not found" };
      }
      if (deleteRec) {
        await User.findByIdAndDelete(_id);
        return {
          status: 200,
          message: "User deleted successfully.",
          data: { _id },
        };
      }
      //console.log(userObj.altContact)
      //console.log(userType)
      if (userType !== "admin") {
        if (!userObj.altContact || userObj.altContact === "") {
          return { status: 400, message: "AltContact is required." };
        }

        if (userObj.dateofbirth && !isAtLeast18(userObj.dateofbirth)) {
          return { status: 400, message: "User should be 18 or older." };
        }
        if (userObj.altContact == existingUser.contact) {
          return {
            status: 400,
            message:
              "Alternate contact should not be the same as primary contact.",
          };
        }
      }
      if (userType !== "admin" && userType !== "manager") {
        if (userObj.dateofbirth && !isAtLeast18(userObj.dateofbirth)) {
          return { status: 400, message: "User should be 18 or older." };
        }
      }

      Object.keys(userObj).forEach((key) => {
        if (
          userObj[key] === undefined ||
          userObj[key] === null ||
          userObj[key] === ""
        ) {
          delete userObj[key];
        }
      });

      const data = await User.findByIdAndUpdate(
        _id,
        { $set: userObj },
        { new: true }
      );
      return { status: 200, message: "User updated successfully", data: data };
    } else {
      if (!firstName || !lastName || !contact || !email) {
        return { status: 400, message: "Missing required fields for new user" };
      }

      //const name = firstName + lastName;
      const newUser = new User(userObj);
      await newUser.save();
      whatsappMessage(contact, "welcome_customer", [firstName]);
      sendOtpByEmail(email, firstName, lastName);
      return {
        status: 200,
        message: "User created successfully",
        data: newUser.toObject(),
      };
    }
  } catch (error) {
    console.error("Error in saveUser:", error.message);
    return { status: 500, message: "Internal server error" };
  }
}

async function updateImage(req) {
  const obj = { status: 200, message: "image updated successfully", data: "" };
  console.log(req.file);
  const url = req.protocol + "://" + req.get("host");
  obj.data = url + "/public/" + req.file.filename;
  return obj;
}

async function getUserProfile(userId) {
  const obj = { status: 200, message: "data fetched successfully", data: [] };
  try {
    const result = await User.findOne(
      { _id: ObjectId(userId) },
      {
        name: 1,
        contact: 1,
        profileImage: 1,
        userName: 1,
        status: 1,
        gender: 1,
        dob: 1,
      }
    );
    if (result) {
      obj.data = result;
    } else {
      obj.status = 401;
      obj.message = "data not found";
    }
    return obj;
  } catch (error) {
    throw new Error(error);
  }
}

async function getUserByContact(body) {
  const obj = { status: 200, message: "data fetched successfully", data: [] };
  const { contact, userType } = body;
  const o = { contact };
  o.userType = "USER";
  if (userType) {
    o.userType = userType;
  }
  try {
    const result = await User.findOne({ ...o });
    if (result) {
      const findBookings = await Booking.find({ contact });
      obj.data = result._doc;
      if (findBookings && findBookings.length) {
        let arr = [];
        for (let i = 0; i < findBookings.length; i++) {
          const o = findBookings[i];
          const vehicleData = await Vehicle.findOne({
            _id: ObjectId(o.vehicleId),
          });
          arr.push({ bookingData: o, vehicleData: vehicleData });
        }
        obj.data = { ...obj.data, bookings: arr };
      }
    } else {
      obj.status = 401;
      obj.message = "data not found";
    }
    return obj;
  } catch (error) {
    throw new Error(error);
  }
}

async function login(emailId) {
  try {
    const res = await Auth(emailId, "Infoaxon");
    console.log(res);
  } catch (error) {
    throw new Error(error);
  }
}

async function searchUser(data) {
  let obj = { status: 200, message: "data fetched successfully", data: [] };
  try {
    const { email, Contact } = data;
    let colName = "Contact";
    let val = Contact;
    if (email) {
      colName = "email";
      val = email;
    }
    const result = await User.find({
      [colName]: { $regex: ".*" + val + ".*" },
    });
    if (result) {
      obj.data = result;
    } else {
      obj.status = 401;
      obj.message = "data not found";
    }
    return obj;
  } catch (error) {
    throw new Error(error);
  }
}

module.exports = {
  //sendOtps,
  getAllDataCount,
  //verify,
  getAllUsers,
  updateUser,
  saveUser,
  getUserProfile,
  searchUser,
  updateImage,
  getUserByContact,
  addOrUpdateMobileToken,
};
