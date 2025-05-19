const { sendEmail } = require("../../../utils/email/index");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const { mongoose } = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Vehicle = require("../../../db/schemas/onboarding/vehicle.schema");
const Location = require("../../../db/schemas/onboarding/location.schema");
const Station = require("../../../db/schemas/onboarding/station.schema");
//const Booking = require("../../../db/schemas/onboarding/booking.schema");
const Booking = require("../../../db/schemas/onboarding/booking.schema");
const cron = require("node-cron");
const BookingDuration = require("../../../db/schemas/onboarding/bookingDuration.schema");
const User = require("../../../db/schemas/onboarding/user.schema");
const Order = require("../../../db/schemas/onboarding/order.schema");
const VehicleMaster = require("../../../db/schemas/onboarding/vehicle-master.schema");
const Plan = require("../../../db/schemas/onboarding/plan.schema");
const Coupon = require("../../../db/schemas/onboarding/coupons.schema");
const InvoiceTbl = require("../../../db/schemas/onboarding/invoice-tbl.schema");
const VehicleTable = require("../../../db/schemas/onboarding/vehicle-table.schema");
const vehicleTable = require("../../../db/schemas/onboarding/vehicle-table.schema");
const plan = require("../../../db/schemas/onboarding/plan.schema");
const location = require("../../../db/schemas/onboarding/location.schema");
const station = require("../../../db/schemas/onboarding/station.schema");
const order = require("../../../db/schemas/onboarding/order.schema");
const pickupImage = require("../../../db/schemas/onboarding/pickupImageUpload");
const { emailValidation, contactValidation } = require("../../../constant");
const { query } = require("express");
//const {generateRandomId } = require('../../../utils/help-scripts/help-functions');
const Invoice = require("../../../db/schemas/onboarding/invoice-tbl.schema"); // Import the Invoice model
const vehicleMaster = require("../../../db/schemas/onboarding/vehicle-master.schema");
const Log = require("../models/Logs.model");
const { whatsappMessage } = require("../../../utils/whatsappMessage");
const {
  // sendOtpByEmailForBooking,
  sendEmailForBookingToStationMaster,
} = require("../../../utils/emailSend");
const General = require("../../../db/schemas/onboarding/general.schema");

const mode = process.env.ENVIRONMENT;

const logError = async (message, functionName, userId) => {
  await Log({ message, functionName, userId });
};

const createBookingDuration = async ({
  bookingDuration,
  attachedVehicles,
  bookingId,
}) => {
  const obj = { status: 200, message: "data fetched successfully", data: [] };
  if (bookingDuration && bookingDuration.label) {
    let result = await BookingDuration.findOne({
      "bookingDuration.label": bookingDuration.label,
    });
    if (result) {
      result = result._doc;
      if (bookingId) {
        if (result.attachedVehicles.length) {
          const find = result.attachedVehicles.find((ele) => ele == bookingId);
          if (!find) {
            const arr = result.attachedVehicles;
            arr.push(bookingId);
            const updatePacket = {
              attachedVehicles: arr,
            };
            await BookingDuration.updateOne(
              { _id: ObjectId(result._id) },
              {
                $set: updatePacket,
              },
              { new: true }
            );
            obj.status = 201;
            obj.message = "Booking duration updated successfully";
          } else {
            (obj.message = "Invalid data"), (obj.status = "401");
          }
        } else {
          await BookingDuration.updateOne(
            { _id: ObjectId(result._id) },
            {
              $set: { attachedVehicles: [bookingId] },
            },
            { new: true }
          );
          obj.status = 201;
          obj.message = "Booking duration updated successfully";
        }
      } else {
        (obj.message = "Invalid data"), (obj.status = "401");
      }
    } else {
      const obj = {
        attachedVehicles:
          attachedVehicles && attachedVehicles.length ? attachedVehicles : [],
        bookingDuration,
      };
      const result = new BookingDuration(obj);
      await result.save();
      obj.message = "data saved successfully";
    }
  } else {
    (obj.message = "Invalid data"), (obj.status = "401");
  }
  return obj;
};

async function createVehicle({
  _id,
  vehicleMasterId,
  stationId,
  vehicleNumber,
  freeKms,
  extraKmsCharges,
  vehicleModel,
  locationId,
  perDayCost,
  lastServiceDate,
  kmsRun,
  condition,
  deleteRec,
  vehicleBookingStatus,
  vehicleStatus,
  vehiclePlan,
  refundableDeposit,
  lateFee,
  speedLimit,
  lastMeterReading,
}) {
  const response = {
    status: 200,
    message: "Data fetched successfully",
    data: [],
  };

  try {
    if (
      _id ||
      (vehicleMasterId &&
        vehicleBookingStatus &&
        vehicleStatus &&
        stationId &&
        vehicleNumber &&
        freeKms &&
        extraKmsCharges &&
        vehicleModel &&
        perDayCost &&
        lastServiceDate &&
        lastMeterReading &&
        kmsRun &&
        condition &&
        locationId)
    ) {
      if (stationId) {
        const findStation = await Station.findOne({ stationId });
        if (!findStation) {
          response.status = 401;
          response.message = "Invalid stationId";
          await Log({
            message: `Invalid stationId provided ${stationId}`,
            functionName: "createVehicle",
            userId: stationId,
          });
          return response;
        }
      }

      if (condition) {
        const statusCheck = ["old", "new"].includes(condition);
        if (!statusCheck) {
          response.status = 401;
          response.message = "Invalid vehicle condition";
          await Log({
            message: "Invalid vehicle condition",
            functionName: "createVehicle",
            userId: stationId,
          });
          return response;
        }
      }

      // if (vehicleNumber && vehicleNumber.length !== 10) {
      //   response.status = 401;
      //   response.message = "Invalid vehicle number";
      //   await Log({
      //     message: "Invalid vehicle number length",
      //     functionName: "createVehicle",
      //     userId: stationId,
      //   });
      //   return response;
      // }

      const o = {
        locationId,
        vehicleBookingStatus,
        vehicleStatus,
        vehicleMasterId,
        stationId,
        vehicleNumber,
        freeKms,
        extraKmsCharges,
        vehicleModel,
        perDayCost,
        lastServiceDate,
        kmsRun,
        condition,
        vehiclePlan,
        refundableDeposit,
        lateFee,
        speedLimit,
        lastMeterReading,
      };

      if (_id) {
        const find = await VehicleTable.findOne({ _id: ObjectId(_id) });
        if (!find) {
          response.status = 401;
          response.message = "Invalid vehicle table ID";
          await Log({
            message: "Invalid vehicle table ID during update",
            functionName: "createVehicle",
            userId: stationId,
          });
          return response;
        }

        if (deleteRec) {
          await VehicleTable.deleteOne({ _id: ObjectId(_id) });
          response.message = "Vehicle deleted successfully";
          response.data = { _id };
          await Log({
            message: "Vehicle deleted successfully",
            functionName: "createVehicle",
            userId: stationId,
          });
          return response;
        }

        await VehicleTable.updateOne({ _id: ObjectId(_id) }, { $set: o });
        response.message = "Vehicle updated successfully";
        response.data = o;
        await Log({
          message: "Vehicle updated successfully",
          functionName: "createVehicle",
          userId: stationId,
        });
      } else {
        const findVeh = await VehicleTable.findOne({ vehicleNumber });

        if (!findVeh) {
          const SaveVehicleTable = new VehicleTable(o);
          await SaveVehicleTable.save();
          response.message = "Vehicle saved successfully";
          response.data = o;
          await Log({
            message: "New vehicle created successfully",
            functionName: "createVehicle",
            userId: stationId,
          });
        } else {
          response.status = 401;
          response.message = "Vehicle number already exists";
          await Log({
            message: `Vehicle number already exists ${vehicleNumber}`,
            functionName: "createVehicle",
            userId: stationId,
          });
          return response;
        }
      }
    } else {
      response.status = 401;
      response.message = "All fields required";
      await Log({
        message: "Required fields missing",
        functionName: "createVehicle",
        userId: stationId,
      });
    }
    return response;
  } catch (error) {
    response.status = 500;
    response.message = "Internal server error";
    await Log({
      message: `Error in createVehicle function: ${error.message}`,
      functionName: "createVehicle",
      userId: stationId,
    });
    throw new Error(error.message);
  }
}

async function booking({
  vehicleTableId,
  userId,
  BookingStartDateAndTime,
  BookingEndDateAndTime,
  extraAddon,
  bookingPrice,
  paymentInitiatedDate,
  stationMasterUserId,
  changeVehicle,
  extendBooking,
  paymentUpdates,
  discount,
  bookingStatus,
  paymentStatus,
  rideStatus,
  pickupLocation,
  invoice,
  paymentMethod,
  paySuccessId,
  payInitFrom,
  stationId,
  discountCuopon,
  bookingId,
  notes,
  isCancelled,
  deleteRec,
  _id,
  discountPrice,
  vehicleBasic,
  vehicleMasterId,
  vehicleBrand,
  vehicleImage,
  vehicleName,
  stationName,
  paymentgatewayOrderId,
  userType = "",
  paymentgatewayReceiptId,
}) {
  const obj = { status: 200, message: "Data fetched successfully", data: [] };

  try {
    if (!_id) {
      if (!userId) {
        obj.status = 401;
        obj.message = "Need to login first";

        await Log({
          message: "Need to login first during booking process",
          functionName: "booking",
          userId,
        });

        return obj;
      }
      // Vehicle availability check
      const vehicleRecord = await Booking.findOne({ vehicleTableId }).sort({
        createdAt: -1,
      });

      //   console.log(vehicleRecord)
      if (
        vehicleRecord &&
        vehicleRecord.bookingStatus != "canceled" &&
        BookingStartDateAndTime === vehicleRecord.BookingStartDateAndTime &&
        BookingEndDateAndTime === vehicleRecord.BookingEndDateAndTime
      ) {
        obj.status = 401;
        obj.message = "Vehicle already booked";
        await Log({
          message: "Vehicle already booked during booking process",
          functionName: "booking",
          userId,
        });
        return obj;
      }

      let sequence = 1;
      const lastBooking = await Booking.findOne({})
        .sort({ createdAt: -1 })
        .select("bookingId");
      if (lastBooking && lastBooking.bookingId) {
        sequence = parseInt(lastBooking.bookingId, 10) + 1;
      }
      var bookingId = sequence.toString().padStart(6, "0");
      const find = await Station.find({ stationName });

      if (userType != "customer") {
        // console.log(find);

        if (!find || find.length === 0) {
          // Check if array is empty
          console.error(`Station not found for stationName: ${stationName}`);
          obj.status = 404;
          obj.message = "Station not found";
          await Log({
            message: `Station not found for stationName: ${stationName}`,
            functionName: "booking",
            userId,
          });
          return obj;
        }
      }

      var stationMasterUserId = find[0].userId;
      var stationId = find[0].stationId;
    }

    let o = {
      vehicleTableId,
      userId,
      BookingStartDateAndTime,
      BookingEndDateAndTime,
      extraAddon,
      bookingPrice,
      stationId,
      paymentInitiatedDate,
      notes,
      changeVehicle,
      paymentUpdates,
      discount,
      bookingStatus,
      paymentStatus,
      rideStatus,
      pickupLocation,
      invoice,
      paymentMethod,
      paySuccessId,
      paymentgatewayOrderId,
      discountCuopon,
      extendBooking,
      payInitFrom,
      bookingId,
      vehicleBasic,
      vehicleMasterId,
      vehicleBrand,
      vehicleImage,
      vehicleName,
      stationName,
      stationMasterUserId,
      paymentgatewayReceiptId,
      isCancelled,
    };
    // console.log(o)
    if (_id && _id.length !== 24) {
      obj.status = 401;
      obj.message = "Invalid booking id";

      await Log({
        message: "Invalid booking ID during booking process",
        functionName: "booking",
        userId,
      });

      return obj;
    }

    Object.keys(o).forEach((key) => {
      if (o[key] === undefined || o[key] === null || o[key] === "") {
        delete o[key];
      }
    });

    if (_id) {
      const find = await Booking.findOne({ _id: ObjectId(_id) });
      if (!find) {
        obj.status = 401;
        obj.message = "Invalid booking id";

        await Log({
          message: "Booking not found for update",
          functionName: "booking",
          userId,
        });

        return obj;
      }

      if (deleteRec) {
        await Booking.deleteOne({ _id: ObjectId(_id) });

        obj.message = "Booking deleted successfully";
        obj.status = 200;

        await Log({
          message: `Booking with ID ${_id} deleted`,
          functionName: "deletebooking",
          userId,
        });

        return obj;
      }

      if (o.notes && Array.isArray(o.notes) && o.notes.length > 0) {
        if (isCancelled === true) {
          o.notes = o.notes.filter(
            (note) => !note.noteType.includes("canceled")
          );
        } else {
          o.notes = [...(find.notes || []), o.notes[0]];
        }
      }

      const UpdatedData = await Booking.findByIdAndUpdate(
        { _id: ObjectId(_id) },
        { $set: o },
        { new: true }
      );

      await Log({
        message: `Booking with ID ${_id} updated`,
        functionName: "updatebooking",
        userId,
      });

      obj.status = 200;
      obj.message = "Booking Update successfull";

      if (paySuccessId) {
        function convertDateString(dateString) {
          if (!dateString) return "Invalid date";

          const date = new Date(dateString);
          if (isNaN(date)) return "Invalid date";

          const options = {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          };

          return date.toLocaleString("en-US", options);
        }
        if (userId && stationMasterUserId) {
          var user = await User.findById(userId);
          if (!user) {
            obj.status = 404;
            obj.message = "User not found";

            await Log({
              message: `User not found with ID: ${userId}`,
              functionName: "booking",
              // userId,
            });
            return obj;
          }

          var stationMasterUser = await User.findById(stationMasterUserId);
          if (!stationMasterUser) {
            obj.status = 404;
            obj.message = "Station master user not found";

            await Log({
              message: `Station master user not found with ID: ${stationMasterUserId}`,
              functionName: "booking",
              userId,
            });
            return obj;
          }
        }

        const station = await Station.findOne({ stationName }).select(
          "latitude longitude"
        );
        if (!station) {
          console.error(`Station not found for stationName: ${stationName}`);
          return;
        }

        const { latitude, longitude } = station;
        const mapLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        //  console.log(mapLink);

        const totalPrice =
          bookingPrice.discountTotalPrice > 0
            ? bookingPrice.discountTotalPrice
            : bookingPrice.totalPrice;

        // Prepare message data
        const date = convertDateString(BookingStartDateAndTime);

        const messageData = [
          user.firstName,
          vehicleName,
          date,
          bookingId,
          stationName,
          mapLink,
          stationMasterUser.contact,
        ];

        if (paymentStatus === "paid") {
          messageData.push(totalPrice, vehicleBasic.refundableDeposit);
          if (mode === "production") {
            whatsappMessage(user.contact, "booking_confirm_paid", messageData);
          }
        } else if (paymentStatus === "partially_paid") {
          const remainingAmount =
            Number(totalPrice) - Number(bookingPrice.userPaid);

          messageData.push(
            bookingPrice.userPaid,
            remainingAmount,
            vehicleBasic.refundableDeposit
          );
          if (mode === "production") {
            whatsappMessage(
              user.contact,
              "booking_confirmed_partial_paid",
              messageData
            );
          }
        }
        sendEmailForBookingToStationMaster(
          userId,
          stationMasterUserId,
          vehicleName,
          BookingStartDateAndTime,
          BookingEndDateAndTime,
          bookingId
        );
      }

      obj.data = UpdatedData;
      return obj;
    } else {
      if (
        vehicleTableId &&
        userId &&
        BookingStartDateAndTime &&
        BookingEndDateAndTime &&
        bookingPrice &&
        paymentStatus &&
        rideStatus &&
        bookingId &&
        paymentMethod &&
        paySuccessId &&
        payInitFrom &&
        vehicleMasterId &&
        vehicleBrand &&
        vehicleImage &&
        vehicleName &&
        stationName &&
        vehicleBasic
      ) {
        const SaveBooking = new Booking(o);

        await SaveBooking.save();

        obj.message = "New booking saved successfully";
        obj.data = SaveBooking;

        await Log({
          message: "New booking created",
          functionName: "booking",
          userId,
        });
      } else {
        obj.status = 401;
        obj.message = "Someting went wrong while creating Booking ";

        await Log({
          message: "Failed booking due to missing fields",
          functionName: "booking",
          userId,
        });

        return obj;
      }
    }

    return obj;
  } catch (error) {
    console.error("Error in booking function:", error.message);

    await Log({
      message: `Error in booking function: ${error.message}`,
      functionName: "booking",
      userId,
    });

    obj.status = 500;
    obj.message = "Internal server error";
    return obj;
  }
}

// cron.schedule(
//   "0 * * * *",
//   async () => {
//     console.log(
//       "Running scheduler to cancel pending payments older than 1 hour..."
//     );

//     try {
//       const oneHourAgo = new Date();
//       oneHourAgo.setHours(oneHourAgo.getHours() - 1);

//       // Find and update bookings with paymentStatus "pending" older than 1 hour
//       const result = await Booking.updateMany(
//         {
//           paymentStatus: "pending",
//           createdAt: { $lte: oneHourAgo },
//         },
//         {
//           $set: {
//             paymentStatus: "failed",
//             bookingStatus: "canceled",
//             rideStatus: "canceled",
//           },
//         }
//       );

//       if (result.modifiedCount > 0) {
//         console.log(
//           `Canceled ${result.modifiedCount} bookings with pending payment.`
//         );
//       } else {
//         console.log("No pending payments older than 1 hour to cancel.");
//       }
//     } catch (error) {
//       console.error(
//         "Error in scheduler for canceling pending payments:",
//         error.message
//       );
//     }
//   },
//   { timezone: "UTC" }
// );

const createOrder = async (o) => {
  const obj = { status: 200, message: "Data fetched successfully", data: [] };
  const {
    vehicleNumber,
    vehicleName,
    endDate,
    endTime,
    startDate,
    startTime,
    pickupLocation,
    location,
    paymentStatus,
    paymentMethod,
    userId,
    email,
    contact,
    submittedDocument,
    _id,
    vehicleImage,
    orderId,
    deleteRec,
  } = o;

  try {
    // Validate vehicleNumber
    if (vehicleNumber) {
      const find = await vehicleTable.findOne({ vehicleNumber });
      if (!find) {
        obj.status = 401;
        obj.message = "Invalid vehicle number";
        await logError(
          "Invalid vehicle number during createOrder",
          "createOrder",
          userId
        );
        return obj;
      }
    }

    // Validate vehicleName
    if (vehicleName) {
      const find = await VehicleMaster.findOne({ vehicleName });
      if (!find) {
        obj.status = 401;
        obj.message = "Invalid vehicle name";
        await logError(
          "Invalid vehicle name during createOrder",
          "createOrder",
          userId
        );
        return obj;
      }
    }

    // Validate dates
    if (
      !startDate ||
      !endDate ||
      !Date.parse(startDate) ||
      !Date.parse(endDate)
    ) {
      obj.status = 401;
      obj.message = "Invalid date";
      await logError("Invalid date during createOrder", "createOrder", userId);
      return obj;
    }

    // Validate pickupLocation
    if (pickupLocation) {
      const find = await Station.findOne({ stationId: pickupLocation });
      if (!find) {
        obj.status = 401;
        obj.message = "Invalid pickup location";
        await logError(
          "Invalid pickup location during createOrder",
          "createOrder",
          userId
        );
        return obj;
      }
    }

    // Validate location
    if (location) {
      const find = await Location.findOne({ locationName: location });
      if (!find) {
        obj.status = 401;
        obj.message = "Invalid location";
        await logError(
          "Invalid location during createOrder",
          "createOrder",
          userId
        );
        return obj;
      }
    }

    // Validate paymentStatus
    if (
      paymentStatus &&
      !["pending", "completed", "canceled"].includes(paymentStatus)
    ) {
      obj.status = 401;
      obj.message = "Invalid paymentStatus";
      await logError(
        "Invalid paymentStatus during createOrder",
        "createOrder",
        userId
      );
      return obj;
    }

    // Validate paymentMethod
    if (
      paymentMethod &&
      !["cash", "card", "upi", "wallet"].includes(paymentMethod)
    ) {
      obj.status = 401;
      obj.message = "Invalid paymentMethod";
      await logError(
        "Invalid paymentMethod during createOrder",
        "createOrder",
        userId
      );
      return obj;
    }

    // Validate userId
    if (userId) {
      if (userId.length === 24) {
        const find = await User.findOne({ _id: ObjectId(userId) });
        if (!find) {
          obj.status = 401;
          obj.message = "Invalid user ID";
          await logError(
            "Invalid user ID during createOrder",
            "createOrder",
            userId
          );
          return obj;
        }
      } else {
        obj.status = 401;
        obj.message = "Invalid user ID";
        await logError(
          "Invalid user ID format during createOrder",
          "createOrder",
          userId
        );
        return obj;
      }
    }

    // Validate email
    if (email) {
      const validateEmail = emailValidation(email);
      if (!validateEmail) {
        obj.status = 401;
        obj.message = "Invalid email";
        await logError(
          "Invalid email format during createOrder",
          "createOrder",
          userId
        );
        return obj;
      }
      const find = await User.findOne({ email });
      if (!find) {
        obj.status = 401;
        obj.message = "Invalid email";
        await logError(
          "Email not associated with any user during createOrder",
          "createOrder",
          userId
        );
        return obj;
      }
    }

    // Validate contact
    if (contact) {
      const validateContact = contactValidation(contact);
      if (!validateContact) {
        obj.status = 401;
        obj.message = "Invalid contact";
        await logError(
          "Invalid contact format during createOrder",
          "createOrder",
          userId
        );
        return obj;
      }
      const find = await User.findOne({ contact });
      if (!find) {
        obj.status = 401;
        obj.message = "Invalid contact";
        await logError(
          "Contact not associated with any user during createOrder",
          "createOrder",
          userId
        );
        return obj;
      }
    }

    // Validate orderId
    if (!orderId || orderId.length !== 4 || isNaN(orderId)) {
      obj.status = 401;
      obj.message = "Invalid order ID";
      await logError(
        "Invalid order ID format during createOrder",
        "createOrder",
        userId
      );
      return obj;
    }

    // Handle existing order (_id)
    if (_id && _id.length === 24) {
      const find = await Order.findOne({ _id: ObjectId(_id) });
      if (!find) {
        obj.status = 401;
        obj.message = "Invalid _id";
        await logError(
          "Order not found for provided _id during createOrder",
          "createOrder",
          userId
        );
        return obj;
      } else {
        if (deleteRec) {
          await Order.deleteOne({ _id: ObjectId(_id) });
          obj.message = "Order deleted successfully";
          obj.status = 200;
          obj.data = { _id };
          await logError("Order deleted successfully", "createOrder", userId);

          return obj;
        }
        await Order.updateOne(
          { _id: ObjectId(_id) },
          { $set: o },
          { new: true }
        );
        obj.message = "Order updated successfully";
        obj.data = o;
        await logError("Order update successfully", "createOrder", userId);

        return obj;
      }
    }

    // Handle new order creation
    if (
      vehicleNumber &&
      vehicleName &&
      endDate &&
      endTime &&
      startDate &&
      startTime &&
      pickupLocation &&
      location &&
      paymentStatus &&
      paymentMethod &&
      userId &&
      email &&
      contact &&
      submittedDocument &&
      vehicleImage &&
      orderId
    ) {
      const find = await Order.findOne({ orderId });
      if (find) {
        obj.status = 401;
        obj.message = "Order ID already exists";
        await logError(
          "Duplicate orderId during createOrder",
          "createOrder",
          userId
        );
        return obj;
      }

      delete o._id;
      const result = new Order({ ...o });
      await result.save();
      obj.message = "Order created successfully";
      obj.data = result;
    } else {
      obj.status = 401;
      obj.message = "Invalid data or missing fields";
      await logError(
        "Missing required fields during createOrder",
        "createOrder",
        userId
      );
    }

    return obj;
  } catch (error) {
    console.error("Error in createOrder function:", error.message);
    await logError(
      `Error in createOrder: ${error.message}`,
      "createOrder",
      userId
    );
    obj.status = 500;
    obj.message = "Internal server error";
    return obj;
  }
};

async function createLocation({ locationName, locationImage, deleteRec, _id }) {
  const obj = {
    status: 200,
    message: "location created successfully",
    data: [],
  };
  if (_id && _id.length == 24) {
    const find = await Location.findOne({ _id: ObjectId(_id) });
    if (!find) {
      obj.status = 401;
      obj.message = "Invalid _id";
      return obj;
    }
    if (deleteRec) {
      await Location.deleteOne({ _id: ObjectId(_id) });
      await Log({
        message: `Booking with ID ${_id} deleted`,
        functionName: "deletebooking",
        userId,
      });
      obj.message = "location deleted successfully";
      obj.data = { _id };
      return obj;
    }
    await Location.updateOne(
      { _id: ObjectId(_id) },
      {
        $set: { locationName, locationImage },
      },
      { new: true }
    );
    obj.message = "location updated successfully";
    obj.data = { _id };
    return obj;
  } else {
    if (locationName && locationImage) {
      const find = await Location.findOne({ locationName });
      if (find) {
        obj.status = 401;
        obj.message = "location already exist";
        return obj;
      }
      const SaveLocation = new Location({ locationName, locationImage });
      SaveLocation.save();
      obj.message = "data saved successfully";
      obj.data = SaveLocation;
    }
  }
  return obj;
}

async function createPlan({
  _id,
  planName,
  planPrice,
  planDuration,
  deleteRec,
  userId,
}) {
  const obj = { status: 200, message: "Plan created successfully", data: [] };

  try {
    if (_id || (planName && planPrice && planDuration)) {
      let o = { planName, planPrice, planDuration };

      // Validate _id length when updating
      if (_id) {
        if (_id.length !== 24) {
          obj.status = 401;
          obj.message = "Invalid _id";
          return obj;
        }

        // Check if plan exists for the same name or duration (excluding the current plan)
        const existingPlan = await Plan.findOne({ _id: ObjectId(_id) });
        if (existingPlan) {
          // Handle deletion
          if (deleteRec) {
            await Plan.deleteOne({ _id: ObjectId(_id) });
            await Log({
              message: `Plan with ID ${_id} deleted`,
              functionName: "deletePlan",
              userId,
            });
            obj.message = "Plan deleted successfully";
            return obj;
          }

          // Handle update
          await Plan.updateOne(
            { _id: ObjectId(_id) },
            { $set: o },
            { new: true }
          );
          obj.message = "Plan updated successfully";
          obj.data = o;
        } else {
          obj.status = 404;
          obj.message = "Plan not found";
        }
      } else {
        const duplicatePlan = await Plan.findOne({
          $or: [{ planName }, { planDuration }],
        });

        if (duplicatePlan) {
          obj.status = 401;
          obj.message = "A plan with the same name or duration already exists";
          return obj;
        }

        // Save the new plan
        const newPlan = new Plan(o);
        await newPlan.save();
        obj.message = "New plan saved successfully";
        obj.data = newPlan;
      }
    } else {
      obj.status = 400;
      obj.message = "Invalid data";
    }
  } catch (err) {
    console.error("Error in createPlan:", err.message);
    obj.status = 500;
    obj.message = "An internal error occurred";
  }

  return obj;
}

async function createInvoice({ bookingID, currentBookingId, _id, deleteRec }) {
  const obj = {
    status: 200,
    message: "Invoice created successfully",
    data: [],
  };

  try {
    if (_id && deleteRec === "true") {
      console.log("Entering delete condition");

      // Delete the invoice
      const deleteResult = await InvoiceTbl.deleteOne({ _id });
      console.log("Delete result:", deleteResult);

      if (deleteResult.deletedCount === 0) {
        return { status: 404, message: "Invoice not found." };
      }

      // After successful deletion, update the booking
      if (bookingID) {
        const bookingUpdateResult = await Booking.updateOne(
          { bookingId: bookingID.trim() },
          { $set: { "bookingPrice.isInvoiceCreated": false } }
        );

        console.log("Booking update result:", bookingUpdateResult);

        if (bookingUpdateResult.matchedCount === 0) {
          return {
            status: 404,
            message: "Booking not found to update invoice status",
          };
        }
      } else {
        console.log("No bookingID provided for update");
        return {
          status: 200,
          message:
            "Invoice deleted successfully, but no booking ID provided for update",
        };
      }

      return {
        status: 200,
        message: "Invoice deleted and booking updated successfully",
      };
    }

    // Rest of the function for creating invoices
    console.log("Skipped delete condition, proceeding to create invoice");

    // Fetch booking details
    const bookings = await Booking.findOne({ _id: currentBookingId }).select(
      "userId bookingId paymentStatus bookingPrice vehicleBasic vehicleName"
    );

    if (!bookings) {
      return {
        status: 401,
        message: "Booking not found",
      };
    }

    const {
      userId,
      bookingId,
      bookingPrice,
      paymentStatus,
      vehicleBasic,
      vehicleName,
    } = bookings;

    const userData = await User.findOne({ _id: userId }).select(
      "firstName lastName contact email"
    );

    if (!userData) {
      return {
        status: 401,
        message: "userData not found",
      };
    }

    const { firstName, lastName, contact, email } = userData;
    const paidInvoice = paymentStatus;

    // Validate `paidInvoice` status if provided
    if (
      paidInvoice &&
      ![
        "pending",
        "partiallyPay",
        "partially_paid",
        "paid",
        "failed",
        "refunded",
      ].includes(paidInvoice)
    ) {
      return {
        status: 401,
        message: "Invalid paidInvoice value",
      };
    }

    const existingInvoice = await InvoiceTbl.findOne({ bookingId });
    if (existingInvoice) {
      return {
        status: 401,
        message: "Invoice already exists for this booking",
      };
    }

    // Generate a new invoice number
    const currentYear = new Date().getFullYear();
    const lastInvoice = await InvoiceTbl.findOne({})
      .sort({ createdAt: -1 })
      .select("invoiceNumber");

    let sequence = 1; // Default sequence
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const match = lastInvoice.invoiceNumber.match(
        new RegExp(`INV-${currentYear}-(\\d{5})`)
      );
      if (match) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }

    const newInvoiceNumber = `INV-${currentYear}-${sequence
      .toString()
      .padStart(5, "0")}`;
    const newInvoiceData = {
      userId,
      bookingId,
      bookingPrice,
      paidInvoice,
      invoiceNumber: newInvoiceNumber,
      vehicleBasic,
      vehicleName,
      firstName,
      lastName,
      contact,
      email,
    };

    // Create and save the new invoice
    const newInvoice = new InvoiceTbl(newInvoiceData);
    await newInvoice.save();

    const updateResult = await Booking.updateOne(
      { _id: currentBookingId },
      { $set: { "bookingPrice.isInvoiceCreated": true } },
      { new: true }
    );

    return {
      status: 200,
      message: "New invoice created successfully",
      data: newInvoiceData,
    };
  } catch (error) {
    console.error("Error in createInvoice:", error.message);

    return {
      status: 500,
      message: `Server error: ${error.message}`,
    };
  }
}

async function getAllInvoice(query) {
  const obj = {
    status: 200,
    message: "Invoices retrieved successfully",
    data: [],
    pagination: {},
  };
  const {
    _id,
    bookingId,
    userId,
    paidInvoice,
    stationId,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  try {
    // Create filter object for query
    const filter = {};
    if (_id) filter._id = _id;
    if (bookingId) filter.bookingId = bookingId;
    if (userId) filter.userId = userId;
    if (paidInvoice) filter.paidInvoice = paidInvoice;
    if (stationId) filter.stationId = stationId;

    const sort = {};
    sort[sortBy] = order === "asc" ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const invoices = await InvoiceTbl.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalRecords = await InvoiceTbl.count(filter);
    obj.data = invoices;

    obj.pagination.currentPage = parseInt(page);
    obj.pagination.totalPages = Math.ceil(totalRecords / parseInt(limit));
    obj.pagination.limit = limit;

    obj.message = "Invoices retrieved successfully";
  } catch (error) {
    console.error("Error fetching invoices:", error.message);
    obj.status = 500;
    obj.message = `Server error: ${error.message}`;
  }

  return obj;
}

async function discountCoupons({
  couponName,
  vehicleType,
  allowedUsers,
  usageAllowed,
  discountType,
  _id,
  deleteRec,
  isCouponActive,
}) {
  const obj = {
    status: 200,
    message: "invoice created successfully",
    data: [],
  };
  let o = {
    couponName,
    vehicleType,
    allowedUsers,
    usageAllowed,
    discountType,
    isCouponActive: isCouponActive ? "active" : "inActive",
  };
  if (isCouponActive) {
    let check = ["active", "inActive"].includes(isCouponActive);
    if (!check) {
      obj.status = 401;
      obj.message = "Invalid isCouponActive";
      return obj;
    }
  }
  if (couponName) {
    const find = await Coupon.findOne({ couponName });
    if (find) {
      obj.status = 401;
      obj.message = "coupon already exists";
      return obj;
    }
  }
  if (vehicleType) {
    let check = ["gear", "non-gear", "all"].includes(vehicleType);
    if (!check) {
      obj.status = 401;
      obj.message = "Invalid vehicle type";
      return obj;
    }
  }
  if (discountType) {
    let check = ["percentage", "fixed"].includes(discountType);
    if (!check) {
      obj.status = 401;
      obj.message = "Invalid discount type";
      return obj;
    }
  }
  if (allowedUsers) {
    for (let i = 0; i < allowedUsers.length; i++) {
      const find = await User.findOne({ _id: ObjectId(allowedUsers[i]) });
      if (!find) {
        obj.status = 401;
        obj.message = "Invalid user id";
        return obj;
        break;
      }
    }
  }
  if (_id) {
    if (_id.length !== 24) {
      obj.status = 401;
      obj.message = "invalid _id";
      return obj;
    }
    const find = await Coupon.findOne({ _id: ObjectId(_id) });
    if (!find) {
      obj.status = 401;
      obj.message = "Invalid _id";
      return obj;
    }
  }
  if (_id) {
    const result = await Coupon.findOne({ _id: ObjectId(_id) });
    if (result) {
      if (deleteRec) {
        await Coupon.deleteOne({ _id: ObjectId(_id) });
        await Log({
          message: `Booking with ID ${_id} deleted`,
          functionName: "deletebooking",
          userId,
        });
        obj.message = "Coupon deleted successfully";
        return obj;
      }
      await Coupon.updateOne(
        { _id: ObjectId(_id) },
        {
          $set: o,
        },
        { new: true }
      );
      obj.message = "Coupon updated successfully";
      obj.data = o;
    } else {
      obj.status = 401;
      obj.message = "Invalid coupon _id";
      return obj;
    }
  } else {
    if (
      couponName &&
      vehicleType &&
      allowedUsers &&
      usageAllowed &&
      discountType
    ) {
      const SavePlan = new Coupon(o);
      SavePlan.save();
      obj.message = "new Coupon saved successfully";
      obj.data = o;
    } else {
      obj.status = 401;
      obj.message = "data is missing";
    }
  }
  return obj;
}

async function createStation({
  stationId,
  stationName,
  locationId,
  state,
  city,
  userId,
  address,
  pinCode,
  openStartTime,
  openEndTime,
  latitude,
  longitude,
  _id,
  status,
  deleteRec,
}) {
  const response = { status: 200, message: "Operation successful", data: [] };
  const logError = async (message, functionName, userId) => {
    await Log({ message, functionName, userId });
  };
  function convertTo24Hour(timeString) {
    // Split the string into time and period (AM/PM)
    const [time, period] = timeString.split(" "); // "10:00 PM" -> ["10:00", "PM"]
    const [hour, minutes] = time.split(":"); // "10:00" -> ["10", "00"]

    // Convert hour to a number and adjust for PM/AM
    let hour24 = parseInt(hour, 10);
    if (period === "PM" && hour24 !== 12) {
      hour24 += 12; // Convert PM to 24-hour format
    } else if (period === "AM" && hour24 === 12) {
      hour24 = 0; // Convert 12 AM to 0
    }

    return hour24; // Return only the hour in 24-hour format
  }
  if (openStartTime && openEndTime) {
    openStartTime = convertTo24Hour(openStartTime);
    openEndTime = convertTo24Hour(openEndTime);
  }
  const stationData = {
    country: "India",
    stationId,
    locationId,
    state,
    city,
    address,
    pinCode,
    openStartTime,
    openEndTime,
    latitude,
    longitude,
    userId,
    stationName,
  };

  try {
    // Validate _id if provided
    if (_id) {
      if (_id.length !== 24) {
        response.status = 401;
        response.message = "Invalid _id";
        logError(
          "Found invalid _id during the creating station",
          "createStation",
          userId
        );
        return response;
      }

      const station = await Station.findOne({ _id: ObjectId(_id) });
      if (!station) {
        response.status = 401;
        response.message = "Station not found";
        logError(
          "Station not found during the creating station",
          "createStation",
          userId
        );

        return response;
      }

      if (deleteRec) {
        await Station.deleteOne({ _id: ObjectId(_id) });
        await Log({
          message: `Booking with ID ${_id} deleted`,
          functionName: "deletebooking",
          userId,
        });
        response.message = "Station deleted successfully";
        logError("Station deleted successfully ", "createStation", userId);

        return response;
      }

      if (status) {
        await Station.updateOne(
          { _id: ObjectId(_id) },
          { $set: { status: status } }
        );

        await Log({
          message: `Station with ID ${_id} status updated to inactive`,
          functionName: "updateStationStatus",
          userId,
        });

        response.message = "Station status updated successfully";
        logError(
          "Station status updated successfully",
          "updateStationStatus",
          userId
        );

        return response;
      }

      // Update existing station
      await Station.updateOne({ _id: ObjectId(_id) }, { $set: stationData });
      response.message = "Station updated successfully";
      response.data = stationData;
      logError("Station updated successfully", "createStation", userId);

      return response;
    }

    // Validate required parameters
    const missingParams = [];
    if (!stationName) missingParams.push("stationName");
    if (!locationId) missingParams.push("locationId");
    if (!state) missingParams.push("state");
    if (!city) missingParams.push("city");
    if (!address) missingParams.push("address");
    if (!pinCode) missingParams.push("pinCode");
    if (!userId) missingParams.push("userId");

    if (missingParams.length > 0) {
      response.status = 401;
      response.message = `Missing required parameters: ${missingParams.join(
        ", "
      )}`;
      return response;
    }

    // Validate userId
    if (userId.length !== 24) {
      response.status = 401;
      response.message = "Invalid user ID";
      logError(
        "Invalid user ID found during the creating station",
        "createStation",
        userId
      );

      return response;
    }
    const user = await User.findOne({ _id: ObjectId(userId) });
    if (!user) {
      response.status = 401;
      response.message = "User not found";
      logError(
        "User not found during the creating station",
        "createStation",
        userId
      );

      return response;
    }
    if (user.userType !== "manager") {
      response.status = 401;
      response.message = "User is not a manager";
      logError(
        "User is not a manager found during the creating station",
        "createStation",
        userId
      );

      return response;
    }

    // Validate locationId
    if (locationId.length !== 24) {
      response.status = 401;
      response.message = "Invalid location ID";
      logError(
        "Invalid location ID found during the creating station",
        "createStation",
        userId
      );

      return response;
    }
    const location = await Location.findOne({ locationId });
    // console.log(location)
    if (!location) {
      response.status = 401;
      response.message = "Location not found";
      logError(
        "Location not found during the creating station",
        "createStation",
        userId
      );

      return response;
    }

    // Validate pinCode
    if (pinCode.length !== 6 || isNaN(pinCode)) {
      response.status = 401;
      response.message = "Invalid pin code";
      logError(
        "Invalid pin code found during the creating station",
        "createStation",
        userId
      );

      return response;
    }

    // Generate a random stationId if not provided
    // if (!stationId) {
    //   let isUnique = false;
    //   while (!isUnique) {
    //     const generatedId = generateRandomId();
    //     const existingStation = await Station.findOne({ stationId: generatedId });
    //     if (!existingStation) {
    //       stationId = generatedId;
    //       isUnique = true;
    //     }
    //   }
    //   stationData.stationId = stationId;
    // }

    // Validate stationId
    if (stationId.length !== 6 || isNaN(stationId)) {
      response.status = 401;
      response.message = "Invalid station ID";
      logError(
        "Invalid station ID found during the creating station",
        "createStation",
        userId
      );

      return response;
    }
    const stationExists = await Station.findOne({ stationId });
    console.log(stationExists);
    if (stationExists) {
      response.status = 401;
      response.message = "Station already exists";
      logError(
        "Station already exists found during the creating station",
        "createStation",
        userId
      );

      return response;
    }

    // Save a new station
    const newStation = new Station(stationData);
    await newStation.save();
    response.message = "Station created successfully";
    logError("Station created successfully", "createStation", userId);

    response.data = stationData;
  } catch (error) {
    response.status = 500;
    response.message = `Server error: ${error.message}`;
    logError(`Server error: ${error.message}`, "createStation", userId);
  }

  return response;
}

async function createVehicleMaster({
  vehicleName,
  vehicleType,
  vehicleBrand,
  vehicleImage,
  deleteRec,
  _id,
}) {
  const response = {
    status: "200",
    message: "data fetched successfully",
    data: [],
  };

  const logError = async (message, functionName, userId) => {
    await Log({ message, functionName, userId });
  };

  try {
    const obj = {
      vehicleName,
      vehicleType,
      vehicleBrand,
      vehicleImage,
      _id,
    };
    if (vehicleType) {
      let statusCheck = ["gear", "non-gear"].includes(vehicleType);
      if (!statusCheck) {
        response.status = 401;
        response.message = "Invalid vehicle type";
        logError(
          "Invalid vehicle type found during creating the vehicle master",
          "createVehicleMaster",
          "Admin"
        );
        return response;
      }
    }
    if (_id && _id.length !== 24) {
      response.status = 401;
      response.message = "Invalid _id";
      logError(
        "Invalid _id found during creating the vehicle master",
        "createVehicleMaster",
        "Admin"
      );

      return response;
    }
    if (_id) {
      const find = await VehicleMaster.findOne({ _id: ObjectId(_id) });
      if (!find) {
        response.status = 401;
        response.message = "Invalid vehicle id";
        logError(
          "Invalid vehicle _id found during creating the vehicle master",
          "createVehicleMaster",
          "Admin"
        );

        return response;
      }
      if (deleteRec) {
        await VehicleMaster.deleteOne({ _id: ObjectId(_id) });
        response.message = "vehicle master deleted successfully";
        response.status = 200;
        response.data = { vehicleName };
        logError(
          "vehicle master deleted successfully",
          "createVehicleMaster",
          "Admin"
        );

        return response;
      }
      await VehicleMaster.updateOne(
        { _id: ObjectId(_id) },
        {
          $set: obj,
        },
        { new: true }
      );
      response.status = 200;
      response.message = "vehicle master updated successfully";
      logError(
        "vehicle master updated successfully",
        "createVehicleMaster",
        "Admin"
      );

      response.data = obj;
    } else {
      if (vehicleName && vehicleType && vehicleBrand && vehicleImage) {
        const find = await VehicleMaster.findOne({ vehicleName });
        if (find) {
          response.status = 401;
          response.message = "vehicle master name already exists";
          logError(
            "vehicle master name already exists found during creating the vehicle master",
            "createVehicleMaster",
            "Admin"
          );

          return response;
        }
        const SaveUser = new VehicleMaster(obj);
        SaveUser.save();
        response.message = "vehicle master saved successfully";
        logError(
          "vehicle master saved successfully",
          "createVehicleMaster",
          "Admin"
        );

        response.data = obj;
      } else {
        response.status = 401;
        response.message = "Invalid vehicle master details";
        logError(
          "Invalid vehicle master details found during creating the vehicle master",
          "createVehicleMaster",
          "Admin"
        );
      }
    }
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

async function searchVehicle({
  name,
  pickupLocation,
  brand,
  transmissionType,
  location,
  startDate,
  startTime,
  endDate,
  endTime,
  sort,
  mostBooked,
  bookingDuration,
}) {
  const obj = { status: 200, message: "data fetched successfully", data: [] };
  let momStartTime = moment(startTime, "hh:mm A");
  let momEndTime = moment(endTime, "hh:mm A");
  let getStartDate = startDate;
  let getStartTime = {
    hours: new Date(momStartTime).getHours(),
    minutes: new Date(momStartTime).getMinutes(),
  };
  let getEndDate = endDate;
  let getEndTime = {
    hours: new Date(momEndTime).getHours(),
    minutes: new Date(momEndTime).getMinutes(),
  };
  const filter = {};
  if (name) {
    filter.name = { $regex: ".*" + name + ".*", $options: "i" };
  }
  if (brand) {
    filter.brand = { $regex: ".*" + brand + ".*", $options: "i" };
  }
  if (transmissionType) {
    filter.transmissionType = transmissionType;
  }
  let attachedDevices = [];
  if (bookingDuration) {
    const result = await BookingDuration.findOne({
      "bookingDuration.label": bookingDuration,
    });
    attachedDevices = result._doc.attachedVehicles;
    if (!attachedDevices.length) {
      return { status: 200, message: "No data found", data: [] };
    }
  }
  if (attachedDevices.length) {
    attachedDevices = attachedDevices.map((obj) => {
      return ObjectId(obj);
    });
  }
  const response = await Vehicle.find(filter);
  if (response && response.length) {
    const finalArr = [];
    for (let i = 0; i < response.length; i++) {
      const { _doc } = response[i];
      const o = _doc;
      const bookFilter = { vehicleId: ObjectId(o._id) };
      if (pickupLocation) {
        bookFilter.pickupLocation = pickupLocation;
      }
      if (location) {
        bookFilter.location = location;
      }
      if (attachedDevices.length) {
        bookFilter._id = { $in: attachedDevices };
      }
      let bookRes = await Booking.find(bookFilter);
      if (bookRes.length) {
        let getInitElement = "";
        let vehicleCount = 0;
        for (let i = 0; i < bookRes.length; i++) {
          const { _doc } = bookRes[i];
          let BookingStartDateAndTime = _doc.BookingStartDateAndTime;
          let BookingEndDateAndTime = _doc.BookingEndDateAndTime;
          let isBooked = _doc.isBooked;
          if (BookingEndDateAndTime && BookingStartDateAndTime && isBooked) {
            const { startDate, startTime } = BookingStartDateAndTime;
            const { endDate, endTime } = BookingEndDateAndTime;
            let bookingStartHours = new Date(
              moment(startTime, "hh:mm A")
            ).getHours();
            let bookingEndHours = new Date(
              moment(endTime, "hh:mm A")
            ).getHours();
            let bookingStartMinutes = new Date(
              moment(startTime, "hh:mm A")
            ).getMinutes();
            let bookingEndMinutes = new Date(
              moment(endTime, "hh:mm A")
            ).getMinutes();
            let checkSoldOut = false;
            let bookingStartDate = moment(startDate)
              .add(bookingStartHours, "hours")
              .add(bookingStartMinutes, "minutes");
            bookingStartDate = new Date(bookingStartDate.format()).getTime();
            let currentStartDate = moment(getStartDate)
              .add(getStartTime.hours, "hours")
              .add(getStartTime.minutes, "minutes");
            currentStartDate = new Date(currentStartDate.format()).getTime();
            let currentEndDate = moment(getEndDate)
              .add(getEndTime.hours, "hours")
              .add(getEndTime.minutes, "minutes");
            currentEndDate = new Date(currentEndDate.format()).getTime();
            let bookingEndDate = moment(endDate)
              .add(bookingEndHours, "hours")
              .add(bookingEndMinutes, "minutes");
            bookingEndDate = new Date(bookingEndDate.format()).getTime();
            if (
              currentStartDate >= bookingStartDate &&
              currentStartDate <= bookingEndDate
            ) {
              checkSoldOut = true;
            } else if (
              currentEndDate >= bookingStartDate &&
              currentStartDate <= bookingEndDate
            ) {
              checkSoldOut = true;
            } else {
              if (!getInitElement) {
                getInitElement = _doc;
              }
              checkSoldOut = false;
            }
            if (!checkSoldOut) {
              vehicleCount = vehicleCount + 1;
            }
          } else {
            getInitElement = _doc;
            vehicleCount = vehicleCount + 1;
          }
        }
        o.vehicleCount = vehicleCount;
        finalArr.push({ ...o, ...getInitElement });
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
    obj.data = finalArr;
  } else {
    obj.status = 401;
    obj.message = "data not found";
  }
  return obj;
}

const getVehicleMasterData = async (query) => {
  const obj = {
    status: 200,
    message: "Data fetched successfully",
    data: [],
    pagination: {},
  };

  try {
    const {
      page = 1,
      limit = 10,
      vehicleName,
      vehicleType,
      vehicleBrand,
      _id,
      search,
      fetchAll = false,
    } = query;

    const filter = {};
    if (_id) filter._id = _id;
    if (vehicleName) filter.vehicleName = vehicleName;
    if (vehicleType) filter.vehicleType = vehicleType;
    if (vehicleBrand) filter.vehicleBrand = vehicleBrand;

    if (search) {
      filter.$or = [
        { vehicleName: { $regex: search, $options: "i" } },
        { vehicleType: { $regex: search, $options: "i" } },
        { vehicleBrand: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    let queryBuilder = VehicleMaster.find(filter).sort({ createdAt: -1 });

    if (!fetchAll) {
      queryBuilder = queryBuilder.skip(skip).limit(Number(limit));
    }

    const response = await queryBuilder;
    const totalRecords = await VehicleMaster.countDocuments(filter);

    if (response.length) {
      const vehicleData = await Promise.all(
        response.map(async (vehicle) => {
          const vehicleCount = await VehicleTable.countDocuments({
            vehicleMasterId: vehicle._id,
            hasAC: true,
          });

          return {
            ...vehicle.toObject(),
            vehicleCount,
          };
        })
      );

      obj.data = vehicleData;

      if (!fetchAll) {
        obj.pagination = {
          totalPages: Math.ceil(totalRecords / limit),
          currentPage: Number(page),
          limit: Number(limit),
        };
      } else {
        obj.pagination = {
          totalRecords,
          totalPages: 1,
          currentPage: 1,
          limit: totalRecords,
        };
      }
    } else {
      obj.status = 404;
      obj.message = "No data found";
    }
  } catch (error) {
    console.error("Error in getVehicleMasterData:", error.message);
    obj.status = 500;
    obj.message = "Internal server error";
  }

  return obj;
};

const getBookings_bk = async (query) => {
  const obj = { status: 200, message: "data fetched successfully", data: [] };
  const {
    vehicleTableId,
    bookingStartDate,
    bookingEndDate,
    bookingStartTime,
    bookingEndTime,
    bookingPrice,
    bookingStatus,
    paymentStatus,
    rideStatus,
    paymentMethod,
    payInitFrom,
    paySuccessId,
    firstName,
    lastName,
    userType,
    contact,
    email,
    longitude,
    latitude,
    address,
    stationName,
    stationId,
    locationName,
    city,
    state,
    pinCode,
    vehicleName,
    vehicleType,
    vehicleBrand,
    vehicleBookingStatus,
    vehicleStatus,
    freeKms,
    extraKmsCharges,
    vehicleNumber,
    vehicleModel,
    vehicleColor,
    perDayCost,
    lastServiceDate,
    kmsRun,
    isBooked,
    condition,
  } = query;
  let mainObj = {};
  if (mainObj._id) {
    mainObj._id = ObjectId(query._id);
  }
  let startDate = null;
  let startTime = null;
  let endDate = null;
  let endTime = null;
  let totalPrice = null;
  let vehiclePrice = null;
  let tax = null;
  let roundPrice = null;
  let extraAddonPrice = null;

  if (bookingPrice) {
    totalPrice = bookingPrice.totalPrice;
    vehiclePrice = bookingPrice.vehiclePrice;
    tax = bookingPrice.tax;
    roundPrice = bookingPrice.roundPrice;
    extraAddonPrice = bookingPrice.extraAddonPrice;
  }
  bookingStartDate && Date.parse(bookingStartDate)
    ? (mainObj["BookingStartDateAndTime.startDate"] = bookingStartDate)
    : null;
  bookingEndDate && Date.parse(bookingEndDate)
    ? (mainObj["BookingEndDateAndTime.endDate"] = bookingEndDate)
    : null;
  bookingStartTime
    ? (mainObj["BookingStartDateAndTime.startTime"] = bookingStartTime)
    : null;
  bookingEndTime
    ? (mainObj["BookingEndDateAndTime.endTime"] = bookingEndTime)
    : null;
  totalPrice ? (mainObj.bookingPrice.totalPrice = totalPrice) : null;
  vehiclePrice ? (mainObj.bookingPrice.vehiclePrice = vehiclePrice) : null;
  tax ? (mainObj.bookingPrice.tax = tax) : null;
  roundPrice ? (mainObj.bookingPrice.roundPrice = roundPrice) : null;
  extraAddonPrice
    ? (mainObj.bookingPrice.extraAddonPrice = extraAddonPrice)
    : null;

  bookingPrice ? (mainObj.bookingPrice = bookingPrice) : null;
  bookingStatus ? (mainObj.bookingStatus = bookingStatus) : null;
  paymentStatus ? (mainObj.paymentStatus = paymentStatus) : null;
  rideStatus ? (mainObj.rideStatus = rideStatus) : null;
  paymentMethod ? (mainObj.paymentMethod = paymentMethod) : null;
  payInitFrom ? (mainObj.payInitFrom = payInitFrom) : null;
  paySuccessId ? (mainObj.paySuccessId = paySuccessId) : null;
  const response = await Booking.find(mainObj);
  if (response) {
    const arr = [];
    for (let i = 0; i < response.length; i++) {
      const { _doc } = response[i];
      let o = _doc;

      console.log(response);
      let find1 = null;
      let find2 = null;
      let find3 = null;
      let find4 = null;
      let find5 = null;

      let obj1 = {};
      stationName ? (obj1.stationName = stationName) : null;
      stationId ? (obj1.stationId = stationId) : null;
      city ? (obj1.city = city) : null;
      state ? (obj1.state = state) : null;
      pinCode ? (obj1.pinCode = pinCode) : null;
      address ? (obj1.address = address) : null;
      latitude ? (obj1.latitude = latitude) : null;
      longitude ? (obj1.longitude = longitude) : null;
      find1 = await station.findOne({ ...obj1 });
      if (find1) {
        let obj = { _id: ObjectId(find1._doc.locationId) };
        locationName ? (obj.locationName = locationName) : null;
        find2 = await Location.findOne({ ...obj });
      }
      let obj2 = { _id: ObjectId(o.vehicleTableId) };
      vehicleBookingStatus
        ? (obj2.vehicleBookingStatus = vehicleBookingStatus)
        : null;
      vehicleStatus ? (obj2.vehicleStatus = vehicleStatus) : null;
      freeKms ? (obj2.freeKms = freeKms) : null;
      extraKmsCharges ? (obj2.extraKmsCharges = extraKmsCharges) : null;
      vehicleNumber ? (obj2.vehicleNumber = vehicleNumber) : null;
      vehicleModel ? (obj2.vehicleModel = vehicleModel) : null;
      vehicleColor ? (obj2.vehicleColor = vehicleColor) : null;
      perDayCost ? (obj2.perDayCost = perDayCost) : null;
      lastServiceDate && Date.parse(lastServiceDate)
        ? (obj2.lastServiceDate = lastServiceDate)
        : null;
      kmsRun ? (obj2.kmsRun = kmsRun) : null;
      isBooked ? (obj2.isBooked = isBooked) : null;
      condition ? (obj2.condition = condition) : null;
      find3 = await vehicleTable.findOne({ ...obj2 });
      if (find3) {
        const obj = { _id: ObjectId(find3._doc.vehicleId) };
        vehicleName ? (obj.vehicleName = vehicleName) : null;
        vehicleType ? (obj.vehicleType = vehicleType) : null;
        vehicleBrand ? (obj.vehicleBrand = vehicleBrand) : null;
        find4 = await VehicleMaster.findOne({ ...obj });
      }
      let obj3 = { _id: ObjectId(o.userId) };
      contact ? (obj3.contact = contact) : null;
      find5 = await User.findOne({ ...obj3 });

      if (find1 && find2 && find3 && find4 && find5) {
        delete find1._id;
        delete find2._id;
        delete find3._id;
        delete find4._id;
        delete find5._id;
        o = {
          ...o,
          ...find1?._doc,
          ...find2?._doc,
          ...find3?._doc,
          ...find4?._doc,
          ...find5?._doc,
        };
        arr.push(o);
      }
    }
    obj.data = arr;
  } else {
    obj.status = 401;
    obj.message = "data not found";
  }
  if (!obj.data.length) {
    obj.message = "data not found";
  }
  return obj;
};

const getVehicleTbl = async (query) => {
  const response = {
    status: 200,
    message: "Data fetched successfully",
    data: [],
  };

  try {
    const {
      vehiclePlan,
      vehicleModel,
      condition,
      BookingStartDateAndTime,
      BookingEndDateAndTime,
      _id,
      vehicleBrand,
      vehicleType,
      stationId,
      locationId,
      page = 1,
      limit = 20,
      search,
    } = query;
    if (!locationId) {
      if (!_id && !BookingStartDateAndTime && !BookingEndDateAndTime) {
        return {
          status: 400,
          message: "Booking start and end dates are required.",
          data: [],
        };
      }
    }

    function isValidISO8601(dateString) {
      if (!dateString) return false;

      // More flexible ISO date validation
      try {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
      } catch (e) {
        return false;
      }
    }

    const startDateValidation = isValidISO8601(BookingStartDateAndTime);
    const endDateValidation = isValidISO8601(BookingEndDateAndTime);

    if (!startDateValidation || !endDateValidation) {
      return {
        status: 400,
        message: "Invalid date format",
        data: [],
      };
    }

    const startDate = BookingStartDateAndTime;
    const endDate = BookingEndDateAndTime;
    const matchFilter = {};

    if (_id) {
      matchFilter._id = _id.length === 24 ? new ObjectId(_id) : _id;
    } else {
      if (vehicleModel) matchFilter.vehicleModel = vehicleModel;
      if (condition) matchFilter.condition = condition;
      if (stationId) matchFilter.stationId = stationId;
      if (locationId) matchFilter.locationId = new ObjectId(locationId);
      if (Array.isArray(vehiclePlan)) {
        matchFilter["vehiclePlan._id"] = {
          $in: vehiclePlan.map((id) => new ObjectId(id)),
        };
      } else if (vehiclePlan) {
        matchFilter["vehiclePlan._id"] = new ObjectId(vehiclePlan);
      }
    }

    const parsedPage = Math.max(parseInt(page, 10), 1);
    const parsedLimit = Math.max(parseInt(limit, 10), 1);

    const pipeline = [
      { $match: matchFilter },
      ...(search
        ? [
            {
              $lookup: {
                from: "vehiclemasters",
                localField: "vehicleMasterId",
                foreignField: "_id",
                as: "searchVehicleMaster",
              },
            },
            {
              $match: {
                $or: [
                  { vehicleNumber: { $regex: search, $options: "i" } },
                  {
                    "searchVehicleMaster.vehicleName": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                ],
              },
            },
          ]
        : []),
      // Lookup bookings for the vehicle
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "vehicleTableId",
          as: "bookings",
        },
      },
      // Lookup station data
      {
        $lookup: {
          from: "stations",
          localField: "stationId",
          foreignField: "stationId",
          as: "stationData",
        },
      },

      // Lookup vehicle master data
      {
        $lookup: {
          from: "vehiclemasters",
          localField: "vehicleMasterId",
          foreignField: "_id",
          as: "vehicleMasterData",
        },
      },

      // Lookup maintenance records
      {
        $lookup: {
          from: "maintenancevehicles",
          localField: "_id",
          foreignField: "vehicleTableId",
          as: "maintenanceData",
        },
      },
      // Filter conflicting bookings & maintenance
      {
        $addFields: {
          conflictingBookings: {
            $filter: {
              input: "$bookings",
              as: "booking",
              cond: {
                $and: [
                  { $ne: ["$$booking.rideStatus", "canceled"] },
                  {
                    $or: [
                      {
                        $and: [
                          {
                            $gte: [
                              "$$booking.BookingStartDateAndTime",
                              startDate,
                            ],
                          },
                          {
                            $lte: [
                              "$$booking.BookingStartDateAndTime",
                              endDate,
                            ],
                          },
                        ],
                      },
                      {
                        $and: [
                          {
                            $gte: [
                              "$$booking.BookingEndDateAndTime",
                              startDate,
                            ],
                          },
                          {
                            $lte: ["$$booking.BookingEndDateAndTime", endDate],
                          },
                        ],
                      },
                      {
                        $and: [
                          {
                            $lte: [
                              "$$booking.BookingStartDateAndTime",
                              startDate,
                            ],
                          },
                          {
                            $gte: ["$$booking.BookingEndDateAndTime", endDate],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
          conflictingMaintenance: {
            $filter: {
              input: "$maintenanceData",
              as: "maintenance",
              cond: {
                $or: [
                  {
                    $and: [
                      { $gte: ["$$maintenance.startDate", startDate] },
                      { $lte: ["$$maintenance.startDate", endDate] },
                    ],
                  },
                  {
                    $and: [
                      { $gte: ["$$maintenance.endDate", startDate] },
                      { $lte: ["$$maintenance.endDate", endDate] },
                    ],
                  },
                  {
                    $and: [
                      { $lte: ["$$maintenance.startDate", startDate] },
                      { $gte: ["$$maintenance.endDate", endDate] },
                    ],
                  },
                ],
              },
            },
          },
        },
      },

      // Match active vehicles and filter out those with conflicting bookings or maintenance
      {
        $match: {
          vehicleStatus: "active",
          "conflictingBookings.0": { $exists: false },
          "conflictingMaintenance.0": { $exists: false },
        },
      },

      // Flatten vehicle master and station data
      {
        $addFields: {
          vehicleMasterData: { $arrayElemAt: ["$vehicleMasterData", 0] },
          stationData: { $arrayElemAt: ["$stationData", 0] },
        },
      },

      // Apply additional filters
      {
        $match: {
          ...(vehicleBrand
            ? { "vehicleMasterData.vehicleBrand": vehicleBrand }
            : {}),
          ...(vehicleType
            ? { "vehicleMasterData.vehicleType": vehicleType }
            : {}),
        },
      },

      // Project the required fields
      {
        $project: {
          _id: 1,
          vehicleImage: "$vehicleMasterData.vehicleImage",
          vehicleBrand: "$vehicleMasterData.vehicleBrand",
          vehicleName: "$vehicleMasterData.vehicleName",
          vehicleType: "$vehicleMasterData.vehicleType",
          stationName: "$stationData.stationName",
          speedLimit: 1,
          refundableDeposit: 1,
          lateFee: 1,
          vehicleStatus: 1,
          freeKms: 1,
          vehicleMasterId: 1,
          extraKmsCharges: 1,
          vehicleNumber: 1,
          vehicleModel: 1,
          vehiclePlan: 1,
          perDayCost: 1,
          lastServiceDate: 1,
          kmsRun: 1,
          condition: 1,
          locationId: 1,
          stationId: 1,
        },
      },

      // Pagination using $facet
      {
        $facet: {
          totalCount: [{ $count: "totalRecords" }],
          data: [
            { $skip: (parsedPage - 1) * parsedLimit },
            { $limit: parsedLimit },
          ],
        },
      },
    ];

    let vehicles = await vehicleTable.aggregate(pipeline);

    if (!vehicles.length || !vehicles[0].totalCount.length) {
      response.status = 404;
      response.message = "No records found";
      response.data = [];
      response.pagination = {
        totalPages: 0,
        currentPage: parsedPage,
        limit: parsedLimit,
      };
      return response;
    }

    const vehicleData = vehicles[0].data || [];
    const adjustedVehicles = [];
    const pricingRules = await General.findOne({});

    // Apply pricing rules to each vehicle
    for (const vehicle of vehicleData) {
      const adjustedVehicle = { ...vehicle };

      if (pricingRules) {
        // Get original per day cost
        const originalPerDayCost = adjustedVehicle.perDayCost;

        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);

        // Calculate total rental cost by applying different rates for each day
        let totalRentalCost = 0;
        const daysBreakdown = [];

        // Calculate booking duration in days
        const bookingDurationMs = endDateObj - startDateObj;
        const bookingDurationDays = Math.ceil(
          bookingDurationMs / (1000 * 60 * 60 * 24)
        );

        // Check if booking contains any weekend days
        let hasWeekendDays = false;
        let weekendPerDayCost = originalPerDayCost;

        if (pricingRules.weakend) {
          const weekendPrice = pricingRules.weakend.Price;
          const weekendPriceType = pricingRules.weakend.PriceType;

          if (weekendPriceType === "+") {
            weekendPerDayCost =
              Number(originalPerDayCost) +
              (Number(originalPerDayCost) * Number(weekendPrice)) / 100;
          } else if (weekendPriceType === "-") {
            weekendPerDayCost =
              Number(originalPerDayCost) -
              (Number(originalPerDayCost) * Number(weekendPrice)) / 100;
          }

          weekendPerDayCost = Math.round(weekendPerDayCost);
        }

        // Loop through each day in the booking period
        const currentDate = new Date(startDateObj);
        const dayOfWeek = currentDate.getDay();
        const isDateOnWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        while (currentDate < endDateObj) {
          const dayOfWeek = currentDate.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          if (isWeekend) {
            hasWeekendDays = true;
          }

          let dailyRate = originalPerDayCost;

          // Apply weekend pricing if it's a weekend day
          if (isWeekend && pricingRules.weakend) {
            const weekendPrice = pricingRules.weakend.Price;
            const weekendPriceType = pricingRules.weakend.PriceType;

            if (weekendPriceType === "+") {
              dailyRate =
                Number(originalPerDayCost) +
                (Number(originalPerDayCost) * Number(weekendPrice)) / 100;
            } else if (weekendPriceType === "-") {
              dailyRate =
                Number(originalPerDayCost) -
                (Number(originalPerDayCost) * Number(weekendPrice)) / 100;
            }
          }

          // Check if the day falls within any special day range
          if (pricingRules.specialDays && pricingRules.specialDays.length > 0) {
            for (const specialDay of pricingRules.specialDays) {
              const fromDate = new Date(specialDay.From);
              const toDate = new Date(specialDay.Too);

              if (currentDate >= fromDate && currentDate <= toDate) {
                const specialPrice = specialDay.Price;
                const specialPriceType = specialDay.PriceType;

                if (specialPriceType === "+") {
                  dailyRate =
                    Number(originalPerDayCost) +
                    (Number(originalPerDayCost) * Number(specialPrice)) / 100;
                } else if (specialPriceType === "-") {
                  dailyRate =
                    Number(originalPerDayCost) -
                    (Number(originalPerDayCost) * Number(specialPrice)) / 100;
                }

                break;
              }
            }
          }

          // Add the daily rate to the total rental cost
          totalRentalCost += dailyRate;

          // Store information about this day for internal use
          daysBreakdown.push({
            date: new Date(currentDate),
            isWeekend,
            dailyRate: Math.round(dailyRate),
          });

          // Move to the next day
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Store the original per day cost
        adjustedVehicle.originalPerDayCost = originalPerDayCost;

        // Display weekend per day cost if booking includes weekend days
        // if (hasWeekendDays) {
        if (isDateOnWeekend) {
          adjustedVehicle.perDayCost = weekendPerDayCost;
        } else {
          adjustedVehicle.perDayCost = originalPerDayCost;
        }

        // Add total rental cost
        adjustedVehicle.totalRentalCost = Math.round(totalRentalCost);

        adjustedVehicle._daysBreakdown = daysBreakdown;
      }

      adjustedVehicles.push(adjustedVehicle);
    }

    // Extract total records and calculate total pages
    const totalRecords = vehicles[0].totalCount[0]?.totalRecords || 0;
    const totalPages = Math.ceil(totalRecords / parsedLimit);

    // Set response with all vehicles
    response.data = adjustedVehicles;
    response.status = 200;
    response.message = "Data fetched successfully";
    response.pagination = {
      totalRecords,
      totalPages,
      currentPage: parsedPage,
      limit: parsedLimit,
    };
  } catch (error) {
    console.error("Error in getVehicleTblData:", error.message);
    response.status = 500;
    response.message = `Internal server error: ${error.message}`;
  }

  return response;
};

const getVehicleTblData = async (query) => {
  const response = {
    status: 200,
    message: "Data fetched successfully",
    data: [],
  };

  try {
    const {
      vehiclePlan,
      vehicleModel,
      condition,
      BookingStartDateAndTime,
      BookingEndDateAndTime,
      _id,
      vehicleBrand,
      vehicleType,
      stationId,
      locationId,
      page = 1,
      limit = 20,
      bypassLimit = false,
      search,
    } = query;

    // All validation code remains the same
    if (
      !locationId &&
      !_id &&
      (!BookingStartDateAndTime || !BookingEndDateAndTime)
    ) {
      return {
        status: 400,
        message: "Booking start and end dates are required.",
        data: [],
      };
    }

    function isValidISO8601(dateString) {
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
      return (
        iso8601Regex.test(dateString) && !isNaN(new Date(dateString).getTime())
      );
    }

    if (
      !isValidISO8601(BookingStartDateAndTime) ||
      !isValidISO8601(BookingEndDateAndTime)
    ) {
      return {
        status: 400,
        message: "Invalid date format",
        data: [],
      };
    }

    const startDate = BookingStartDateAndTime;
    const endDate = BookingEndDateAndTime;

    const matchFilter = {};

    if (_id) {
      matchFilter._id = ObjectId.isValid(_id) ? new ObjectId(_id) : _id;
    } else {
      if (vehicleModel) matchFilter.vehicleModel = vehicleModel;
      if (condition) matchFilter.condition = condition;
      if (stationId) matchFilter.stationId = stationId;
      if (locationId && ObjectId.isValid(locationId)) {
        matchFilter.locationId = new ObjectId(locationId);
      }
      if (Array.isArray(vehiclePlan)) {
        matchFilter["vehiclePlan._id"] = {
          $in: vehiclePlan.map((id) => new ObjectId(id)),
        };
      } else if (vehiclePlan) {
        matchFilter["vehiclePlan._id"] = new ObjectId(vehiclePlan);
      }
    }

    const pipeline = [
      { $match: matchFilter },
      ...(search
        ? [
            {
              $lookup: {
                from: "vehiclemasters",
                localField: "vehicleMasterId",
                foreignField: "_id",
                as: "searchVehicleMaster",
              },
            },
            {
              $match: {
                $or: [
                  {
                    "searchVehicleMaster.vehicleName": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    "searchVehicleMaster.vehicleBrand": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                ],
              },
            },
            {
              $unset: "searchVehicleMaster",
            },
          ]
        : []),
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "vehicleTableId",
          as: "bookings",
        },
      },
      {
        $lookup: {
          from: "stations",
          localField: "stationId",
          foreignField: "stationId",
          as: "stationData",
        },
      },
      {
        $lookup: {
          from: "vehiclemasters",
          localField: "vehicleMasterId",
          foreignField: "_id",
          as: "vehicleMasterData",
        },
      },
      {
        $lookup: {
          from: "maintenancevehicles",
          localField: "_id",
          foreignField: "vehicleTableId",
          as: "maintenanceData",
        },
      },

      {
        $addFields: {
          conflictingBookings: {
            $filter: {
              input: "$bookings",
              as: "booking",
              cond: {
                $and: [
                  {
                    $ne: ["$$booking.rideStatus", "canceled"],
                  },
                  {
                    $not: [
                      { $lt: ["$$booking.BookingEndDateAndTime", startDate] },
                    ],
                  },
                  {
                    $or: [
                      {
                        $and: [
                          {
                            $gte: [
                              "$$booking.BookingStartDateAndTime",
                              startDate,
                            ],
                          },
                          {
                            $lte: [
                              "$$booking.BookingStartDateAndTime",
                              endDate,
                            ],
                          },
                        ],
                      },
                      {
                        $and: [
                          {
                            $gte: [
                              "$$booking.BookingEndDateAndTime",
                              startDate,
                            ],
                          },
                          {
                            $lte: ["$$booking.BookingEndDateAndTime", endDate],
                          },
                        ],
                      },
                      {
                        $and: [
                          {
                            $lte: [
                              "$$booking.BookingStartDateAndTime",
                              startDate,
                            ],
                          },
                          {
                            $gte: ["$$booking.BookingEndDateAndTime", endDate],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
          conflictingMaintenance: {
            $filter: {
              input: "$maintenanceData",
              as: "maintenance",
              cond: {
                $or: [
                  {
                    $and: [
                      { $gte: ["$$maintenance.startDate", startDate] },
                      { $lte: ["$$maintenance.startDate", endDate] },
                    ],
                  },
                  {
                    $and: [
                      { $gte: ["$$maintenance.endDate", startDate] },
                      { $lte: ["$$maintenance.endDate", endDate] },
                    ],
                  },
                  {
                    $and: [
                      { $lte: ["$$maintenance.startDate", startDate] },
                      { $gte: ["$$maintenance.endDate", endDate] },
                    ],
                  },
                ],
              },
            },
          },
        },
      },

      {
        $addFields: {
          vehicleMasterData: { $arrayElemAt: ["$vehicleMasterData", 0] },
          stationData: { $arrayElemAt: ["$stationData", 0] },
        },
      },

      {
        $match: {
          vehicleStatus: "active",
          ...(vehicleBrand
            ? { "vehicleMasterData.vehicleBrand": vehicleBrand }
            : {}),
          ...(vehicleType
            ? { "vehicleMasterData.vehicleType": vehicleType }
            : {}),
        },
      },
    ];

    // Get total count for pagination
    const countPipeline = [{ $match: matchFilter }, { $count: "totalRecords" }];
    const cursor = vehicleTable.aggregate(countPipeline);
    const totalRecords = cursor.length ? cursor[0]?.totalRecords || 0 : 0;

    // Execute the pipeline to get all vehicles
    const allVehicles = await vehicleTable.aggregate(pipeline);

    // Now separate available and excluded vehicles
    const availableVehicles = allVehicles.filter(
      (vehicle) =>
        vehicle.conflictingBookings.length === 0 &&
        vehicle.conflictingMaintenance.length === 0
    );

    const excludedVehicles = allVehicles.filter(
      (vehicle) =>
        vehicle.conflictingBookings.length > 0 ||
        vehicle.conflictingMaintenance.length > 0
    );

    const groupAvailableVehicles = {};
    const groupExcludedVehicles = {};

    // Group available vehicles
    availableVehicles.forEach((vehicle) => {
      const groupKey = `${vehicle.vehicleModel}-${
        vehicle.vehicleMasterData?.vehicleBrand || ""
      }-${vehicle.vehicleMasterData?.vehicleName || ""}-${vehicle.perDayCost}`;

      if (!groupAvailableVehicles[groupKey]) {
        groupAvailableVehicles[groupKey] = {
          ...vehicle,
          vehicleNumber: undefined,
          lastServiceDate: undefined,
          kmsRun: undefined,
          lastMeterReading: undefined,
          vehicleDetails: [
            {
              _id: vehicle._id,
              vehicleNumber: vehicle.vehicleNumber,
              lastServiceDate: vehicle.lastServiceDate,
              kmsRun: vehicle.kmsRun,
              lastMeterReading: vehicle.lastMeterReading || null,
            },
          ],
        };
      } else {
        groupAvailableVehicles[groupKey].vehicleDetails.push({
          _id: vehicle._id,
          vehicleNumber: vehicle.vehicleNumber,
          lastServiceDate: vehicle.lastServiceDate,
          kmsRun: vehicle.kmsRun,
          lastMeterReading: vehicle.lastMeterReading || null,
        });
      }
    });

    // Group excluded vehicles with the same approach
    excludedVehicles.forEach((vehicle) => {
      const groupKey = `${vehicle.vehicleModel}-${
        vehicle.vehicleMasterData?.vehicleBrand || ""
      }-${vehicle.vehicleMasterData?.vehicleName || ""}-${vehicle.perDayCost}`;

      if (!groupExcludedVehicles[groupKey]) {
        groupExcludedVehicles[groupKey] = {
          ...vehicle,
          vehicleNumber: undefined,
          lastServiceDate: undefined,
          kmsRun: undefined,
          lastMeterReading: undefined,
          vehicleDetails: [
            {
              _id: vehicle._id,
              vehicleNumber: vehicle.vehicleNumber,
              lastServiceDate: vehicle.lastServiceDate,
              kmsRun: vehicle.kmsRun,
              lastMeterReading: vehicle.lastMeterReading || null,
              BookingStartDate:
                vehicle.bookings.length > 0
                  ? vehicle.bookings[vehicle.bookings.length - 1]
                      .BookingStartDateAndTime
                  : null,
              BookingEndDate:
                vehicle.bookings.length > 0
                  ? vehicle.bookings[vehicle.bookings.length - 1]
                      .BookingEndDateAndTime
                  : null,
              MaintenanceStartDate:
                vehicle.maintenanceData.length > 0
                  ? vehicle.maintenanceData[vehicle.maintenanceData.length - 1]
                      .startDate
                  : null,
              MaintenanceEndDate:
                vehicle.maintenanceData.length > 0
                  ? vehicle.maintenanceData[vehicle.maintenanceData.length - 1]
                      .endDate
                  : null,
            },
          ],
        };
      } else {
        groupExcludedVehicles[groupKey].vehicleDetails.push({
          _id: vehicle._id,
          vehicleNumber: vehicle.vehicleNumber,
          lastServiceDate: vehicle.lastServiceDate,
          kmsRun: vehicle.kmsRun,
          lastMeterReading: vehicle.lastMeterReading || null,
          BookingStartDate:
            vehicle.bookings.length > 0
              ? vehicle.bookings[vehicle.bookings.length - 1]
                  .BookingStartDateAndTime
              : null,
          BookingEndDate:
            vehicle.bookings.length > 0
              ? vehicle.bookings[vehicle.bookings.length - 1]
                  .BookingEndDateAndTime
              : null,
          MaintenanceStartDate:
            vehicle.maintenanceData.length > 0
              ? vehicle.maintenanceData[vehicle.maintenanceData.length - 1]
                  .startDate
              : null,
          MaintenanceEndDate:
            vehicle.maintenanceData.length > 0
              ? vehicle.maintenanceData[vehicle.maintenanceData.length - 1]
                  .endDate
              : null,
        });
      }
    });

    // Convert the grouped objects to arrays
    const groupedAvailableArray = Object.values(groupAvailableVehicles);
    const groupedExcludedArray = Object.values(groupExcludedVehicles);

    // Clean up unwanted data
    const cleanGroupedAvailable = groupedAvailableArray.map((vehicle) => {
      const {
        conflictingBookings,
        conflictingMaintenance,
        bookings,
        maintenanceData,
        ...rest
      } = vehicle;

      return {
        ...rest,
        vehicleBrand: vehicle.vehicleMasterData?.vehicleBrand || "",
        vehicleName: vehicle.vehicleMasterData?.vehicleName || "",
        vehicleType: vehicle.vehicleMasterData?.vehicleType || "",
        vehicleImage: vehicle.vehicleMasterData?.vehicleImage || "",
        stationName: vehicle.stationData?.stationName || "",
      };
    });

    const cleanGroupedExcluded = groupedExcludedArray.map((vehicle) => {
      const {
        conflictingBookings,
        conflictingMaintenance,
        bookings,
        maintenanceData,
        ...rest
      } = vehicle;

      return {
        ...rest,
        vehicleBrand: vehicle.vehicleMasterData?.vehicleBrand || "",
        vehicleName: vehicle.vehicleMasterData?.vehicleName || "",
        vehicleType: vehicle.vehicleMasterData?.vehicleType || "",
        vehicleImage: vehicle.vehicleMasterData?.vehicleImage || "",
        stationName: vehicle.stationData?.stationName || "",
      };
    });

    // Apply pagination to grouped data
    const totalGroupedRecords =
      cleanGroupedAvailable.length + cleanGroupedExcluded.length;
    const parsedPage = Math.max(parseInt(page, 10), 1);
    const parsedLimit = bypassLimit ? 10000 : Math.max(parseInt(limit, 10), 1);
    const totalPages = Math.ceil(totalGroupedRecords / parsedLimit);

    // Calculate start and end indices for pagination
    const startIndex = (parsedPage - 1) * parsedLimit;
    const endIndex = startIndex + parsedLimit;

    // Apply pagination
    let paginatedAvailable = cleanGroupedAvailable;
    let paginatedExcluded = cleanGroupedExcluded;

    if (!bypassLimit) {
      const allGroupedVehicles = [
        ...cleanGroupedExcluded,
        ...cleanGroupedAvailable,
      ];
      const paginatedGroups = allGroupedVehicles.slice(startIndex, endIndex);

      // Separate back into available and excluded
      paginatedAvailable = paginatedGroups.filter((v) =>
        cleanGroupedAvailable.some(
          (av) => av._id && v._id && av._id.toString() === v._id.toString()
        )
      );
      paginatedExcluded = paginatedGroups.filter((v) =>
        cleanGroupedExcluded.some(
          (ex) => ex._id && v._id && ex._id.toString() === v._id.toString()
        )
      );
    }

    // Apply pricing rules to available vehicles
    const pricingRules = await General.findOne({});

    // if (pricingRules) {
    //   paginatedAvailable = paginatedAvailable.map((groupedVehicle) => {
    //     const adjustedVehicle = { ...groupedVehicle };
    //     const originalPerDayCost = adjustedVehicle.perDayCost;
    //     let finalPerDayCost = originalPerDayCost;

    //     const startDateObj = new Date(startDate);
    //     const endDateObj = new Date(endDate);

    //     // Check if start date or end date is a weekend
    //     const startDayOfWeek = startDateObj.getDay();
    //     const endDayOfWeek = endDateObj.getDay();
    //     const isWeekendBooking =
    //       startDayOfWeek === 6 ||
    //       startDayOfWeek === 0 ||
    //       endDayOfWeek === 6 ||
    //       endDayOfWeek === 0;

    //     // Apply weekend pricing only if start date or end date is a weekend
    //     if (isWeekendBooking && pricingRules.weakend) {
    //       const weekendPrice = pricingRules.weakend.Price;
    //       const weekendPriceType = pricingRules.weakend.PriceType;

    //       if (weekendPriceType === "+") {
    //         finalPerDayCost =
    //           Number(originalPerDayCost) +
    //           (Number(originalPerDayCost) * Number(weekendPrice)) / 100;
    //       } else if (weekendPriceType === "-") {
    //         finalPerDayCost =
    //           Number(originalPerDayCost) -
    //           (Number(originalPerDayCost) * Number(weekendPrice)) / 100;
    //       }
    //     }

    //     // Check if start date or end date falls within any special day range
    //     if (pricingRules.specialDays && pricingRules.specialDays.length > 0) {
    //       pricingRules.specialDays.forEach((specialDay) => {
    //         const fromDate = new Date(specialDay.From);
    //         const toDate = new Date(specialDay.Too);

    //         // Check if start date or end date is within special day range
    //         if (
    //           (startDateObj >= fromDate && startDateObj <= toDate) ||
    //           (endDateObj >= fromDate && endDateObj <= toDate)
    //         ) {
    //           const specialPrice = specialDay.Price;
    //           const specialPriceType = specialDay.PriceType;

    //           if (specialPriceType === "+") {
    //             finalPerDayCost =
    //               Number(originalPerDayCost) +
    //               (Number(originalPerDayCost) * Number(specialPrice)) / 100;
    //           } else if (specialPriceType === "-") {
    //             finalPerDayCost =
    //               Number(originalPerDayCost) -
    //               (Number(originalPerDayCost) * Number(specialPrice)) / 100;
    //           }
    //         }
    //       });
    //     }

    //     adjustedVehicle.originalPerDayCost = originalPerDayCost;
    //     adjustedVehicle.perDayCost = Math.round(finalPerDayCost);

    //     return adjustedVehicle;
    //   });
    // }
    // if (pricingRules) {
    //   paginatedAvailable = paginatedAvailable.map((groupedVehicle) => {
    //     const adjustedVehicle = { ...groupedVehicle };
    //     const originalPerDayCost = adjustedVehicle.perDayCost;

    //     const startDateObj = new Date(startDate);
    //     const endDateObj = new Date(endDate);

    //     adjustedVehicle.originalPerDayCost = originalPerDayCost;

    //     let totalRentalCost = 0;

    //     const daysInBooking = [];
    //     const currentDate = new Date(startDateObj);

    //     const weekendPrice = pricingRules.weakend
    //       ? pricingRules.weakend.Price
    //       : 0;
    //     const weekendPriceType = pricingRules.weakend
    //       ? pricingRules.weakend.PriceType
    //       : "+";

    //     // Loop through each day in the booking period
    //     const dayOfWeek = currentDate.getDay();
    //     const isDateOnWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    //     while (currentDate < endDateObj) {
    //       const nextDate = new Date(currentDate);
    //       nextDate.setDate(nextDate.getDate() + 1);

    //       const dayOfWeek = currentDate.getDay();
    //       const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    //       let dailyRate = originalPerDayCost;

    //       // Apply weekend pricing if it's a weekend day
    //       if (isWeekend && pricingRules.weakend) {
    //         if (weekendPriceType === "+") {
    //           dailyRate =
    //             Number(originalPerDayCost) +
    //             (Number(originalPerDayCost) * Number(weekendPrice)) / 100;
    //         } else if (weekendPriceType === "-") {
    //           dailyRate =
    //             Number(originalPerDayCost) -
    //             (Number(originalPerDayCost) * Number(weekendPrice)) / 100;
    //         }
    //       }

    //       // Check if the day falls within any special day range
    //       if (pricingRules.specialDays && pricingRules.specialDays.length > 0) {
    //         for (const specialDay of pricingRules.specialDays) {
    //           const fromDate = new Date(specialDay.From);
    //           const toDate = new Date(specialDay.Too);

    //           if (currentDate >= fromDate && currentDate <= toDate) {
    //             const specialPrice = specialDay.Price;
    //             const specialPriceType = specialDay.PriceType;

    //             if (specialPriceType === "+") {
    //               dailyRate =
    //                 Number(originalPerDayCost) +
    //                 (Number(originalPerDayCost) * Number(specialPrice)) / 100;
    //             } else if (specialPriceType === "-") {
    //               dailyRate =
    //                 Number(originalPerDayCost) -
    //                 (Number(originalPerDayCost) * Number(specialPrice)) / 100;
    //             }

    //             break;
    //           }
    //         }
    //       }

    //       // Add the daily rate to the total rental cost
    //       totalRentalCost += dailyRate;

    //       // Store information about this day for debugging
    //       daysInBooking.push({
    //         date: new Date(currentDate),
    //         isWeekend,
    //         dailyRate: Math.round(dailyRate),
    //       });

    //       // Move to the next day
    //       currentDate.setDate(currentDate.getDate() + 1);
    //     }

    //     // Store the calculated values
    //     adjustedVehicle.daysBreakdown = daysInBooking;
    //     adjustedVehicle.totalRentalCost = Math.round(totalRentalCost);

    //     // For backward compatibility, keep perDayCost as the average
    //     const bookingDurationDays = Math.ceil(
    //       (endDateObj - startDateObj) / (1000 * 60 * 60 * 24)
    //     );
    //     if (isDateOnWeekend == true) {
    //       adjustedVehicle.perDayCost = Math.round(
    //         totalRentalCost / bookingDurationDays
    //       );
    //     }

    //     return adjustedVehicle;
    //   });
    // }
    if (pricingRules) {
      paginatedAvailable = paginatedAvailable.map((groupedVehicle) => {
        const adjustedVehicle = { ...groupedVehicle };
        const originalPerDayCost = adjustedVehicle.perDayCost;

        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);

        adjustedVehicle.originalPerDayCost = originalPerDayCost;

        let totalRentalCost = 0;

        const daysInBooking = [];
        const currentDate = new Date(startDateObj);
        console.log(currentDate);

        const weekendPrice = pricingRules.weakend
          ? pricingRules.weakend.Price
          : 0;
        const weekendPriceType = pricingRules.weakend
          ? pricingRules.weakend.PriceType
          : "+";

        // Check if start date is a weekend
        const startDayOfWeek = currentDate.getDay();
        const isStartDateWeekend = startDayOfWeek === 0 || startDayOfWeek === 6;
        console.log(currentDate, startDayOfWeek, isStartDateWeekend);

        // Loop through each day in the booking period
        while (currentDate < endDateObj) {
          const nextDate = new Date(currentDate);
          nextDate.setDate(nextDate.getDate() + 1);

          const dayOfWeek = currentDate.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          let dailyRate = originalPerDayCost;

          // Apply weekend pricing if it's a weekend day
          if (isWeekend && pricingRules.weakend) {
            if (weekendPriceType === "+") {
              dailyRate =
                Number(originalPerDayCost) +
                (Number(originalPerDayCost) * Number(weekendPrice)) / 100;
            } else if (weekendPriceType === "-") {
              dailyRate =
                Number(originalPerDayCost) -
                (Number(originalPerDayCost) * Number(weekendPrice)) / 100;
            }
          }

          // Check if the day falls within any special day range
          if (pricingRules.specialDays && pricingRules.specialDays.length > 0) {
            for (const specialDay of pricingRules.specialDays) {
              const fromDate = new Date(specialDay.From);
              const toDate = new Date(specialDay.Too);

              if (currentDate >= fromDate && currentDate <= toDate) {
                const specialPrice = specialDay.Price;
                const specialPriceType = specialDay.PriceType;

                if (specialPriceType === "+") {
                  dailyRate =
                    Number(originalPerDayCost) +
                    (Number(originalPerDayCost) * Number(specialPrice)) / 100;
                } else if (specialPriceType === "-") {
                  dailyRate =
                    Number(originalPerDayCost) -
                    (Number(originalPerDayCost) * Number(specialPrice)) / 100;
                }

                break;
              }
            }
          }

          // Add the daily rate to the total rental cost
          totalRentalCost += dailyRate;

          // Store information about this day for debugging
          daysInBooking.push({
            date: new Date(currentDate),
            isWeekend,
            dailyRate: Math.round(dailyRate),
          });

          // Move to the next day
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Store the calculated values
        adjustedVehicle.daysBreakdown = daysInBooking;
        adjustedVehicle.totalRentalCost = Math.round(totalRentalCost);

        // Calculate booking duration
        const bookingDurationDays = Math.ceil(
          (endDateObj - startDateObj) / (1000 * 60 * 60 * 24)
        );

        // Update perDayCost for display purposes based on start date
        if (isStartDateWeekend && pricingRules.weakend) {
          // Calculate weekend price for display
          let weekendDayRate = originalPerDayCost;

          if (weekendPriceType === "+") {
            weekendDayRate =
              Number(originalPerDayCost) +
              (Number(originalPerDayCost) * Number(weekendPrice)) / 100;
          } else if (weekendPriceType === "-") {
            weekendDayRate =
              Number(originalPerDayCost) -
              (Number(originalPerDayCost) * Number(weekendPrice)) / 100;
          }

          adjustedVehicle.perDayCost = Math.round(weekendDayRate);
        } else {
          // Keep the original per day cost for weekdays
          adjustedVehicle.perDayCost = originalPerDayCost;
        }

        return adjustedVehicle;
      });
    }

    // when there is no data return this response
    if (paginatedAvailable?.length === 0 && paginatedExcluded?.length === 0) {
      response.status = 404;
      response.message = "No Vehicles Found";
      response.data = [];
      response.pagination = {
        totalRecords: 0,
        totalPages: 0,
        currentPage: 1,
        limit: 20,
        bypassLimit,
      };
    } else {
      response.status = 200;
      response.message = "Data fetched successfully";
      response.data = {
        availableVehicles: paginatedAvailable,
        excludedVehicles: paginatedExcluded,
      };
      response.pagination = {
        totalRecords: totalGroupedRecords,
        totalPages,
        currentPage: parsedPage,
        limit: parsedLimit,
        bypassLimit,
      };
    }
  } catch (error) {
    console.error("Error in getVehicleTblData:", error.message);
    response.status = 500;
    response.message = `Internal server error: ${error.message}`;
  }

  return response;
};

const getVehicleTblDataAllStation = async (query) => {
  const response = {
    status: 200,
    message: "Data fetched successfully",
    data: [],
  };

  try {
    const {
      vehiclePlan,
      vehicleModel,
      condition,
      vehicleColor,
      BookingStartDateAndTime,
      BookingEndDateAndTime,
      _id,
      vehicleBrand,
      vehicleType,
      stationId,
      locationId,
      page = 1,
      limit = 20,
    } = query;

    // Ensure booking start and end dates are provided when locationId is missing
    if (
      !locationId &&
      !_id &&
      (!BookingStartDateAndTime || !BookingEndDateAndTime)
    ) {
      return {
        status: 400,
        message: "Booking start and end dates are required.",
        data: [],
      };
    }

    function isValidISO8601(dateString) {
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
      return (
        iso8601Regex.test(dateString) && !isNaN(new Date(dateString).getTime())
      );
    }

    if (
      !isValidISO8601(BookingStartDateAndTime) ||
      !isValidISO8601(BookingEndDateAndTime)
    ) {
      return {
        status: 400,
        message: "Invalid date format",
        data: [],
      };
    }

    const startDate = BookingStartDateAndTime;
    const endDate = BookingEndDateAndTime;

    // Constructing match filter
    const matchFilter = {};

    if (_id) {
      matchFilter._id = ObjectId.isValid(_id) ? new ObjectId(_id) : _id;
    } else {
      if (vehicleModel) matchFilter.vehicleModel = vehicleModel;
      if (condition) matchFilter.condition = condition;
      if (vehicleColor) matchFilter.vehicleColor = vehicleColor;
      if (stationId) matchFilter.stationId = stationId;
      if (locationId && ObjectId.isValid(locationId)) {
        matchFilter.locationId = new ObjectId(locationId);
      }
      if (Array.isArray(vehiclePlan)) {
        matchFilter["vehiclePlan._id"] = {
          $in: vehiclePlan.map((id) => new ObjectId(id)),
        };
      } else if (vehiclePlan) {
        matchFilter["vehiclePlan._id"] = new ObjectId(vehiclePlan);
      }
    }

    const parsedPage = Math.max(parseInt(page, 10), 1);
    const parsedLimit = Math.max(parseInt(limit, 10), 1);
    const skip = (parsedPage - 1) * parsedLimit;

    // const pipeline = [
    //   { $match: matchFilter },

    //   // Lookup bookings
    //   {
    //     $lookup: {
    //       from: "bookings",
    //       localField: "_id",
    //       foreignField: "vehicleTableId",
    //       as: "bookings",
    //     },
    //   },

    //   // Lookup station data
    //   {
    //     $lookup: {
    //       from: "stations",
    //       localField: "stationId",
    //       foreignField: "stationId",
    //       as: "stationData",
    //     },
    //   },

    //   // Lookup vehicle master data
    //   {
    //     $lookup: {
    //       from: "vehiclemasters",
    //       localField: "vehicleMasterId",
    //       foreignField: "_id",
    //       as: "vehicleMasterData",
    //     },
    //   },

    //   // Lookup maintenance records
    //   {
    //     $lookup: {
    //       from: "maintenancevehicles",
    //       localField: "_id",
    //       foreignField: "vehicleTableId",
    //       as: "maintenanceData",
    //     },
    //   },

    //   {
    //     $addFields: {
    //       conflictingBookings: {
    //         $filter: {
    //           input: "$bookings",
    //           as: "booking",
    //           cond: {
    //             $and: [
    //               { $ne: ["$$booking.rideStatus", "canceled"] }, // Exclude canceled bookings
    //               {
    //                 $or: [
    //                   {
    //                     $and: [
    //                       {
    //                         $gte: [
    //                           "$$booking.BookingStartDateAndTime",
    //                           startDate,
    //                         ],
    //                       },
    //                       {
    //                         $lte: [
    //                           "$$booking.BookingStartDateAndTime",
    //                           endDate,
    //                         ],
    //                       },
    //                     ],
    //                   },
    //                   {
    //                     $and: [
    //                       {
    //                         $gte: [
    //                           "$$booking.BookingEndDateAndTime",
    //                           startDate,
    //                         ],
    //                       },
    //                       {
    //                         $lte: ["$$booking.BookingEndDateAndTime", endDate],
    //                       },
    //                     ],
    //                   },
    //                   {
    //                     $and: [
    //                       {
    //                         $lte: [
    //                           "$$booking.BookingStartDateAndTime",
    //                           startDate,
    //                         ],
    //                       },
    //                       {
    //                         $gte: ["$$booking.BookingEndDateAndTime", endDate],
    //                       },
    //                     ],
    //                   },
    //                 ],
    //               },
    //             ],
    //           },
    //         },
    //       },

    //       conflictingMaintenance: {
    //         $filter: {
    //           input: "$maintenanceData",
    //           as: "maintenance",
    //           cond: {
    //             $or: [
    //               {
    //                 $and: [
    //                   { $gte: ["$$maintenance.startDate", startDate] },
    //                   { $lte: ["$$maintenance.startDate", endDate] },
    //                 ],
    //               },
    //               {
    //                 $and: [
    //                   { $gte: ["$$maintenance.endDate", startDate] },
    //                   { $lte: ["$$maintenance.endDate", endDate] },
    //                 ],
    //               },
    //               {
    //                 $and: [
    //                   { $lte: ["$$maintenance.startDate", startDate] },
    //                   { $gte: ["$$maintenance.endDate", endDate] },
    //                 ],
    //               },
    //             ],
    //           },
    //         },
    //       },
    //     },
    //   },

    //   // Flatten vehicle master and station data
    //   {
    //     $addFields: {
    //       vehicleMasterData: { $arrayElemAt: ["$vehicleMasterData", 0] },
    //       stationData: { $arrayElemAt: ["$stationData", 0] },
    //     },
    //   },

    //   // Apply additional filters
    //   {
    //     $match: {
    //       vehicleStatus: "active",
    //       ...(vehicleBrand
    //         ? { "vehicleMasterData.vehicleBrand": vehicleBrand }
    //         : {}),
    //       ...(vehicleType
    //         ? { "vehicleMasterData.vehicleType": vehicleType }
    //         : {}),
    //     },
    //   },

    //   { $skip: (parsedPage - 1) * parsedLimit },
    //   { $limit: parsedLimit },

    //   // Use $facet to create separate datasets for available and excluded vehicles
    //   {
    //     $facet: {
    //       availableVehicles: [
    //         {
    //           $match: {
    //             conflictingBookings: { $size: 0 }, // Ensure no conflicting bookings
    //             conflictingMaintenance: { $size: 0 }, // Ensure no conflicting maintenance
    //           },
    //         },
    //         { $project: { conflictingBookings: 0, conflictingMaintenance: 0 } },
    //         {
    //           $project: {
    //             _id: 1,
    //             vehicleMasterId: 1,
    //             vehicleNumber: 1,
    //             freeKms: 1,
    //             extraKmsCharges: 1,
    //             stationId: 1,
    //             vehicleModel: 1,
    //             vehiclePlan: 1,
    //             perDayCost: 1,
    //             refundableDeposit: 1,
    //             lateFee: 1,
    //             speedLimit: 1,
    //             lastServiceDate: 1,
    //             kmsRun: 1,
    //             locationId: 1,
    //             condition: 1,
    //             vehicleStatus: 1,
    //             vehicleImage: {
    //               $ifNull: ["$vehicleMasterData.vehicleImage", ""],
    //             },
    //             vehicleBrand: {
    //               $ifNull: ["$vehicleMasterData.vehicleBrand", ""],
    //             },
    //             vehicleName: {
    //               $ifNull: ["$vehicleMasterData.vehicleName", ""],
    //             },
    //             vehicleType: {
    //               $ifNull: ["$vehicleMasterData.vehicleType", ""],
    //             },
    //             stationName: { $ifNull: ["$stationData.stationName", ""] },
    //           },
    //         },
    //       ],

    //       excludedVehicles: [
    //         {
    //           $match: {
    //             $or: [
    //               { $expr: { $gt: [{ $size: "$conflictingBookings" }, 0] } }, // Vehicles with conflicting bookings
    //               { $expr: { $gt: [{ $size: "$conflictingMaintenance" }, 0] } }, // Vehicles with conflicting maintenance
    //             ],
    //           },
    //         },

    //         { $project: { conflictingBookings: 0, conflictingMaintenance: 0 } },

    //         {
    //           $project: {
    //             _id: 1,
    //             vehicleMasterId: 1,
    //             vehicleNumber: 1,
    //             freeKms: 1,
    //             extraKmsCharges: 1,
    //             stationId: 1,
    //             vehicleModel: 1,
    //             vehiclePlan: 1,
    //             perDayCost: 1,
    //             refundableDeposit: 1,
    //             lateFee: 1,
    //             speedLimit: 1,
    //             lastServiceDate: 1,
    //             kmsRun: 1,
    //             locationId: 1,
    //             condition: 1,
    //             vehicleStatus: 1,
    //             vehicleBrand: {
    //               $ifNull: ["$vehicleMasterData.vehicleBrand", ""],
    //             },
    //             vehicleName: {
    //               $ifNull: ["$vehicleMasterData.vehicleName", ""],
    //             },
    //             vehicleType: {
    //               $ifNull: ["$vehicleMasterData.vehicleType", ""],
    //             },
    //             vehicleImage: {
    //               $ifNull: ["$vehicleMasterData.vehicleImage", ""],
    //             },
    //             stationName: { $ifNull: ["$stationData.stationName", ""] },
    //             BookingStartDate: {
    //               $ifNull: [
    //                 { $arrayElemAt: ["$bookings.BookingStartDateAndTime", -1] },
    //                 null,
    //               ],
    //             },
    //             BookingEndDate: {
    //               $ifNull: [
    //                 { $arrayElemAt: ["$bookings.BookingEndDateAndTime", -1] },
    //                 null,
    //               ],
    //             },

    //             // Last Maintenance Dates (startDate and endDate)
    //             MaintenanceStartDate: {
    //               $ifNull: [
    //                 { $arrayElemAt: ["$maintenanceData.startDate", -1] },
    //                 null,
    //               ],
    //             },
    //             MaintenanceEndDate: {
    //               $ifNull: [
    //                 { $arrayElemAt: ["$maintenanceData.endDate", -1] },
    //                 null,
    //               ],
    //             },
    //           },
    //         },
    //       ],

    //       totalCount: [{ $count: "totalRecords" }],
    //     },
    //   },
    // ];

    const pipeline = [
      { $match: matchFilter },
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "vehicleTableId",
          as: "bookings",
        },
      },
      {
        $lookup: {
          from: "stations",
          localField: "stationId",
          foreignField: "stationId",
          as: "stationData",
        },
      },
      {
        $lookup: {
          from: "vehiclemasters",
          localField: "vehicleMasterId",
          foreignField: "_id",
          as: "vehicleMasterData",
        },
      },
      {
        $lookup: {
          from: "maintenancevehicles",
          localField: "_id",
          foreignField: "vehicleTableId",
          as: "maintenanceData",
        },
      },

      // Add conflicting bookings/maintenance fields
      // (keeping your existing addFields unchanged)
      {
        $addFields: {
          conflictingBookings: {
            $filter: {
              input: "$bookings",
              as: "booking",
              cond: {
                $and: [
                  { $ne: ["$$booking.rideStatus", "canceled"] },
                  {
                    $or: [
                      {
                        $and: [
                          {
                            $gte: [
                              "$$booking.BookingStartDateAndTime",
                              startDate,
                            ],
                          },
                          {
                            $lte: [
                              "$$booking.BookingStartDateAndTime",
                              endDate,
                            ],
                          },
                        ],
                      },
                      {
                        $and: [
                          {
                            $gte: [
                              "$$booking.BookingEndDateAndTime",
                              startDate,
                            ],
                          },
                          {
                            $lte: ["$$booking.BookingEndDateAndTime", endDate],
                          },
                        ],
                      },
                      {
                        $and: [
                          {
                            $lte: [
                              "$$booking.BookingStartDateAndTime",
                              startDate,
                            ],
                          },
                          {
                            $gte: ["$$booking.BookingEndDateAndTime", endDate],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
          conflictingMaintenance: {
            $filter: {
              input: "$maintenanceData",
              as: "maintenance",
              cond: {
                $or: [
                  {
                    $and: [
                      { $gte: ["$$maintenance.startDate", startDate] },
                      { $lte: ["$$maintenance.startDate", endDate] },
                    ],
                  },
                  {
                    $and: [
                      { $gte: ["$$maintenance.endDate", startDate] },
                      { $lte: ["$$maintenance.endDate", endDate] },
                    ],
                  },
                  {
                    $and: [
                      { $lte: ["$$maintenance.startDate", startDate] },
                      { $gte: ["$$maintenance.endDate", endDate] },
                    ],
                  },
                ],
              },
            },
          },
        },
      },

      // Flatten vehicle master and station data
      {
        $addFields: {
          vehicleMasterData: { $arrayElemAt: ["$vehicleMasterData", 0] },
          stationData: { $arrayElemAt: ["$stationData", 0] },
          vehicleName: {
            $ifNull: [
              { $arrayElemAt: ["$vehicleMasterData.vehicleName", 0] },
              "",
            ],
          },
        },
      },

      // Apply filters
      {
        $match: {
          vehicleStatus: "active",
          ...(vehicleBrand
            ? { "vehicleMasterData.vehicleBrand": vehicleBrand }
            : {}),
          ...(vehicleType
            ? { "vehicleMasterData.vehicleType": vehicleType }
            : {}),
        },
      },

      // Group by vehicle name to combine vehicles with the same name
      {
        $group: {
          _id: "$vehicleName",
          firstVehicle: { $first: "$$ROOT" },
          allVehicles: { $push: "$$ROOT" },
          count: { $sum: 1 },
        },
      },

      // Reshape the data - if count > 1, add others as an array
      {
        $project: {
          _id: "$firstVehicle._id",
          vehicleMasterId: "$firstVehicle.vehicleMasterId",
          vehicleNumber: "$firstVehicle.vehicleNumber",
          vehicleName: "$firstVehicle.vehicleName",
          freeKms: "$firstVehicle.freeKms",
          extraKmsCharges: "$firstVehicle.extraKmsCharges",
          stationId: "$firstVehicle.stationId",
          vehicleModel: "$firstVehicle.vehicleModel",
          vehiclePlan: "$firstVehicle.vehiclePlan",
          perDayCost: "$firstVehicle.perDayCost",
          refundableDeposit: "$firstVehicle.refundableDeposit",
          lateFee: "$firstVehicle.lateFee",
          speedLimit: "$firstVehicle.speedLimit",
          lastServiceDate: "$firstVehicle.lastServiceDate",
          kmsRun: "$firstVehicle.kmsRun",
          locationId: "$firstVehicle.locationId",
          condition: "$firstVehicle.condition",
          vehicleStatus: "$firstVehicle.vehicleStatus",
          stationData: "$firstVehicle.stationData",
          vehicleMasterData: "$firstVehicle.vehicleMasterData",
          bookings: "$firstVehicle.bookings",
          maintenanceData: "$firstVehicle.maintenanceData",
          conflictingBookings: "$firstVehicle.conflictingBookings",
          conflictingMaintenance: "$firstVehicle.conflictingMaintenance",
          // Only add siblings if there's more than one vehicle with this name
          sameNameVehicles: {
            $cond: {
              if: { $gt: ["$count", 1] },
              then: {
                $map: {
                  input: {
                    $slice: ["$allVehicles", 1, { $subtract: ["$count", 1] }],
                  },
                  as: "vehicle",
                  in: {
                    _id: "$$vehicle._id",
                    vehicleNumber: "$$vehicle.vehicleNumber",
                    stationId: "$$vehicle.stationId",
                    stationName: {
                      $ifNull: ["$$vehicle.stationData.stationName", ""],
                    },
                    vehicleStatus: "$$vehicle.vehicleStatus",
                    conflictingBookings: {
                      $size: "$$vehicle.conflictingBookings",
                    },
                    conflictingMaintenance: {
                      $size: "$$vehicle.conflictingMaintenance",
                    },
                  },
                },
              },
              else: "$$REMOVE",
            },
          },
        },
      },

      { $skip: (parsedPage - 1) * parsedLimit },
      { $limit: parsedLimit },

      // Use $facet to create separate datasets for available and excluded vehicles
      {
        $facet: {
          availableVehicles: [
            {
              $match: {
                conflictingBookings: { $size: 0 },
                conflictingMaintenance: { $size: 0 },
                // If any vehicle in sameNameVehicles has conflicts, exclude this one too
                $expr: {
                  $cond: {
                    if: { $ifNull: ["$sameNameVehicles", false] },
                    then: {
                      $not: {
                        $anyElementTrue: {
                          $map: {
                            input: "$sameNameVehicles",
                            as: "vehicle",
                            in: {
                              $or: [
                                { $gt: ["$$vehicle.conflictingBookings", 0] },
                                {
                                  $gt: ["$$vehicle.conflictingMaintenance", 0],
                                },
                              ],
                            },
                          },
                        },
                      },
                    },
                    else: true,
                  },
                },
              },
            },
            // Project the fields you want to keep
            {
              $project: {
                _id: 1,
                vehicleMasterId: 1,
                vehicleNumber: 1,
                freeKms: 1,
                extraKmsCharges: 1,
                stationId: 1,
                vehicleModel: 1,
                vehiclePlan: 1,
                perDayCost: 1,
                refundableDeposit: 1,
                lateFee: 1,
                speedLimit: 1,
                lastServiceDate: 1,
                kmsRun: 1,
                locationId: 1,
                condition: 1,
                vehicleStatus: 1,
                sameNameVehicles: 1,
                vehicleImage: {
                  $ifNull: ["$vehicleMasterData.vehicleImage", ""],
                },
                vehicleBrand: {
                  $ifNull: ["$vehicleMasterData.vehicleBrand", ""],
                },
                vehicleName: {
                  $ifNull: ["$vehicleMasterData.vehicleName", ""],
                },
                vehicleType: {
                  $ifNull: ["$vehicleMasterData.vehicleType", ""],
                },
                stationName: { $ifNull: ["$stationData.stationName", ""] },
              },
            },
          ],

          excludedVehicles: [
            {
              $match: {
                $or: [
                  { $expr: { $gt: [{ $size: "$conflictingBookings" }, 0] } },
                  { $expr: { $gt: [{ $size: "$conflictingMaintenance" }, 0] } },
                  // If any vehicle in sameNameVehicles has conflicts, include this one too
                  {
                    $expr: {
                      $cond: {
                        if: { $ifNull: ["$sameNameVehicles", false] },
                        then: {
                          $anyElementTrue: {
                            $map: {
                              input: "$sameNameVehicles",
                              as: "vehicle",
                              in: {
                                $or: [
                                  { $gt: ["$$vehicle.conflictingBookings", 0] },
                                  {
                                    $gt: [
                                      "$$vehicle.conflictingMaintenance",
                                      0,
                                    ],
                                  },
                                ],
                              },
                            },
                          },
                        },
                        else: false,
                      },
                    },
                  },
                ],
              },
            },
            // Project the fields you want to keep
            {
              $project: {
                _id: 1,
                vehicleMasterId: 1,
                vehicleNumber: 1,
                freeKms: 1,
                extraKmsCharges: 1,
                stationId: 1,
                vehicleModel: 1,
                vehiclePlan: 1,
                perDayCost: 1,
                refundableDeposit: 1,
                lateFee: 1,
                speedLimit: 1,
                lastServiceDate: 1,
                kmsRun: 1,
                locationId: 1,
                condition: 1,
                vehicleStatus: 1,
                sameNameVehicles: 1,
                vehicleBrand: {
                  $ifNull: ["$vehicleMasterData.vehicleBrand", ""],
                },
                vehicleName: {
                  $ifNull: ["$vehicleMasterData.vehicleName", ""],
                },
                vehicleType: {
                  $ifNull: ["$vehicleMasterData.vehicleType", ""],
                },
                vehicleImage: {
                  $ifNull: ["$vehicleMasterData.vehicleImage", ""],
                },
                stationName: { $ifNull: ["$stationData.stationName", ""] },
                BookingStartDate: {
                  $ifNull: [
                    { $arrayElemAt: ["$bookings.BookingStartDateAndTime", -1] },
                    null,
                  ],
                },
                BookingEndDate: {
                  $ifNull: [
                    { $arrayElemAt: ["$bookings.BookingEndDateAndTime", -1] },
                    null,
                  ],
                },
                MaintenanceStartDate: {
                  $ifNull: [
                    { $arrayElemAt: ["$maintenanceData.startDate", -1] },
                    null,
                  ],
                },
                MaintenanceEndDate: {
                  $ifNull: [
                    { $arrayElemAt: ["$maintenanceData.endDate", -1] },
                    null,
                  ],
                },
              },
            },
          ],

          totalCount: [{ $count: "totalRecords" }],
        },
      },
    ];

    const result = await vehicleTable.aggregate(pipeline);

    if (!result.length || !result[0].availableVehicles.length) {
      return {
        status: 404,
        message: "No records found",
        data: [],
        pagination: {
          totalRecords: 0,
          totalPages: 0,
          currentPage: parsedPage,
          limit: parsedLimit,
        },
      };
    }

    // Extract available and excluded vehicles
    let availableVehicles = result[0].availableVehicles;
    let excludedVehicles = result[0].excludedVehicles;
    const totalRecords = result[0].totalCount.length
      ? result[0].totalCount[0].totalRecords
      : 0;

    // Ensure pagination dynamically distributes vehicles
    let finalAvailableVehicles = [];
    let finalExcludedVehicles = [];

    if (excludedVehicles.length > 0) {
      if (excludedVehicles.length >= parsedLimit) {
        finalExcludedVehicles = excludedVehicles.slice(0, parsedLimit);
      } else {
        finalExcludedVehicles = excludedVehicles;
        finalAvailableVehicles = availableVehicles.slice(
          0,
          parsedLimit - excludedVehicles.length
        );
      }
    } else {
      finalAvailableVehicles = availableVehicles.slice(0, parsedLimit);
    }

    const totalPages = Math.ceil(totalRecords / parsedLimit);

    response.status = 200;
    response.message = "Data fetched successfully";
    response.data = {
      availableVehicles: finalAvailableVehicles,
      excludedVehicles: finalExcludedVehicles,
    };
    response.pagination = {
      totalRecords,
      totalPages,
      currentPage: parsedPage,
      limit: parsedLimit,
    };
  } catch (error) {
    console.error("Error in getVehicleTblData:", error.message);
    response.status = 500;
    response.message = `Internal server error: ${error.message}`;
  }

  return response;
};

// Helper function to group vehicles by name
function groupVehiclesByName(vehicles) {
  const vehicleMap = new Map();

  vehicles.forEach((vehicle) => {
    const vehicleName = vehicle.vehicleName;

    if (vehicleMap.has(vehicleName)) {
      // If vehicle with this name already exists, add this vehicle's data to the additionalData array
      const existingVehicle = vehicleMap.get(vehicleName);

      // Initialize additionalData array if it doesn't exist
      if (!existingVehicle.additionalData) {
        existingVehicle.additionalData = [];
        // Add the first vehicle's details to the array (deep clone to avoid circular references)
        existingVehicle.additionalData.push(
          JSON.parse(JSON.stringify(existingVehicle.vehicleDetails))
        );
      }

      // Add current vehicle details to the array (deep clone to avoid circular references)
      existingVehicle.additionalData.push(
        JSON.parse(JSON.stringify(vehicle.vehicleDetails))
      );

      // Initialize stations array if it doesn't exist
      if (!existingVehicle.stations) {
        existingVehicle.stations = [];
        // Add the first vehicle's station data
        existingVehicle.stations.push(
          JSON.parse(JSON.stringify(existingVehicle.stationData))
        );
      }

      // Check if this station already exists in the stations array
      const stationExists = existingVehicle.stations.some(
        (station) => station.stationId === vehicle.stationData.stationId
      );

      if (!stationExists) {
        // Add current vehicle's station data
        existingVehicle.stations.push(
          JSON.parse(JSON.stringify(vehicle.stationData))
        );
      }

      // Remove the vehicleDetails to avoid duplication
      delete existingVehicle.vehicleDetails;

      // Update the map
      vehicleMap.set(vehicleName, existingVehicle);
    } else {
      // First time seeing this vehicle name
      // Create a new object with proper structure
      const newVehicle = JSON.parse(JSON.stringify(vehicle)); // Deep clone to avoid circular references

      // Initialize the additionalData array with this vehicle's details
      newVehicle.additionalData = [
        JSON.parse(JSON.stringify(vehicle.vehicleDetails)),
      ];

      // Initialize stations array with this vehicle's station data
      newVehicle.stations = [JSON.parse(JSON.stringify(vehicle.stationData))];

      // Remove the individual vehicleDetails to avoid duplication
      delete newVehicle.vehicleDetails;

      vehicleMap.set(vehicleName, newVehicle);
    }
  });

  // Convert map values to array
  return Array.from(vehicleMap.values());
}

// Helper function to group vehicles by name
function groupVehiclesByName(vehicles) {
  const vehicleMap = new Map();

  vehicles.forEach((vehicle) => {
    const vehicleName = vehicle.vehicleName;

    if (vehicleMap.has(vehicleName)) {
      // If vehicle with this name already exists, add this vehicle's data to additionalData array
      const existingVehicle = vehicleMap.get(vehicleName);

      if (!existingVehicle.additionalData.vehicles) {
        // Create vehicles array if it doesn't exist yet, and add the first vehicle's data
        existingVehicle.additionalData.vehicles = [
          existingVehicle.additionalData,
        ];
      }

      // Add current vehicle data to the array
      existingVehicle.additionalData.vehicles.push(vehicle.additionalData);

      // Add station data to stations array if it doesn't already exist
      if (!existingVehicle.stations) {
        existingVehicle.stations = [existingVehicle.stationData];
      }

      // Check if this station already exists in the stations array
      const stationExists = existingVehicle.stations.some(
        (station) => station.stationId === vehicle.stationData.stationId
      );

      if (!stationExists) {
        existingVehicle.stations.push(vehicle.stationData);
      }

      // Update the map
      vehicleMap.set(vehicleName, existingVehicle);
    } else {
      // First time seeing this vehicle name
      // Create a new object with stations array
      vehicle.stations = [vehicle.stationData];
      vehicleMap.set(vehicleName, vehicle);
    }
  });

  // Convert map values to array
  return Array.from(vehicleMap.values());
}

const getPlanData = async (query) => {
  const obj = {
    status: 200,
    message: "Plans retrieved successfully",
    data: [],
    pagination: {},
  };

  try {
    const { _id, stationId, locationId, search, page = 1, limit = 10 } = query;

    // Validate _id
    if (_id && _id.length !== 24) {
      obj.status = 400;
      obj.message = "Invalid plan ID format";
      return obj;
    }

    const matchFilter = {};
    if (_id) {
      matchFilter._id = new ObjectId(_id);
    } else {
      if (stationId) matchFilter.stationId = stationId;
      if (locationId) matchFilter.locationId = new ObjectId(locationId);
    }

    if (search) {
      matchFilter.$or = [
        { planName: { $regex: search, $options: "i" } },
        { stationName: { $regex: search, $options: "i" } },
        { vehicleName: { $regex: search, $options: "i" } },
        //  { locationId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    // Aggregation pipeline with pagination
    const plans = await Plan.aggregate([
      {
        $lookup: {
          from: "stations",
          localField: "stationId",
          foreignField: "stationId",
          as: "stationData",
        },
      },
      {
        $lookup: {
          from: "vehiclemasters",
          localField: "vehicleMasterId",
          foreignField: "_id",
          as: "vehicleMasterData",
        },
      },
      {
        $unwind: { path: "$stationData", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: {
          path: "$vehicleMasterData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          planName: 1,
          planDuration: 1,
          planPrice: 1,
          stationId: 1,
          vehicleMasterId: 1,
          locationId: 1,
          planDetails: 1,
          stationName: "$stationData.stationName",
          vehicleName: "$vehicleMasterData.vehicleName",
        },
      },
      { $match: matchFilter },
      // { $sort: { planName: 1 } }, // Sort by planName (ascending)
      { $skip: skip },
      { $limit: Number(limit) },
      { $sort: { createdAt: -1 } },
    ]);

    // Total records count
    const totalRecords = await Plan.countDocuments(matchFilter);

    if (!plans.length) {
      obj.message = "No records found";
      obj.status = 404;
      return obj;
    }

    obj.data = plans;
    obj.pagination = {
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: Number(page),
      limit: Number(limit),
    };
  } catch (error) {
    console.error("Error fetching plans:", error.message);
    obj.status = 500;
    obj.message = "Internal server error";
  }

  return obj;
};

async function getLocationData(query) {
  const obj = {
    status: 200,
    message: "Data fetched successfully",
    data: [],
    pagination: {},
  };

  const {
    _id,
    locationName,
    locationId,
    city,
    state,
    locationStatus,
    search,
    page = 1,
    limit = 10,
    fetchAll = false,
  } = query;

  try {
    let filter = {};
    if (_id) filter._id = ObjectId(_id);
    if (locationName) filter.locationName = locationName;
    if (locationId) filter._id = ObjectId(locationId);
    if (city) filter.city = city;
    if (state) filter.state = state;

    if (search) {
      filter.$or = [
        { locationName: { $regex: search, $options: "i" } },
        { locationStatus: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    // Fetch total record count for pagination
    const totalRecords = await Location.countDocuments(filter);

    // const locations = await Location.find(filter)
    //   .skip(skip)
    //   .limit(Number(limit))
    //   .sort({ createdAt: -1 }); // Optional: Sort by creation date
    // Fetch paginated location data
    let locationQuery = Location.find(filter).sort({ createdAt: -1 });

    if (!fetchAll) {
      locationQuery = locationQuery.skip(skip).limit(Number(limit));
    }

    const locations = await locationQuery;

    if (locations.length) {
      // Fetch station counts for each location
      const locationData = await Promise.all(
        locations.map(async (location) => {
          const stationCount = await Station.countDocuments({
            locationId: location._id,
            hasAC: true,
          });

          return {
            ...location.toObject(),
            stationCount,
          };
        })
      );

      obj.data = locationData;

      // Add pagination metadata
      // obj.pagination = {
      //   totalPages: Math.ceil(totalRecords / limit),
      //   currentPage: Number(page),
      //   limit: Number(limit),
      // };
      if (!fetchAll) {
        obj.pagination = {
          totalPages: Math.ceil(totalRecords / limit),
          currentPage: Number(page),
          limit: Number(limit),
        };
      } else {
        obj.pagination = {
          totalRecords,
          totalPages: 1,
          currentPage: 1,
          limit: totalRecords,
        };
      }
    } else {
      obj.status = 404;
      obj.message = "No locations found";
    }
  } catch (error) {
    console.error("Error in getLocationData:", error.message);
    obj.status = 500;
    obj.message = "Internal server error";
  }

  return obj;
}

async function getLocation(query) {
  const obj = {
    status: 200,
    message: "Data fetched successfully",
    data: [],
  };

  const { _id, locationName, locationId, city, state, locationStatus } = query;
  let filter = {};
  if (_id) filter._id = ObjectId(_id);
  if (locationName) filter.locationName = locationName;
  if (locationId) filter._id = ObjectId(locationId);
  if (city) filter.city = city;
  if (state) filter.state = state;

  try {
    if (locationStatus) {
      filter.locationStatus = locationStatus;
    } else {
      filter.locationStatus = { $ne: "inactive" };
    }

    const result = await Location.find(filter).sort({ createdAt: -1 });
    if (result.length) {
      obj.data = result;
    } else {
      obj.status = 404;
      obj.message = "No locations found";
    }
  } catch (error) {
    console.error("Error in getLocations:", error.message);
    obj.status = 500;
    obj.message = "Internal server error";
  }

  return obj;
}

const getStationData = async (query) => {
  const obj = {
    status: 200,
    message: "Data fetched successfully",
    data: [],
    pagination: {},
  };

  const {
    locationName,
    stationName,
    stationId,
    address,
    city,
    pinCode,
    state,
    search,
    locationId,
    _id,
    userId,
    page = 1,
    limit = 10,
  } = query;

  const filter = {};
  if (_id) filter._id = ObjectId(_id);
  if (locationId) filter.locationId = ObjectId(locationId);
  if (stationName) filter.stationName = stationName;
  if (stationId) filter.stationId = stationId;
  if (address) filter.address = address;
  if (city) filter.city = city;
  if (state) filter.state = state;
  if (pinCode) filter.pinCode = pinCode;
  if (userId) filter.userId = userId;

  if (search) {
    filter.$or = [
      { stationName: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
      { state: { $regex: search, $options: "i" } },
      // { pinCode: { $regex: search, $options: "i" } },
      { country: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  try {
    const totalRecords = await station.count(filter);

    const response = await station
      .find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .populate("userId", "firstName lastName contact");

    if (response.length) {
      // const enrichedData = await Promise.all(
      //   response.map(async (record) => {
      //     const { _doc: stationData } = record;
      //     const enrichedStation = { ...stationData };

      //     // Fetch location data
      //     if (stationData.locationId) {
      //       const locationData = await location.findOne(
      //         { _id: ObjectId(stationData.locationId) },
      //         { _id: 0 }
      //       );
      //       if (locationData) Object.assign(enrichedStation, locationData);
      //     }

      //     // Fetch user data
      //     if (stationData.userId) {
      //       const userData = await User.findOne(
      //         { _id: ObjectId(stationData.userId) },
      //         { _id: 0, firstName: 1, lastName: 1, contact: 1, email: 1, userType: 1 }
      //       );
      //       if (userData?.userType === "manager") {
      //         Object.assign(enrichedStation, userData);
      //       }
      //     }

      //     return enrichedStation;
      //   })
      // );

      obj.data = response;
      obj.pagination = {
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: Number(page),
        limit: Number(limit),
      };
    } else {
      obj.status = 404;
      obj.message = "Data not found";
    }
  } catch (error) {
    console.error("Error fetching station data:", error.message);
    obj.status = 500;
    obj.message = "Internal server error";
  }

  return obj;
};

async function getAllVehicles({ page, limit }) {
  const obj = { status: 200, message: "data fetched successfully", data: [] };
  const offset = (page - 1) * limit;
  const response = await Booking.find({}).skip(offset).limit(limit);
  if (response && response.length) {
    const finalArr = [];
    for (let i = 0; i < response.length; i++) {
      let { _doc } = response[i];
      let o = _doc;
      let vehicleRes = await Vehicle.findOne({ _id: ObjectId(o.vehicleId) });
      if (vehicleRes) {
        vehicleRes = vehicleRes._doc;
        finalArr.push({ ...vehicleRes, ...o });
      }
    }
    obj.data = finalArr;
    obj.count = await Booking.find({}).countDocuments();
  } else {
    obj.status = 401;
    obj.message = "data not found";
  }
  return obj;
}

async function getLocations(query) {
  const obj = { status: 200, message: "data fetched successfully", data: [] };
  const result = await Location.find({});

  if (result) {
    obj.status = 200;
    obj.data = result;
    obj.message = "data get successfully";
  } else {
    obj.status = 401;
    obj.message = "data get successfully";
  }
  return obj;
}

async function getOrders() {
  const obj = { status: 200, message: "data fetched successfully", data: [] };
  const result = await Order.find({});
  if (result) {
    obj.status = 200;
    obj.data = result;
    obj.message = "data get successfully";
  } else {
    obj.status = 401;
    obj.message = "data get successfully";
  }
  return obj;
}

async function getAllBookingDuration() {
  const obj = { status: 200, message: "Data fetched successfully", data: [] };

  try {
    // Fetch all booking durations
    const result = await BookingDuration.find({});
    if (result && result.length > 0) {
      obj.data = result;
      obj.message = "Data retrieved successfully";
    } else {
      obj.status = 404;
      obj.message = "No booking durations available";
    }
  } catch (err) {
    console.error("Error in getAllBookingDuration:", err);
    obj.status = 500;
    obj.message = `Server error: ${err.message}`;
  }

  return obj;
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
  getLocation,
  getPlanData,
  createInvoice,
  discountCoupons,
  getAllInvoice,
  createStation,
  searchVehicle,
  getLocations,
  booking,
  getMessages,
  getVehicleTbl,
  getVehicleTblDataAllStation,
};
