const Booking = require("../../../db/schemas/onboarding/booking.schema");
const Log = require("../../../db/schemas/onboarding/log");
const VehicleMaster = require("../../../db/schemas/onboarding/vehicle-master.schema");
const Station = require("../../../db/schemas/onboarding/station.schema");
const Otp = require("../../../db/schemas/onboarding/logOtp");
const { whatsappMessage } = require("../../../utils/whatsappMessage");
const { createOrderId } = require("./booking.model");
const { createPaymentLinkUtil } = require("./razorpay.model");
const { timelineFunctionServer } = require("./timeline.model");

const vehicleChangeInBooking = async (req, res) => {
  const {
    vehicleTableId,
    changeVehicle,
    _id,
    vehicleBasic,
    bookingPrice,
    vehicleMasterId,
    contact,
    otp,
    vehicleImage,
    vehicleBrand,
    vehicleName,
    managerContact,
    firstName,
    finalAmount,
    ChangeId,
    refundAmount,
  } = req.body;
  try {
    const bookingData = await Booking.findOne({ _id: _id });
    if (!bookingData) {
      res.json({ status: 401, message: "Booking not found" });
    }

    // const otpRecord = await Otp.findOne({ contact });
    // if (!otpRecord) {
    //   const message = "No OTP found for the given contact number";
    //   return res.json({ status: 404, message });
    // }

    // if (otp !== otpRecord.otp) {
    //     const message = "Invalid OTP";
    //     return res.json({ status: 401, message });
    //   }

    //   await Otp.deleteOne({ contact });

    const o = {
      vehicleTableId,
      vehicleMasterId,
      changeVehicle,
      vehicleImage,
      vehicleName,
      vehicleBrand,
      vehicleBasic,
      bookingPrice,
    };

    Object.keys(o).forEach((key) => {
      if (o[key] === undefined || o[key] === null || o[key] === "") {
        delete o[key];
      }
    });

    const updatedData = await Booking.findOneAndUpdate(
      { _id: _id },
      { $set: o },
      { new: true }
    );

    await Log({
      message: `Vhicle changed for  this booking  ${_id} `,
      functionName: "vehicleChangeInBooking",
    });

    const station = await Station.findOne({
      stationName: bookingData.stationName,
    }).select("latitude longitude");
    if (!station) {
      console.error(`Station not found for stationName: ${stationName}`);
      return;
    }

    const { latitude, longitude } = station;

    const mapLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    const Oldvehicle = `${changeVehicle.vehicleName}(${changeVehicle.vehicleNumber})`;
    const Newvehicle = `${bookingData.vehicleName}(${vehicleBasic.vehicleNumber})`;

    const Amount =
      bookingPrice.diffAmount[bookingPrice.diffAmount.length - 1].amount;

    const messageData = [
      firstName,
      bookingData.bookingId,
      Oldvehicle,
      Newvehicle,
      bookingData.stationName,
      mapLink,
      Amount,
      Amount,
      vehicleBasic.refundableDeposit,
      managerContact,
    ];

    if (finalAmount === 0) {
      const timeLineData = {
        currentBooking_id: bookingData._id,
        timeLine: [
          {
            title: "Vehicle Changed",
            changeToVehicle: `From (${changeVehicle?.vehicleNumber}) to (${vehicleBasic?.vehicleNumber})`,
            date: Date.now(),
            paymentAmount: finalAmount,
            refundAmount: refundAmount,
          },
        ],
      };

      await timelineFunctionServer(timeLineData);
      whatsappMessage([contact], "bike_change", messageData);
      return res.status(200).json({
        success: true,
        message: "Vehicle Changed",
        data: updatedData,
        timeLine: timeLineData || null,
      });
    }

    const razorpayOrder = await createOrderId({
      amount: finalAmount,
      booking_id: bookingData?.bookingId,
      _id: _id,
      type: "ChangeVehicle",
      typeId: ChangeId,
    });

    const paymentData = await createPaymentLinkUtil({
      bookingId: _id,
      amount: finalAmount,
      orderId: razorpayOrder.id,
      type: "ChangeVehicle",
      typeId: ChangeId,
      isTimeLine: false,
    });

    if (paymentData?.paymentLinkId) {
      const timeLineData = {
        currentBooking_id: bookingData._id,
        timeLine: [
          {
            title: "Vehicle Changed",
            changeToVehicle: `From (${changeVehicle?.vehicleNumber}) to (${vehicleBasic?.vehicleNumber})`,
            date: Date.now(),
            paymentAmount: finalAmount,
            refundAmount: refundAmount,
            PaymentLink: paymentData?.paymentLink,
          },
        ],
      };

      await timelineFunctionServer(timeLineData);
      whatsappMessage([contact], "bike_change", messageData);
      res.status(200).json({
        success: true,
        message: "Vehicle Changed",
        data: updatedData,
        timeLine: timeLineData || null,
      });
    } else {
      res.status(200).json({
        success: false,
        message: "unable to complete extend request! try again",
      });
    }
  } catch (error) {
    res.json({ status: 500, message: error.message });
  }
};

module.exports = { vehicleChangeInBooking };
