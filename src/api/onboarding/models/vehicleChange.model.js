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
        let oldTotalPrice = oldBookingPrice.totalPrice;

        if (
          oldBookingPrice.extendAmount &&
          oldBookingPrice.extendAmount?.length > 0
        ) {
          const oldExtendBookingPrice = oldBookingPrice.extendAmount.reduce(
            (sum, p) => {
              return sum + (Number(p.amount) + Number(p.addOnAmount || 0));
            },
            0
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
      let priceDifference = 0;
      let oldRemainingValue = 0;
      let newRemainingCost = 0;

      if (daysLeft > 0) {
        // Calculate old vehicle's total price
        const oldBookingPrice = booking.bookingPrice;
        let oldTotalPrice = oldBookingPrice.totalPrice;

        // Add extension amounts if any
        if (
          oldBookingPrice.extendAmount &&
          oldBookingPrice.extendAmount?.length > 0
        ) {
          const oldExtendBookingPrice = oldBookingPrice.extendAmount.reduce(
            (sum, p) => {
              return sum + (Number(p.amount) + Number(p.addOnAmount || 0));
            },
            0
          );
          if (oldExtendBookingPrice > 0) {
            oldTotalPrice += oldExtendBookingPrice;
          }
        }

        // Calculate remaining value of old booking (what customer has already paid for remaining days)
        oldRemainingValue = (oldTotalPrice / totalBookingDuration) * daysLeft;

        // Calculate cost of new vehicle for remaining days
        newRemainingCost =
          (newVehicleData.totalRentalCost / totalBookingDuration) * daysLeft;

        // Price difference: positive = customer owes more, negative = customer gets refund
        priceDifference = newRemainingCost - oldRemainingValue;
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

      // Only process payment if there's a significant difference (more than ₹1)
      const hasSignificantDifference = Math.abs(priceDifference) > 1;
      const isExtraPayment = priceDifference > 1; // Customer needs to pay more
      const isRefund = priceDifference < -1; // Customer gets refund

      const changedId = (booking.bookingPrice.diffAmount?.length || 0) + 1;
      let newOrderId = "";

      if (isExtraPayment) {
        const razorpayOrder = await createOrderId({
          amount: Math.round(Math.abs(priceDifference)),
          booking_id: booking?.bookingId,
          _id: booking?._id,
          type: "ChangeVehicle",
          typeId: changedId,
        });

        if (razorpayOrder?.id) {
          newOrderId = razorpayOrder.id;
        }
      }

      // Only add diffAmount entry if there's a significant price difference
      if (hasSignificantDifference) {
        booking.bookingPrice.diffAmount = [
          ...(booking.bookingPrice.diffAmount || []),
          {
            id: changedId,
            title: "changedVehicle",
            amount: isExtraPayment ? Math.round(Math.abs(priceDifference)) : 0,
            refundAmount: isRefund ? Math.round(Math.abs(priceDifference)) : 0,
            oldAmount: Math.round(oldRemainingValue),
            newAmount: Math.round(newRemainingCost),
            paymentMethod: isRefund ? "refund" : "",
            orderId: newOrderId,
            transactionId: "",
            status: isExtraPayment ? "unpaid" : "paid",
            rideStatus: false,
          },
        ];
      } else {
        // No price difference - just record the vehicle change
        booking.bookingPrice.diffAmount = [
          ...(booking.bookingPrice.diffAmount || []),
          {
            id: changedId,
            title: "changedVehicle",
            amount: 0,
            refundAmount: 0,
            oldAmount: Math.round(oldRemainingValue),
            newAmount: Math.round(newRemainingCost),
            paymentMethod: "",
            orderId: "",
            transactionId: "",
            status: "paid",
            rideStatus: false,
          },
        ];
      }

      booking.vehicleBasic.vehicleNumber = newVehicleData.vehicleNumber;

      booking.markModified("bookingPrice");
      booking.markModified("vehicleBasic");
      booking.markModified("changeVehicle");

      if (isExtraPayment) {
        const paymentData = await createPaymentLinkUtil({
          bookingId: booking?._id,
          amount: Math.round(Math.abs(priceDifference)),
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
                paymentAmount: Math.round(Math.abs(priceDifference)),
                refundAmount: 0,
                oldAmount: Math.round(oldRemainingValue),
                newAmount: Math.round(newRemainingCost),
                PaymentLink: paymentData?.paymentLink,
              },
            ],
          };
        }
      } else if (isRefund) {
        timeLineData = {
          currentBooking_id: booking._id,
          timeLine: [
            {
              title: "Vehicle Changed",
              changeToVehicle: `From (${booking?.changeVehicle?.vehicleNumber}) to (${booking?.vehicleBasic?.vehicleNumber})`,
              date: Date.now(),
              paymentAmount: 0,
              refundAmount: Math.round(Math.abs(priceDifference)),
              oldAmount: Math.round(oldRemainingValue),
              newAmount: Math.round(newRemainingCost),
            },
          ],
        };
      } else {
        // No price difference
        timeLineData = {
          currentBooking_id: booking._id,
          timeLine: [
            {
              title: "Vehicle Changed",
              changeToVehicle: `From (${booking?.changeVehicle?.vehicleNumber}) to (${booking?.vehicleBasic?.vehicleNumber})`,
              date: Date.now(),
              paymentAmount: 0,
              refundAmount: 0,
              oldAmount: Math.round(oldRemainingValue),
              newAmount: Math.round(newRemainingCost),
            },
          ],
        };
      }

      if (timeLineData !== null) {
        await timelineFunctionServer(timeLineData);
      }
    } else {
      // Same vehicle master - just changing the specific vehicle instance
      // storing old vehicle info
      booking.changeVehicle = {
        vehicleMasterId: booking?.vehicleMasterId,
        vehicleTableId: booking?.vehicleTableId,
        bookingPrice: booking?.bookingPrice,
        vehicleName: booking?.vehicleName,
        vehicleNumber: booking?.vehicleBasic?.vehicleNumber,
      };

      // Calculate old and new amounts for same vehicle master
      const oldVehiclePrice = booking.bookingPrice.totalPrice;
      const newVehiclePrice =
        newVehicleData?.totalRentalCost +
        Number(booking.bookingPrice?.extraAddonPrice || 0) +
        (Number(booking?.bookingPrice?.tax) || 0) +
        (Number(booking?.bookingPrice?.addonTax) || 0);

      // now updating with new details
      booking.vehicleTableId = newVehicleData._id;
      booking.vehicleBasic.isChanged = true;
      booking.bookingPrice.bookingPrice = newVehicleData?.totalRentalCost;
      booking.bookingPrice.vehiclePrice = newVehicleData?.totalRentalCost;
      booking.bookingPrice.totalPrice = newVehiclePrice;

      booking.bookingPrice.diffAmount = [
        ...(booking.bookingPrice.diffAmount || []),
        {
          id: (booking.bookingPrice.diffAmount?.length || 0) + 1,
          title: "changedVehicle",
          amount: 0,
          refundAmount: 0,
          oldAmount: Math.round(oldVehiclePrice),
          newAmount: Math.round(newVehiclePrice),
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

      timeLineData = {
        currentBooking_id: booking._id,
        timeLine: [
          {
            title: "Vehicle Changed",
            changeToVehicle: `From (${booking?.changeVehicle?.vehicleNumber}) to (${booking?.vehicleBasic?.vehicleNumber})`,
            date: Date.now(),
            paymentAmount: 0,
            refundAmount: 0,
            oldAmount: Math.round(oldVehiclePrice),
            newAmount: Math.round(newVehiclePrice),
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

module.exports = { vehicleChangeInBooking, vehicleChange };
