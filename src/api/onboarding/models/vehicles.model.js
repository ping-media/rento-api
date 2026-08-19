const { sendEmail } = require("../../../utils/email/index");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const axios = require("axios");
const { mongoose } = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Vehicle = require("../../../db/schemas/onboarding/vehicle.schema");
const Location = require("../../../db/schemas/onboarding/location.schema");
const Station = require("../../../db/schemas/onboarding/station.schema");
const Booking = require("../../../db/schemas/onboarding/booking.schema");
// const cron = require("node-cron");
const BookingDuration = require("../../../db/schemas/onboarding/bookingDuration.schema");
const User = require("../../../db/schemas/onboarding/user.schema");
const Order = require("../../../db/schemas/onboarding/order.schema");
const VehicleMaster = require("../../../db/schemas/onboarding/vehicle-master.schema");
const Plan = require("../../../db/schemas/onboarding/plan.schema");
const Coupon = require("../../../db/schemas/onboarding/coupons.schema");
const InvoiceTbl = require("../../../db/schemas/onboarding/invoice-tbl.schema");
const VehicleTable = require("../../../db/schemas/onboarding/vehicle-table.schema");
const vehicleTable = require("../../../db/schemas/onboarding/vehicle-table.schema");
const station = require("../../../db/schemas/onboarding/station.schema");
const { emailValidation, contactValidation } = require("../../../constant");
const Log = require("../models/Logs.model");
const { whatsappMessage } = require("../../../utils/whatsappMessage");
const {
  sendEmailForBookingToStationMaster,
} = require("../../../utils/emailSend");
const General = require("../../../db/schemas/onboarding/general.schema");
const { getDurationInDays, calculateTax } = require("../../../utils");
const { generateBookingId } = require("../../../utils/generateBookingId");

const logError = async (message, functionName, userId) => {
  await Log({ message, functionName, userId });
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

let cachedPricingRules = null;
let pricingRulesCachedAt = null;
const PRICING_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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
              { new: true },
            );
            obj.status = 201;
            obj.message = "Booking duration updated successfully";
          } else {
            ((obj.message = "Invalid data"), (obj.status = "401"));
          }
        } else {
          await BookingDuration.updateOne(
            { _id: ObjectId(result._id) },
            {
              $set: { attachedVehicles: [bookingId] },
            },
            { new: true },
          );
          obj.status = 201;
          obj.message = "Booking duration updated successfully";
        }
      } else {
        ((obj.message = "Invalid data"), (obj.status = "401"));
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
    ((obj.message = "Invalid data"), (obj.status = "401"));
  }
  return obj;
};

async function createVehicle({
  _id,
  vehicleMasterId,
  stationId,
  vehicleNumber,
  freeKms,
  weekendFreeKms,
  extraKmsCharges,
  vehicleModel,
  locationId,
  perDayCost,
  weekendCost,
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
        weekendFreeKms &&
        extraKmsCharges &&
        vehicleModel &&
        perDayCost &&
        weekendCost &&
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

      const o = {
        locationId,
        vehicleBookingStatus,
        vehicleStatus,
        vehicleMasterId,
        stationId,
        vehicleNumber,
        freeKms,
        weekendFreeKms,
        extraKmsCharges,
        vehicleModel,
        perDayCost,
        weekendCost,
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

        if (vehicleStatus === "active") {
          const masterId = vehicleMasterId || find.vehicleMasterId;
          const findMaster = await VehicleMaster.findOne({
            _id: ObjectId(masterId),
          });
          if (!findMaster) {
            response.status = 401;
            response.message = "Invalid vehicleMasterId";
            return response;
          }
          if (findMaster.status !== "active") {
            response.status = 401;
            response.message =
              "Please make the Vehicle Master active before activating this vehicle";
            await Log({
              message: `VehicleMaster ${vehicleMasterId} is inactive, cannot activate vehicle`,
              functionName: "createVehicle",
              userId: stationId,
            });
            return response;
          }
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

        if (vehicleNumber) {
          const duplicateVehicle = await VehicleTable.findOne({
            vehicleNumber,
            _id: { $ne: ObjectId(_id) },
          });

          if (duplicateVehicle) {
            response.status = 401;
            response.message = "Vehicle number already exists";

            await Log({
              message: `Duplicate vehicle number attempted: ${vehicleNumber}`,
              functionName: "createVehicle",
              userId: stationId,
            });

            return response;
          }
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

async function booking(
  {
    vehicleTableId,
    // vehicleAssigned = false,
    vehicleAssigned,
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
    Note,
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
    bookedFrom = "web",
    paymentgatewayOrderId,
    userType = "",
    paymentgatewayReceiptId,
    session = undefined,
  },
  // { session = undefined } = {},
) {
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

      if (vehicleTableId) {
        // Vehicle availability check
        const vehicleRecord = await Booking.findOne({ vehicleTableId })
          .sort({
            createdAt: -1,
          })
          .session(session);

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
      }

      var bookingId = await generateBookingId(session);
      // if (!bookingId) {
      //   bookingId = await generateBookingId(session);
      // }

      const find = await Station.find({ stationName }).session(session);

      if (userType != "customer") {
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
      vehicleAssigned,
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
      bookedFrom,
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
      const find = await Booking.findOne({ _id: ObjectId(_id) }).session(
        session,
      );
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
        await Booking.deleteOne({ _id: ObjectId(_id) }).session(session);

        obj.message = "Booking deleted successfully";
        obj.status = 200;

        await Log({
          message: `Booking with ID ${_id} deleted`,
          functionName: "deletebooking",
          userId,
        });

        return obj;
      }

      // if there is note
      if (Note) {
        o.notes = [...(find.notes || []), Note];
      }

      if (o.notes && Array.isArray(o.notes) && o.notes.length > 0) {
        if (isCancelled === true) {
          o.notes = o.notes.filter(
            (note) => !note.noteType.includes("canceled"),
          );
        } else {
          o.notes = [...(find.notes || []), o.notes[0]];
        }
      }

      const UpdatedData = await Booking.findByIdAndUpdate(
        { _id: ObjectId(_id) },
        { $set: o },
        { new: true, session },
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

          var stationMasterUser =
            await User.findById(stationMasterUserId).session(session);
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

        const station = await Station.findOne({ stationName })
          .select("latitude longitude")
          .session(session);
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

          await whatsappMessage(
            [user.contact],
            "booking_confirm_paid",
            messageData,
          );
        } else if (paymentStatus === "partially_paid") {
          const remainingAmount =
            Number(totalPrice) - Number(bookingPrice.userPaid);

          messageData.push(
            bookingPrice.userPaid,
            remainingAmount,
            vehicleBasic.refundableDeposit,
          );
          await whatsappMessage(
            [user.contact],
            "booking_confirmed_partial_paid",
            messageData,
          );
        } else if (paymentStatus === "cash") {
          messageData.push(totalPrice, vehicleBasic.refundableDeposit);

          await whatsappMessage(
            [user.contact],
            "booking_confirm_cash",
            messageData,
          );
        }
        sendEmailForBookingToStationMaster(
          userId,
          stationMasterUserId,
          vehicleName,
          BookingStartDateAndTime,
          BookingEndDateAndTime,
          bookingId,
        );
      }

      obj.data = UpdatedData;
      return obj;
    } else {
      if (
        // vehicleTableId &&
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

        await SaveBooking.save({ session });

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
          userId,
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
          userId,
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
          userId,
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
          userId,
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
        userId,
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
        userId,
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
            userId,
          );
          return obj;
        }
      } else {
        obj.status = 401;
        obj.message = "Invalid user ID";
        await logError(
          "Invalid user ID format during createOrder",
          "createOrder",
          userId,
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
          userId,
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
          userId,
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
          userId,
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
          userId,
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
        userId,
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
          userId,
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
          { new: true },
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
          userId,
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
        userId,
      );
    }

    return obj;
  } catch (error) {
    console.error("Error in createOrder function:", error.message);
    await logError(
      `Error in createOrder: ${error.message}`,
      "createOrder",
      userId,
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
      { new: true },
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
  kmLimit,
  deleteRec,
  userId,
}) {
  const obj = { status: 200, message: "Plan created successfully", data: [] };

  try {
    if (_id || (planName && planPrice && planDuration && kmLimit)) {
      let o = { planName, planPrice, planDuration, kmLimit };

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

            await vehicleTable.updateMany(
              {},
              { $pull: { vehiclePlan: { _id: ObjectId(_id) } } },
            );

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
            { new: true },
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
          { $set: { "bookingPrice.isInvoiceCreated": false } },
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
      "userId bookingId paymentStatus bookingPrice vehicleBasic vehicleName",
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
      "firstName lastName contact email",
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
        new RegExp(`INV-${currentYear}-(\\d{5})`),
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
      { new: true },
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
        { new: true },
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
  mapLink,
  weekendPriceIncrease,
  weekendPercentage,
  weekendPriceType,
  isGstActive,
  _id,
  addonId,
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
    mapLink,
    stationName,
    weekendPriceIncrease,
    weekendPercentage,
    weekendPriceType,
    isGstActive,
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
          userId,
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
          userId,
        );

        return response;
      }

      if (addonId) {
        const addon = station.extraAddOn.find(
          (a) => a._id.toString() === addonId.toString(),
        );

        if (!addon) {
          response.status = 404;
          response.message = "Addon not found in this station";
          return response;
        }

        addon.status = status; // update the field
        await station.save();

        logError(
          "Station addon updated successfully ",
          "createStation",
          userId,
        );
        response.status = 200;
        response.message = "Addon status updated successfully";
        response.data = station;
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
          { $set: { status: status } },
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
          userId,
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
        ", ",
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
        userId,
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
        userId,
      );

      return response;
    }
    if (user.userType !== "manager") {
      response.status = 401;
      response.message = "User is not a manager";
      logError(
        "User is not a manager found during the creating station",
        "createStation",
        userId,
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
        userId,
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
        userId,
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
        userId,
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
        userId,
      );

      return response;
    }

    // const stationExists = await Station.findOne({ stationId });
    // console.log(stationExists);
    // if (stationExists) {
    //   response.status = 401;
    //   response.message = "Station already exists";
    //   logError(
    //     "Station already exists found during the creating station",
    //     "createStation",
    //     userId,
    //   );

    //   return response;
    // }
    const stationExists = await Station.findOne({
      $or: [{ stationId }, { stationName }],
    });

    if (stationExists) {
      response.status = 401;

      if (stationExists.stationId === stationId) {
        response.message = "Station ID already exists";

        logError(
          "Station ID already exists during station creation",
          "createStation",
          userId,
        );
      } else {
        response.message = "Station name already exists";

        logError(
          "Station name already exists during station creation",
          "createStation",
          userId,
        );
      }

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
          "Admin",
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
        "Admin",
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
          "Admin",
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
          "Admin",
        );

        return response;
      }
      await VehicleMaster.updateOne(
        { _id: ObjectId(_id) },
        {
          $set: obj,
        },
        { new: true },
      );
      response.status = 200;
      response.message = "vehicle master updated successfully";
      logError(
        "vehicle master updated successfully",
        "createVehicleMaster",
        "Admin",
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
            "Admin",
          );

          return response;
        }
        const SaveUser = new VehicleMaster(obj);
        SaveUser.save();
        response.message = "vehicle master saved successfully";
        logError(
          "vehicle master saved successfully",
          "createVehicleMaster",
          "Admin",
        );

        response.data = obj;
      } else {
        response.status = 401;
        response.message = "Invalid vehicle master details";
        logError(
          "Invalid vehicle master details found during creating the vehicle master",
          "createVehicleMaster",
          "Admin",
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
              moment(startTime, "hh:mm A"),
            ).getHours();
            let bookingEndHours = new Date(
              moment(endTime, "hh:mm A"),
            ).getHours();
            let bookingStartMinutes = new Date(
              moment(startTime, "hh:mm A"),
            ).getMinutes();
            let bookingEndMinutes = new Date(
              moment(endTime, "hh:mm A"),
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
      vehicleCategory,
      _id,
      search,
      fetchAll = false,
    } = query;

    const filter = {};
    if (_id) filter._id = _id;
    if (vehicleName) filter.vehicleName = vehicleName;
    if (vehicleType) filter.vehicleType = vehicleType;
    if (vehicleBrand) filter.vehicleBrand = vehicleBrand;
    if (vehicleCategory) filter.vehicleCategory = vehicleCategory;

    if (search) {
      filter.$or = [
        { vehicleName: { $regex: search, $options: "i" } },
        { vehicleType: { $regex: search, $options: "i" } },
        { vehicleBrand: { $regex: search, $options: "i" } },
        { vehicleCategory: { $regex: search, $options: "i" } },
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
        }),
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
      vehicleName,
      stationId,
      locationId,
      excludeBookingId,
      page = 1,
      limit = 20,
      search,
      includeUnavailable = false,
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

    let excludeVehicleId = null;

    if (excludeBookingId) {
      const booking =
        await Booking.findById(excludeBookingId).select("vehicleTableId");
      if (booking?.vehicleTableId) {
        excludeVehicleId = booking.vehicleTableId;
      }
    }

    const startDate = BookingStartDateAndTime;
    const endDate = BookingEndDateAndTime;
    const matchFilter = {};

    if (excludeVehicleId) {
      matchFilter._id = { $ne: excludeVehicleId };
    }

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

    // Convert search dates to IST offset for maintenance comparison
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(new Date().getTime() + IST_OFFSET_MS);
    const startDateIST = new Date(
      new Date(startDate).getTime() + IST_OFFSET_MS,
    );
    const endDateIST = new Date(new Date(endDate).getTime() + IST_OFFSET_MS);

    const unavailabilityCheckPipeline = [
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
      {
        $lookup: {
          from: "bookings",
          let: { masterId: "$vehicleMasterId", sid: "$stationId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$vehicleMasterId", "$$masterId"] },
                    { $eq: ["$stationId", "$$sid"] },
                  ],
                },
                bookingStatus: { $ne: "canceled" },
                rideStatus: { $nin: ["completed", "canceled"] },
                $or: [
                  { rideStatus: "ongoing" },
                  {
                    $and: [
                      { BookingEndDateAndTime: { $gt: startDate } },
                      { BookingStartDateAndTime: { $lt: endDate } },
                    ],
                  },
                ],
                // BookingEndDateAndTime: { $gt: startDate },
                // BookingStartDateAndTime: { $lt: endDate },
              },
            },
            {
              $project: {
                _id: 1,
                bookingId: 1,
                bookingStatus: 1,
                rideStatus: 1,
                paymentStatus: 1,
                vehicleAssigned: 1,
                vehicleTableId: 1,
                BookingStartDateAndTime: 1,
                BookingEndDateAndTime: 1,
                // changeVehicle: 1,
                // vehicleBasicVehicleNumber: "$vehicleBasic.vehicleNumber",
              },
            },
          ],
          as: "bookings",
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
        $lookup: {
          from: "vehiclemasters",
          localField: "vehicleMasterId",
          foreignField: "_id",
          as: "vehicleMasterData",
        },
      },
      {
        $addFields: {
          vehicleMasterData: {
            $mergeObjects: [
              { vehicleCategory: "two-wheeler", gstPercentage: 0 },
              { $arrayElemAt: ["$vehicleMasterData", 0] },
            ],
          },

          conflictingBookings: {
            $filter: {
              input: "$bookings",
              as: "booking",
              cond: {
                $and: [
                  ...(excludeBookingId
                    ? [
                        {
                          $ne: [
                            "$$booking._id",
                            new ObjectId(excludeBookingId),
                          ],
                        },
                      ]
                    : []),
                  {
                    $and: [
                      // { $ne: ["$$booking.rideStatus", "pending"] },
                      { $ne: ["$$booking.rideStatus", "canceled"] },
                      { $ne: ["$$booking.rideStatus", "completed"] },
                      { $ne: ["$$booking.bookingStatus", "canceled"] },
                    ],
                  },
                  {
                    $gte: ["$$booking.BookingEndDateAndTime", startDate],
                    // $lt: ["$$booking.BookingStartDateAndTime", endDate],
                  },
                  // { $gt: ["$$booking.BookingEndDateAndTime", startDate] },
                  // Check for time overlap (any of these conditions means conflict)
                  {
                    $or: [
                      { $eq: ["$$booking.rideStatus", "ongoing"] },
                      // Booking starts during search period
                      {
                        $and: [
                          {
                            $gte: [
                              "$$booking.BookingStartDateAndTime",
                              startDate,
                            ],
                          },
                          {
                            $lt: ["$$booking.BookingStartDateAndTime", endDate],
                          },
                        ],
                      },
                      // Booking ends during search period
                      {
                        $and: [
                          {
                            $gt: ["$$booking.BookingEndDateAndTime", startDate],
                          },
                          {
                            $lte: ["$$booking.BookingEndDateAndTime", endDate],
                          },
                        ],
                      },
                      // Booking completely encompasses search period
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
                $and: [
                  {
                    $eq: [
                      { $ifNull: ["$$maintenance.status", "active"] },
                      "active",
                    ],
                  },
                  // Convert stored string dates to Date for proper comparison
                  {
                    $gte: [
                      {
                        $dateFromString: {
                          dateString: "$$maintenance.endDate",
                        },
                      },
                      nowIST,
                    ],
                  },
                  {
                    $or: [
                      {
                        $and: [
                          {
                            $gte: [
                              {
                                $dateFromString: {
                                  dateString: "$$maintenance.startDate",
                                },
                              },
                              startDateIST,
                            ],
                          },
                          {
                            $lt: [
                              {
                                $dateFromString: {
                                  dateString: "$$maintenance.startDate",
                                },
                              },
                              endDateIST,
                            ],
                          },
                        ],
                      },
                      {
                        $and: [
                          {
                            $gt: [
                              {
                                $dateFromString: {
                                  dateString: "$$maintenance.endDate",
                                },
                              },
                              startDateIST,
                            ],
                          },
                          {
                            $lte: [
                              {
                                $dateFromString: {
                                  dateString: "$$maintenance.endDate",
                                },
                              },
                              endDateIST,
                            ],
                          },
                        ],
                      },
                      {
                        $and: [
                          {
                            $lte: [
                              {
                                $dateFromString: {
                                  dateString: "$$maintenance.startDate",
                                },
                              },
                              startDateIST,
                            ],
                          },
                          {
                            $gte: [
                              {
                                $dateFromString: {
                                  dateString: "$$maintenance.endDate",
                                },
                              },
                              endDateIST,
                            ],
                          },
                        ],
                      },
                      {
                        $and: [
                          {
                            $gte: [
                              {
                                $dateFromString: {
                                  dateString: "$$maintenance.startDate",
                                },
                              },
                              startDateIST,
                            ],
                          },
                          {
                            $lte: [
                              {
                                $dateFromString: {
                                  dateString: "$$maintenance.endDate",
                                },
                              },
                              endDateIST,
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $match: {
          // "vehicleMasterData.status": { $ne: "inactive" },
          ...(vehicleBrand
            ? { "vehicleMasterData.vehicleBrand": vehicleBrand }
            : {}),
          ...(vehicleType
            ? { "vehicleMasterData.vehicleType": vehicleType }
            : {}),
          ...(vehicleName
            ? {
                "vehicleMasterData.vehicleName": {
                  $regex: escapeRegex(vehicleName),
                  $options: "i",
                },
              }
            : {}),
        },
      },
      {
        $project: {
          _id: 1,
          vehicleNumber: 1,
          vehicleStatus: 1,
          conflictingBookings: 1,
          conflictingMaintenance: 1,
          "vehicleMasterData.status": 1,
        },
      },
    ];

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
          let: { masterId: "$vehicleMasterId", sid: "$stationId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$vehicleMasterId", "$$masterId"] },
                    { $eq: ["$stationId", "$$sid"] },
                  ],
                },
                bookingStatus: { $ne: "canceled" },
                rideStatus: { $nin: ["completed", "canceled"] },
                $or: [
                  { rideStatus: "ongoing" }, // always load ongoing regardless of dates
                  // overlapping with search period — for conflictingBookings
                  {
                    BookingEndDateAndTime: { $gt: startDate },
                    BookingStartDateAndTime: { $lt: endDate },
                  },
                  // past-ended but ride still not completed — for pendingRideBookings
                  {
                    BookingEndDateAndTime: { $lt: startDate },
                    vehicleAssigned: true,
                  },
                ],
              },
            },
            {
              $project: {
                _id: 1,
                bookingId: 1,
                bookingStatus: 1,
                rideStatus: 1,
                paymentStatus: 1,
                vehicleAssigned: 1,
                vehicleTableId: 1,
                BookingStartDateAndTime: 1,
                BookingEndDateAndTime: 1,
              },
            },
          ],
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
                  ...(excludeBookingId
                    ? [
                        {
                          $ne: [
                            "$$booking._id",
                            new ObjectId(excludeBookingId),
                          ],
                        },
                      ]
                    : []),
                  {
                    $and: [
                      // { $ne: ["$$booking.rideStatus", "pending"] },
                      { $ne: ["$$booking.rideStatus", "canceled"] },
                      { $ne: ["$$booking.rideStatus", "completed"] },
                      { $ne: ["$$booking.bookingStatus", "canceled"] },
                    ],
                  },
                  {
                    $gte: ["$$booking.BookingEndDateAndTime", startDate],
                  },
                  // Check for time overlap (any of these conditions means conflict)
                  {
                    $or: [
                      { $eq: ["$$booking.rideStatus", "ongoing"] }, // overdue ongoing always blocks
                      // Booking starts during search period
                      {
                        $and: [
                          {
                            $gte: [
                              "$$booking.BookingStartDateAndTime",
                              startDate,
                            ],
                          },
                          {
                            $lt: ["$$booking.BookingStartDateAndTime", endDate],
                          },
                        ],
                      },
                      // Booking ends during search period
                      {
                        $and: [
                          {
                            $gt: ["$$booking.BookingEndDateAndTime", startDate],
                          },
                          {
                            $lte: ["$$booking.BookingEndDateAndTime", endDate],
                          },
                        ],
                      },
                      // Booking completely encompasses search period
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
                $and: [
                  {
                    $eq: [
                      { $ifNull: ["$$maintenance.status", "active"] },
                      "active",
                    ],
                  },
                  // Convert stored string dates to Date for proper comparison
                  {
                    $gte: [
                      {
                        $dateFromString: {
                          dateString: "$$maintenance.endDate",
                        },
                      },
                      nowIST,
                    ],
                  },
                  {
                    $or: [
                      {
                        $and: [
                          {
                            $gte: [
                              {
                                $dateFromString: {
                                  dateString: "$$maintenance.startDate",
                                },
                              },
                              startDateIST,
                            ],
                          },
                          {
                            $lt: [
                              {
                                $dateFromString: {
                                  dateString: "$$maintenance.startDate",
                                },
                              },
                              endDateIST,
                            ],
                          },
                        ],
                      },
                      {
                        $and: [
                          {
                            $gt: [
                              {
                                $dateFromString: {
                                  dateString: "$$maintenance.endDate",
                                },
                              },
                              startDateIST,
                            ],
                          },
                          {
                            $lte: [
                              {
                                $dateFromString: {
                                  dateString: "$$maintenance.endDate",
                                },
                              },
                              endDateIST,
                            ],
                          },
                        ],
                      },
                      {
                        $and: [
                          {
                            $lte: [
                              {
                                $dateFromString: {
                                  dateString: "$$maintenance.startDate",
                                },
                              },
                              startDateIST,
                            ],
                          },
                          {
                            $gte: [
                              {
                                $dateFromString: {
                                  dateString: "$$maintenance.endDate",
                                },
                              },
                              endDateIST,
                            ],
                          },
                        ],
                      },
                      {
                        $and: [
                          {
                            $gte: [
                              {
                                $dateFromString: {
                                  dateString: "$$maintenance.startDate",
                                },
                              },
                              startDateIST,
                            ],
                          },
                          {
                            $lte: [
                              {
                                $dateFromString: {
                                  dateString: "$$maintenance.endDate",
                                },
                              },
                              endDateIST,
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },

          pendingRideBookings: {
            $filter: {
              input: "$bookings",
              as: "booking",
              cond: {
                $and: [
                  // Pinned to THIS specific vehicle
                  { $eq: ["$$booking.vehicleAssigned", true] },
                  { $eq: ["$$booking.vehicleTableId", "$_id"] },
                  // Ride not finished
                  { $ne: ["$$booking.rideStatus", "completed"] },
                  { $ne: ["$$booking.rideStatus", "canceled"] },
                  { $ne: ["$$booking.bookingStatus", "canceled"] },
                  // Booking period already ended (before search start)
                  { $lt: ["$$booking.BookingEndDateAndTime", startDate] },
                ],
              },
            },
          },
        },
      },

      {
        $match: {
          vehicleStatus: "active",
          "vehicleMasterData.status": { $ne: "inactive" },
        },
      },

      // Flatten vehicle master and station data
      {
        $addFields: {
          vehicleMasterData: {
            $mergeObjects: [
              { vehicleCategory: "two-wheeler", gstPercentage: 0 },
              { $arrayElemAt: ["$vehicleMasterData", 0] },
            ],
          },
          stationData: {
            $mergeObjects: [
              {
                weekendPriceIncrease: "active",
                weekendPercentage: 0,
                weekendPriceType: "percentage",
              },
              { $arrayElemAt: ["$stationData", 0] },
            ],
          },
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
          ...(vehicleName
            ? {
                "vehicleMasterData.vehicleName": {
                  $regex: escapeRegex(vehicleName),
                  $options: "i",
                },
              }
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
          bookingConflict: 1,
          freeKms: 1,
          vehicleMasterId: 1,
          vehicleMasterData: 1,
          extraKmsCharges: 1,
          vehicleNumber: 1,
          vehicleModel: 1,
          vehiclePlan: 1,
          perDayCost: 1,
          weekendCost: 1,
          weekendFreeKms: 1,
          lastServiceDate: 1,
          kmsRun: 1,
          condition: 1,
          locationId: 1,
          stationData: 1,
          stationId: 1,
          conflictingBookings: 1,
          conflictingMaintenance: 1,
          pendingRideBookings: 1,
        },
      },

      // Pagination using $facet
      { $sort: { vehicleNumber: 1 } },
    ];

    const allVehiclesForCheck = await vehicleTable.aggregate(
      unavailabilityCheckPipeline,
    );

    let vehicles = await vehicleTable.aggregate(pipeline);

    // When _id filter is used, only 1 vehicle is in results but conflictingBookings
    // has the full pool's bookings — fetch full sorted pool for correct slot math
    const fullPoolByGroup = {};
    // _id, search, and excludeBookingId can all reduce the per-group vehicle
    // count below the true pool size — fetch the real pool for correct slot math
    if ((_id || search || excludeBookingId) && vehicles.length > 0) {
      // if (_id && vehicles.length > 0) {
      for (const v of vehicles) {
        const gKey = `${v.vehicleModel}-${v.stationId}`;
        if (!fullPoolByGroup[gKey]) {
          const allPoolVehicles = await vehicleTable
            .find({
              vehicleMasterId: v.vehicleMasterId,
              stationId: v.stationId,
              vehicleStatus: "active",
            })
            .select("_id vehicleNumber")
            .sort({ vehicleNumber: 1 })
            .lean();
          fullPoolByGroup[gKey] = allPoolVehicles.map((pv) =>
            pv._id.toString(),
          );
        }
      }
    }

    const specificAssignedVehicleIds = new Set();
    vehicles.forEach((v) => {
      const vid = v._id.toString();
      const assignedToThis = (v.conflictingBookings || []).filter(
        (b) =>
          b.vehicleAssigned === true && b.vehicleTableId?.toString() === vid,
      );
      if (assignedToThis.length > 0) {
        specificAssignedVehicleIds.add(vid);
      }
    });

    // Step 2 — per group, check if the entire pool is full
    // (only then do unassigned bookings cause a vehicle to show as booked)
    const groupFreeSlots = {};
    const fullPoolForGroup =
      Object.keys(fullPoolByGroup).length > 0 ? fullPoolByGroup : null;

    vehicles.forEach((v) => {
      const key = `${v.vehicleModel}-${v.stationId}`;
      if (!groupFreeSlots[key]) {
        const poolIds = fullPoolForGroup?.[key] || null;

        // operational = pool vehicles not under maintenance and not specifically assigned
        const operationalCount = poolIds
          ? poolIds.filter((id) => !specificAssignedVehicleIds.has(id)).length
          : vehicles.filter(
              (pv) =>
                `${pv.vehicleModel}-${pv.stationId}` === key &&
                (pv.conflictingMaintenance?.length || 0) === 0 &&
                !specificAssignedVehicleIds.has(pv._id.toString()),
            ).length;

        const unassignedCount = (v.conflictingBookings || []).filter(
          (b) => !b.vehicleAssigned,
        ).length;

        groupFreeSlots[key] = Math.max(0, operationalCount - unassignedCount);
      }
    });

    vehicles = vehicles.map((v) => {
      const vid = v._id.toString();
      const key = `${v.vehicleModel}-${v.stationId}`;
      let computedStatus = v.vehicleStatus;

      if ((v.conflictingMaintenance?.length || 0) > 0) {
        computedStatus = "maintenance";
      } else if (specificAssignedVehicleIds.has(vid)) {
        // specifically pinned to another booking
        computedStatus = "booked";
      } else if (groupFreeSlots[key] <= 0) {
        // entire pool is full — no slot available for anyone
        computedStatus = "booked";
      }
      const conflictingBookingForDisplay =
        v.conflictingBookings?.find(
          (b) =>
            b.vehicleAssigned === true && b.vehicleTableId?.toString() === vid,
        ) || v.conflictingBookings?.[0];
      const pendingRide = v.pendingRideBookings?.[0];

      const { pendingRideBookings: _removed, ...vClean } = v;

      return {
        ...vClean,
        vehicleStatus: computedStatus,
        bookingConflict:
          computedStatus === "booked" && conflictingBookingForDisplay
            ? {
                _id: conflictingBookingForDisplay._id,
                bookingId: conflictingBookingForDisplay.bookingId,
              }
            : null,
        pendingRideWarning: pendingRide
          ? {
              _id: pendingRide._id,
              bookingId: pendingRide.bookingId,
              rideStatus: pendingRide.rideStatus,
              BookingEndDateAndTime: pendingRide.BookingEndDateAndTime,
              message:
                "This vehicle has an active booking whose period has ended but ride is not marked completed yet",
            }
          : null,
      };
    });

    const filteredVehicles = includeUnavailable
      ? vehicles
      : vehicles.filter((v) => v.vehicleStatus === "active");

    if (!filteredVehicles.length) {
      if (allVehiclesForCheck.length === 0) {
        response.status = 404;
        response.message = "No vehicles found matching the search criteria";
        response.data = [];
        response.pagination = {
          totalPages: 0,
          currentPage: parsedPage,
          limit: parsedLimit,
        };
        return response;
      }

      const unavailabilityReasons = [];
      allVehiclesForCheck.forEach((vehicle) => {
        if (vehicle.vehicleStatus !== "active") {
          unavailabilityReasons.push({
            vehicleId: vehicle._id,
            vehicleNumber: vehicle.vehicleNumber,
            reason: "Vehicle is blocked. Unblock it to proceed",
          });
        } else if (vehicle.vehicleMasterData?.status === "inactive") {
          unavailabilityReasons.push({
            vehicleId: vehicle._id,
            vehicleNumber: vehicle.vehicleNumber,
            reason: "Vehicle master is inactive",
          });
        } else if (vehicle.conflictingBookings.length > 0) {
          // const bookingId = vehicle.conflictingBookings[0].bookingId;
          const blockingBooking =
            vehicle.conflictingBookings.find(
              (b) =>
                b.vehicleAssigned &&
                b.vehicleTableId?.toString() === vehicle._id.toString(),
            ) || vehicle.conflictingBookings[0];
          const bookingId = blockingBooking?.bookingId;
          unavailabilityReasons.push({
            vehicleId: vehicle._id,
            vehicleNumber: vehicle.vehicleNumber,
            reason: bookingId
              ? `Vehicle ${vehicle.vehicleNumber} is already in booking ${bookingId}`
              : "Vehicle is already booked",
            bookingId: blockingBooking?.bookingId,
            // bookingId: vehicle.conflictingBookings[0].bookingId,
          });
        } else if (vehicle.conflictingMaintenance.length > 0) {
          unavailabilityReasons.push({
            vehicleId: vehicle._id,
            vehicleNumber: vehicle.vehicleNumber,
            reason: "Vehicle is under maintenance",
            maintenanceId: vehicle.conflictingMaintenance[0]._id,
          });
        }
      });

      response.status = 404;
      response.message = `Found ${allVehiclesForCheck.length} vehicle(s) but none are available for the selected time period`;
      response.data = [];
      response.unavailabilityReasons = unavailabilityReasons;
      response.pagination = {
        totalPages: 0,
        currentPage: parsedPage,
        limit: parsedLimit,
      };
      return response;
    }

    // Pagination on filtered vehicles
    const totalRecords = filteredVehicles.length;
    const totalPages = Math.ceil(totalRecords / parsedLimit);
    const startIndex = (parsedPage - 1) * parsedLimit;
    const vehicleData = filteredVehicles.slice(
      startIndex,
      startIndex + parsedLimit,
    );

    const adjustedVehicles = [];
    // const pricingRules = await General.findOne({});
    const now = Date.now();
    if (
      !cachedPricingRules ||
      now - pricingRulesCachedAt > PRICING_CACHE_TTL_MS
    ) {
      cachedPricingRules = await General.findOne({});
      pricingRulesCachedAt = now;
    }
    const pricingRules = cachedPricingRules;

    for (const vehicle of vehicleData) {
      const adjustedVehicle = { ...vehicle };

      if (pricingRules) {
        const originalPerDayCost = adjustedVehicle.perDayCost;

        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);

        const durationInHours = (endDateObj - startDateObj) / (1000 * 60 * 60);
        const bookingDurationDays =
          durationInHours < 24 ? 1 : Math.ceil(durationInHours / 24);

        let totalRentalCost = 0;
        const daysBreakdown = [];
        const appliedPlans = [];

        let remainingDays = bookingDurationDays;
        let currentDate = new Date(startDateObj);

        // Get weekend percentage from station data instead of global pricing rules
        const weekendPercentage =
          adjustedVehicle.stationData?.weekendPercentage || 0;

        // Check if this station has weekend price increase enabled
        const stationWeekendEnabled =
          adjustedVehicle.stationData?.weekendPriceIncrease === "active";

        // NEW: check global flag to decide pricing source (vehicle-level vs station-level)
        const useVehicleLevelWeekendPrice =
          pricingRules?.vehicleLevelWeekendPrice === true;
        const vehicleWeekendCost = adjustedVehicle?.weekendCost;
        const vehicleWeekendKmLimit = adjustedVehicle?.weekendFreeKms ?? null;

        if (
          adjustedVehicle.vehiclePlan &&
          adjustedVehicle.vehiclePlan.length > 0
        ) {
          const sortedPlans = [...adjustedVehicle.vehiclePlan].sort(
            (a, b) => b.planDuration - a.planDuration,
          );

          for (const plan of sortedPlans) {
            if (remainingDays >= plan.planDuration) {
              const times = Math.floor(remainingDays / plan.planDuration);
              const planCost = times * plan.planPrice;

              totalRentalCost += planCost;
              appliedPlans.push({
                days: plan.planDuration,
                count: times,
                planPrice: plan.planPrice,
                kmLimit: plan.kmLimit ?? 0,
              });

              remainingDays -= times * plan.planDuration;

              currentDate.setDate(
                currentDate.getDate() + times * plan.planDuration,
              );
            }
          }
        }

        // STEP 2: Charge Daily for Remaining Days with Weekend/Special Rules
        for (let i = 0; i < remainingDays; i++) {
          const dayOfWeek = currentDate.getDay();
          const isWeekend =
            dayOfWeek === 0 ||
            dayOfWeek === 6 ||
            (dayOfWeek === 5 &&
              new Date(currentDate.getTime() + 24 * 60 * 60 * 1000).getDay() ===
                6 &&
              remainingDays > 1);
          // const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          let dailyRate = originalPerDayCost;

          // if (isWeekend && stationWeekendEnabled && weekendPercentage !== 0) {
          //   const weekendPriceType =
          //     adjustedVehicle?.stationData?.weekendPriceType || "percentage";
          //   if (weekendPriceType === "fixed") {
          //     dailyRate += weekendPercentage;
          //   } else {
          //     dailyRate += (originalPerDayCost * weekendPercentage) / 100;
          //   }
          // }
          if (isWeekend) {
            if (useVehicleLevelWeekendPrice) {
              // Vehicle-level: use vehicle's own weekendCost directly if set
              if (vehicleWeekendCost != null && vehicleWeekendCost > 0) {
                dailyRate = vehicleWeekendCost;
              }
            } else if (stationWeekendEnabled && weekendPercentage !== 0) {
              // Station-level: existing percentage/fixed logic
              const weekendPriceType =
                adjustedVehicle?.stationData?.weekendPriceType || "percentage";
              if (weekendPriceType === "fixed") {
                dailyRate += weekendPercentage;
              } else {
                dailyRate += (originalPerDayCost * weekendPercentage) / 100;
              }
            }
          }

          // Apply special day pricing
          if (pricingRules.specialDays && pricingRules.specialDays.length > 0) {
            for (const specialDay of pricingRules.specialDays) {
              const fromDate = new Date(specialDay.From);
              const toDate = new Date(specialDay.Too);

              if (currentDate >= fromDate && currentDate <= toDate) {
                const specialPrice = specialDay.Price;
                const specialPriceType = specialDay.PriceType;

                if (specialPriceType === "+") {
                  dailyRate += (originalPerDayCost * specialPrice) / 100;
                } else if (specialPriceType === "-") {
                  dailyRate -= (originalPerDayCost * specialPrice) / 100;
                }

                break;
              }
            }
          }

          totalRentalCost += dailyRate;

          const isWeekendKmApplied =
            isWeekend &&
            useVehicleLevelWeekendPrice &&
            vehicleWeekendKmLimit != null &&
            vehicleWeekendKmLimit > 0;

          daysBreakdown.push({
            date: new Date(currentDate),
            isWeekend,
            dailyRate: Math.round(dailyRate),
            weekendPriceApplied: isWeekend
              ? useVehicleLevelWeekendPrice
                ? vehicleWeekendCost != null && vehicleWeekendCost > 0
                : stationWeekendEnabled && weekendPercentage !== 0
              : false,
            weekendPriceType: useVehicleLevelWeekendPrice
              ? "vehicleLevel"
              : adjustedVehicle?.stationData?.weekendPriceType || "percentage",
            kmLimit: isWeekendKmApplied
              ? vehicleWeekendKmLimit
              : adjustedVehicle.freeKms,
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Final Adjustments
        adjustedVehicle.originalPerDayCost = originalPerDayCost;
        adjustedVehicle._daysBreakdown = daysBreakdown;
        adjustedVehicle.totalRentalCost = Math.round(totalRentalCost);
        adjustedVehicle.appliedPlans = appliedPlans;

        // adding tax if station is taking tax
        const gstPercentage = adjustedVehicle?.vehicleMasterData?.gstPercentage;
        const isGstActive =
          adjustedVehicle?.stationData?.isGstActive === "active" ? true : false;

        if (isGstActive) {
          adjustedVehicle.tax =
            gstPercentage > 0
              ? calculateTax(Math.round(totalRentalCost), gstPercentage)
              : 0;
        } else {
          adjustedVehicle.tax = 0;
        }

        const startDay = startDateObj.getDay();
        const isStartWeekend = startDay === 0 || startDay === 6;

        if (useVehicleLevelWeekendPrice) {
          adjustedVehicle.perDayCost =
            isStartWeekend &&
            vehicleWeekendCost != null &&
            vehicleWeekendCost > 0
              ? Math.round(vehicleWeekendCost)
              : originalPerDayCost;
        } else if (
          isStartWeekend &&
          stationWeekendEnabled &&
          weekendPercentage !== 0
        ) {
          const weekendPriceType =
            adjustedVehicle?.stationData?.weekendPriceType || "percentage";
          adjustedVehicle.perDayCost = Math.round(
            weekendPriceType === "fixed"
              ? originalPerDayCost + weekendPercentage
              : originalPerDayCost +
                  (originalPerDayCost * weekendPercentage) / 100,
          );
        } else {
          adjustedVehicle.perDayCost = originalPerDayCost;
        }

        const isStartWeekendKmApplied =
          isStartWeekend &&
          useVehicleLevelWeekendPrice &&
          vehicleWeekendKmLimit != null &&
          vehicleWeekendKmLimit > 0;

        adjustedVehicle.weekdayFreeKms = adjustedVehicle.freeKms;
        adjustedVehicle.freeKms = isStartWeekendKmApplied
          ? vehicleWeekendKmLimit
          : adjustedVehicle.freeKms;
      }

      adjustedVehicles.push(adjustedVehicle);
    }

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
      vehicleCategory,
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

    // Add this validation after the existing date format validation
    const currentDate = new Date();
    const bookingStartDate = new Date(BookingStartDateAndTime);

    if (bookingStartDate < currentDate) {
      return {
        status: 400,
        message: "Booking start date cannot be in the past.",
        data: [],
      };
    }

    const startDate = BookingStartDateAndTime;
    const endDate = BookingEndDateAndTime;

    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(new Date().getTime() + IST_OFFSET_MS);
    const startDateIST = new Date(
      new Date(startDate).getTime() + IST_OFFSET_MS,
    );
    const endDateIST = new Date(new Date(endDate).getTime() + IST_OFFSET_MS);

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
                  {
                    "searchVehicleMaster.vehicleCategory": {
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
          let: { masterId: "$vehicleMasterId", sid: "$stationId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$vehicleMasterId", "$$masterId"] },
                    { $eq: ["$stationId", "$$sid"] },
                  ],
                },
                // Pre-filter at DB level — don't load completed/canceled bookings
                bookingStatus: { $ne: "canceled" },
                rideStatus: { $ne: "completed" },
                paymentStatus: {
                  $in: ["paid", "partially_paid", "partiallyPay", "pending"],
                },
                $or: [
                  { rideStatus: "ongoing" }, // always include ongoing regardless of dates
                  {
                    $and: [
                      { BookingEndDateAndTime: { $gt: startDate } },
                      { BookingStartDateAndTime: { $lt: endDate } },
                    ],
                  },
                ],
                // BookingEndDateAndTime: { $gt: startDate },
                // BookingStartDateAndTime: { $lt: endDate },
              },
            },
            // Only project fields we actually use — don't load entire booking documents
            {
              $project: {
                _id: 1,
                bookingId: 1,
                bookingStatus: 1,
                rideStatus: 1,
                paymentStatus: 1,
                vehicleAssigned: 1,
                vehicleTableId: 1,
                BookingStartDateAndTime: 1,
                BookingEndDateAndTime: 1,
              },
            },
          ],
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
                  // Exclude canceled bookings (always available if canceled)
                  { $ne: ["$$booking.bookingStatus", "canceled"] },

                  // Only include bookings that have paid/partially paid status
                  {
                    $or: [
                      { $eq: ["$$booking.paymentStatus", "paid"] },
                      { $eq: ["$$booking.paymentStatus", "partially_paid"] },
                      { $eq: ["$$booking.paymentStatus", "partiallyPay"] },
                      { $eq: ["$$booking.paymentStatus", "pending"] },
                    ],
                  },

                  // Exclude completed rides (vehicle is free after completion)
                  { $ne: ["$$booking.rideStatus", "completed"] },

                  // Check for time overlap with search period
                  {
                    $or: [
                      { $eq: ["$$booking.rideStatus", "ongoing"] },
                      // Booking starts during search period
                      {
                        $and: [
                          {
                            $gte: [
                              "$$booking.BookingStartDateAndTime",
                              startDate,
                            ],
                          },
                          {
                            $lt: ["$$booking.BookingStartDateAndTime", endDate],
                          },
                        ],
                      },
                      // Booking ends during search period
                      {
                        $and: [
                          {
                            $gt: ["$$booking.BookingEndDateAndTime", startDate],
                          },
                          {
                            $lte: ["$$booking.BookingEndDateAndTime", endDate],
                          },
                        ],
                      },
                      // Booking completely encompasses search period
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
                      // Search period completely encompasses booking
                      {
                        $and: [
                          {
                            $gte: [
                              "$$booking.BookingStartDateAndTime",
                              startDate,
                            ],
                          },
                          {
                            $lte: ["$$booking.BookingEndDateAndTime", endDate],
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
                $and: [
                  {
                    $eq: [
                      { $ifNull: ["$$maintenance.status", "active"] },
                      "active",
                    ],
                  },
                  {
                    $or: [
                      // Maintenance starts during search period
                      {
                        $and: [
                          { $gte: ["$$maintenance.startDate", startDate] },
                          { $lt: ["$$maintenance.startDate", endDate] },
                        ],
                      },
                      // Maintenance ends during search period
                      {
                        $and: [
                          { $gt: ["$$maintenance.endDate", startDate] },
                          { $lte: ["$$maintenance.endDate", endDate] },
                        ],
                      },
                      // Maintenance completely encompasses search period
                      {
                        $and: [
                          { $lte: ["$$maintenance.startDate", startDate] },
                          { $gte: ["$$maintenance.endDate", endDate] },
                        ],
                      },
                      // Search period completely encompasses maintenance
                      {
                        $and: [
                          { $gte: ["$$maintenance.startDate", startDate] },
                          { $lte: ["$$maintenance.endDate", endDate] },
                        ],
                      },
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
          vehicleMasterData: {
            $mergeObjects: [
              { vehicleCategory: "two-wheeler", gstPercentage: 0 },
              { $arrayElemAt: ["$vehicleMasterData", 0] },
            ],
          },
          stationData: {
            $mergeObjects: [
              {
                weekendPriceIncrease: "active",
                weekendPercentage: 0,
                weekendPriceType: "percentage",
              },
              { $arrayElemAt: ["$stationData", 0] },
            ],
          },
        },
      },

      {
        $match: {
          // vehicleStatus: "active",
          // "vehicleMasterData.status": { $ne: "inactive" },
          ...(vehicleBrand
            ? { "vehicleMasterData.vehicleBrand": vehicleBrand }
            : {}),
          ...(vehicleType
            ? { "vehicleMasterData.vehicleType": vehicleType }
            : {}),
          ...(vehicleCategory
            ? { "vehicleMasterData.vehicleCategory": vehicleCategory }
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

    // For _id queries, fetch full pool count for accurate slot math
    // Without this, 1 unassigned booking against 102 vehicles wrongly
    // excludes the single queried vehicle
    const fullPoolCountByGroup = {};
    if (_id && allVehicles.length > 0) {
      for (const v of allVehicles) {
        const gKey = `${v.vehicleModel}-${v.vehicleMasterData?.vehicleBrand || ""}-${v.vehicleMasterData?.vehicleName || ""}-${v.perDayCost}`;
        if (!fullPoolCountByGroup[gKey]) {
          const assignedVehicleIdsInPool = (v.conflictingBookings || [])
            // .filter(
            //   (b) =>
            //     b.vehicleAssigned === true &&
            //     b.vehicleTableId &&
            //     b.rideStatus === "ongoing",
            // )
            .filter((b) => b.vehicleAssigned === true && b.vehicleTableId)
            .map((b) => new ObjectId(b.vehicleTableId.toString()));

          const poolTrulyFreeCount = await vehicleTable.countDocuments({
            vehicleMasterId: v.vehicleMasterId,
            stationId: v.stationId,
            vehicleStatus: "active",
            ...(assignedVehicleIdsInPool.length > 0
              ? { _id: { $nin: assignedVehicleIdsInPool } }
              : {}),
          });

          // const maintenanceBlockedIds = await mongoose.connection
          //   .collection("maintenancevehicles")
          //   .distinct("vehicleTableId", {
          //     status: "active",
          //     startDate: { $lte: endDate },
          //     endDate: { $gte: startDate },
          //   });

          // const excludedIds = [
          //   ...assignedVehicleIdsInPool,
          //   ...maintenanceBlockedIds.map((id) => new ObjectId(id.toString())),
          // ];

          // const poolTrulyFreeCount = await vehicleTable.countDocuments({
          //   vehicleMasterId: v.vehicleMasterId,
          //   stationId: v.stationId,
          //   vehicleStatus: "active",
          //   ...(excludedIds.length > 0 ? { _id: { $nin: excludedIds } } : {}),
          // });
          fullPoolCountByGroup[gKey] = poolTrulyFreeCount;
        }
      }
    }

    // Now separate available and excluded vehicles
    // GROUP-FIRST approach: since bookings are now joined at the model+station level,
    // all vehicles in the same model group share the same conflictingBookings list.
    // Availability = operationalVehicles - conflictingBookingCount (count-based, not ID-based).

    const allGroupsByKey = {};

    allVehicles.forEach((vehicle) => {
      const groupKey = `${vehicle.vehicleModel}-${
        vehicle.vehicleMasterData?.vehicleBrand || ""
      }-${vehicle.vehicleMasterData?.vehicleName || ""}-${vehicle.perDayCost}`;

      if (!allGroupsByKey[groupKey]) {
        allGroupsByKey[groupKey] = {
          vehicles: [],
          conflictingBookings: vehicle.conflictingBookings, // same for all in group
        };
      }
      allGroupsByKey[groupKey].vehicles.push(vehicle);
    });

    const groupAvailableVehicles = {};
    const groupExcludedVehicles = {};

    Object.entries(allGroupsByKey).forEach(([groupKey, groupData]) => {
      const { vehicles: vehiclesInGroup, conflictingBookings } = groupData;

      const activeVehicles = vehiclesInGroup.filter(
        (v) =>
          v.vehicleStatus === "active" &&
          v.vehicleMasterData?.status !== "inactive",
      );
      const inactiveVehicles = vehiclesInGroup.filter(
        (v) =>
          v.vehicleStatus !== "active" ||
          v.vehicleMasterData?.status === "inactive",
      );

      const vehiclesUnderMaintenance = activeVehicles.filter(
        (v) => v.conflictingMaintenance.length > 0,
      );
      const operationalVehicles = activeVehicles.filter(
        (v) => v.conflictingMaintenance.length === 0,
      );

      // Assigned bookings pin a specific vehicle — don't count against other vehicles
      const assignedConflictingBookings = conflictingBookings.filter(
        (b) => b.vehicleAssigned === true && b.vehicleTableId,
        // (b) =>
        //   b.vehicleAssigned === true &&
        //   b.vehicleTableId &&
        //   b.rideStatus === "ongoing",
      );
      const unassignedConflictingBookings = conflictingBookings.filter(
        (b) => !b.vehicleAssigned,
      );

      // IDs of vehicles already pinned to an assigned booking
      const assignedVehicleIds = new Set(
        assignedConflictingBookings.map((b) => b.vehicleTableId?.toString()),
      );

      // Operational vehicles not pinned to any specific booking
      const trulyFreeVehicles = operationalVehicles.filter(
        (v) => !assignedVehicleIds.has(v._id.toString()),
      );

      const poolTrulyFreeCount = fullPoolCountByGroup[groupKey] ?? null;

      let actualAvailableVehicles;
      let availableSlots;

      if (poolTrulyFreeCount !== null) {
        // _id query: full pool count known, check if slot exists for this vehicle
        availableSlots = Math.max(
          0,
          poolTrulyFreeCount - unassignedConflictingBookings.length,
        );
        actualAvailableVehicles = availableSlots > 0 ? trulyFreeVehicles : [];
      } else {
        actualAvailableVehicles = trulyFreeVehicles.slice(
          unassignedConflictingBookings.length,
        );
        availableSlots = actualAvailableVehicles.length;

        // const unassignedCount = Math.min(
        //   unassignedConflictingBookings.length,
        //   trulyFreeVehicles.length,
        // );
        // actualAvailableVehicles = trulyFreeVehicles.slice(unassignedCount);
        // availableSlots = actualAvailableVehicles.length;
      }

      // Latest booking date info for the excluded display
      let latestBookingEndDate = null;
      let latestBookingStartDate = null;
      if (conflictingBookings.length > 0) {
        let latestBooking = conflictingBookings[0];
        for (const booking of conflictingBookings) {
          if (
            new Date(booking.BookingEndDateAndTime) >
            new Date(latestBooking.BookingEndDateAndTime)
          ) {
            latestBooking = booking;
          }
        }
        latestBookingEndDate = latestBooking.BookingEndDateAndTime;
        latestBookingStartDate = latestBooking.BookingStartDateAndTime;
      }

      if (availableSlots > 0) {
        const representativeVehicle = actualAvailableVehicles[0];
        groupAvailableVehicles[groupKey] = {
          ...representativeVehicle,
          vehicleNumber: undefined,
          lastServiceDate: undefined,
          kmsRun: undefined,
          lastMeterReading: undefined,
          vehicleDetails: actualAvailableVehicles.map((v) => ({
            _id: v._id,
            vehicleNumber: v.vehicleNumber,
            lastServiceDate: v.lastServiceDate,
            kmsRun: v.kmsRun,
            lastMeterReading: v.lastMeterReading || null,
          })),
        };
      } else {
        // Zero free slots — goes to excluded list
        const allExcluded = [
          ...operationalVehicles, // blocked by bookings
          ...vehiclesUnderMaintenance,
          ...inactiveVehicles,
        ];

        if (allExcluded.length > 0) {
          const representativeVehicle = allExcluded[0];
          groupExcludedVehicles[groupKey] = {
            ...representativeVehicle,
            vehicleNumber: undefined,
            lastServiceDate: undefined,
            kmsRun: undefined,
            lastMeterReading: undefined,
            vehicleDetails: allExcluded.map((v) => {
              const isUnderMaintenance = v.conflictingMaintenance?.length > 0;

              let latestMaintenanceEndDate = null;
              let latestMaintenanceStartDate = null;

              if (isUnderMaintenance) {
                let latestMaintenance = v.conflictingMaintenance[0];
                for (const maintenance of v.conflictingMaintenance) {
                  if (
                    new Date(maintenance.endDate) >
                    new Date(latestMaintenance.endDate)
                  ) {
                    latestMaintenance = maintenance;
                  }
                }
                latestMaintenanceEndDate = latestMaintenance.endDate;
                latestMaintenanceStartDate = latestMaintenance.startDate;
              }

              return {
                _id: v._id,
                vehicleNumber: v.vehicleNumber,
                lastServiceDate: v.lastServiceDate,
                kmsRun: v.kmsRun,
                lastMeterReading: v.lastMeterReading || null,
                BookingStartDate: isUnderMaintenance
                  ? null
                  : latestBookingStartDate,
                BookingEndDate: isUnderMaintenance
                  ? null
                  : latestBookingEndDate,
                MaintenanceStartDate: latestMaintenanceStartDate,
                MaintenanceEndDate: latestMaintenanceEndDate,
              };
            }),
          };
        }
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
          (av) => av._id && v._id && av._id.toString() === v._id.toString(),
        ),
      );
      paginatedExcluded = paginatedGroups.filter((v) =>
        cleanGroupedExcluded.some(
          (ex) => ex._id && v._id && ex._id.toString() === v._id.toString(),
        ),
      );
    }

    // Apply pricing rules to available vehicles
    // const pricingRules = await General.findOne({});
    const now = Date.now();
    if (
      !cachedPricingRules ||
      now - pricingRulesCachedAt > PRICING_CACHE_TTL_MS
    ) {
      cachedPricingRules = await General.findOne({});
      pricingRulesCachedAt = now;
    }
    const pricingRules = cachedPricingRules;

    if (pricingRules) {
      paginatedAvailable = paginatedAvailable.map((groupedVehicle) => {
        const adjustedVehicle = { ...groupedVehicle };
        const originalPerDayCost = adjustedVehicle.perDayCost;
        // const weekendCost =
        //   adjustedVehicle?.weekendCost != null
        //     ? adjustedVehicle.weekendCost
        //     : originalPerDayCost;

        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        const durationInHours = (endDateObj - startDateObj) / (1000 * 60 * 60);
        const bookingDurationDays =
          durationInHours < 24 ? 1 : Math.ceil(durationInHours / 24);

        adjustedVehicle.originalPerDayCost = originalPerDayCost;

        let totalRentalCost = 0;
        const daysBreakdown = [];
        const appliedPlans = [];

        let remainingDays = bookingDurationDays;
        let currentDate = new Date(startDateObj);

        // Get weekend percentage from station data instead of global pricing rules
        const weekendPercentage =
          adjustedVehicle?.stationData?.weekendPercentage || 0;

        // Check if this station has weekend price increase enabled
        const stationWeekendEnabled =
          adjustedVehicle?.stationData?.weekendPriceIncrease === "active";

        // NEW: check global flag to decide pricing source (vehicle-level vs station-level)
        const useVehicleLevelWeekendPrice =
          pricingRules?.vehicleLevelWeekendPrice === true;
        const vehicleWeekendCost = adjustedVehicle?.weekendCost;
        const vehicleWeekendKmLimit = adjustedVehicle?.weekendFreeKms ?? null;

        // STEP 1: Apply Plan Pricing (e.g. 7-day, 15-day, etc.)
        if (
          adjustedVehicle.vehiclePlan &&
          adjustedVehicle.vehiclePlan.length > 0
        ) {
          const sortedPlans = [...adjustedVehicle.vehiclePlan].sort(
            (a, b) => b.planDuration - a.planDuration,
          );

          for (const plan of sortedPlans) {
            if (remainingDays >= plan.planDuration) {
              const times = Math.floor(remainingDays / plan.planDuration);
              const planCost = times * plan.planPrice;

              totalRentalCost += planCost;
              appliedPlans.push({
                days: plan.planDuration,
                count: times,
                kmLimit: plan.kmLimit ?? 0,
                planPrice: plan.planPrice,
              });

              remainingDays -= times * plan.planDuration;

              // Move currentDate forward for the plan days
              currentDate.setDate(
                currentDate.getDate() + times * plan.planDuration,
              );
            }
          }
        }

        // STEP 2: Charge Daily for Remaining Days with Weekend/Special Rules
        for (let i = 0; i < remainingDays; i++) {
          const dayOfWeek = currentDate.getDay();
          const isWeekend =
            dayOfWeek === 0 ||
            dayOfWeek === 6 ||
            (dayOfWeek === 5 &&
              new Date(currentDate.getTime() + 24 * 60 * 60 * 1000).getDay() ===
                6 &&
              remainingDays > 1);

          let dailyRate = originalPerDayCost;

          // Apply weekend pricing both percentage and fixed based
          // if (isWeekend && weekendCost > 0) {
          //   dailyRate = weekendCost;
          // }
          // if (isWeekend && stationWeekendEnabled && weekendPercentage !== 0) {
          //   const weekendPriceType =
          //     adjustedVehicle?.stationData?.weekendPriceType || "percentage";
          //   if (weekendPriceType === "fixed") {
          //     dailyRate += weekendPercentage;
          //   } else {
          //     dailyRate += (originalPerDayCost * weekendPercentage) / 100;
          //   }
          // }
          if (isWeekend) {
            if (useVehicleLevelWeekendPrice) {
              // Vehicle-level: use vehicle's own weekendCost directly if set
              if (vehicleWeekendCost != null && vehicleWeekendCost > 0) {
                dailyRate = vehicleWeekendCost;
              }
            } else if (stationWeekendEnabled && weekendPercentage !== 0) {
              // Station-level: existing percentage/fixed logic
              const weekendPriceType =
                adjustedVehicle?.stationData?.weekendPriceType || "percentage";
              if (weekendPriceType === "fixed") {
                dailyRate += weekendPercentage;
              } else {
                dailyRate += (originalPerDayCost * weekendPercentage) / 100;
              }
            }
          }

          // Apply special day pricing
          if (pricingRules.specialDays && pricingRules.specialDays.length > 0) {
            for (const specialDay of pricingRules.specialDays) {
              const fromDate = new Date(specialDay.From);
              const toDate = new Date(specialDay.Too);

              if (currentDate >= fromDate && currentDate <= toDate) {
                const specialPrice = specialDay.Price;
                const specialPriceType = specialDay.PriceType;

                if (specialPriceType === "+") {
                  dailyRate += (originalPerDayCost * specialPrice) / 100;
                } else if (specialPriceType === "-") {
                  dailyRate -= (originalPerDayCost * specialPrice) / 100;
                }
                break;
              }
            }
          }

          totalRentalCost += dailyRate;

          const isWeekendKmApplied =
            isWeekend &&
            useVehicleLevelWeekendPrice &&
            vehicleWeekendKmLimit != null &&
            vehicleWeekendKmLimit > 0;

          daysBreakdown.push({
            date: new Date(currentDate),
            isWeekend,
            dailyRate: Math.round(dailyRate),
            weekendPriceApplied: isWeekend
              ? useVehicleLevelWeekendPrice
                ? vehicleWeekendCost != null && vehicleWeekendCost > 0
                : stationWeekendEnabled && weekendPercentage !== 0
              : false,
            kmLimit: isWeekendKmApplied
              ? vehicleWeekendKmLimit
              : adjustedVehicle.freeKms,
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Final Adjustments
        adjustedVehicle.daysBreakdown = daysBreakdown;
        adjustedVehicle.totalRentalCost = Math.round(totalRentalCost);
        adjustedVehicle.appliedPlans = appliedPlans;

        // adding tax if station is taking tax
        const gstPercentage = adjustedVehicle?.vehicleMasterData?.gstPercentage;
        const isGstActive =
          adjustedVehicle?.stationData?.isGstActive === "active" ? true : false;

        if (isGstActive) {
          adjustedVehicle.tax =
            gstPercentage > 0
              ? calculateTax(Math.round(totalRentalCost), gstPercentage)
              : 0;
        } else {
          adjustedVehicle.tax = 0;
        }

        // Show updated perDayCost on UI based on booking's first day
        const startDay = startDateObj.getDay();
        const isStartWeekend = startDay === 0 || startDay === 6;

        if (useVehicleLevelWeekendPrice) {
          adjustedVehicle.perDayCost =
            isStartWeekend &&
            vehicleWeekendCost != null &&
            vehicleWeekendCost > 0
              ? Math.round(vehicleWeekendCost)
              : originalPerDayCost;
        } else if (
          isStartWeekend &&
          stationWeekendEnabled &&
          weekendPercentage !== 0
        ) {
          const weekendPriceType =
            adjustedVehicle?.stationData?.weekendPriceType || "percentage";
          adjustedVehicle.perDayCost = Math.round(
            weekendPriceType === "fixed"
              ? originalPerDayCost + weekendPercentage
              : originalPerDayCost +
                  (originalPerDayCost * weekendPercentage) / 100,
          );
        } else {
          adjustedVehicle.perDayCost = originalPerDayCost;
        }

        // Effective km limit for booking start day
        const isStartWeekendKmApplied =
          isStartWeekend &&
          useVehicleLevelWeekendPrice &&
          vehicleWeekendKmLimit != null &&
          vehicleWeekendKmLimit > 0;

        adjustedVehicle.weekdayFreeKms = adjustedVehicle.freeKms;

        adjustedVehicle.freeKms = isStartWeekendKmApplied
          ? vehicleWeekendKmLimit
          : adjustedVehicle.freeKms;

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
          parsedLimit - excludedVehicles.length,
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
          JSON.parse(JSON.stringify(existingVehicle.vehicleDetails)),
        );
      }

      // Add current vehicle details to the array (deep clone to avoid circular references)
      existingVehicle.additionalData.push(
        JSON.parse(JSON.stringify(vehicle.vehicleDetails)),
      );

      // Initialize stations array if it doesn't exist
      if (!existingVehicle.stations) {
        existingVehicle.stations = [];
        // Add the first vehicle's station data
        existingVehicle.stations.push(
          JSON.parse(JSON.stringify(existingVehicle.stationData)),
        );
      }

      // Check if this station already exists in the stations array
      const stationExists = existingVehicle.stations.some(
        (station) => station.stationId === vehicle.stationData.stationId,
      );

      if (!stationExists) {
        // Add current vehicle's station data
        existingVehicle.stations.push(
          JSON.parse(JSON.stringify(vehicle.stationData)),
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
        (station) => station.stationId === vehicle.stationData.stationId,
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
          kmLimit: 1,
          stationId: 1,
          vehicleMasterId: 1,
          locationId: 1,
          planDetails: 1,
          stationName: "$stationData.stationName",
          vehicleName: "$vehicleMasterData.vehicleName",
        },
      },
      { $match: matchFilter },
      { $sort: { planDuration: 1 } },
      { $skip: skip },
      { $limit: Number(limit) },
      // { $sort: { createdAt: -1 } },
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
        }),
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

    // const result = await Location.find(filter).sort({ createdAt: -1 });
    const result = await Location.find(filter)
      .collation({ locale: "en", strength: 2 })
      .sort({ locationName: 1 });
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
    weekendPriceType,
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
  if (weekendPriceType) filter.weekendPriceType = weekendPriceType;

  if (search) {
    filter.$or = [
      { stationName: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
      { state: { $regex: search, $options: "i" } },
      { country: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  try {
    const totalRecords = await station.count(filter);

    const response = await station.aggregate([
      { $match: filter },

      {
        $addFields: {
          priority: {
            $cond: [
              {
                $regexMatch: {
                  input: { $toLower: "$stationName" },
                  regex: "^hsr layout$",
                },
              },
              0,
              1,
            ],
          },
        },
      },

      { $sort: { priority: 1, stationName: 1 } },
      { $skip: skip },
      { $limit: Number(limit) },
    ]);

    await station.populate(response, {
      path: "userId",
      select: "firstName lastName contact",
    });

    if (response.length) {
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

const getStationMap = async (req, res) => {
  try {
    const { stationId } = req.params;

    const stationData = await station.findOne({ stationId });

    if (!stationData) {
      return res.status(404).json({
        message: "Station not found",
      });
    }

    const mapUrl =
      `https://maps.googleapis.com/maps/api/staticmap` +
      `?center=${encodeURIComponent(
        stationData.address || stationData.city || "",
      )}` +
      `&zoom=10` +
      `&size=600x400` +
      `&markers=color:red|label:A|${stationData.latitude},${stationData.longitude}` +
      `&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    const response = await axios.get(mapUrl, {
      responseType: "arraybuffer",
    });

    res.set("Content-Type", "image/png");
    res.send(response.data);
  } catch (error) {
    console.error("Error fetching station map:", error.message);

    res.status(500).json({
      message: "Failed to fetch station map",
    });
  }
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
  getStationMap,
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
