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


const transporter = nodemailer.createTransport({
  port: 465,
  service: "gmail",
  secure: true,
  auth: {
    user: 'kashyapshivram512@gmail.com',
    pass: 'kmbc nqqe cavl eyma'
  },
});

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

async function getAllUsers(o) {
  const obj = { status: 200, message: "data fetched successfully", data: [] }
  const response = await User.find({ ...o }, { otp: 0, password: 0})
  if (response && response.length) {
    obj.data = response
  } else {
    obj.status = 401
    obj.message = "data not found"
  }
  return obj
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

async function saveUser({ _id, userType, status, altContact, firstName, lastName, contact, email, password, deleteRec, kycApproved, isEmailVerified, isContactVerified, drivingLicence, idProof, addressProof }) {
  const response = { status: "200", message: "data fetched successfully", data: [] }
  try {
    if (_id && _id.length !== 24) {
      response.status = 401
      response.message = "Invalid _id"
      return response
    }
    if (contact) {
      const isValid = contactValidation(contact)
      if (!isValid) {
        response.status = 401
        response.message = "Invalid phone number"
        return response
      } else {
        if (!_id) {
          const find = await User.findOne({ contact })
          if (find) {
            response.status = 401
            response.message = "this contact number already exists"
            return response
          }
        }
      }
    }
    if (altContact) {
      const isValid = contactValidation(altContact)
      if (!isValid) {
        response.status = 401
        response.message = "Invalid altContact number"
        return response
      }
    }
    let checkUserType = "customer"
    if (userType) {
      let isUserType = ["manager", "customer", "admin"].includes(userType)
      if (!isUserType) {
        response.status = 401
        response.message = "Invalid user type"
        return response
      } else {
        if ((userType == "admin" || userType == "manager") && !password) {
          response.status = 401
          response.message = "password is required here if you are admin or manager"
          return response
        } else {
          checkUserType = userType
        }
      }

    }
    let checkStatus = "active"
    if (status) {
      let statusCheck = ["active", "inactive"].includes(status)
      if (!statusCheck) {
        response.status = 401
        response.message = "Invalid user status"
        return response
      } else {
        checkStatus = status
      }
    }
    let checkKycApproved = "no"
    if (kycApproved) {
      let check = ["yes", "no"].includes(kycApproved)
      if (check) {
        checkKycApproved = kycApproved
      } else {
        response.status = 401
        response.message = "Invalid kyc Approved"
        return response
      }
    }
    let checkIsEmailVerified = "no"
    if (isEmailVerified) {
      let check = ["yes", "no"].includes(isEmailVerified)
      if (check) {
        checkIsEmailVerified = isEmailVerified
      } else {
        response.status = 401
        response.message = "Invalid isEmailVerified"
        return response
      }
    }
    let checkIsContactVerified = "no"
    if (isContactVerified) {
      let check = ["yes", "no"].includes(isContactVerified)
      if (check) {
        checkIsContactVerified = isContactVerified
      } else {
        response.status = 401
        response.message = "Invalid isContactVerified"
        return response
      }
    }
    if (email) {
      const isValidEmail = emailValidation(email)
      if (!isValidEmail) {
        response.status = 401
        response.message = "Invalid email address"
        return response
      }
    }
    const obj = {
      addressProof, drivingLicence, idProof, isContactVerified: checkIsContactVerified, isEmailVerified: checkIsEmailVerified, kycApproved: checkKycApproved, userType: checkUserType, status: checkStatus, altContact, firstName, lastName, contact, email, password
    }
    if (_id) {
      const find = await User.findOne({ _id: ObjectId(_id) })
      if (!find) {
        response.status = 401
        response.message = "Invalid user id"
        return response
      } else {
        if (deleteRec) {
          await User.deleteOne({ _id: ObjectId(_id) })
          response.message = "user deleted successfully"
          response.status = 200
          response.data = { _id }
          return response
        }
        delete obj._id
        await User.updateOne(
          { _id: ObjectId(_id) },
          {
            $set: obj
          },
          { new: true }
        );
        response.message = "user updated successfully"
        response.data = obj
      }

    } else {
      if (firstName && lastName && contact && email) {
        const SaveUser = new User(obj)
        SaveUser.save()
        response.message = "data saved successfully"
        response.data = SaveUser._doc
      } else {
        response.status = 401
        response.message = "some details are missing"
      }
    }
  } catch (error) {
    throw new Error(error);
  }
  return response
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

async function sendOtp(o) {
  const obj = { status: 200, message: "data fetched successfully", data: [] };
  const { email, contact } = o
  try {
    if (contact) {
      const isValidContact = contactValidation(contact)
      if (isValidContact) {
        const findUser = await User.findOne({ contact })
        if (findUser) {
          const contactOtp = Math.floor(100000 + Math.random() * 900000)
          await User.updateOne(
            { contact },
            {
              $set: { otp: contactOtp }
            },
            { new: true }
          );
          obj.data = contact
          obj.message = "otp sent successfully on your regoistered contact number"
        } else {
          flag = false
          obj.message = "user does not exist"
          return obj
        }
      } else {
        flag = false
        obj.message = "contact is invalid"
        obj.data = contact
        return obj
      }
    } else if (email) {
      const random = Math.floor(100000 + Math.random() * 900000)
      let receiver = {
        from: "kashyapshivram512@gmail.com",
        to: email,
        subject: "Rent moto user verification with otp service",
        text: "Hi " + email + ", " + "Your verification otp is " + random
      };
      const response = await transporter.sendMail(receiver)
      if (response) {
        obj.data = response
        const user = await User.findOne({ email })
        if (user) {
          await User.updateOne(
            { email },
            {
              $set: { otp: random }
            },
            { new: true }
          );
        }
        obj.message = "otp sent successfully on your registered email"
        obj.data = email
      } else {
        obj.status = 401
        obj.data = email
        obj.message = "data not found"
      }
    } else {
      obj.status = 401
      obj.message = "invalid email or contact"
      obj.data = contact
      return obj
    }
    return obj;
  } catch (error) {
    throw new Error(error);
  }
}

async function verify({ type, otp, contact }) {
  const obj = { status: 200, message: "data fetched successfully", data: [] };
  if (type && otp && contact) {
    if (type == "email") {
      const findUser = await User.findOne({ contact })
      if (findUser) {
        const { _doc } = findUser
        if (otp == _doc.otp) {
          obj.message = "otp verified successfully"
          await User.updateOne(
            { contact },
            {
              $set: { otp: "" }
            },
            { new: true }
          )
        } else {
          obj.status = 401
          obj.message = "invalid otp"
        }
      } else {
        obj.status = 401
        obj.message = "invalid contact"
      }
    } else {
      if (type == "contact" && otp == "123456") {
        const findUser = await User.findOne({ contact })
        if (findUser) {
          obj.data = findUser
          obj.message = "otp verified successfully"
        } else {
          obj.status = 401
          obj.message = "invalid contact"
        }
      }
    }
  } else {
    obj.status = 401
    obj.message = "invalid data"
  }
  return obj;
}



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
  sendOtp,
  getAllDataCount,
  verify,
  getAllUsers,
  updateUser,
  saveUser,
  getUserProfile,
  searchUser,
  updateImage,
  getUserByContact
};
