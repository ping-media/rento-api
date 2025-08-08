const Booking = require("../db/schemas/onboarding/booking.schema.js");
const Log = require("../api/onboarding/models/Logs.model.js");
const station = require("../db/schemas/onboarding/station.schema.js");
const User = require("../db/schemas/onboarding/user.schema.js");
const { whatsappMessage } = require("./whatsappMessage.js");
const {
  sendEmailForBookingToStationMaster,
  sendCancelEmail,
} = require("./emailSend.js");
const Timeline = require("../db/schemas/onboarding/timeline.schema.js");

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
  try {
    if (!id) {
      await Log({
        message: `Uable to get bookingId`,
        functionName: "sendMessageAfterBooking",
      });
      return;
    }

    const booking = await Booking.findOne({ bookingId: id.toString() }).lean();

    if (!booking) {
      console.log("Booking not found");
      await Log({
        message: `Booking not found ${id}`,
        functionName: "sendMessageAfterBooking",
      });
      return;
    }

    const {
      _id,
      userId,
      stationMasterUserId,
      stationName,
      bookingPrice,
      vehicleBasic,
      vehicleName,
      BookingStartDateAndTime,
      BookingEndDateAndTime,
      bookingId,
      bookingStatus,
      paymentStatus,
      paymentMethod,
    } = booking;

    console.log(paymentStatus);

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

      const stationMasterEmail = stationMasterUser.email || "";

      const stationData = await station
        .findOne({ stationName })
        .select("latitude longitude userId");
      if (!stationData) {
        console.error(`Station not found for stationName: ${stationName}`);
        return;
      }

      const { latitude, longitude } = stationData;
      const mapLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

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

      if (bookingStatus === "extended") {
        const extendRide =
          booking?.bookingPrice?.extendAmount[
            booking?.bookingPrice?.extendAmount?.length - 1
          ];
        const messageData = [
          user.firstName,
          booking.bookingId,
          booking.bookingId,
          convertDateString(extendRide?.BookingStartDateAndTime),
          convertDateString(extendRide?.BookingEndDateAndTime),
          (
            Number(extendRide?.amount) + Number(extendRide?.addOnAmount)
          ).toFixed(2),
          extendRide?.status === "paid"
            ? (
                Number(extendRide?.amount) + Number(extendRide?.addOnAmount)
              ).toFixed(2)
            : 0,
          stationMasterUser.contact,
        ];

        await whatsappMessage(
          [user.contact, "9916864268", stationMasterUser.contact],
          "booking_extend",
          messageData
        );
      }
      if (paymentStatus === "paid") {
        messageData.push(totalPrice, vehicleBasic.refundableDeposit);

        await whatsappMessage(
          [user.contact, "9916864268", stationMasterUser.contact],
          "booking_confirm_paid",
          messageData
        );
      } else if (paymentStatus === "partially_paid") {
        const remainingAmount =
          Number(totalPrice) - Number(bookingPrice.userPaid);

        messageData.push(
          bookingPrice.userPaid,
          remainingAmount,
          vehicleBasic.refundableDeposit
        );
        await whatsappMessage(
          user.contact,
          "booking_confirmed_partial_paid",
          messageData
        );
      } else if (paymentMethod === "cash" && paymentStatus === "pending") {
        messageData.push(totalPrice, vehicleBasic.refundableDeposit);

        await whatsappMessage(
          [user.contact, "9916864268", stationMasterUser.contact],
          "booking_confirm_cash",
          messageData
        );
      }
      if (bookingStatus === "extended") {
        const timelineData = await Timeline.findOne({ currentBooking_id: _id });

        if (!timelineData) {
          await Log({
            message: `Timeline not found`,
            functionName: "sendMessageAfterBooking",
          });

          return res.json({
            success: false,
            message: "Timeline not found",
          });
        }

        const timeLine = timelineData?.timeLine;

        const link = `https://${timeLine[timelineData.length - 1].PaymentLink}`;
        const amount = timeLine[timeLine.length - 1].paymentAmount;
        const flag =
          timeLine[timeLine.length - 1].changeToVehicle == ""
            ? "Extend vehicle"
            : "Change vehicle";
        const firstName = userId.firstName;
        const email = userId.email;
        const managerContact = stationMasterUserId.contact;
        const bookingId = bookingId;

        await sendEmailForExtendOrVehicleChange(
          email,
          firstName,
          flag,
          bookingId,
          amount,
          link,
          managerContact
        );
      } else if (bookingStatus === "canceled") {
        sendCancelEmail(
          email,
          userId.firstName,
          vehicleName,
          bookingId,
          BookingStartDateAndTime,
          stationName,
          totalPrice,
          managerContact
        );
      } else {
        await sendEmailForBookingToStationMaster(
          userId,
          stationMasterUserId,
          vehicleName,
          BookingStartDateAndTime,
          BookingEndDateAndTime,
          bookingId,
          stationMasterEmail
        );
      }
    }

    return { success: true };
  } catch (error) {
    console.log("Error while sending notification", error?.message);
    return { success: false, message: error?.message };
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
