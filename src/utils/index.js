const Booking = require("../db/schemas/onboarding/booking.schema.js");
const Log = require("../api/onboarding/models/Logs.model.js");
const station = require("../db/schemas/onboarding/station.schema.js");
const User = require("../db/schemas/onboarding/user.schema.js");
const { whatsappMessage } = require("./whatsappMessage.js");
const { sendEmailForBookingToStationMaster } = require("./emailSend.js");

const convertDateString = (dateString) => {
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
};

const sendMessageAfterBooking = async (id) => {
  if (!id) {
    await Log({
      message: `Uable to get bookingId`,
      functionName: "sendMessageAfterBooking",
    });
  }

  const booking = await Booking.findById(id);
  if (!booking) {
    throw new Error("Booking not found");
  }

  const {
    userId,
    stationMasterUserId,
    stationName,
    bookingPrice,
    vehicleBasic,
    vehicleName,
    BookingStartDateAndTime,
    BookingEndDateAndTime,
    bookingId,
  } = booking;

  if (userId && stationMasterUserId) {
    var user = await User.findById(userId);
    if (!user) {
      obj.status = 404;
      obj.message = "User not found";

      await Log({
        message: `User not found with ID: ${userId}`,
        functionName: "booking",
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

    const stationData = await station
      .findOne({ stationName })
      .select("latitude longitude");
    if (!stationData) {
      console.error(`Station not found for stationName: ${stationName}`);
      return;
    }

    const { latitude, longitude } = stationData;
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

      whatsappMessage(user.contact, "booking_confirm_paid", messageData);
    } else if (paymentStatus === "partially_paid") {
      const remainingAmount =
        Number(totalPrice) - Number(bookingPrice.userPaid);

      messageData.push(
        bookingPrice.userPaid,
        remainingAmount,
        vehicleBasic.refundableDeposit
      );
      whatsappMessage(
        user.contact,
        "booking_confirmed_partial_paid",
        messageData
      );
    } else if (paymentStatus === "cash") {
      messageData.push(totalPrice, vehicleBasic.refundableDeposit);

      whatsappMessage(user.contact, "booking_confirm_cash", messageData);
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
};

const getDurationInDays = (date1Str, date2Str) => {
  // Parse the input strings into Date objects
  const date1 = new Date(date1Str);
  const date2 = new Date(date2Str);

  // Check if the dates are valid
  if (isNaN(date1) || isNaN(date2)) {
    return "Invalid date format";
  }

  // Get the difference between the two dates in milliseconds
  const differenceInMs = Math.abs(date2 - date1);

  // Convert milliseconds to days
  const days = Math.floor(differenceInMs / (1000 * 60 * 60 * 24));

  return Number(days);
};

module.exports = {
  convertDateString,
  sendMessageAfterBooking,
  getDurationInDays,
};
