const { getVehicleTbl } = require("../models/vehicles.model");
const Booking = require("../../../db/schemas/onboarding/booking.schema");
// const vehicleTable = require("../../../db/schemas/onboarding/vehicle-table.schema");
const { whatsappMessage } = require("../../../utils/whatsappMessage");

const extentBooking = async (req, res) => {
  let {
    _id,
    vehicleTableId,
    extendAmount,
    bookingPrice,
    oldBookings,
    extendBooking,
    bookingStatus,
    firstName,
    managerContact,
    contact,
  } = req.body;
  //  const res = { status: 200, message: "Data fetched successfully", data: [] };
  const { BookingEndDateAndTime, BookingStartDateAndTime } = req.query;

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

  try {
    // const vehicleData = await getVehicleTbl(req.query);
    const vehicleData = await getVehicleTbl({
      ...req.query,
      _id: vehicleTableId,
    });

    const data = vehicleData?.data?.filter((item) => {
      return item._id.toString() === vehicleTableId;
    });

    if (!bookingPrice.extendAmount) {
      bookingPrice.extendAmount = [];
    }
    bookingPrice.extendAmount.push(extendAmount);

    if (!extendBooking.oldBooking) {
      extendBooking.oldBooking = [];
    }
    extendBooking.oldBooking.push(oldBookings);
    const o = {
      BookingEndDateAndTime,
      extendBooking,
      bookingPrice,
      bookingStatus,
    };

    if (data.length > 0) {
      const updatedData = await Booking.findOneAndUpdate(
        { _id: _id },
        { $set: o },
        { new: true }
      );

      const Amount = extendAmount.amount;
      const vehicle = data[0].vehicleName;

      const messageData = [
        firstName,
        vehicle,
        updatedData.bookingId,
        convertDateString(BookingStartDateAndTime),
        convertDateString(BookingEndDateAndTime),
        Amount,
        Amount,
        managerContact,
      ];
      whatsappMessage(contact, "booking_extend", messageData);
      return res.status(200).json({
        status: 200,
        message: "booking extended successfully ",
        data: updatedData,
      });
    }

    return res.json({
      status: 401,
      message: "vehicle is not available",
      data: data,
    });
  } catch (error) {
    console.error("Error during vehicle availability check:", error);
    return res.json({
      status: 500,
      message: "Internal server error",
    });
  }
};

module.exports = { extentBooking };
