const { sendEmail } = require("../../../utils/email/index");
const { v4: uuidv4 } = require('uuid');
const moment = require("moment");
const { mongoose } = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Vehicle = require("../../../db/schemas/onboarding/vehicle.schema");
const Location = require("../../../db/schemas/onboarding/location.schema");
const Station = require("../../../db/schemas/onboarding/station.schema");
//const Booking = require("../../../db/schemas/onboarding/booking.schema");
const Booking = require('../../../db/schemas/onboarding/booking.schema')
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
const { emailValidation, contactValidation } = require("../../../constant");
const { query } = require("express");
//const {generateRandomId } = require('../../../utils/help-scripts/help-functions');
const Invoice = require('../../../db/schemas/onboarding/invoice-tbl.schema'); // Import the Invoice model
const vehicleMaster = require("../../../db/schemas/onboarding/vehicle-master.schema");
const Log = require("../models/Logs.model")


const logError = async (message, functionName, userId) => {
  await Log({ message, functionName, userId });
};




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



async function createVehicle({
  _id, vehicleMasterId, stationId, vehicleNumber, freeKms, extraKmsCharges, vehicleModel, vehicleColor, locationId,
  perDayCost, lastServiceDate, kmsRun, isBooked, condition, deleteRec, vehicleBookingStatus, vehicleStatus,
  vehiclePlan, refundableDeposit, lateFee, speedLimit
}) {
  const response = { status: 200, message: "Data fetched successfully", data: [] };

  try {
    if (_id || (vehicleMasterId && vehicleBookingStatus && vehicleStatus && stationId && vehicleNumber &&
      freeKms && extraKmsCharges && vehicleModel && vehicleColor && perDayCost && lastServiceDate &&
      kmsRun && isBooked && condition && locationId)) {

      if (stationId) {
        const findStation = await Station.findOne({ stationId });
        if (!findStation) {
          response.status = 401;
          response.message = "Invalid stationId";
          await Log({
            message: `Invalid stationId provided ${stationId}`,
            functionName: "createVehicle",
            userId: stationId
          });
          return response;
        }
      }

      if (isBooked) {
        const statusCheck = ["false", "true"].includes(isBooked.toString());
        if (!statusCheck) {
          response.status = 401;
          response.message = "Invalid isBooked value";
          await Log({
            message: "Invalid isBooked value",
            functionName: "createVehicle",
            userId: stationId
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
            userId: stationId
          });
          return response;
        }
      }

      if (vehicleNumber && vehicleNumber.length !== 10) {
        response.status = 401;
        response.message = "Invalid vehicle number";
        await Log({
          message: "Invalid vehicle number length",
          functionName: "createVehicle",
          userId: stationId
        });
        return response;
      }

      const o = {
        locationId, vehicleBookingStatus, vehicleStatus, vehicleMasterId, stationId, vehicleNumber, freeKms,
        extraKmsCharges, vehicleModel, vehicleColor, perDayCost, lastServiceDate, kmsRun, isBooked, condition,
        vehiclePlan, refundableDeposit, lateFee, speedLimit
      };

      if (_id) {
        const find = await VehicleTable.findOne({ _id: ObjectId(_id) });
        if (!find) {
          response.status = 401;
          response.message = "Invalid vehicle table ID";
          await Log({
            message: "Invalid vehicle table ID during update",
            functionName: "createVehicle",
            userId: stationId
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
            userId: stationId
          });
          return response;
        }

        await VehicleTable.updateOne({ _id: ObjectId(_id) }, { $set: o });
        response.message = "Vehicle updated successfully";
        response.data = o;
        await Log({
          message: "Vehicle updated successfully",
          functionName: "createVehicle",
          userId: stationId
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
            userId: stationId
          });
        } else {
          response.status = 401;
          response.message = "Vehicle number already exists";
          await Log({
            message: `Vehicle number already exists ${vehicleNumber}`,
            functionName: "createVehicle",
            userId: stationId
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
        userId: stationId
      });
    }
    return response;
  } catch (error) {
    response.status = 500;
    response.message = "Internal server error";
    await Log({
      message: `Error in createVehicle function: ${error.message}`,
      functionName: "createVehicle",
      userId: stationId
    });
    throw new Error(error.message);
  }
}


async function booking({
  vehicleTableId, userId, BookingStartDateAndTime, BookingEndDateAndTime, extraAddon, bookingPrice,
  discount, bookingStatus, paymentStatus, rideStatus, pickupLocation, invoice, paymentMethod, paySuccessId, payInitFrom,
  deleteRec, _id, discountPrice, vehicleBasic, vehicleMasterId, vehicleBrand, vehicleImage, vehicleName, stationName, paymentgatewayOrderId, userType = ""
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
      const vehicleRecord = await Booking.findOne({ vehicleTableId }).sort({ createdAt: -1 });

      //   console.log(vehicleRecord)
      if (vehicleRecord && vehicleRecord.bookingStatus != "canceled" && BookingStartDateAndTime === vehicleRecord.BookingStartDateAndTime &&
        BookingEndDateAndTime === vehicleRecord.BookingEndDateAndTime) {

        obj.status = 401;
        obj.message = "Vehicle already booked";
        await Log({
          message: "Vehicle already booked during booking process",
          functionName: "booking",
          userId,
        });
        return obj;

      }

      const convertToISOFormat = (dateString, timeString) => {
        const [day, month, year] = dateString.split("-");
        const [hour, minute] = timeString.split(":");
        const ampm = timeString.split(" ")[1];
        let hour24 = parseInt(hour, 10);
        if (ampm === "PM" && hour24 < 12) hour24 += 12;
        if (ampm === "AM" && hour24 === 12) hour24 = 0;
        return new Date(`${year}-${month}-${day}T${hour24}:${minute}:00.000Z`).toISOString();
      };

      if (BookingStartDateAndTime && BookingStartDateAndTime.startDate && BookingStartDateAndTime.startTime) {
        const { startDate, startTime } = BookingStartDateAndTime;
        BookingStartDateAndTime = convertToISOFormat(startDate, startTime);
      }
      if (BookingEndDateAndTime && BookingEndDateAndTime.endDate && BookingEndDateAndTime.endTime) {
        const { endDate, endTime } = BookingEndDateAndTime;
        BookingEndDateAndTime = convertToISOFormat(endDate, endTime);
      }

      let sequence = 1;
      const lastBooking = await Booking.findOne({}).sort({ createdAt: -1 }).select('bookingId');
      if (lastBooking && lastBooking.bookingId) {
        sequence = parseInt(lastBooking.bookingId, 10) + 1;
      }
      var bookingId = sequence.toString().padStart(6, '0');
      const find = await Station.find({ stationName });

      if (userType != "customer") {
        // console.log(find);

        if (!find || find.length === 0) { // Check if array is empty
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



    }

    let o = {
      vehicleTableId, userId, BookingStartDateAndTime, BookingEndDateAndTime, extraAddon, bookingPrice,
      discount, bookingStatus, paymentStatus, rideStatus, pickupLocation, invoice, paymentMethod, paySuccessId, paymentgatewayOrderId,
      payInitFrom, bookingId, vehicleBasic, vehicleMasterId, vehicleBrand, vehicleImage, vehicleName, stationName, stationMasterUserId
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

    if (_id) {
      const find = await Booking.findOne({ _id: ObjectId(_id) });
      //console.log(find)
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
        obj.data = { _id };

        await Log({
          message: `Booking with ID ${_id} deleted`,
          functionName: "deletebooking",
          userId,
        });

        return obj;
      }

      await Booking.updateOne({ _id: ObjectId(_id) }, { $set: o }, { new: true });

      await Log({
        message: `Booking with ID ${_id} updated`,
        functionName: "updatebooking",
        userId,
      });
      obj.status = 200;
        obj.message = "Booking Update successfull ";
        obj.data=_id;
        return obj;
    } else {
      if (
        vehicleTableId && userId && BookingStartDateAndTime && BookingEndDateAndTime &&
        bookingPrice && paymentStatus && rideStatus && bookingId &&
        paymentMethod && paySuccessId && payInitFrom &&
        vehicleMasterId && vehicleBrand && vehicleImage && vehicleName && stationName && vehicleBasic
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



cron.schedule("0 * * * *", async () => {
  console.log("Running scheduler to cancel pending payments older than 1 hour...");

  try {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Find and update bookings with paymentStatus "pending" older than 1 hour
    const result = await Booking.updateMany(
      {
        paymentStatus: "pending",
        createdAt: { $lte: oneHourAgo },
      },
      {
        $set: {
          paymentStatus: "canceled",
          bookingStatus: "canceled",
          rideStatus: "canceled",
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`Canceled ${result.modifiedCount} bookings with pending payment.`);
    } else {
      console.log("No pending payments older than 1 hour to cancel.");
    }
  } catch (error) {
    console.error("Error in scheduler for canceling pending payments:", error.message);
  }
});







const createOrder = async (o) => {
  const obj = { status: 200, message: "Data fetched successfully", data: [] };
  const {
    vehicleNumber, vehicleName, endDate, endTime, startDate, startTime, pickupLocation, location,
    paymentStatus, paymentMethod, userId, email, contact, submittedDocument, _id, vehicleImage, orderId, deleteRec
  } = o;



  try {
    // Validate vehicleNumber
    if (vehicleNumber) {
      const find = await vehicleTable.findOne({ vehicleNumber });
      if (!find) {
        obj.status = 401;
        obj.message = "Invalid vehicle number";
        await logError("Invalid vehicle number during createOrder", "createOrder", userId);
        return obj;
      }
    }

    // Validate vehicleName
    if (vehicleName) {
      const find = await VehicleMaster.findOne({ vehicleName });
      if (!find) {
        obj.status = 401;
        obj.message = "Invalid vehicle name";
        await logError("Invalid vehicle name during createOrder", "createOrder", userId);
        return obj;
      }
    }

    // Validate dates
    if (!startDate || !endDate || !Date.parse(startDate) || !Date.parse(endDate)) {
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
        await logError("Invalid pickup location during createOrder", "createOrder", userId);
        return obj;
      }
    }

    // Validate location
    if (location) {
      const find = await Location.findOne({ locationName: location });
      if (!find) {
        obj.status = 401;
        obj.message = "Invalid location";
        await logError("Invalid location during createOrder", "createOrder", userId);
        return obj;
      }
    }

    // Validate paymentStatus
    if (paymentStatus && !['pending', 'completed', 'canceled'].includes(paymentStatus)) {
      obj.status = 401;
      obj.message = "Invalid paymentStatus";
      await logError("Invalid paymentStatus during createOrder", "createOrder", userId);
      return obj;
    }

    // Validate paymentMethod
    if (paymentMethod && !['cash', 'card', 'upi', 'wallet'].includes(paymentMethod)) {
      obj.status = 401;
      obj.message = "Invalid paymentMethod";
      await logError("Invalid paymentMethod during createOrder", "createOrder", userId);
      return obj;
    }

    // Validate userId
    if (userId) {
      if (userId.length === 24) {
        const find = await User.findOne({ _id: ObjectId(userId) });
        if (!find) {
          obj.status = 401;
          obj.message = "Invalid user ID";
          await logError("Invalid user ID during createOrder", "createOrder", userId);
          return obj;
        }
      } else {
        obj.status = 401;
        obj.message = "Invalid user ID";
        await logError("Invalid user ID format during createOrder", "createOrder", userId);
        return obj;
      }
    }

    // Validate email
    if (email) {
      const validateEmail = emailValidation(email);
      if (!validateEmail) {
        obj.status = 401;
        obj.message = "Invalid email";
        await logError("Invalid email format during createOrder", "createOrder", userId);
        return obj;
      }
      const find = await User.findOne({ email });
      if (!find) {
        obj.status = 401;
        obj.message = "Invalid email";
        await logError("Email not associated with any user during createOrder", "createOrder", userId);
        return obj;
      }
    }

    // Validate contact
    if (contact) {
      const validateContact = contactValidation(contact);
      if (!validateContact) {
        obj.status = 401;
        obj.message = "Invalid contact";
        await logError("Invalid contact format during createOrder", "createOrder", userId);
        return obj;
      }
      const find = await User.findOne({ contact });
      if (!find) {
        obj.status = 401;
        obj.message = "Invalid contact";
        await logError("Contact not associated with any user during createOrder", "createOrder", userId);
        return obj;
      }
    }

    // Validate orderId
    if (!orderId || orderId.length !== 4 || isNaN(orderId)) {
      obj.status = 401;
      obj.message = "Invalid order ID";
      await logError("Invalid order ID format during createOrder", "createOrder", userId);
      return obj;
    }

    // Handle existing order (_id)
    if (_id && _id.length === 24) {
      const find = await Order.findOne({ _id: ObjectId(_id) });
      if (!find) {
        obj.status = 401;
        obj.message = "Invalid _id";
        await logError("Order not found for provided _id during createOrder", "createOrder", userId);
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
    if (vehicleNumber && vehicleName && endDate && endTime && startDate && startTime && pickupLocation && location &&
      paymentStatus && paymentMethod && userId && email && contact && submittedDocument && vehicleImage && orderId) {
      const find = await Order.findOne({ orderId });
      if (find) {
        obj.status = 401;
        obj.message = "Order ID already exists";
        await logError("Duplicate orderId during createOrder", "createOrder", userId);
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
      await logError("Missing required fields during createOrder", "createOrder", userId);
    }

    return obj;
  } catch (error) {
    console.error("Error in createOrder function:", error.message);
    await logError(`Error in createOrder: ${error.message}`, "createOrder", userId);
    obj.status = 500;
    obj.message = "Internal server error";
    return obj;
  }
};


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




async function createPlan({ _id, planName, planPrice, stationId, planDuration, vehicleMasterId, deleteRec, locationId }) {
  const obj = { status: 200, message: "Plan created successfully", data: [] };

  try {
    if (_id || (planName && planPrice && stationId && planDuration && vehicleMasterId && locationId)) {
      let o = { planName, planPrice, stationId, planDuration, vehicleMasterId, locationId };


      if (_id) {
        if (_id.length !== 24) {
          obj.status = 401;
          obj.message = "Invalid _id";
          return obj;
        }



        // Check if plan exists for the same station with the same name or duration
        const duplicatePlan = await Plan.findOne({
          stationId,
          $or: [{ planName }, { planDuration }],
          _id: { $ne: ObjectId(_id) }, // Exclude the current plan being updated
        });

        if (duplicatePlan) {
          obj.status = 401;
          obj.message = "A plan with the same name or duration already exists for this station";
          return obj;
        }

        const existingPlan = await Plan.findOne({ _id: ObjectId(_id) });
        if (existingPlan) {
          // Handle deletion
          if (deleteRec) {
            await Plan.deleteOne({ _id: ObjectId(_id) });
            obj.message = "Plan deleted successfully";
            return obj;
          }

          // Handle update
          await Plan.updateOne({ _id: ObjectId(_id) }, { $set: o }, { new: true });
          obj.message = "Plan updated successfully";
          obj.data = o;
        } else {
          obj.status = 404;
          obj.message = "Plan not found";
        }
      } else {
        // Validate station ID
        const stationExists = await Station.findOne({ stationId });
        if (!stationExists) {
          obj.status = 401;
          obj.message = "Invalid station ID";
          return obj;
        }

        // Validate vehicle master ID
        const vehicleMasterExists = await VehicleMaster.findOne({ vehicleMasterId });
        if (!vehicleMasterExists) {
          obj.status = 401;
          obj.message = "Invalid vehicle master ID";
          return obj;
        }

        // Check for duplicate plan name or duration within the same station
        const duplicatePlan = await Plan.findOne({
          stationId,
          $or: [{ planName }, { planDuration }],
        });

        if (duplicatePlan) {
          obj.status = 401;
          obj.message = "A plan with the same name or duration already exists for this station";
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



async function createInvoice({ _id, deleteRec, bookingId, paidInvoice, userId }) {
  const obj = { status: 200, message: "Invoice created successfully", data: [] };
  const o = { userId, bookingId, paidInvoice };

  try {
    if (paidInvoice) {
      const isValidStatus = ['paid', 'unpaid', 'partialpaid'].includes(paidInvoice);
      if (!isValidStatus) {
        obj.status = 401;
        obj.message = "Invalid paidInvoice";
        return obj;
      }
    }

    if (bookingId) {
      if (bookingId.length === 24) {
        const find = await Booking.findOne({ _id: ObjectId(bookingId) });
        //obj.data=find;
        if (!find) {
          obj.status = 401;
          obj.message = "Invalid bookingId";
          return obj;
        }
      } else {
        obj.status = 401;
        obj.message = "Invalid bookingId";
        return obj;
      }
    }

    if (_id) {
      if (_id.length !== 24) {
        obj.status = 401;
        obj.message = "Invalid _id";
        return obj;
      }

      const find = await InvoiceTbl.findOne({ _id: ObjectId(_id) });
      if (!find) {
        obj.status = 401;
        obj.message = "Invalid _id";
        return obj;
      }

      if (deleteRec) {
        await InvoiceTbl.deleteOne({ _id: ObjectId(_id) });
        obj.message = "Invoice deleted successfully";
        return obj;
      }

      delete o.invoiceNumber; // Don't update invoice number
      await InvoiceTbl.updateOne(
        { _id: ObjectId(_id) },
        { $set: o },
        { new: true }
      );
      obj.message = "Invoice updated successfully";
      obj.data = o;
    } else {
      // Create new invoice
      if (bookingId) {

        const find = await InvoiceTbl.findOne({ bookingId });
        if (find) {
          obj.status = 401;
          obj.message = "Invoice Number allready exists";
          return obj;
        }
        else {

          const currentYear = new Date().getFullYear();

          // Get the last invoice number for the year
          const lastInvoice = await InvoiceTbl.findOne({})
            .sort({ createdAt: -1 }) // Sort by latest created
            .select('invoiceNumber');

          let sequence = 1; // Default sequence
          if (lastInvoice && lastInvoice.invoiceNumber) {
            const match = lastInvoice.invoiceNumber.match(new RegExp(`INV-${currentYear}-(\\d{5})`));
            if (match) {
              sequence = parseInt(match[1], 10) + 1;
            }
          }

          // Generate new invoice number
          const newInvoiceNumber = `INV-${currentYear}-${sequence.toString().padStart(5, '0')}`;
          o.invoiceNumber = newInvoiceNumber;

          const newInvoice = new InvoiceTbl(o);
          await newInvoice.save();

          obj.message = "New invoice created successfully";
          obj.data = o;
        }

      } else {
        obj.status = 401;
        obj.message = "Invalid data";
      }
    }
    return obj;
  } catch (error) {
    obj.status = 500;
    obj.message = `Server error: ${error.message}`;
    return obj;
  }
}

async function getAllInvoice(query) {
  const obj = { status: 200, message: "Invoices retrieved successfully", data: [] };
  const {
    _id,
    bookingId,
    userId,
    paidInvoice,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    order = 'asc'
  } = query;

  try {
    // Create filter object for query
    const filter = {};
    if (_id) filter._id = _id;
    if (bookingId) filter.bookingId = bookingId;
    if (userId) filter.userId = userId;
    if (paidInvoice) filter.paidInvoice = paidInvoice;

    const sort = {};
    sort[sortBy] = order === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const invoices = await InvoiceTbl.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalRecords = await InvoiceTbl.count(filter);
    obj.data = invoices;

    obj.currentPage = parseInt(page);
    obj.totalPages = Math.ceil(totalRecords / parseInt(limit));

    obj.message = "Invoices retrieved successfully";
  } catch (error) {
    console.error("Error fetching invoices:", error.message);
    obj.status = 500;
    obj.message = `Server error: ${error.message}`;
  }

  return obj;
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

async function createStation({
  stationId,
  stationName,
  locationId,
  state,
  city,
  userId,
  address,
  pinCode,
  latitude,
  longitude,
  _id,
  deleteRec
}) {
  const response = { status: 200, message: "Operation successful", data: [] };
  const logError = async (message, functionName, userId) => {
    await Log({ message, functionName, userId });
  };
  const stationData = {
    country: "India",
    stationId,
    locationId,
    state,
    city,
    address,
    pinCode,
    latitude,
    longitude,
    userId,
    stationName
  };

  try {
    // Validate _id if provided
    if (_id) {
      if (_id.length !== 24) {
        response.status = 401;
        response.message = "Invalid _id";
        return response;
      }

      const station = await Station.findOne({ _id: ObjectId(_id) });
      if (!station) {
        response.status = 401;
        response.message = "Station not found";
        return response;
      }

      if (deleteRec) {
        await Station.deleteOne({ _id: ObjectId(_id) });
        response.message = "Station deleted successfully";
        return response;
      }

      // Update existing station
      await Station.updateOne({ _id: ObjectId(_id) }, { $set: stationData });
      response.message = "Station updated successfully";
      response.data = stationData;

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
      response.message = `Missing required parameters: ${missingParams.join(", ")}`;
      return response;
    }

    // Validate userId
    if (userId.length !== 24) {
      response.status = 401;
      response.message = "Invalid user ID";
      return response;
    }
    const user = await User.findOne({ _id: ObjectId(userId) });
    if (!user) {
      response.status = 401;
      response.message = "User not found";
      return response;
    }
    if (user.userType !== "manager") {
      response.status = 401;
      response.message = "User is not a manager";
      return response;
    }

    // Validate locationId
    if (locationId.length !== 24) {
      response.status = 401;
      response.message = "Invalid location ID";
      return response;
    }
    const location = await Location.findOne({ _id: ObjectId(locationId) });
    if (!location) {
      response.status = 401;
      response.message = "Location not found";
      return response;
    }

    // Validate pinCode
    if (pinCode.length !== 6 || isNaN(pinCode)) {
      response.status = 401;
      response.message = "Invalid pin code";
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
      return response;
    }
    const stationExists = await Station.findOne({ stationId });
    if (stationExists) {
      response.status = 401;
      response.message = "Station already exists";
      return response;
    }

    // Save a new station
    const newStation = new Station(stationData);
    await newStation.save();
    response.message = "Station created successfully";
    response.data = stationData;

  } catch (error) {
    response.status = 500;
    response.message = `Server error: ${error.message}`;
  }

  return response;
}


async function createVehicleMaster({ vehicleName, vehicleType, vehicleBrand, vehicleImage, deleteRec, _id }) {
  const response = { status: "200", message: "data fetched successfully", data: [] }
  try {
    const obj = {
      vehicleName, vehicleType, vehicleBrand, vehicleImage, _id
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
      response.status = 200
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
  const obj = {
    status: 200,
    message: "Data fetched successfully",
    data: [],
    pagination: {},
  };

  try {
    const { page = 1, limit = 10, ...filter } = query;

    if (filter._id) {
      try {
        filter._id = new ObjectId(filter._id);
      } catch (err) {
        obj.status = 400;
        obj.message = "Invalid _id format";
        return obj;
      }
    }

    const skip = (page - 1) * limit;

    const response = await VehicleMaster.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const totalRecords = await VehicleMaster.count(filter);

    if (response.length) {
      obj.data = response;
      obj.pagination = {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: Number(page),
        pageSize: Number(limit),
      };
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

      console.log(response)
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
        find4 = await VehicleMaster.findOne({ ...obj })
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
  const response = { status: 200, message: "Data fetched successfully", data: [] };

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
      page = 1, // Default page number
      limit = 20, // Default limit per page
    } = query;
    if (!locationId) {
      if (!_id && (!BookingStartDateAndTime || !BookingEndDateAndTime)) {
        return {
          status: 400,
          message: "Booking start and end dates are required.",
          data: [],
        };
      }
    }


    const startDate = BookingStartDateAndTime;
    const endDate = BookingEndDateAndTime;

    const matchFilter = {};
    if (_id) {
      matchFilter._id = _id.length === 24 ? new ObjectId(_id) : _id; // Ensure valid ObjectId
    } else {
      if (vehicleModel) matchFilter.vehicleModel = vehicleModel;
      if (vehiclePlan) matchFilter.vehiclePlan = new ObjectId(vehiclePlan);
      if (condition) matchFilter.condition = condition;
      if (vehicleColor) matchFilter.vehicleColor = vehicleColor;
      if (stationId) matchFilter.stationId = stationId;
      if (locationId) matchFilter.locationId = new ObjectId(locationId);
    }

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
        $addFields: {
          conflictingBookings: {
            $filter: {
              input: "$bookings",
              as: "booking",
              cond: {
                $and: [
                  { $in: ["$$booking.bookingStatus", ["pending", "completed"]] },
                  {
                    $and: [
                      { $lte: ["$$booking.BookingStartDateAndTime", endDate] },
                      { $gte: ["$$booking.BookingEndDateAndTime", startDate] },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      { $match: { "conflictingBookings.0": { $exists: false } } },
      {
        $addFields: {
          vehicleMasterData: { $arrayElemAt: ["$vehicleMasterData", 0] },
          stationData: { $arrayElemAt: ["$stationData", 0] },
        },
      },
      {
        $match: {
          ...(vehicleBrand && { "vehicleMasterData.vehicleBrand": vehicleBrand }),
          ...(vehicleType && { "vehicleMasterData.vehicleType": vehicleType }),
        },
      },
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
          vehicleColor: 1,
          perDayCost: 1,
          lastServiceDate: 1,
          kmsRun: 1,
          isBooked: 1,
          condition: 1,
          locationId: 1,
          stationId: 1,





        },
      },
      {
        $facet: {
          metadata: [
            { $count: "total" },
            { $addFields: { page: parseInt(page, 10), limit: parseInt(limit, 10) } },

          ],
          data: [
            { $skip: (parseInt(page, 10) - 1) * parseInt(limit, 10) },
            { $limit: parseInt(limit, 10) },
          ],
        },
      },
    ];

    const results = await vehicleTable.aggregate(pipeline);

    if (results.length && results[0].metadata.length) {
      response.data = results[0].data;
      response.pagination = results[0].metadata[0];
    } else {
      response.message = _id
        ? "No vehicle found with the given ID."
        : "No available vehicles found for the selected criteria.";
    }
  } catch (error) {
    console.error("Error in getVehicleTblData:", error.message);
    response.status = 500;
    response.message = `Internal server error: ${error.message}`;
  }

  return response;
};


















// const getPlanData = async (query) => {
//   const obj = { status: 200, message: "Plans retrieved successfully", data: [] };

//   try {
//     const { _id, stationId, locationId } = query;

//     // Fetch by _id
//     if (_id) {
//       if (_id.length !== 24) {
//         obj.status = 401;
//         obj.message = "Invalid plan ID";
//         return obj;
//       }


//     }

//     const filter = {};
//     if (stationId) filter.stationId = stationId;
//     if (locationId) filter.locationId = locationId;
//     if (_id) filter._id = _id;

//     // Fetch plans based on the filter
//     const find=await Station.find({stationId})
//     console.log(find)
//     const plans = await Plan.find(filter)
//    // .populate("stationId") // Populate station data
//     .populate("vehicleMasterId"); // Populate vehicle data

//     if (!plans.length) {
//       obj.message = "No records found";
//       obj.status = 401;

//       return obj;
//     }

//     obj.data = plans;
//   } catch (error) {
//     console.error("Error fetching plans:", error.message);
//     obj.status = 500;
//     obj.message = "Internal server error";
//   }

//   return obj;
// };

const getPlanData = async (query) => {
  const obj = { status: 200, message: "Plans retrieved successfully", data: [], pagination: {} };

  try {
    const { _id, stationId, locationId, page = 1, limit = 10 } = query;

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

    const skip = (page - 1) * limit;

    // Aggregation pipeline with pagination
    const plans = await Plan.aggregate([
      { $match: matchFilter },
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
        $unwind: { path: "$vehicleMasterData", preserveNullAndEmptyArrays: true },
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
      { $sort: { planName: 1 } }, // Sort by planName (ascending)
      { $skip: skip },
      { $limit: Number(limit) },
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
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: Number(page),
      pageSize: Number(limit),
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
    pagination: {}
  };

  const {
    _id,
    locationName,
    locationId,
    city,
    state,
    page = 1,
    limit = 10
  } = query;

  let filter = {};
  if (_id) filter._id = ObjectId(_id);
  if (locationName) filter.locationName = locationName;
  if (locationId) filter._id = ObjectId(locationId);
  if (city) filter.city = city;
  if (state) filter.state = state;

  const skip = (page - 1) * limit;

  try {
    // Fetch total record count for pagination
    const totalRecords = await Location.count(filter);

    // Fetch paginated location data
    const result = await Location.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }); // Optional: Sort by creation date

    if (result.length) {
      obj.data = result;

      // Add pagination metadata
      obj.pagination = {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: Number(page),
        pageSize: Number(limit),
      };
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
    pagination: {}
  };

  const {
    locationName,
    stationName,
    stationId,
    address,
    city,
    pinCode,
    state,
    contact,
    locationId,
    _id,
    userId,
    page = 1,
    limit = 10
  } = query;

  let filter = {};
  if (_id) filter._id = ObjectId(_id);
  if (locationId) filter.locationId = ObjectId(locationId);
  if (stationName) filter.stationName = stationName;
  if (stationId) filter.stationId = stationId;
  if (address) filter.address = address;
  if (city) filter.city = city;
  if (state) filter.state = state;
  if (pinCode) filter.pinCode = pinCode;
  if (userId) filter.userId = userId;

  const skip = (page - 1) * limit;

  try {
    // Fetch total record count for pagination
    const totalRecords = await station.count(filter);

    // Fetch paginated station data
    const response = await station.find(filter).skip(skip).limit(Number(limit));

    if (response.length) {
      const arr = [];
      for (let i = 0; i < response.length; i++) {
        const { _doc } = response[i];
        let o = _doc;

        let obj = { _id: ObjectId(o.locationId) };
        if (locationName) obj.locationName = locationName;

        const find = await location.findOne(obj, { _id: 0 });

        let obj3 = { _id: ObjectId(o.userId) };
        if (contact) obj3.contact = contact;

        const find3 = await User.findOne({ ...obj3 }, { _id: 0, firstName: 1, lastName: 1, contact: 1, email: 1 });

        if (find) {
          o = {
            ...o,
            ...find?._doc
          };

          if (find3 && find3?._doc?.userType === "manager") {
            o = {
              ...o,
              ...find3?._doc
            };
          }
          arr.push(o);
        }
      }

      obj.data = arr;

      // Add pagination metadata
      obj.pagination = {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: Number(page),
        pageSize: Number(limit),
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
  getPlanData,
  createInvoice,
  discountCoupons,
  getAllInvoice,
  createStation,
  searchVehicle,
  getLocations,
  booking,
  getMessages
};
