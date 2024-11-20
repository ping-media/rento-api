const { sendEmail } = require("../../../utils/email/index");
const { v4: uuidv4 } = require('uuid');
const moment = require("moment");
const { mongoose } = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Vehicle = require("../../../db/schemas/onboarding/vehicle.schema");
const Location = require("../../../db/schemas/onboarding/location.schema");
const Booking = require("../../../db/schemas/onboarding/booking.schema");
const BookingDuration = require("../../../db/schemas/onboarding/bookingDuration.schema");
const Order = require("../../../db/schemas/onboarding/order.schema");
const vehicleMaster = require("../../../db/schemas/onboarding/vehicle-master.schema");

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


async function createVehicle({ pricePerday, location, name, url, distanceLimit, accessChargePerKm, vehicleNumber, pickupLocation, transmissionType, brand, BookingStartDateAndTime, BookingEndDateAndTime, bookingCount, isBooked, bookingAmount, contact, bookingDuration }) {
  const obj = { status: 200, message: "data fetched successfully", data: [] }
  const result = await Booking.findOne({ vehicleNumber });
  let bookingDurationObj = bookingDuration ? bookingDuration : {}
  if (result) {
    const updateVehicle = {}
    pricePerday ? updateVehicle.pricePerday = pricePerday : ""
    url ? updateVehicle.url = url : ""
    url ? updateVehicle.distanceLimit = distanceLimit : ""
    url ? updateVehicle.accessChargePerKm = accessChargePerKm : ""
    url ? updateVehicle.transmissionType = transmissionType : ""
    url ? updateVehicle.brand = brand : ""
    url ? updateVehicle.name = name : ""
    await Vehicle.updateOne(
      { _id: ObjectId(result._doc.vehicleId) },
      {
        $set: updateVehicle
      },
      { new: true }
    );
    const updateObj = {}
    bookingDuration ? updateObj.bookingDuration = bookingDuration : {}
    BookingStartDateAndTime ? updateObj.BookingStartDateAndTime = BookingStartDateAndTime : ""
    BookingEndDateAndTime ? updateObj.BookingEndDateAndTime = BookingEndDateAndTime : ""
    isBooked ? updateObj.isBooked = isBooked : ""
    location ? updateObj.location = location : ""
    pickupLocation ? updateObj.pickupLocation = pickupLocation : ""
    vehicleNumber ? updateObj.vehicleNumber = vehicleNumber : ""
    await Booking.updateOne(
      { vehicleNumber: vehicleNumber },
      {
        $set: updateObj
      },
      { new: true }
    );
    obj.status = 201
    obj.message = "Updated Successfully"
  } else {
    const veRes = await Vehicle.findOne({ name });
    let _id = ""
    if (veRes) {
      _id = veRes._doc._id
    } else {
      const vehicleObj = {
        pricePerday, name, url, distanceLimit, accessChargePerKm, transmissionType, brand, bookingCount: bookingCount ? bookingCount : 0
      }
      const resultData = new Vehicle({ ...vehicleObj });
      _id = resultData._doc._id
      await resultData.save();
    }
    const bookingObj = {
      bookingDuration: bookingDurationObj, vehicleNumber, BookingStartDateAndTime, BookingEndDateAndTime, isBooked: false, vehicleId: _id, location, pickupLocation, bookingAmount, contact
    }
    const bookingResponse = new Booking({ ...bookingObj });
    await bookingResponse.save();
    obj.status = 200
    obj.message = "data saved successfully"
  }
  return obj
}

async function booking(o) {
  const obj = { status: 200, message: "data fetched successfully", data: [] }
  const { BookingStartDateAndTime, BookingEndDateAndTime, vehicleNumber, vehicleId, contact, bookingAmount } = o
  const result = await Booking.findOne({ vehicleNumber });
  if (result) {
    await Booking.updateOne(
      { vehicleNumber },
      {
        $set: { BookingStartDateAndTime, BookingEndDateAndTime, isBooked: true, contact, bookingAmount }
      },
      { new: true }
    );
    const vehicleObj = await Vehicle.findOne({ _id: ObjectId(vehicleId) });
    if (vehicleObj) {
      const { _doc } = vehicleObj
      let bookingCount = parseInt(_doc.bookingCount) + 1
      await Vehicle.updateOne(
        { _id: ObjectId(vehicleId) },
        {
          $set: { bookingCount }
        },
        { new: true }
      );
      obj.status = 201
      obj.message = "Updated Successfully"
    }

  }
  return obj
}

async function createOrder(o) {
  const obj = { status: 200, message: "data fetched successfully", data: [] }
  const { vehicleNumber, vehicleName, endDate, endTime, startDate, startTime, pickupLocation, location,
    paymentStatus, paymentMethod, userName, email, contact, submittedDocument, _id, vehicleImage } = o
  if (vehicleNumber && vehicleName && endDate && endTime && startDate && startTime && pickupLocation && location &&
    paymentStatus && paymentMethod && userName && email && contact && submittedDocument && vehicleImage) {
    if (_id) {
      const result = await Order.findOne({ _id: ObjectId(_id) });
      if (result) {
        await Order.updateOne(
          { _id: ObjectId(_id) },
          {
            $set: { ...o }
          },
          { new: true }
        );
        obj.message = "data updated successfully"
      } else {
        const result = new Order({ ...o });
        await result.save();
        obj.message = "data saved successfully"
      }
    } else {
      const result = new Order({ ...o });
      await result.save();
      obj.message = "data saved successfully"
    }
  } else {
    obj.status = 401
    obj.message = "Invalid data or something is missing"
  }
  return obj
}

async function createLocation({ locationName, stations, locationImage, _id }) {
  const obj = { status: 200, message: "location created successfully", data: [] }
  if (locationName && stations && stations.length && locationImage) {
    let o = { locationName, stations, locationImage }
    const result = await Location.findOne({ locationName });
    if (result) {
      const checkStations = result._doc.stations
      let checkStation = true
      if (checkStations.length) {        
        for(let i = 0; i < checkStations.length; i++) {
          const find = stations.find(ele => ele.stationName === checkStations[i].station.value)
          if(!find) {
            checkStation = false
            break
          }
        }
      }
      if(!checkStation) {
        obj.status = 401
        obj.message = "Invalid data"
        return obj
      }
      await Location.updateOne(
        { locationName },
        {
          $set: o
        },
        { new: true }
      );
      obj.status = 201
      obj.message = "Updated Successfully"
    } else {
      const result = new Location(o);
      await result.save();
      obj.message = "data saved successfully"
    }
  } else {
    obj.status = 401
    obj.message = "Invalid data"
  }
  return obj

}

async function createVehicleMaster({ vehicleName, vehicleType, vehicleBrand, vehicleImage, deleteRec, _id }) {
  const response = { status: "200", message: "data fetched successfully", data: [] }
  try {
    if (_id) {
      if (deleteRec) {
        await vehicleMaster.deleteOne({ _id: ObjectId(_id) })
        response.message = "vehicle deleted successfully"
        response.status = 200
        response.data = { vehicleName }
        return response
      }
      const obj = {
        vehicleName, vehicleType, vehicleBrand, vehicleImage
      }
      const findVehicle = await User.findOne({ vehicleName })
      if (findVehicle) {
        await User.updateOne(
          { contact },
          {
            $set: obj
          },
          { new: true }
        );
        response.message = "user updated successfully"
        response.data = obj
      } else {
        if (vehicleName && vehicleType && vehicleBrand && vehicleImage) {
          const SaveUser = new User(obj)
          SaveUser.save()
          response.message = "data saved successfully"
          response.data = obj
        } else {
          response.status = 401
          response.message = "Invalid vehicle details"
        }
      }
    } else {
      response.status = 401
      response.message = "Invalid vehicle details"
    }
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


async function getLocations() {
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
  searchVehicle,
  getLocations,
  booking,
  getMessages
};
