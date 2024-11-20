const { sendEmail } = require("../../../utils/email/index");
const { v4: uuidv4 } = require('uuid');
const moment = require("moment");
const { mongoose } = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Vehicle = require("../../../db/schemas/onboarding/vehicle.schema");
const Location = require("../../../db/schemas/onboarding/location.schema");
const Station = require("../../../db/schemas/onboarding/station.schema");
const Booking = require("../../../db/schemas/onboarding/booking.schema");
const BookingDuration = require("../../../db/schemas/onboarding/bookingDuration.schema");
const User = require("../../../db/schemas/onboarding/user.schema");
const Order = require("../../../db/schemas/onboarding/order.schema");
const VehicleMaster = require("../../../db/schemas/onboarding/vehicle-master.schema");
const Plan = require("../../../db/schemas/onboarding/plan.schema");
const Coupon = require("../../../db/schemas/onboarding/coupons.schema");
const InvoiceTbl = require("../../../db/schemas/onboarding/invoice-tbl.schema");
const VehicleTable = require("../../../db/schemas/onboarding/vehicle-table.schema");
const vehicleTable = require("../../../db/schemas/onboarding/vehicle-table.schema");
const vehicleMaster = require("../../../db/schemas/onboarding/vehicle-master.schema");
const plan = require("../../../db/schemas/onboarding/plan.schema");
const location = require("../../../db/schemas/onboarding/location.schema");
const station = require("../../../db/schemas/onboarding/station.schema");
const order = require("../../../db/schemas/onboarding/order.schema");
const { emailValidation, contactValidation } = require("../../../constant");

const createBookingDuration = async ({ bookingDuration, attachedVehicles, bookingId }) => {
  const obj = { status: 200, message: "data fetched successfully", data: [] }
  if (bookingDuration && bookingDuration.label) {
    let result = await BookingDuration.findOne({ 'bookingDuration.label': bookingDuration.label });
    if (result) {
      result = result._doc
      if (bookingId) {
        if (result.attachedVehicles.length) {
          const find = result.attachedVehicles.find(ele => ele == bookingId)
          if (!find) {
            const arr = result.attachedVehicles
            arr.push(bookingId)
            const updatePacket = {
              "attachedVehicles": arr,
            }
            await BookingDuration.updateOne(
              { _id: ObjectId(result._id) },
              {
                $set: updatePacket
              },
              { new: true }
            );
            obj.status = 201
            obj.message = "Booking duration updated successfully"
          } else {
            obj.message = "Invalid data",
              obj.status = "401"
          }
        } else {
          await BookingDuration.updateOne(
            { _id: ObjectId(result._id) },
            {
              $set: { "attachedVehicles": [bookingId] }
            },
            { new: true }
          );
          obj.status = 201
          obj.message = "Booking duration updated successfully"
        }
      } else {
        obj.message = "Invalid data",
          obj.status = "401"
      }
    } else {
      const obj = { attachedVehicles: attachedVehicles && attachedVehicles.length ? attachedVehicles : [], bookingDuration }
      const result = new BookingDuration(obj);
      await result.save();
      obj.message = "data saved successfully"
    }
  } else {
    obj.message = "Invalid data",
      obj.status = "401"
  }
  return obj
}


async function createVehicle({ _id, vehicleId, stationId, vehicleNumber, freeKms, extraKmsCharges, vehicleModel, vehicleColor, perDayCost, lastServiceDate, kmsRun, isBooked, condition, deleteRec, vehicleBookingStatus, vehicleStatus, vehiclePlan }) {
  const response = { status: "200", message: "data fetched successfully", data: [] }
  try {
    if (_id || (vehicleId && vehicleBookingStatus && vehicleStatus && stationId && vehicleNumber && freeKms && extraKmsCharges && vehicleModel && vehicleColor && perDayCost && lastServiceDate && kmsRun && isBooked && condition)) {
      if (stationId) {
        const findStation = await Station.findOne({ stationId })
        if (!findStation) {
          response.status = 401
          response.message = "Invalid stationId"
          return response
        }
      }
      if (vehiclePlan && vehiclePlan.length == 24) {
        const findPlan = await Plan.findOne({ _id: ObjectId(vehiclePlan) })
        if (!findPlan) {
          response.status = 401
          response.message = "Invalid vehicle plan"
          return response
        }
      } else {
        response.status = 401
        response.message = "Invalid vehicle plan"
        return response
      }
      if (isBooked) {
        let statusCheck = ["false", "true"].includes(isBooked.toString())
        if (!statusCheck) {
          response.status = 401
          response.message = "Invalid isBooked value"
          return response
        }
      }
      if (condition) {
        let statusCheck = ["old", "new"].includes(condition)
        if (!statusCheck) {
          response.status = 401
          response.message = "Invalid vehicle condition"
          return response
        }
      }
      if (vehicleBookingStatus) {
        let statusCheck = ["available", "booked"].includes(vehicleBookingStatus)
        if (!statusCheck) {
          response.status = 401
          response.message = "Invalid vehicleBookingStatus"
          return response
        }
      }
      if (vehicleColor) {
        let statusCheck = ["white", "black", "red", "blue", "green", "yellow"].includes(vehicleColor)
        if (!statusCheck) {
          response.status = 401
          response.message = "Invalid vehicle color"
          return response
        }
      }
      if (vehicleStatus) {
        let statusCheck = ["active", "inActive"].includes(vehicleStatus)
        if (!statusCheck) {
          response.status = 401
          response.message = "Invalid vehicleStatus"
          return response
        }
      }
      if (vehicleNumber && vehicleNumber.length !== 10) {
        response.status = 401
        response.message = "Invalid vehicle number"
        return response
      } else {
        const findVeh = await VehicleTable.find({ vehicleNumber })
        if (findVeh && findVeh.length == 2) {
          response.status = 401
          response.message = "Vehicle number already exist"
          return response
        }
      }
      if (_id && _id.length == 24) {
        const find = await VehicleTable.findOne({ _id: ObjectId(_id) })
        if (!find) {
          response.status = 401
          response.message = "Invalid vehicleId"
          return response
        }
      }
      const o = {
        vehicleBookingStatus, vehicleStatus, vehicleId, stationId, vehicleNumber, freeKms, extraKmsCharges, vehicleModel, vehicleColor, perDayCost, lastServiceDate, kmsRun, isBooked, condition, vehiclePlan
      }
      if (_id) {
        const find = await VehicleTable.findOne({ _id: ObjectId(_id) })
        if (!find) {
          response.status = 401
          response.message = "Invalid vehicle table id"
          return response
        }
        if (deleteRec) {
          await VehicleTable.deleteOne({ _id: ObjectId(_id) })
          response.message = "vehicle deleted successfully"
          response.status = 200
          response.data = { _id }
          return response
        }
        await VehicleTable.updateOne(
          { _id: ObjectId(_id) },
          {
            $set: o
          },
          { new: true }
        );
        response.message = "Vehicle Table updated successfully"
        response.data = o
      } else {
        if (vehicleId && vehicleBookingStatus && vehicleStatus && freeKms && extraKmsCharges && stationId && vehicleNumber && vehicleModel && vehicleColor && perDayCost && lastServiceDate && kmsRun && isBooked && condition) {
          const find = await VehicleTable.findOne({ vehicleNumber })
          if (!find) {
            const SaveVehicleTable = new VehicleTable(o)
            SaveVehicleTable.save()
            response.message = "data saved successfully"
            response.data = o
          } else {
            response.status = 401
            response.message = "Vehicle number already exists"
          }
        } else {
          response.status = 401
          response.message = "Something is missing"
          return response
        }
      }
    } else {
      response.status = 401
      response.message = "Something is missing"
    }
    return response
  } catch (error) {
    throw new Error(error);
  }
}

async function booking({ vehicleTableId, userId, BookingStartDateAndTime, BookingEndDateAndTime, extraAddon, bookingPrice,
  discount, bookingStatus, paymentStatus, rideStatus, pickupLocation, invoice, paymentMethod, paySuccessId, payInitFrom,
  deleteRec, _id, discountPrice
}) {
  const obj = { status: 200, message: "data fetched successfully", data: [] }

  const { startTime, startDate } = BookingStartDateAndTime
  const { endTime, endDate } = BookingEndDateAndTime
  const { totalPrice, price, tax, roundPrice } = bookingPrice
  const o = {
    vehicleTableId, userId, BookingStartDateAndTime, BookingEndDateAndTime, extraAddon, bookingPrice,
    discount, bookingStatus, paymentStatus, rideStatus, pickupLocation, invoice, paymentMethod, paySuccessId, payInitFrom,
    bookingId: Math.floor(100000 + Math.random() * 900000)
  }
  if (_id && _id.length !== 24) {
    obj.status = 401
    obj.message = "Invalid booking id"
    return obj
  }
  if (discountPrice && isNaN(discountPrice)) {
    obj.status = 401
    obj.message = "Invalid discount price"
    return obj
  }
  if (vehicleTableId) {
    const find = await vehicleTable.findOne({ _id: ObjectId(vehicleTableId) })
    if (!find) {
      obj.status = 401
      obj.message = "Invalid vehicle table id"
      return obj
    }
  }
  if (userId) {
    if (userId.length !== 24) {
      obj.status = 401
      obj.message = "Invalid user id"
      return obj
    }
    const find = await User.findOne({ _id: ObjectId(userId) })
    if (!find) {
      obj.status = 401
      obj.message = "Invalid user id"
      return obj
    }
  }
  if (bookingPrice.discountPrice) {
    if (isNaN(bookingPrice.discountPrice)) {
      obj.status = 401
      obj.message = "Invalid discount price"
      return obj
    }
  }
  if (bookingPrice.extraAddonPrice) {
    if (isNaN(bookingPrice.extraAddonPrice)) {
      obj.status = 401
      obj.message = "Invalid extraAddonPrice price"
      return obj
    }
  }
  if (bookingPrice) {
    if (isNaN(bookingPrice.totalPrice) || isNaN(bookingPrice.vehiclePrice) || isNaN(bookingPrice.tax) || isNaN(bookingPrice.roundPrice)) {
      obj.status = 401
      obj.message = "invalid booking price"
      return obj
    }
  }
  if (bookingStatus) {
    let check = ['pending', 'completed', 'canceled'].includes(bookingStatus)
    if (!check) {
      obj.status = 401
      obj.message = "Invalid booking Status"
      return obj
    }
  }
  if (paymentStatus) {
    let check = ['pending', 'completed', 'canceled'].includes(paymentStatus)
    if (!check) {
      obj.status = 401
      obj.message = "Invalid paymentStatus"
      return obj
    }
  }
  if (rideStatus) {
    let check = ['pending', 'completed', 'canceled'].includes(rideStatus)
    if (!check) {
      obj.status = 401
      obj.message = "Invalid rideStatus"
      return obj
    }
  }
  if (paymentMethod) {
    let check = ['online', 'cash'].includes(paymentMethod)
    if (!check) {
      obj.status = 401
      obj.message = "Invalid payment method"
      return obj
    }
  }
  if (pickupLocation) {
    const find = await Station.findOne({ stationId: pickupLocation })
    if (!find) {
      obj.status = 401
      obj.message = "invalid pickup location"
      return obj
    }
  }
  if (invoice) {
    const find = await InvoiceTbl.findOne({ _id: ObjectId(invoice) })
    if (!find) {
      obj.status = 401
      obj.message = "invalid invoice id"
      return obj
    }
  }
  if (_id) {
    const find = await Booking.findOne({ _id: ObjectId(_id) })
    if (!find) {
      obj.status = 401
      obj.message = "Invalid booking id"
      return obj
    }
    if (deleteRec) {
      await Booking.deleteOne({ _id: ObjectId(_id) })
      obj.message = "booking deleted successfully"
      obj.status = 200
      obj.data = { _id }
      return obj
    }
    await Booking.updateOne(
      { _id: ObjectId(_id) },
      {
        $set: o
      },
      { new: true }
    );
  } else {
    if (vehicleTableId && userId && BookingStartDateAndTime && BookingEndDateAndTime
      && bookingPrice && startTime && endTime && startDate &&
      bookingStatus && paymentStatus && rideStatus
      && paymentMethod && paySuccessId && payInitFrom && endDate &&
      totalPrice && tax
    ) {
      const SaveBooking = new Booking(o)
      SaveBooking.save()
      obj.message = "new booking saved successfully"
      obj.data = o
    } else {
      obj.status = 401
      obj.message = "Something is missing"
      return obj
    }
  }
  return obj
}

async function createOrder(o) {
  const obj = { status: 200, message: "data fetched successfully", data: [] }
  const { vehicleNumber, vehicleName, endDate, endTime, startDate, startTime, pickupLocation, location,
    paymentStatus, paymentMethod, userId, email, contact, submittedDocument, _id, vehicleImage, orderId } = o
  if (vehicleNumber) {
    const find = await vehicleTable.findOne({ vehicleNumber })
    if (!find) {
      obj.status = 401
      obj.message = "invalid vehicle number"
      return obj
    }
  }
  if (vehicleName) {
    const find = await VehicleMaster.findOne({ vehicleName })
    if (!find) {
      obj.status = 401
      obj.message = "invalid vehicle name"
      return obj
    }
  }
  if (!startDate || !endDate) {
    obj.status = 401
    obj.message = "invalid date"
    return obj
  }
  if (startDate && !Date?.parse(startDate) && endDate && !Date?.parse(endDate)) {
    obj.status = 401
    obj.message = "invalid date"
    return obj
  }
  if (pickupLocation) {
    const find = await Station.findOne({ stationId: pickupLocation })
    if (!find) {
      obj.status = 401
      obj.message = "invalid pickup location"
      return obj
    }
  }
  if (location) {
    const find = await Location.findOne({ locationName: location })
    if (!find) {
      obj.status = 401
      obj.message = "invalid location"
      return obj
    }
  }
  if (paymentStatus) {
    let check = ['pending', 'completed', 'canceled'].includes(paymentStatus)
    if (!check) {
      obj.status = 401
      obj.message = "Invalid paymentStatus"
      return obj
    }
  }
  if (paymentMethod) {
    let check = ['cash', 'card', 'upi', 'wallet'].includes(paymentMethod)
    if (!check) {
      obj.status = 401
      obj.message = "Invalid paymentStatus"
      return obj
    }
  }
  if (userId) {
    if (userId.length == 24) {
      const find = await User.findOne({ _id: ObjectId(userId) })
      if (!find) {
        obj.status = 401
        obj.message = "invalid user id"
        return obj
      }
    } else {
      obj.status = 401
      obj.message = "invalid user id"
      return obj
    }
  }
  if (email) {
    const validateEmail = emailValidation(email)
    if (!validateEmail) {
      obj.status = 401
      obj.message = "invalid email"
      return obj
    }
    const find = await User.findOne({ email })
    if (!find) {
      obj.status = 401
      obj.message = "invalid email"
      return obj
    }
  }
  if (contact) {
    const validateContact = contactValidation(contact)
    if (!validateContact) {
      obj.status = 401
      obj.message = "invalid contact"
      return obj
    }
    const find = await User.findOne({ contact })
    if (!find) {
      obj.status = 401
      obj.message = "invalid contact"
      return obj
    }
  }
  if (orderId.length !== 4 || isNaN(orderId)) {
    obj.status = 401
    obj.message = "invalid order id"
    return obj
  }
  if (_id && _id.length == 24) {
    const find = await Order.findOne({ _id: ObjectId(_id) })
    if (!find) {
      obj.status = 401
      obj.message = "Invalid _id"
      return obj
    } else {
      if (deleteRec) {
        await Order.deleteOne({ _id: ObjectId(_id) })
        obj.message = "order deleted successfully"
        obj.status = 200
        obj.data = { _id }
        return obj
      }
      await Order.updateOne(
        { _id: ObjectId(_id) },
        {
          $set: o
        },
        { new: true }
      );
      obj.message = "order updated successfully"
      obj.data = o
    }
  } else {
    if (vehicleNumber && vehicleName && endDate && endTime && startDate && startTime && pickupLocation && location &&
      paymentStatus && paymentMethod && userId && email && contact && submittedDocument && vehicleImage && orderId) {
      const find = await Order.findOne({ orderId })
      if (find) {
        obj.status = 401
        obj.message = "order id already exist"
        return obj
      }
      delete o._id
      const result = new Order({ ...o });
      await result.save();
      obj.message = "data saved successfully"
    } else {
      obj.status = 401
      obj.message = "Invalid data or something is missing"
    }
  }

  return obj
}

async function createLocation({ locationName, locationImage, deleteRec, _id }) {
  const obj = { status: 200, message: "location created successfully", data: [] }
  if (_id && _id.length == 24) {
    const find = await Location.findOne({ _id: ObjectId(_id) })
    if (!find) {
      obj.status = 401
      obj.message = "Invalid _id"
      return obj
    }
    if (deleteRec) {
      await Location.deleteOne({ _id: ObjectId(_id) })
      obj.message = "location deleted successfully"
      obj.data = { _id }
      return obj
    }
    await Location.updateOne(
      { _id: ObjectId(_id) },
      {
        $set: { locationName, locationImage }
      },
      { new: true }
    );
    obj.message = "location updated successfully"
    obj.data = { _id }
    return obj
  } else {
    if (locationName && locationImage) {
      const find = await Location.findOne({ locationName })
      if (find) {
        obj.status = 401
        obj.message = "location already exist"
        return obj
      }
      const SaveLocation = new Location({ locationName, locationImage })
      SaveLocation.save()
      obj.message = "data saved successfully"
      obj.data = SaveLocation
    }
  }
  return obj
}

async function createPlan({ planName, planPrice, stationId, _id, deleteRec, planDuration }) {
  const obj = { status: 200, message: "plan created successfully", data: [] }
  try {
    if (_id || (planName && planPrice && stationId && planDuration)) {
      let o = { planName, planPrice, stationId, planDuration }
      if (isNaN(planDuration)) {
        obj.status = 401
        obj.message = "invalid plan duration"
        return obj
      }
      if (planName) {
        const find = await Plan.findOne({ planName })
        if (find) {
          obj.status = 401
          obj.message = "plan already exists"
          return obj
        }
      }
      if (stationId) {
        const find = await Station.findOne({ stationId })
        if (!find) {
          obj.status = 401
          obj.message = "invalid station id"
          return obj
        }
      }
      if (_id && _id.length !== 24) {
        obj.status = 401
        obj.message = "invalid _id"
        return obj
      }
      if (_id) {
        const result = await Plan.findOne({ _id: ObjectId(_id) });
        if (result) {
          if (deleteRec) {
            await Plan.deleteOne({ _id: ObjectId(_id) })
            obj.message = "plan deleted successfully"
            return obj
          }
          await Plan.updateOne(
            { _id: ObjectId(_id) },
            {
              $set: o
            },
            { new: true }
          );
          obj.message = "plan updated successfully"
          obj.data = o
        } else {
          obj.status = 401
          obj.message = "Invalid data"
        }
      } else {
        const SavePlan = new Plan(o)
        SavePlan.save()
        obj.message = "new plan saved successfully"
        obj.data = o
      }
    } else {
      obj.status = 401
      obj.message = "Invalid data"
    }
  } catch (err) {
    console.log(err)
  }

  return obj
}

async function createInvoice({ pdfDoc, _id, deleteRec, bookingId, paidInvoice }) {
  const obj = { status: 200, message: "invoice created successfully", data: [] }
  const o = { pdfDoc, bookingId, paidInvoice }
  try {
    if (paidInvoice) {
      let check = ['paid', 'unpaid'].includes(paidInvoice)
      if (!check) {
        obj.status = 401
        obj.message = "Invalid paidInvoice"
        return obj
      }
    }
    if (bookingId) {
      if (bookingId.length == 36) {
        const find = await Booking.findOne({ bookingId })
        if (!find) {
          obj.status = 401
          obj.message = "invalid order id"
          return obj
        }
      } else {
        obj.status = 401
        obj.message = "invalid order id"
        return obj
      }
    }
    if (_id) {
      if (_id.length !== 24) {
        obj.status = 401
        obj.message = "invalid _id"
        return obj
      }
      const find = await InvoiceTbl.findOne({ _id: ObjectId(_id) })
      if (!find) {
        obj.status = 401
        obj.message = "Invalid _id"
        return obj
      }
      if (deleteRec) {
        await InvoiceTbl.deleteOne({ _id: ObjectId(_id) })
        obj.message = "invoice deleted successfully"
        return obj
      }
      delete o.invoiceNumber
      await InvoiceTbl.updateOne(
        { _id: ObjectId(_id) },
        {
          $set: o
        },
        { new: true }
      );
      obj.message = "invoice updated successfully"
      obj.data = o
    } else {
      if (pdfDoc && bookingId) {
        o.invoiceNumber = Math.floor(100000 + Math.random() * 900000)
        const SavePlan = new InvoiceTbl(o)
        SavePlan.save()
        obj.message = "new invoice saved successfully"
        obj.data = o
      } else {
        obj.status = 401
        obj.message = "Invalid data"
      }
    }
    return obj
  } catch (err) {
    console.log(err)
  }

}

async function discountCoupons({ couponName, vehicleType, allowedUsers, usageAllowed, discountType, _id, deleteRec, isCouponActive }) {
  const obj = { status: 200, message: "invoice created successfully", data: [] }
  let o = { couponName, vehicleType, allowedUsers, usageAllowed, discountType, isCouponActive: isCouponActive ? "active" : "inActive" }
  if (isCouponActive) {
    let check = ['active', 'inActive'].includes(isCouponActive)
    if (!check) {
      obj.status = 401
      obj.message = "Invalid isCouponActive"
      return obj
    }
  }
  if (couponName) {
    const find = await Coupon.findOne({ couponName })
    if (find) {
      obj.status = 401
      obj.message = "coupon already exists"
      return obj
    }
  }
  if (vehicleType) {
    let check = ["gear", "non-gear", "all"].includes(vehicleType)
    if (!check) {
      obj.status = 401
      obj.message = "Invalid vehicle type"
      return obj
    }
  }
  if (discountType) {
    let check = ['percentage', 'fixed'].includes(discountType)
    if (!check) {
      obj.status = 401
      obj.message = "Invalid discount type"
      return obj
    }
  }
  if (allowedUsers) {
    for (let i = 0; i < allowedUsers.length; i++) {
      const find = await User.findOne({ _id: ObjectId(allowedUsers[i]) })
      if (!find) {
        obj.status = 401
        obj.message = "Invalid user id"
        return obj
        break;
      }
    }
  }
  if (_id) {
    if (_id.length !== 24) {
      obj.status = 401
      obj.message = "invalid _id"
      return obj
    }
    const find = await Coupon.findOne({ _id: ObjectId(_id) })
    if (!find) {
      obj.status = 401
      obj.message = "Invalid _id"
      return obj
    }
  }
  if (_id) {
    const result = await Coupon.findOne({ _id: ObjectId(_id) });
    if (result) {
      if (deleteRec) {
        await Coupon.deleteOne({ _id: ObjectId(_id) })
        obj.message = "Coupon deleted successfully"
        return obj
      }
      await Coupon.updateOne(
        { _id: ObjectId(_id) },
        {
          $set: o
        },
        { new: true }
      );
      obj.message = "Coupon updated successfully"
      obj.data = o
    } else {
      obj.status = 401
      obj.message = "Invalid coupon _id"
      return obj
    }
  } else {
    if (couponName && vehicleType && allowedUsers && usageAllowed && discountType) {
      const SavePlan = new Coupon(o)
      SavePlan.save()
      obj.message = "new Coupon saved successfully"
      obj.data = o
    } else {
      obj.status = 401
      obj.message = "data is missing"
    }

  }
  return obj
}




async function createStation({ stationId, stationName, locationId, state, city, userId, address, pinCode, latitude, longitude, _id, deleteRec }) {
  const obj = { status: 200, message: "location created successfully", data: [] }
  const o = { country: "India", stationId, stationName, locationId, state, city, address, pinCode, latitude, longitude, userId }
  if (_id && _id.length !== 24) {
    obj.status = 401
    obj.message = "invalid _id"
    return obj
  }
  if(_id && stationId){
    obj.status = 401
    obj.message = "station id cant be updated"
    return obj
  }
  if (userId) {
    if (userId.length !== 24) {
      obj.status = 401
      obj.message = "invalid user id"
      return obj
    }
    const find = await User.findOne({ _id: ObjectId(userId) })
    if (!find) {
      obj.status = 401
      obj.message = "invalid user id"
      return obj
    } else {
      let userType = find._doc.userType
      if (userType !== "manager") {
        obj.status = 401
        obj.message = "user is not manager"
        return obj
      }
    }
  }
  if (locationId) {
    if (locationId.length !== 24) {
      obj.status = 401
      obj.message = "invalid location id"
      return obj
    }
    const find = await Location.findOne({ _id: ObjectId(locationId) })
    if (!find) {
      obj.status = 401
      obj.message = "invalid location id"
      return obj
    }
  }
  if (pinCode && pinCode.length == 6) {
    if (isNaN(pinCode)) {
      obj.status = 401
      obj.message = "invalid pincode"
      return obj
    }
  } else {
    obj.status = 401
    obj.message = "invalid pincode"
    return obj
  }
  if (stationId && stationId.length == 6 && !isNaN(stationId) && !_id) {
    const find = await Station.findOne({ stationId })
    if (find) {
      obj.status = 401
      obj.message = "station already exists"
      return obj
    }
  }
  if (_id) {
    const find = await Station.findOne({ _id: ObjectId(_id) })
    if (!find) {
      obj.status = 401
      obj.message = "Invalid _id"
      return obj
    }
    if (deleteRec) {
      await Station.deleteOne({ _id: ObjectId(_id) })
      obj.message = "station deleted successfully"
      return obj
    }
    await Station.updateOne(
      { _id: ObjectId(_id) },
      {
        $set: o
      },
      { new: true }
    );
    obj.message = "station updated successfully"
    obj.data = o
  } else {
    if (stationName && locationId && stationId && state && city && address && pinCode && userId) {
      const SaveStation = new Station(o)
      SaveStation.save()
      obj.message = "data saved successfully"
      obj.data = o
    } else {
      obj.status = 401
      obj.message = "Missing Station details"
    }
  }
  return obj
}

async function createVehicleMaster({ vehicleName, vehicleType, vehicleBrand, vehicleImage, deleteRec, _id }) {
  const response = { status: "200", message: "data fetched successfully", data: [] }
  try {
    const obj = {
      vehicleName, vehicleType, vehicleBrand, vehicleImage
    }
    if (vehicleType) {
      let statusCheck = ["gear", "non-gear"].includes(vehicleType)
      if (!statusCheck) {
        response.status = 401
        response.message = "Invalid vehicle type"
        return response
      }
    }
    if (_id && _id.length !== 24) {
      response.status = 401
      response.message = "Invalid _id"
      return response
    }
    if (_id) {
      const find = await VehicleMaster.findOne({ _id: ObjectId(_id) })
      if (!find) {
        response.status = 401
        response.message = "Invalid vehicle id"
        return response
      }
      if (deleteRec) {
        await VehicleMaster.deleteOne({ _id: ObjectId(_id) })
        response.message = "vehicle master deleted successfully"
        response.status = 200
        response.data = { vehicleName }
        return response
      }
      await VehicleMaster.updateOne(
        { _id: ObjectId(_id) },
        {
          $set: obj
        },
        { new: true }
      );
      response.message = "vehicle master updated successfully"
      response.data = obj
    } else {
      if (vehicleName && vehicleType && vehicleBrand && vehicleImage) {
        const find = await VehicleMaster.findOne({ vehicleName })
        if (find) {
          response.status = 401
          response.message = "vehicle master name already exists"
          return response
        }
        const SaveUser = new VehicleMaster(obj)
        SaveUser.save()
        response.message = "vehicle master saved successfully"
        response.data = obj
      } else {
        response.status = 401
        response.message = "Invalid vehicle master details"
      }
    }
    return response
  } catch (error) {
    throw new Error(error);
  }
}





async function searchVehicle({ name, pickupLocation, brand, transmissionType, location, startDate, startTime, endDate, endTime, sort, mostBooked, bookingDuration }) {
  const obj = { status: 200, message: "data fetched successfully", data: [] }
  let momStartTime = moment(startTime, "hh:mm A");
  let momEndTime = moment(endTime, "hh:mm A");
  let getStartDate = startDate
  let getStartTime = { hours: new Date(momStartTime).getHours(), minutes: new Date(momStartTime).getMinutes() }
  let getEndDate = endDate
  let getEndTime = { hours: new Date(momEndTime).getHours(), minutes: new Date(momEndTime).getMinutes() }
  const filter = {}
  if (name) {
    filter.name = { $regex: '.*' + name + '.*', $options: 'i' }
  }
  if (brand) {
    filter.brand = { $regex: '.*' + brand + '.*', $options: 'i' }
  }
  if (transmissionType) {
    filter.transmissionType = transmissionType
  }
  let attachedDevices = []
  if (bookingDuration) {
    const result = await BookingDuration.findOne({ 'bookingDuration.label': bookingDuration });
    attachedDevices = result._doc.attachedVehicles
    if (!attachedDevices.length) {
      return { status: 200, message: "No data found", data: [] }
    }
  }
  if (attachedDevices.length) {
    attachedDevices = attachedDevices.map((obj) => {
      return (
        ObjectId(obj)
      )
    })
  }
  const response = await Vehicle.find(filter)
  if (response && response.length) {
    const finalArr = []
    for (let i = 0; i < response.length; i++) {
      const { _doc } = response[i]
      const o = _doc
      const bookFilter = { vehicleId: ObjectId(o._id) }
      if (pickupLocation) {
        bookFilter.pickupLocation = pickupLocation
      }
      if (location) {
        bookFilter.location = location
      }
      if (attachedDevices.length) {
        bookFilter._id = { $in: attachedDevices }
      }
      let bookRes = await Booking.find(bookFilter)
      if (bookRes.length) {
        let getInitElement = ""
        let vehicleCount = 0
        for (let i = 0; i < bookRes.length; i++) {
          const { _doc } = bookRes[i]
          let BookingStartDateAndTime = _doc.BookingStartDateAndTime
          let BookingEndDateAndTime = _doc.BookingEndDateAndTime
          let isBooked = _doc.isBooked
          if (BookingEndDateAndTime && BookingStartDateAndTime && isBooked) {
            const { startDate, startTime } = BookingStartDateAndTime
            const { endDate, endTime } = BookingEndDateAndTime
            let bookingStartHours = new Date(moment(startTime, "hh:mm A")).getHours()
            let bookingEndHours = new Date(moment(endTime, "hh:mm A")).getHours()
            let bookingStartMinutes = new Date(moment(startTime, "hh:mm A")).getMinutes()
            let bookingEndMinutes = new Date(moment(endTime, "hh:mm A")).getMinutes()
            let checkSoldOut = false
            let bookingStartDate = moment(startDate).add(bookingStartHours, 'hours').add(bookingStartMinutes, 'minutes')
            bookingStartDate = new Date(bookingStartDate.format()).getTime()
            let currentStartDate = moment(getStartDate).add(getStartTime.hours, 'hours').add(getStartTime.minutes, 'minutes')
            currentStartDate = new Date(currentStartDate.format()).getTime()
            let currentEndDate = moment(getEndDate).add(getEndTime.hours, 'hours').add(getEndTime.minutes, 'minutes')
            currentEndDate = new Date(currentEndDate.format()).getTime()
            let bookingEndDate = moment(endDate).add(bookingEndHours, 'hours').add(bookingEndMinutes, 'minutes')
            bookingEndDate = new Date(bookingEndDate.format()).getTime()
            if (currentStartDate >= bookingStartDate && currentStartDate <= bookingEndDate) {
              checkSoldOut = true
            } else if (currentEndDate >= bookingStartDate && currentStartDate <= bookingEndDate) {
              checkSoldOut = true
            } else {
              if (!getInitElement) {
                getInitElement = _doc
              }
              checkSoldOut = false
            }
            if (!checkSoldOut) {
              vehicleCount = vehicleCount + 1
            }
          } else {
            getInitElement = _doc
            vehicleCount = vehicleCount + 1
          }
        }
        o.vehicleCount = vehicleCount
        finalArr.push({ ...o, ...getInitElement })
      }
    }
    if (sort == "lowToHigh") {
      finalArr.sort((a, b) => a.pricePerday - b.pricePerday);
    } else {
      finalArr.sort((a, b) => b.pricePerday - a.pricePerday);
    }
    if (mostBooked) {
      finalArr.sort((a, b) => b.bookingCount - a.bookingCount);
    }
    obj.data = finalArr
  } else {
    obj.status = 401
    obj.message = "data not found"
  }
  return obj
}

const getVehicleMasterData = async (query) => {
  const obj = { status: 200, message: "data fetched successfully", data: [] }
  let filter = query
  if (filter._id) {
    filter._id = ObjectId(query._id)
  }
  const response = await vehicleMaster.find({ ...filter })
  if (response) {
    obj.data = response
  } else {
    obj.status = 401
    obj.message = "data not found"
  }
  return obj
}


const getBookings = async (query) => {
  const obj = { status: 200, message: "data fetched successfully", data: [] }
  const {
    vehicleTableId, bookingStartDate, bookingEndDate, bookingStartTime, bookingEndTime, bookingPrice, bookingStatus, paymentStatus, rideStatus, paymentMethod, payInitFrom, paySuccessId,
    firstName, lastName, userType, contact, email, longitude, latitude, address,
    stationName, stationId, locationName, city, state, pinCode,
    vehicleName, vehicleType, vehicleBrand,
    vehicleBookingStatus, vehicleStatus, freeKms, extraKmsCharges, vehicleNumber, vehicleModel, vehicleColor, perDayCost, lastServiceDate, kmsRun, isBooked, condition,
  } = query
  let mainObj = {}
  if (mainObj._id) {
    mainObj._id = ObjectId(query._id)
  }
  let startDate = null
  let startTime = null
  let endDate = null
  let endTime = null
  let totalPrice = null
  let vehiclePrice = null
  let tax = null
  let roundPrice = null
  let extraAddonPrice = null
  if (bookingPrice) {
    totalPrice = bookingPrice.totalPrice
    vehiclePrice = bookingPrice.vehiclePrice
    tax = bookingPrice.tax
    roundPrice = bookingPrice.roundPrice
    extraAddonPrice = bookingPrice.extraAddonPrice
  }
  bookingStartDate && Date.parse(bookingStartDate) ? mainObj['BookingStartDateAndTime.startDate'] = bookingStartDate : null
  bookingEndDate && Date.parse(bookingEndDate) ? mainObj['BookingEndDateAndTime.endDate'] = bookingEndDate : null
  bookingStartTime ? mainObj['BookingStartDateAndTime.startTime'] = bookingStartTime : null
  bookingEndTime ? mainObj['BookingEndDateAndTime.endTime'] = bookingEndTime : null
  totalPrice ? mainObj.bookingPrice.totalPrice = totalPrice : null
  vehiclePrice ? mainObj.bookingPrice.vehiclePrice = vehiclePrice : null
  tax ? mainObj.bookingPrice.tax = tax : null
  roundPrice ? mainObj.bookingPrice.roundPrice = roundPrice : null
  extraAddonPrice ? mainObj.bookingPrice.extraAddonPrice = extraAddonPrice : null

  bookingPrice ? mainObj.bookingPrice = bookingPrice : null
  bookingStatus ? mainObj.bookingStatus = bookingStatus : null
  paymentStatus ? mainObj.paymentStatus = paymentStatus : null
  rideStatus ? mainObj.rideStatus = rideStatus : null
  paymentMethod ? mainObj.paymentMethod = paymentMethod : null
  payInitFrom ? mainObj.payInitFrom = payInitFrom : null
  paySuccessId ? mainObj.paySuccessId = paySuccessId : null
  const response = await Booking.find(mainObj)
  if (response) {
    const arr = []
    for (let i = 0; i < response.length; i++) {
      const { _doc } = response[i]
      let o = _doc
      if (o.bookingId == "564f1e1f-4a52-494e-ba8e-4cd2d71bd29e") {
        console.log(o)
      }
      let find1 = null
      let find2 = null
      let find3 = null
      let find4 = null
      let find5 = null

      let obj1 = {}
      stationName ? obj1.stationName = stationName : null
      stationId ? obj1.stationId = stationId : null
      city ? obj1.city = city : null
      state ? obj1.state = state : null
      pinCode ? obj1.pinCode = pinCode : null
      address ? obj1.address = address : null
      latitude ? obj1.latitude = latitude : null
      longitude ? obj1.longitude = longitude : null
      find1 = await station.findOne({ ...obj1 })
      if (find1) {
        let obj = { _id: ObjectId(find1._doc.locationId) }
        locationName ? obj.locationName = locationName : null
        find2 = await Location.findOne({ ...obj })
      }
      let obj2 = { _id: ObjectId(o.vehicleTableId) }
      vehicleBookingStatus ? obj2.vehicleBookingStatus = vehicleBookingStatus : null
      vehicleStatus ? obj2.vehicleStatus = vehicleStatus : null
      freeKms ? obj2.freeKms = freeKms : null
      extraKmsCharges ? obj2.extraKmsCharges = extraKmsCharges : null
      vehicleNumber ? obj2.vehicleNumber = vehicleNumber : null
      vehicleModel ? obj2.vehicleModel = vehicleModel : null
      vehicleColor ? obj2.vehicleColor = vehicleColor : null
      perDayCost ? obj2.perDayCost = perDayCost : null
      lastServiceDate && Date.parse(lastServiceDate) ? obj2.lastServiceDate = lastServiceDate : null
      kmsRun ? obj2.kmsRun = kmsRun : null
      isBooked ? obj2.isBooked = isBooked : null
      condition ? obj2.condition = condition : null
      find3 = await vehicleTable.findOne({ ...obj2 })
      if (find3) {
        const obj = { _id: ObjectId(find3._doc.vehicleId) }
        vehicleName ? obj.vehicleName = vehicleName : null
        vehicleType ? obj.vehicleType = vehicleType : null
        vehicleBrand ? obj.vehicleBrand = vehicleBrand : null
        find4 = await vehicleMaster.findOne({ ...obj })
      }
      let obj3 = { _id: ObjectId(o.userId) }
      contact ? obj3.contact = contact : null
      find5 = await User.findOne({ ...obj3 })

      if (find1 && find2 && find3 && find4 && find5) {
        delete find1._id
        delete find2._id
        delete find3._id
        delete find4._id
        delete find5._id
        o = {
          ...o,
          ...find1?._doc,
          ...find2?._doc,
          ...find3?._doc,
          ...find4?._doc,
          ...find5?._doc
        }
        arr.push(o)
      }
    }
    obj.data = arr
  } else {
    obj.status = 401
    obj.message = "data not found"
  }
  if (!obj.data.length) {
    obj.message = "data not found"
  }
  return obj
}

const getVehicleTblData = async (query) => {
  const obj = { status: 200, message: "data fetched successfully", data: [] }
  const { vehicleName, vehicleType, vehicleBrand, locationName, locationId, stationId, pinCode, planIds, stationName, startDate, startTime, endDate, endTime } = query
  let momStartTime = moment(startTime ? startTime : "00:00 AM", "hh:mm A");
  let momEndTime = moment(endTime ? endTime : "00:00 AM", "hh:mm A");
  let getStartDate = startDate
  let getStartTime = { hours: new Date(momStartTime).getHours(), minutes: new Date(momStartTime).getMinutes() }
  let getEndDate = endDate
  let getEndTime = { hours: new Date(momEndTime).getHours(), minutes: new Date(momEndTime).getMinutes() }
  let filter = {}
  if (query && Object.keys(query).length) {
    filter = JSON.parse(JSON.stringify(query))
    delete filter.planIds
    let checkPlanIds = planIds ? JSON.parse(planIds) : []
    if (checkPlanIds && checkPlanIds.length) {
      filter.vehiclePlan = { $in: checkPlanIds }
    }
    if (filter._id) {
      filter._id = ObjectId(query._id)
    }
  }
  const response = await vehicleTable.find(filter)
  if (response) {
    const arr = []
    for (let i = 0; i < response.length; i++) {
      const { _doc } = response[i]
      let bookingFlag = false
      let o = _doc
      if (o && o.vehiclePlan) {
        const findPlan = await Plan.findOne({ _id: ObjectId(o.vehiclePlan) }, { stationId: 0, _id: 0 })
        o = { ...o, ...findPlan._doc }
      }
      let vehicleCount = 0
      if (o.isBooked == "true") {
        const find = await Booking.findOne({ vehicleTableId: o._id }, { BookingStartDateAndTime: 1, BookingEndDateAndTime: 1, _id: 0 })
        if (find) {
          let _doc = find._doc
          let BookingStartDateAndTime = _doc.BookingStartDateAndTime
          let BookingEndDateAndTime = _doc.BookingEndDateAndTime
          if (BookingEndDateAndTime && BookingStartDateAndTime) {
            const { startDate, startTime } = BookingStartDateAndTime
            const { endDate, endTime } = BookingEndDateAndTime
            let bookingStartHours = new Date(moment(startTime, "hh:mm A")).getHours()
            let bookingEndHours = new Date(moment(endTime, "hh:mm A")).getHours()
            let bookingStartMinutes = new Date(moment(startTime, "hh:mm A")).getMinutes()
            let bookingEndMinutes = new Date(moment(endTime, "hh:mm A")).getMinutes()
            let bookingStartDate = moment(startDate).add(bookingStartHours, 'hours').add(bookingStartMinutes, 'minutes')
            bookingStartDate = new Date(bookingStartDate.format()).getTime()
            let currentStartDate = moment(getStartDate).add(getStartTime.hours, 'hours').add(getStartTime.minutes, 'minutes')
            currentStartDate = new Date(currentStartDate.format()).getTime()
            let currentEndDate = moment(getEndDate).add(getEndTime.hours, 'hours').add(getEndTime.minutes, 'minutes')
            currentEndDate = new Date(currentEndDate.format()).getTime()
            let bookingEndDate = moment(endDate).add(bookingEndHours, 'hours').add(bookingEndMinutes, 'minutes')
            bookingEndDate = new Date(bookingEndDate.format()).getTime()
            if (currentStartDate >= bookingStartDate && currentStartDate <= bookingEndDate) {
              bookingFlag = true
            } else if (currentEndDate >= bookingStartDate && currentStartDate <= bookingEndDate) {
              bookingFlag = true
            } else {
              bookingFlag = false
            }
            if (!bookingFlag) {
              vehicleCount = vehicleCount + 1
            }
          } else {
            obj.status = 401
            obj.message = "Something went wrong"
            return obj
          }
        }
      }
      let obj1 = { _id: ObjectId(o.vehicleId) }
      vehicleName ? obj1.vehicleName = vehicleName : null
      vehicleType ? obj1.vehicleType = vehicleType : null
      vehicleBrand ? obj1.vehicleBrand = vehicleBrand : null
      const find1 = await vehicleMaster.findOne({ ...obj1 }, {_id: 0})

      let obj3 = { stationId: o.stationId }
      stationName ? obj3.stationName = stationName : null
      locationId ? obj3.locationId = locationId : null
      pinCode ? obj3.pinCode = pinCode : null
      const find3 = await station.findOne({ ...obj3 }, {_id: 0})
      let find2 = null
      if (find3) {
        const obj = { _id: ObjectId(find3._doc.locationId) }
        locationName ? obj.locationName = locationName : null
        find2 = await Location.findOne({ ...obj }, {_id: 0})
      }
      if (find1 && find2 && find3) {
        let find = null
        if (arr.length) {
          find = arr.find(ele => ele.stationId === find3._doc.stationId && ele.vehicleName === find1._doc.vehicleName)
          if (find && !bookingFlag) {
            //if (find) {
            find.vehicleCount = find.vehicleCount + 1
            const index = arr.findIndex(ele => ele.stationId === find3._doc.stationId && vehicleName === find1._doc.vehicleName)
            arr[index] = find
          }
        }
        if (!find) {
          o = {
            ...o,
            ...find1?._doc,
            ...find2?._doc,
            ...find3?._doc,
            vehicleCount: 1
          }
          arr.push(o)
        }
      }
    }
    obj.data = arr
    if (!obj.data.length) {
      obj.message = "data not found"
    }
  } else {
    obj.status = 401
    obj.message = "data not found"
  }
  return obj
}

const getPlanData = async (query) => {
  const obj = { status: 200, message: "data fetched successfully", data: [] }
  let filter = query
  if (filter._id) {
    filter._id = ObjectId(query._id)
  }
  const response = await plan.find({ ...filter })
  if (response) {
    obj.data = response
  } else {
    obj.status = 401
    obj.message = "data not found"
  }
  return obj
}

const getLocationData = async (query) => {
  const obj = { status: 200, message: "data fetched successfully", data: [] }
  let filter = query
  if (filter._id) {
    filter._id = ObjectId(query._id)
  }
  const response = await Location.find({ ...filter })
  const arr = []
  if (response && response.length) {
    for(let i = 0; i < response.length; i++) {
      const { _doc } = response[i]
      let o = _doc
      const find = await station.find({locationId: ObjectId(o._id)})
      if (find) {
       o.stationCount = find.length
       arr.push(o)
      }
    }
    obj.data = arr
  } else {
    obj.status = 401
    obj.message = "data not found"
  }
  return obj
}

const getStationData = async (query) => {
  const obj = { status: 200, message: "data fetched successfully", data: [] }
  const { locationName, stationName, stationId, address, city, pinCode, state, contact, locationId, _id, userId } = query
  let filter = {}
  _id ? filter._id = ObjectId(_id) : null
  locationId ? filter.locationId = ObjectId(locationId) : null
  stationName ? filter.stationName = stationName : null
  stationId ? filter.stationId = stationId : null
  address ? filter.address = address : null
  city ? filter.city = city : null
  state ? filter.state = state : null
  pinCode ? filter.pinCode = pinCode : null
  userId ? filter.userId = userId : null
  const response = await station.find(filter)
  if (response) {
    const arr = []
    for (let i = 0; i < response.length; i++) {
      const { _doc } = response[i]
      let o = _doc
      let obj = {_id: ObjectId(o.locationId)}
      locationName ? obj.locationName = locationName : null
      const find = await location.findOne(obj, {_id: 0})
      
      let obj3 = { _id: ObjectId(o.userId) }
      contact ? obj3.contact = contact : null
      const find3 = await User.findOne({ ...obj3 }, {_id: 0, firstName: 1, lastName: 1, contact: 1, email: 1})
      if (find) {
        o = {
          ...o,
          ...find?._doc
        }
        if (find3 && find3?._doc?.userType === "manager") {
          o = {
            ...o,
            ...find3?._doc
          }
        }
        arr.push(o)
      }
    }
    obj.data = arr
  } else {
    obj.status = 401
    obj.message = "data not found"
  }
  return obj
}

async function getAllVehicles({ page, limit }) {
  const obj = { status: 200, message: "data fetched successfully", data: [] }
  const offset = (page - 1) * limit;
  const response = await Booking.find({}).skip(offset).limit(limit);
  if (response && response.length) {
    const finalArr = []
    for (let i = 0; i < response.length; i++) {
      let { _doc } = response[i]
      let o = _doc
      let vehicleRes = await Vehicle.findOne({ _id: ObjectId(o.vehicleId) })
      if (vehicleRes) {
        vehicleRes = vehicleRes._doc
        finalArr.push({ ...vehicleRes, ...o })
      }
    }
    obj.data = finalArr
    obj.count = await Booking.find({}).countDocuments();
  } else {
    obj.status = 401
    obj.message = "data not found"
  }
  return obj
}


async function getLocations(query) {
  const obj = { status: 200, message: "data fetched successfully", data: [] }
  const result = await Location.find({});
  if (result) {
    obj.status = 200
    obj.data = result
    obj.message = "data get successfully"
  } else {
    obj.status = 401
    obj.message = "data get successfully"
  }
  return obj
}

async function getOrders() {
  const obj = { status: 200, message: "data fetched successfully", data: [] }
  const result = await Order.find({});
  if (result) {
    obj.status = 200
    obj.data = result
    obj.message = "data get successfully"
  } else {
    obj.status = 401
    obj.message = "data get successfully"
  }
  return obj
}



async function getAllBookingDuration() {
  const obj = { status: 200, message: "data fetched successfully", data: [] }
  const result = await BookingDuration.find({});
  if (result) {
    obj.status = 200
    obj.data = result
    obj.message = "data get successfully"
  } else {
    obj.status = 401
    obj.message = "data get successfully"
  }
  return obj
}




async function getMessages(chatId) {
  const result = await Message.find({ chatId: chatId });
  return result;
}


module.exports = {
  createBookingDuration,
  createVehicleMaster,
  getAllBookingDuration,
  createVehicle,
  getOrders,
  getAllVehicles,
  createOrder,
  createLocation,
  createPlan,
  getVehicleMasterData,
  getVehicleTblData,
  getStationData,
  getLocationData,
  getPlanData,
  createInvoice,
  discountCoupons,
  getBookings,
  createStation,
  searchVehicle,
  getLocations,
  booking,
  getMessages
};
