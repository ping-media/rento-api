// import files
const { sendEmail } = require("../../../utils/email/index");

// import packages
require("dotenv").config();
const { mongoose } = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { Auth } = require("two-step-auth");
const nodemailer = require('nodemailer');
// import errors
const errorMessages = require("../errors/errors");
const { sendMessage } = require("../../../utils/Phone");
const User = require("../../../db/schemas/onboarding/user.schema");
const Traffic = require("../../../db/schemas/onboarding/traffic.schema ");
const { booking } = require("../services/vehicles.service");
const Booking = require("../../../db/schemas/onboarding/booking.schema");
const Vehicle = require("../../../db/schemas/onboarding/vehicle.schema");
const { contactValidation, emailValidation } = require("../../../constant");
const vehicleMaster = require("../../../db/schemas/onboarding/vehicle-master.schema");
const station = require("../../../db/schemas/onboarding/station.schema");
const coupon = require("../../../db/schemas/onboarding/coupons.schema");
const invoiceTbl = require("../../../db/schemas/onboarding/invoice-tbl.schema");
const plan = require("../../../db/schemas/onboarding/plan.schema");
const order = require("../../../db/schemas/onboarding/order.schema");
const location = require("../../../db/schemas/onboarding/location.schema");
const Otp = require("../../../db/schemas/onboarding/logOtp");





async function updateUser({ _id, userType, firstName, contact, lastName, email }) {
  const o = { status: 200, message: "data fetched successfully", data: [] }
  try {
    const result = await User.findOne({ _id: ObjectId(_id) })
    if (result) {
      const obj = {
        userType: userType ? userType : "USER",
        firstName: firstName ? firstName : "",
        lastName: lastName ? lastName : "",
        contact: contact ? contact : "",
        email: email ? email : ""
      }
      await User.updateOne(
        { _id: ObjectId(_id) },
        {
          $set: obj
        },
        { new: true }
      );
      o.message = "user updated successfully"
    } else {
      o.message = "Invalid details",
        o.status = "401"
    }
    return "Updated Successfully";
  } catch (error) {
    throw new Error(error);
  }
}

async function getAllUsers(query) {
  const obj = { status: 200, message: "Data fetched successfully", data: [] };

  try {
    // Destructure query parameters
    const { 
      _id, 
      userType, 
      otp, 
      password, 
      isEmailVerified, 
      isContactVerified, 
      kycApproved,
      userDocuments,
      status,
      altContact,
      firstName,
      idProof,
      addressProof,
      lastName,
      contact,
      email,
      search,
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      order = 'desc' 
    } = query;

    // Build the filter object based on query parameters
    const filter = {};
    if (_id) filter._id = _id;
    if (firstName) filter.firstName = firstName;
    if (lastName) filter.lastName = lastName;
    if (email) filter.email = email;
    if (contact) filter.contact = contact;
    if (userType) filter.userType = userType;


    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },       // Search in `name` (case-insensitive)
        { email: { $regex: search, $options: "i" } },      
        { lastName: { $regex: search, $options: "i" } } ,
        { contact: { $regex: search, $options: "i" } }, 
        { userType: { $regex: search, $options: "i" } } 
        
      ];
    }

    const sort = {};
    sort[sortBy] = order === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const response = await User.find(filter, { otp: 0, password: 0 }) // Exclude sensitive fields
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

     if (response && response.length) {
      obj.data = response;
      obj.currentPage = parseInt(page);
      const Recod=await User.count(filter)
      obj.totalPages = Math.ceil((Recod) / parseInt(limit));
    } else {
      obj.status = 404;
      obj.message = "No data found";
    }
  } catch (error) {
    console.error("Error fetching users:", error.message);
    obj.status = 500;
    obj.message = `Server error: ${error.message}`;
  }

  return obj;
}


async function getAllDataCount() {
  const obj = { status: 200, message: "data fetched successfully", data: [] }
  obj.data = {
    usersCount: await User.count({}),
    bookingsCount: await Booking.count({}),
    vehiclesCount: await vehicleMaster.count({}),
    locationCount: await location.count({}),
    stationsCount: await station.count({}),
    couponsCount: await coupon.count({}),
    invoicesCount: await invoiceTbl.count({}),
    plansCount: await plan.count({}),
    ordersCount: await order.count({}),
  }
  return obj
}

// async function saveUser({
//   _id,
//   userType,
//   status,
//   altContact,
//   firstName,
//   lastName,
//   contact,
//   email,
//   password,
//   deleteRec,
//   kycApproved,
//   isEmailVerified,
//   isContactVerified,
//   drivingLicence,
//   idProof,
//   addressProof,
//   dateofbirth,
//   gender,
//   otp,
// }) {
//   const response = { status: 200, message: "Data processed successfully", data: [] };

//   try {
//     // Validate _id
//     if (_id && _id.length !== 24) {
//       response.status = 400;
//       response.message = "Invalid _id";
//       return response;
//     }

//     // Validate contact
//     if (contact) {
//       const isValid = contactValidation(contact);
//       if (!isValid) {
//         response.status = 400;
//         response.message = "Invalid phone number";
//         return response;
//       }
//       if (!_id) {
//         const existingUser = await User.findOne({ contact });
//         if (existingUser) {
//           response.status = 409; // Conflict
//           response.message = "This contact number already exists";
//           return response;
//         }
//       }
//     }

//     // Validate altContact
//     if (altContact) {
//       const isValid = contactValidation(altContact);
//       if (!isValid) {
//         response.status = 400;
//         response.message = "Invalid alternative contact number";
//         return response;
//       }
//     }

//     // Validate userType
//     const validUserTypes = ["manager", "customer", "admin"];
//     let checkUserType = "customer";
//     if (userType) {
//       if (!validUserTypes.includes(userType)) {
//         response.status = 400;
//         response.message = "Invalid user type";
//         return response;
//       }
//       if ((userType === "admin" || userType === "manager") && !password && !_id) {
//         response.status = 400;
//         response.message = "Password is required for admin or manager";
//         return response;
//       }
//       checkUserType = userType;
//     }

//     // Validate status
//     const validStatuses = ["active", "inactive"];
//     let checkStatus = "active";
//     if (status) {
//       if (!validStatuses.includes(status)) {
//         response.status = 400;
//         response.message = "Invalid user status";
//         return response;
//       }
//       checkStatus = status;
//     }

//     // Validate kycApproved
//     const validKycStatuses = ["yes", "no"];
//     let checkKycApproved = "no";
//     if (kycApproved) {
//       if (!validKycStatuses.includes(kycApproved)) {
//         response.status = 400;
//         response.message = "Invalid KYC approval status";
//         return response;
//       }
//       checkKycApproved = kycApproved;
//     }

//     // Validate isEmailVerified
//     let checkIsEmailVerified = "no";
//     if (isEmailVerified && validKycStatuses.includes(isEmailVerified)) {
//       checkIsEmailVerified = isEmailVerified;
//     }

//     // Validate isContactVerified
//     let checkIsContactVerified = "no";
//     if (isContactVerified && validKycStatuses.includes(isContactVerified)) {
//       checkIsContactVerified = isContactVerified;
//     }

//     // Validate email
//     if (email) {
//       const isValidEmail = emailValidation(email);
//       if (!isValidEmail) {
//         response.status = 400;
//         response.message = "Invalid email address";
//         return response;
//       }
//     }

//     // Prepare user object
//     const userObj = {
//       addressProof,
//       drivingLicence,
//       idProof,
//       isContactVerified: checkIsContactVerified,
//       isEmailVerified: checkIsEmailVerified,
//       kycApproved: checkKycApproved,
//       userType: checkUserType,
//       status: checkStatus,
//       altContact,
//       firstName,
//       lastName,
//       contact,
//       email,
//       password,
//       dateofbirth,
//       gender,
//     };

//     if (_id) {
//       // Update or delete user
//       const existingUser = await User.findById(_id);
//       if (!existingUser) {
//         response.status = 404;
//         response.message = "User not found";
//         return response;
//       }
//       if (deleteRec) {
//         await User.findByIdAndDelete(_id);
//         response.message = "User deleted successfully";
//         response.data = { _id };
//         return response;
//       }
//       // Update user
//       await User.findByIdAndUpdate(_id, userObj, { new: true });
//       response.message = "User updated successfully";
//       response.data = userObj;
//     } else {
//       // Validate required fields for new user
//       if (!firstName || !lastName || !contact || !email) {
//         response.status = 400;
//         response.message = "Missing required fields for new user";
//         return response;
//       }

//       // OTP verification for customers
//       if (userType === "customer") {
//         const otpRecord = await Otp.findOne({ contact });
//         if (!otpRecord) {
//           response.status = 404;
//           response.message = "No OTP found for the given contact number";
//           return response;
//         }
//         if (otp !== otpRecord.otp) {
//           response.status = 401;
//           response.message = "Invalid OTP";
//           return response;
//         }
//         await Otp.deleteOne({ contact });
//       }

//       // Save new user
//       const newUser = new User(userObj);
//       await newUser.save();
//       response.message = "User created successfully";
//       response.data = newUser.toObject();
//     }
//   } catch (error) {
//     console.error("Error in saveUser:", error.message);
//     response.status = 500;
//     response.message = "Internal server error";
//   }

//   return response;
// }


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
    drivingLicence,
    idProof,
    addressProof,
    dateofbirth,
    gender,
    otp,
  } = userData;

  const response = { status: 200, message: "Data processed successfully", data: [] };

  try {
    // Validation helpers
    const validateId = (id) => id && id.length === 24;
    const isValidContact = (number) => contactValidation(number);
    const isValidEmail = (email) => emailValidation(email);
    const isValidEnum = (value, validList) => validList.includes(value);

    // Validate `_id`
    if (_id && !validateId(_id)) {
      return { status: 400, message: "Invalid _id" };
    }

    // Validate `contact`
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

    // Validate `altContact`
    if (altContact && !isValidContact(altContact)) {
      return { status: 400, message: "Invalid alternative contact number" };
    }

    // Validate `userType`
    const validUserTypes = ["manager", "customer", "admin"];
    if (!isValidEnum(userType, validUserTypes)) {
      return { status: 400, message: "Invalid user type" };
    }
    if ((userType === "admin" || userType === "manager") && !password && !_id) {
      return { status: 400, message: "Password is required for admin or manager" };
    }

    // Validate `status`
    const validStatuses = ["active", "inactive"];
    if (!isValidEnum(status, validStatuses)) {
      return { status: 400, message: "Invalid user status" };
    }

    // Validate `kycApproved`, `isEmailVerified`, and `isContactVerified`
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

    // Validate `email`
    if (email && !isValidEmail(email)) {
      return { status: 400, message: "Invalid email address" };
    }

    // Prepare user object
    const userObj = {
      addressProof,
      drivingLicence,
      idProof,
      isContactVerified,
      isEmailVerified,
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

    // Handle user update or creation
    if (_id) {
      const existingUser = await User.findById(_id);
      if (!existingUser) {
        return { status: 404, message: "User not found" };
      }
      if (deleteRec) {
        await User.findByIdAndDelete(_id);
        return { status: 200, message: "User deleted successfully", data: { _id } };
      }
      await User.findByIdAndUpdate(_id, userObj, { new: true });
      return { status: 200, message: "User updated successfully", data: userObj };
    } else {
      if (!firstName || !lastName || !contact || !email) {
        return { status: 400, message: "Missing required fields for new user" };
      }

      // if (userType === "customer") {
      //   const otpRecord = await Otp.findOne({ contact });
      //   if (!otpRecord || otpRecord.otp !== otp) {
      //     return {
      //       status: otpRecord ? 401 : 404,
      //       message: otpRecord ? "Invalid OTP" : "No OTP found for the given contact number",
      //     };
      //   }
      //   await Otp.deleteOne({ contact });
      // }

      const newUser = new User(userObj);
      await newUser.save();
      return { status: 201, message: "User created successfully", data: newUser.toObject() };
    }
  } catch (error) {
    console.error("Error in saveUser:", error.message);
    return { status: 500, message: "Internal server error" };
  }
}









async function updateImage(req) {
  const obj = { status: 200, message: "image updated successfully", data: "" };
  console.log(req.file)
  const url = req.protocol + '://' + req.get('host')
  obj.data = url + '/public/' + req.file.filename
  return obj
}


async function getUserProfile(userId) {
  const obj = { status: 200, message: "data fetched successfully", data: [] };
  try {
    const result = await User.findOne({ _id: ObjectId(userId) },
      { name: 1, contact: 1, profileImage: 1, userName: 1, status: 1, gender: 1, dob: 1 });
    if (result) {
      obj.data = result
    } else {
      obj.status = 401
      obj.message = "data not found"
    }
    return obj;
  } catch (error) {
    throw new Error(error);
  }
}

async function getUserByContact(body) {
  const obj = { status: 200, message: "data fetched successfully", data: [] };
  const { contact, userType } = body
  const o = { contact }
  o.userType = 'USER'
  if (userType) {
    o.userType = userType
  }
  try {
    const result = await User.findOne({ ...o });
    if (result) {
      const findBookings = await Booking.find({ contact });
      obj.data = result._doc
      if (findBookings && findBookings.length) {
        let arr = []
        for (let i = 0; i < findBookings.length; i++) {
          const o = findBookings[i]
          const vehicleData = await Vehicle.findOne({ _id: ObjectId(o.vehicleId) });
          arr.push({ bookingData: o, vehicleData: vehicleData })
        }
        obj.data = { ...obj.data, bookings: arr }
      }
    } else {
      obj.status = 401
      obj.message = "data not found"
    }
    return obj;
  } catch (error) {
    throw new Error(error);
  }
}

// async function sendOtps(o) {
//   const obj = { status: 200, message: "data fetched successfully", data: [] };
//   const { email, contact } = o
//   try {
//     if (contact) {
//       const isValidContact = contactValidation(contact)
//       if (isValidContact) {
//         const findUser = await User.findOne({ contact })
//         if (findUser) {
//           const contactOtp = Math.floor(100000 + Math.random() * 900000)
//           await User.updateOne(
//             { contact },
//             {
//               $set: { otp: contactOtp }
//             },
//             { new: true }
//           );
//           obj.data = contact
//           obj.message = "otp sent successfully on your regoistered contact number"
//         } else {
//           obj.status=401;
//           flag = false
//           obj.message = "user does not exist"
//           return obj
//         }
//       } else {
//         flag = false
//         obj.message = "contact is invalid"
//         obj.data = contact
//         return obj
//       }
//     } else if (email) {
//       const random = Math.floor(100000 + Math.random() * 900000)
//       let receiver = {
//         from: "kashyapshivram512@gmail.com",
//         to: email,
//         subject: "Rent moto user verification with otp service",
//         text: "Hi " + email + ", " + "Your verification otp is " + random
//       };
//       const response = await transporter.sendMail(receiver)
//       if (response) {
//         obj.data = response
//         const user = await User.findOne({ email })
//         if (user) {
//           await User.updateOne(
//             { email },
//             {
//               $set: { otp: random }
//             },
//             { new: true }
//           );
//         }
//         obj.message = "otp sent successfully on your registered email"
//         obj.data = email
//       } else {
//         obj.status = 401
//         obj.data = email
//         obj.message = "data not found"
//       }
//     } else {
//       obj.status = 401
//       obj.message = "invalid email or contact"
//       obj.data = contact
//       return obj
//     }
//     return obj;
//   } catch (error) {
//     throw new Error(error);
//   }
// }





// async function verify({ type, otp, contact }) {
//   const obj = { status: 200, message: "data fetched successfully", data: [] };
//   if (type && otp && contact) {
//     if (type == "email") {
//       const findUser = await User.findOne({ contact })
//       if (findUser) {
//         const { _doc } = findUser
//         if (otp == _doc.otp) {
//           obj.message = "otp verified successfully"
//           await User.updateOne(
//             { contact },
//             {
//               $set: { otp: "" }
//             },
//             { new: true }
//           )
//         } else {
//           obj.status = 401
//           obj.message = "invalid otp"
//         }
//       } else {
//         obj.status = 401
//         obj.message = "invalid contact"
//       }
//     } else {
//       if (type == "contact" && otp == "123456") {
//         const findUser = await User.findOne({ contact })
//         if (findUser) {
//           obj.data = findUser
//           obj.message = "otp verified successfully"
//         } else {
//           obj.status = 401
//           obj.message = "invalid contact"
//         }
//       }
//     }
//   } else {
//     obj.status = 401
//     obj.message = "invalid data"
//   }
//   return obj;
// }






async function login(emailId) {
  try {
    const res = await Auth(emailId, "Infoaxon");
    console.log(res)
  } catch (error) {
    throw new Error(error);
  }

  // You can follow this approach,
  // but the second approach is suggested,
  // as the mails will be treated as important
  // const res = await Auth(emailId, "Company Name");
  // console.log(res);
  // console.log(res.mail);
  // console.log(res.OTP);
  // console.log(res.success);
}



async function searchUser(data) {
  let obj = { status: 200, message: "data fetched successfully", data: [] };
  try {
    const { email, Contact } = data
    let colName = "Contact"
    let val = Contact
    if (email) {
      colName = "email"
      val = email
    }
    const result = await User.find({ [colName]: { $regex: '.*' + val + '.*' } })
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
  getUserByContact
};
