const Booking = require("../../../db/schemas/onboarding/booking.schema");
const Log = require("../../../db/schemas/onboarding/log");
// const VehicleMaster = require("../../../db/schemas/onboarding/vehicle-master.schema");
const Station = require("../../../db/schemas/onboarding/station.schema");
const {
  calculateVehicleChangePricing,
} = require("../../../helper/vehicleChangePricing");
// const Otp = require("../../../db/schemas/onboarding/logOtp");
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
      { new: true },
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
      customBookingId: bookingData?.bookingId,
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

const vehicleChange = async (req, res) => {
  const { booking_id, newVehicleData, daysLeft, totalBookingDuration } =
    req.body;

  try {
    if (
      !booking_id ||
      !newVehicleData._id ||
      daysLeft < 0 ||
      totalBookingDuration <= 0
    ) {
      return res.json({
        success: false,
        message:
          "Invalid request: Please provide a valid booking ID, vehicle details, a non-negative number of days left, and a total booking duration greater than zero.",
      });
    }

    const booking = await Booking.findById(booking_id);

    if (!booking) {
      return res.json({
        success: false,
        message:
          "Unable to fetch booking or there is no booking with this booking id! try again",
      });
    }

    let timeLineData = null;

    if (booking?.vehicleMasterId !== newVehicleData?.vehicleMasterId) {
      let refundAmount = 0;

      if (daysLeft > 0) {
        const oldBookingPrice = booking.bookingPrice;
        let oldTotalPrice =
          oldBookingPrice.originalTotalPrice || oldBookingPrice.totalPrice;
        // let oldTotalPrice = oldBookingPrice.totalPrice;

        if (
          oldBookingPrice.extendAmount &&
          oldBookingPrice.extendAmount?.length > 0
        ) {
          const oldExtendBookingPrice = oldBookingPrice.extendAmount.reduce(
            (sum, p) => {
              return sum + (Number(p.amount) + Number(p.addOnAmount || 0));
            },
            0,
          );
          if (oldExtendBookingPrice > 0) {
            oldTotalPrice += oldExtendBookingPrice;
          }
        }

        const balanceLeft = (oldTotalPrice / totalBookingDuration) * daysLeft;
        const newBalance =
          (newVehicleData.totalRentalCost / totalBookingDuration) * daysLeft;

        refundAmount = newBalance - balanceLeft;
      }
      // storing old vehicle info
      booking.changeVehicle = {
        vehicleMasterId: booking?.vehicleMasterId,
        vehicleTableId: booking?.vehicleTableId,
        bookingPrice: booking?.bookingPrice,
        vehicleName: booking?.vehicleName,
        vehicleNumber: booking?.vehicleBasic?.vehicleNumber,
      };
      // now updating with new details
      booking.vehicleTableId = newVehicleData._id;
      booking.vehicleMasterId = newVehicleData.vehicleMasterId;
      booking.vehicleImage = newVehicleData.vehicleImage;
      booking.vehicleBrand = newVehicleData.vehicleBrand;
      booking.vehicleName = newVehicleData.vehicleName;
      if (!booking.bookingPrice.originalTotalPrice) {
        booking.bookingPrice.originalTotalPrice =
          booking.bookingPrice.totalPrice;
      }
      booking.bookingPrice.bookingPrice = newVehicleData?.totalRentalCost;
      booking.bookingPrice.vehiclePrice = newVehicleData?.totalRentalCost;
      booking.bookingPrice.tax = booking?.bookingPrice?.tax || 0;
      booking.bookingPrice.addonTax = booking?.bookingPrice?.addonTax || 0;
      booking.bookingPrice.totalPrice =
        newVehicleData?.totalRentalCost +
        Number(booking?.bookingPrice?.extraAddonPrice || 0) +
        (Number(booking?.bookingPrice?.tax) || 0) +
        (Number(booking?.bookingPrice?.addonTax) || 0);
      booking.bookingPrice.appliedPlan = newVehicleData?.appliedPlans;
      booking.bookingPrice.daysBreakdown = newVehicleData?._daysBreakdown;

      booking.vehicleBasic.isChanged = true;

      const isExtraPayment = refundAmount > 0;
      const changedId = (booking.bookingPrice.diffAmount?.length || 0) + 1;
      let newOrderId = "";

      if (isExtraPayment) {
        const razorpayOrder = await createOrderId({
          amount: isExtraPayment ? Math.round(Number(refundAmount)) : 0,
          booking_id: booking?.bookingId,
          _id: booking?._id,
          type: "ChangeVehicle",
          typeId: changedId,
          customBookingId: booking?.bookingId,
        });

        if (razorpayOrder?.id) {
          newOrderId = razorpayOrder.id;
        }
      }

      booking.bookingPrice.diffAmount = [
        ...(booking.bookingPrice.diffAmount || []),
        {
          id: changedId,
          title: "changedVehicle",
          amount: isExtraPayment ? Number(refundAmount) : 0,
          refundAmount: !isExtraPayment
            ? Math.abs(Math.round(Number(refundAmount)))
            : 0,
          paymentMethod: "",
          orderId: newOrderId,
          transactionId: "",
          status: isExtraPayment ? "unpaid" : "paid",
          rideStatus: false,
        },
      ];
      booking.vehicleBasic.vehicleNumber = newVehicleData.vehicleNumber;

      booking.markModified("bookingPrice");
      booking.markModified("vehicleBasic");
      booking.markModified("changeVehicle");

      if (isExtraPayment) {
        const paymentData = await createPaymentLinkUtil({
          bookingId: booking?._id,
          amount: isExtraPayment ? Math.round(Number(refundAmount)) : 0,
          orderId: newOrderId,
          type: "ChangeVehicle",
          typeId: changedId,
          isTimeLine: false,
        });

        if (paymentData?.paymentLinkId) {
          timeLineData = {
            currentBooking_id: booking._id,
            timeLine: [
              {
                title: "Vehicle Changed",
                changeToVehicle: `From (${booking?.changeVehicle?.vehicleNumber}) to (${booking?.vehicleBasic?.vehicleNumber})`,
                date: Date.now(),
                paymentAmount: isExtraPayment
                  ? Math.round(Number(refundAmount))
                  : 0,
                refundAmount: 0,
                PaymentLink: paymentData?.paymentLink,
              },
            ],
          };
        }
      } else {
        timeLineData = {
          currentBooking_id: booking._id,
          timeLine: [
            {
              title: "Vehicle Changed",
              changeToVehicle: `From (${booking?.changeVehicle?.vehicleNumber}) to (${booking?.vehicleBasic?.vehicleNumber})`,
              date: Date.now(),
              paymentAmount: 0,
              refundAmount: !isExtraPayment
                ? Math.abs(Math.round(Number(refundAmount)))
                : 0,
            },
          ],
        };
      }

      if (timeLineData !== null) {
        await timelineFunctionServer(timeLineData);
      }
    } else {
      // storing old vehicle info
      booking.changeVehicle = {
        vehicleMasterId: booking?.vehicleMasterId,
        vehicleTableId: booking?.vehicleTableId,
        bookingPrice: booking?.bookingPrice,
        vehicleName: booking?.vehicleName,
        vehicleNumber: booking?.vehicleBasic?.vehicleNumber,
      };
      // now updating with new details
      booking.vehicleTableId = newVehicleData._id;
      booking.vehicleBasic.isChanged = true;
      booking.bookingPrice.bookingPrice = newVehicleData?.totalRentalCost;
      booking.bookingPrice.vehiclePrice = newVehicleData?.totalRentalCost;
      booking.bookingPrice.totalPrice =
        newVehicleData?.totalRentalCost +
        Number(booking.bookingPrice?.extraAddonPrice || 0);
      booking.bookingPrice.diffAmount = [
        ...(booking.bookingPrice.diffAmount || []),
        {
          id: (booking.bookingPrice.diffAmount?.length || 0) + 1,
          title: "changedVehicle",
          amount: 0,
          refundAmount: 0,
          paymentMethod: "",
          orderId: "",
          transactionId: "",
          status: "paid",
          rideStatus: false,
        },
      ];
      booking.vehicleBasic.vehicleNumber = newVehicleData.vehicleNumber;

      booking.markModified("bookingPrice");
      booking.markModified("vehicleBasic");
      booking.markModified("changeVehicle");

      const timeLineData = {
        currentBooking_id: booking._id,
        timeLine: [
          {
            title: "Vehicle Changed",
            changeToVehicle: `From (${booking?.changeVehicle?.vehicleNumber}) to (${booking?.vehicleBasic?.vehicleNumber})`,
            date: Date.now(),
            paymentAmount: 0,
            refundAmount: 0,
          },
        ],
      };

      await timelineFunctionServer(timeLineData);
    }

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      data: booking,
      timeLine: timeLineData,
    });
  } catch (error) {
    console.log("unable to update booking", error);

    await Log({
      message: `Unable to update booking with new vehicle! with error ${error?.message}`,
      functionName: "vehicleChange",
    });
    return res.status(200).json({
      success: false,
      message: "Unable to update the vehicle! try after sometime",
    });
  }
};

const vehicleChangeNew = async (req, res) => {
  const { booking_id, newVehicleTableId } = req.body;
  const isAdmin =
    req.user?.userType === "admin" || req.user?.userType === "manager";

  try {
    if (!booking_id || !newVehicleTableId) {
      return res.json({
        success: false,
        message: "booking_id and newVehicleTableId are required.",
      });
    }

    const booking = await Booking.findById(booking_id);
    if (!booking) {
      return res.json({ success: false, message: "Booking not found." });
    }

    const lastDiff = booking.bookingPrice.diffAmount?.at(-1);
    if (lastDiff?.status === "unpaid") {
      return res.json({
        success: false,
        message: "Settle the pending payment before changing vehicle.",
      });
    }

    // Reuse same pricing logic
    const pricing = await calculateVehicleChangePricing(
      booking,
      newVehicleTableId,
      isAdmin,
    );
    if (!pricing.success) {
      return res.json({ success: false, message: pricing.message });
    }

    const {
      newVehicleData,
      oldRemainingValue,
      newRemainingCost,
      priceDifference,
      isExtraPayment,
      isRefund,
    } = pricing;

    const isSameVehicleMaster =
      booking.vehicleMasterId.toString() ===
      newVehicleData.vehicleMasterId.toString();

    let timeLineData = null;

    // --- Store old vehicle snapshot ---
    booking.changeVehicle = {
      vehicleMasterId: booking.vehicleMasterId,
      vehicleTableId: booking.vehicleTableId,
      bookingPrice: booking.bookingPrice,
      vehicleName: booking.vehicleName,
      vehicleNumber: booking.vehicleBasic?.vehicleNumber,
    };

    // --- Update booking with new vehicle ---
    booking.vehicleTableId = newVehicleData._id;
    booking.vehicleMasterId = newVehicleData.vehicleMasterId;
    booking.vehicleImage = newVehicleData.vehicleImage;
    booking.vehicleBrand = newVehicleData.vehicleBrand;
    booking.vehicleName = newVehicleData.vehicleName;
    booking.vehicleBasic.vehicleNumber = newVehicleData.vehicleNumber;
    booking.vehicleBasic.isChanged = true;

    // bookingPrice stays untouched — only diffAmount updated
    if (!Array.isArray(booking.bookingPrice.diffAmount)) {
      booking.bookingPrice.diffAmount = [];
    }

    const changedId = booking.bookingPrice.diffAmount.length + 1;
    let newOrderId = "";

    if (isExtraPayment) {
      const razorpayOrder = await createOrderId({
        amount: priceDifference,
        booking_id: booking.bookingId,
        _id: booking._id,
        type: "ChangeVehicle",
        typeId: changedId,
        customBookingId: booking?.bookingId,
      });
      if (razorpayOrder?.id) newOrderId = razorpayOrder.id;
    }

    booking.bookingPrice.diffAmount.push({
      id: changedId,
      title: "changedVehicle",
      amount: isExtraPayment ? priceDifference : 0,
      refundAmount: isRefund ? priceDifference : 0,
      oldAmount: oldRemainingValue,
      newAmount: newRemainingCost,
      paymentMethod: isRefund ? "refund" : "",
      orderId: newOrderId,
      paymentInitiatedDate: new Date().getTime(),
      transactionId: "",
      status: isExtraPayment ? "unpaid" : "paid",
      rideStatus: false,
      // New vehicle pricing snapshot preserved here
      newVehicleSnapshot: {
        vehicleTableId: newVehicleData._id,
        vehicleMasterId: newVehicleData.vehicleMasterId,
        vehicleName: newVehicleData.vehicleName,
        vehicleNumber: newVehicleData.vehicleNumber,
        rentalCost: newVehicleData.totalRentalCost,
        appliedPlans: newVehicleData.appliedPlans,
        tax: newVehicleData.tax,
      },
    });

    booking.markModified("bookingPrice.diffAmount");
    booking.markModified("bookingPrice");
    booking.markModified("vehicleBasic");
    booking.markModified("changeVehicle");

    // --- Payment link if extra payment ---
    if (isExtraPayment) {
      const paymentData = await createPaymentLinkUtil({
        bookingId: booking._id,
        amount: priceDifference,
        orderId: newOrderId,
        type: "ChangeVehicle",
        typeId: changedId,
        isTimeLine: false,
      });

      if (paymentData?.paymentLinkId) {
        timeLineData = {
          currentBooking_id: booking._id,
          timeLine: [
            {
              title: "Vehicle Changed",
              changeToVehicle: `From (${booking.changeVehicle.vehicleNumber}) to (${newVehicleData.vehicleNumber})`,
              date: Date.now(),
              paymentAmount: priceDifference,
              refundAmount: 0,
              oldAmount: oldRemainingValue,
              newAmount: newRemainingCost,
              PaymentLink: paymentData.paymentLink,
            },
          ],
        };
      }
    } else {
      timeLineData = {
        currentBooking_id: booking._id,
        timeLine: [
          {
            title: "Vehicle Changed",
            changeToVehicle: `From (${booking.changeVehicle.vehicleNumber}) to (${newVehicleData.vehicleNumber})`,
            date: Date.now(),
            paymentAmount: 0,
            refundAmount: isRefund ? priceDifference : 0,
            oldAmount: oldRemainingValue,
            newAmount: newRemainingCost,
          },
        ],
      };
    }

    if (timeLineData) await timelineFunctionServer(timeLineData);

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      data: booking,
      timeLine: timeLineData,
    });
  } catch (error) {
    console.log("vehicleChangeNew error", error);
    await Log({
      message: `Unable to update booking with new vehicle! ${error?.message}`,
      functionName: "vehicleChangeNew",
    });
    return res.status(200).json({
      success: false,
      message: "Unable to update the vehicle! try after sometime",
    });
  }
};

const vehicleChangePreview = async (req, res) => {
  const { booking_id, newVehicleTableId } = req.body;
  const isAdmin =
    req.user?.userType === "admin" || req.user?.userType === "manager";

  try {
    if (!booking_id || !newVehicleTableId) {
      return res.json({
        success: false,
        message: "booking_id and newVehicleTableId are required.",
      });
    }

    const booking = await Booking.findById(booking_id);
    if (!booking) {
      return res.json({ success: false, message: "Booking not found." });
    }

    // Block if there's already an unpaid vehicle change
    const lastDiff = booking.bookingPrice.diffAmount?.at(-1);
    if (lastDiff?.status === "unpaid") {
      return res.json({
        success: false,
        message: "Settle the pending payment before changing vehicle.",
      });
    }

    const pricing = await calculateVehicleChangePricing(
      booking,
      newVehicleTableId,
      isAdmin,
    );

    if (!pricing.success) {
      return res.json({ success: false, message: pricing.message });
    }

    return res.status(200).json({
      success: true,
      message: "Vehicle change preview calculated.",
      data: {
        currentVehicle: {
          vehicleNumber: booking.vehicleBasic?.vehicleNumber,
          vehicleName: booking.vehicleName,
          vehicleBrand: booking.vehicleBrand,
        },
        newVehicle: {
          vehicleNumber: pricing.newVehicleData.vehicleNumber,
          vehicleName: pricing.newVehicleData.vehicleName,
          vehicleBrand: pricing.newVehicleData.vehicleBrand,
          totalRentalCost: pricing.newVehicleData.totalRentalCost,
          appliedPlans: pricing.newVehicleData.appliedPlans,
          _daysBreakdown: pricing.newVehicleData._daysBreakdown,
          tax: pricing.newVehicleData.tax,
        },
        priceSummary: {
          oldRemainingValue: pricing.oldRemainingValue,
          newRemainingCost: pricing.newRemainingCost,
          difference: pricing.priceDifference,
          isExtraPayment: pricing.isExtraPayment,
          isRefund: pricing.isRefund,
          isFreeSwap: pricing.isFreeSwap,
          daysLeft: pricing.daysLeft,
          segmentType: pricing.currentSegment.type,
        },
      },
    });
  } catch (error) {
    console.log("vehicleChangePreview error", error);
    return res.status(200).json({
      success: false,
      message: "Unable to calculate preview.",
    });
  }
};

module.exports = {
  vehicleChangeInBooking,
  vehicleChange,
  vehicleChangeNew,
  vehicleChangePreview,
};
