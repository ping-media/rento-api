const Booking = require("../../../db/schemas/onboarding/booking.schema.js");
const General = require("../../../db/schemas/onboarding/general.schema.js");
const Log = require("../../../api/onboarding/models/Logs.model.js");
const station = require("../../../db/schemas/onboarding/station.schema.js");
const pickupImage = require("../../../db/schemas/onboarding/pickupImageUpload.js");
const { booking } = require("./vehicles.model.js");
const { timelineFunctionServer } = require("./timeline.model.js");
const { default: axios } = require("axios");
require("dotenv").config();

// Get All Bookings with Filtering and Pagination
const getBooking = async (query) => {
  const obj = { status: 200, message: "Data fetched successfully", data: [] };

  try {
    const {
      _id,
      bookingId,
      bookingStatus,
      userId = null,
      paymentStatus,
      search,
      vehicleBrand,
      vehicleName,
      stationName,
      rideStatus,
      paymentMethod,
      payInitFrom,
      stationId,
      sortBy,
      sortOrder,
      page = 1,
      limit = 10,
    } = query;

    if (_id) {
      if (_id.length !== 24) {
        await Log({
          message: "Invalid booking ID",
          functionName: "booking",
          userId: userId || "Admin",
        });
        obj.status = 401;
        obj.message = "Invalid booking ID";
        return obj;
      }

      // Find booking by `_id`
      const booking = await Booking.findById(_id);
      if (!booking) {
        await Log({
          message: "Booking not found for the provided ID",
          functionName: "booking",
          userId: userId || "Admin",
        });
        obj.status = 404;
        obj.message = "Booking not found";
        return obj;
      }

      obj.data = [booking];
      return obj;
    }

    const sortby = sortBy || "createdAt";
    const sortorder = sortOrder === "asc" ? 1 : -1;

    const filters = {};
    if (_id) filters._id = _id;
    if (bookingId) filters.bookingId = bookingId;
    if (vehicleBrand) filters.vehicleBrand = vehicleBrand;
    if (vehicleName) filters.vehicleName = vehicleName;
    if (stationName) filters.stationName = stationName;
    if (bookingStatus) filters.bookingStatus = bookingStatus;
    if (paymentStatus) filters.paymentStatus = paymentStatus;
    if (userId) filters.userId = userId;
    if (rideStatus) filters.rideStatus = rideStatus;
    if (paymentMethod) filters.paymentMethod = paymentMethod;
    if (payInitFrom) filters.payInitFrom = payInitFrom;
    if (stationId) filters.stationId = stationId;

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, "i");
      filters.$or = [
        { bookingId: searchRegex },
        { vehicleBrand: searchRegex },
        { vehicleName: searchRegex },
        { stationName: searchRegex },
        { bookingStatus: searchRegex },
        { paymentStatus: searchRegex },
        { paymentMethod: searchRegex },
        { rideStatus: searchRegex },
        { payInitFrom: searchRegex },
        {
          BookingStartDateAndTime: {
            $regex: searchRegex,
          },
        },
        {
          BookingEndDateAndTime: {
            $regex: searchRegex,
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const bookings = await Booking.find(filters)
      .populate("userId", "firstName lastName contact createdAt updatedAt")
      .sort({ [sortby]: sortorder })
      .skip(skip)
      .limit(Number(limit));

    // If no bookings found
    if (!bookings.length) {
      await Log({
        message: "No bookings found for the provided filters",
        functionName: "booking",
        userId: userId || "Admin",
      });
      obj.message = "No records found";
      obj.status = 200;
      return obj;
    }

    // Add bookings to the response
    obj.data = bookings;

    // Include pagination metadata
    const totalRecords = await Booking.count(filters);
    obj.pagination = {
      // totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: Number(page),
      limit: Number(limit),
    };
  } catch (error) {
    console.error("Error fetching bookings:", error);
    await Log({
      message: `Error fetching bookings: ${error.message}`,
      functionName: "booking",
      //  userId: userId || "Admin",
    });
    obj.status = 500;
    obj.message = "Internal server error";
  }

  return obj;
};

const getBookings = async (query) => {
  const obj = {
    status: 200,
    message: "Data fetched successfully",
    data: [],
    isEmpty: false,
  };

  try {
    const { _id, bookingId, bookingStatus, userId, paymentStatus, search } =
      query;

    if (_id) {
      const booking = await Booking.findById(_id)
        .populate(
          "userId",
          "firstName lastName contact altContact email kycApproved"
        )
        .populate("vehicleTableId", "vehiclePlan perDayCost")
        .populate(
          "stationMasterUserId",
          "firstName lastName contact altContact email status"
        );

      if (!booking) {
        await Log({
          message: "Booking not found for the provided ID",
          functionName: "booking",
          userId: userId || null,
        });
        obj.status = 404;
        obj.message = "Booking not found";
        obj.isEmpty = true;
        return obj;
      }

      const pickupImageData = await pickupImage
        .findOne({
          bookingId: booking?.bookingId,
        })
        .select("-bookingId -__v");

      const stationData = await station.findOne({
        stationId: booking?.stationId,
      });

      const pricingRules = await General.findOne({});

      if (booking && booking.vehicleTableId && pricingRules) {
        const originalPerDayCost = booking.vehicleTableId.perDayCost;
        let finalPerDayCost = originalPerDayCost;

        const startDateObj = new Date(booking.BookingStartDateAndTime);
        const endDateObj =
          booking.extendBooking?.originalEndDate ||
          booking.BookingEndDateAndTime
            ? new Date(
                booking.extendBooking?.originalEndDate ||
                  booking.BookingEndDateAndTime
              )
            : null;

        // Check if start or end is weekend
        const startDayOfWeek = startDateObj.getDay();
        const endDayOfWeek = endDateObj?.getDay();
        const isWeekendBooking =
          startDayOfWeek === 6 ||
          startDayOfWeek === 0 ||
          endDayOfWeek === 6 ||
          endDayOfWeek === 0;

        if (isWeekendBooking && pricingRules.weakend) {
          const weekendPrice = pricingRules.weakend.Price;
          const weekendPriceType = pricingRules.weakend.PriceType;

          if (weekendPriceType === "+") {
            finalPerDayCost =
              Number(originalPerDayCost) +
              (Number(originalPerDayCost) * Number(weekendPrice)) / 100;
          } else if (weekendPriceType === "-") {
            finalPerDayCost =
              Number(originalPerDayCost) -
              (Number(originalPerDayCost) * Number(weekendPrice)) / 100;
          }
        }

        // Apply special day pricing
        if (pricingRules.specialDays && pricingRules.specialDays.length > 0) {
          pricingRules.specialDays.forEach((specialDay) => {
            const fromDate = new Date(specialDay.From);
            const toDate = new Date(specialDay.Too);

            if (
              (startDateObj >= fromDate && startDateObj <= toDate) ||
              (endDateObj >= fromDate && endDateObj <= toDate)
            ) {
              const specialPrice = specialDay.Price;
              const specialPriceType = specialDay.PriceType;

              if (specialPriceType === "+") {
                finalPerDayCost =
                  Number(originalPerDayCost) +
                  (Number(originalPerDayCost) * Number(specialPrice)) / 100;
              } else if (specialPriceType === "-") {
                finalPerDayCost =
                  Number(originalPerDayCost) -
                  (Number(originalPerDayCost) * Number(specialPrice)) / 100;
              }
            }
          });
        }
        const bookingObj = {
          ...booking.toObject(),
          stationData,
          pickupImage: pickupImageData,
        };
        bookingObj.vehicleTableId.originalPerDayCost = originalPerDayCost;
        bookingObj.vehicleTableId.perDayCost = Math.round(finalPerDayCost);
        obj.data = [bookingObj];
        return obj;
      }

      obj.data = [booking];
      return obj;
    }

    // Build filter conditions dynamically
    const filters = {};
    if (bookingStatus) filters.bookingStatus = bookingStatus;
    if (userId) filters.userId = userId;
    if (bookingId) filters.bookingId = bookingId;
    if (paymentStatus) filters.paymentStatus = paymentStatus;

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, "i");
      filters.$or = [
        { bookingId: searchRegex },
        { vehicleName: searchRegex },
        { stationName: searchRegex },
        { bookingStatus: searchRegex },
        { paymentStatus: searchRegex },
      ];
    }

    // Fetch bookings
    const bookings = await Booking.find(filters)
      .populate("userId", "firstName lastName contact")
      .populate("stationMasterUserId", "firstName lastName contact")
      .sort({ createdAt: -1 });

    // If no bookings found
    if (!bookings || bookings.length === 0) {
      await Log({
        message: "No bookings found for the provided filters",
        functionName: "booking",
        userId: userId || null,
      });
      obj.message = "No records found";
      obj.status = 200;
      return obj;
    }

    // Add bookings to the response
    obj.data = bookings;
  } catch (error) {
    console.error("Error fetching bookings:", error);
    await Log({
      message: `Error fetching bookings: ${error.message}`,
      functionName: "booking",
      // userId: userId || null,
    });
    obj.status = 500;
    obj.message = "Internal server error";
  }

  return obj;
};

const createOrderId = async ({ amount, booking_id, _id, type, typeId }) => {
  const key_id = process.env.VITE_RAZOR_KEY_ID;
  const key_secret = process.env.VITE_RAZOR_KEY_SECRET;

  // API endpoint for Razorpay order creation
  const url = "https://api.razorpay.com/v1/orders";

  // Prepare the order data to send
  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: "receipt#" + booking_id,
    payment_capture: 1,
    notes: {
      booking_id: _id.toString(),
      type: type || "",
      typeId: typeId || "",
    },
  };

  try {
    // Make the API request to Razorpay using axios
    const response = await axios.post(url, options, {
      headers: {
        "Content-Type": "application/json",
      },
      auth: {
        username: key_id,
        password: key_secret,
      },
    });

    return response.data;
  } catch (error) {
    return error.message;
  }
};

const initiateBooking = async (req, res) => {
  try {
    let { bookingData, paymentMethod } = req.body;

    if (!bookingData.vehicleTableId || !bookingData.userId || !paymentMethod) {
      return res.json({ message: "Required fields missing", status: 400 });
    }

    // is amount goes to zero after discount
    if (bookingData?.bookingPrice?.isDiscountZero) {
      bookingData = {
        ...bookingData,
        paymentMethod: "online",
        bookingStatus: "done",
        paymentStatus: "paid",
      };

      const response = await booking(bookingData);

      if (response?.status === 200) {
        const timeLineData = {
          userId: response?.data?.userId,
          bookingId: response?.data?.bookingId,
          currentBooking_id: response?.data?._id,
          isStart: true,
          timeLine: [
            {
              title: "Booking Created",
              date: Date.now(),
            },
          ],
        };
        await timelineFunctionServer(timeLineData);
      }

      return res.json(response);
    }

    // for cash payment mode
    if (paymentMethod === "cash") {
      bookingData = {
        ...bookingData,
        payInitFrom: "Cash",
        bookingStatus: "done",
        paymentMethod: paymentMethod,
      };

      const response = await booking(bookingData);

      if (response?.status === 200) {
        const paymentAmount =
          bookingData?.bookingPrice?.discountTotalPrice > 0
            ? bookingData?.bookingPrice?.discountTotalPrice
            : bookingData?.bookingPrice?.totalPrice;

        const timeLineData_1 = {
          userId: response?.data?.userId,
          bookingId: response?.data?.bookingId,
          currentBooking_id: response?.data?._id,
          isStart: true,
          timeLine: [
            {
              title: "Booking Created",
              date: Date.now(),
            },
          ],
        };

        await timelineFunctionServer(timeLineData_1);

        const timeLineData_2 = {
          currentBooking_id: response?.data?._id,
          timeLine: [
            {
              title: "Pay Later",
              date: Date.now(),
              paymentAmount: paymentAmount || 0,
            },
          ],
        };
        await timelineFunctionServer(timeLineData_2);
        return res.json(response);
      }
    }

    // for other payment modes
    if (paymentMethod === "partiallyPay") {
      const userPaid = Math.round(
        (bookingData?.bookingPrice?.discountTotalPrice ||
          bookingData?.bookingPrice?.totalPrice) * 0.2
      );
      const AmountLeftAfterUserPaid =
        (bookingData?.bookingPrice?.discountTotalPrice ||
          bookingData?.bookingPrice?.totalPrice) - userPaid;

      bookingData = {
        ...bookingData,
        bookingPrice: {
          ...bookingData.bookingPrice,
          userPaid,
          AmountLeftAfterUserPaid: {
            amount: Math.round(AmountLeftAfterUserPaid),
            status: "unpaid",
          },
        },
      };
    }

    bookingData = { ...bookingData, paymentMethod: paymentMethod };

    const response = await booking(bookingData);

    if (response?.status === 200) {
      const timeLineData_1 = {
        userId: response?.data?.userId,
        bookingId: response?.data?.bookingId,
        currentBooking_id: response?.data?._id,
        isStart: true,
        timeLine: [
          {
            title: "Booking Created",
            date: Date.now(),
          },
        ],
      };

      await timelineFunctionServer(timeLineData_1);

      const payableAmount =
        (paymentMethod === "partiallyPay"
          ? bookingData?.bookingPrice?.userPaid
          : bookingData?.bookingPrice?.discountTotalPrice &&
            bookingData?.bookingPrice?.discountTotalPrice > 0
          ? bookingData?.bookingPrice?.discountTotalPrice
          : bookingData?.bookingPrice?.totalPrice) || 100;

      const razorData = await createOrderId({
        amount: payableAmount,
        booking_id: response?.data?.bookingId,
        _id: response?.data?._id,
        type: paymentMethod === "partiallyPay" ? "partiallyPay" : "",
      });

      if (razorData?.status === "created") {
        await Booking.findByIdAndUpdate(response?.data?._id, {
          $set: {
            payInitFrom: "Razorpay",
            paymentInitiatedDate: razorData?.created_at,
            paymentgatewayOrderId: razorData?.id,
            paymentgatewayReceiptId: razorData?.receipt,
          },
        });

        const timeLineData = {
          currentBooking_id: response.data?._id,
          timeLine: [
            {
              title: "Payment Initiated",
              date: Date.now(),
            },
          ],
        };

        await timelineFunctionServer(timeLineData);
      } else {
        return res.json({ status: 500, message: "Failed to initiate payment" });
      }

      return res.json({
        status: 200,
        message: response?.message,
        data: {
          orderId: razorData?.id,
          booking_id: response?.data?._id,
          bookingId: response?.data?.bookingId,
          payableAmount,
        },
      });
    }

    return res.json({
      status: 500,
      message: response?.message,
    });
  } catch (error) {
    console.error("Booking error:", error);
    return res.json({
      status: 500,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

const initiateExtendBooking = async (req, res) => {
  const { _id, bookingId, amount, data } = req.body;

  // Validate required fields
  if (!_id || !bookingId || !amount || !data) {
    return res.status(400).json({
      message: "Missing required fields! try again",
    });
  }

  try {
    const booking = await Booking.findById(_id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const razorpayOrder = await createOrderId({
      amount: amount,
      booking_id: bookingId,
      _id: _id,
      type: "extension",
      typeId: data.extendAmount.id,
    });

    // Update properties individually
    if (data.BookingEndDateAndTime) {
      booking.BookingEndDateAndTime = data.BookingEndDateAndTime;
    }

    if (!booking.bookingPrice.extendAmount) {
      booking.bookingPrice.extendAmount = [];
    }

    if (data.extendAmount) {
      booking.bookingPrice.extendAmount.push({
        ...data.extendAmount,
        orderId: razorpayOrder.id,
      });
    }

    if (!booking.extendBooking) {
      booking.extendBooking = {};
    }

    if (!booking.extendBooking.oldBooking) {
      booking.extendBooking.oldBooking = [];
    }

    if (data.oldBookings) {
      booking.extendBooking.oldBooking.push(data.oldBookings);
    }

    booking.bookingStatus = "extended";

    // Mark nested objects as modified
    booking.markModified("bookingPrice");
    booking.markModified("extendBooking");

    const savedBooking = await booking.save();

    if (savedBooking) {
      await timelineFunctionServer({
        currentBooking_id: booking._id,
        timeLine: [
          {
            title: "Payment Initiated",
            date: Date.now(),
            paymentAmount: amount,
            extendDate: data.extendAmount.bookingEndDateAndTime,
          },
        ],
      });

      res.json({
        id: razorpayOrder.id,
        status: razorpayOrder.status,
        bookingUpdate: true,
      });
    } else {
      res.json({
        bookingUpdate: false,
        message: "Unable to extend booking! try again",
      });
    }
  } catch (error) {
    console.error("Error in initiateExtendBooking:", error);
    res.json({
      message: "Internal server error",
      error: error.message,
      bookingUpdate: false,
    });
  }
};

const updateBooking = async (req, res) => {
  const { BookingStartDateAndTime, BookingEndDateAndTime, _id } = req.body;

  if (!_id) {
    return res.status(400).json({
      message: "Missing required fields! try again",
    });
  }

  try {
    const booking = await Booking.findById(_id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    let isStartUpdate = false;
    let isEndUpdate = false;

    if (BookingStartDateAndTime > booking.BookingStartDateAndTime) {
      booking.BookingStartDateAndTime = BookingStartDateAndTime;
      isStartUpdate = true;
    }

    if (BookingEndDateAndTime > booking.BookingEndDateAndTime) {
      booking.BookingEndDateAndTime = BookingEndDateAndTime;
      isEndUpdate = true;
    }

    const savedBooking = await booking.save();

    if (savedBooking) {
      await timelineFunctionServer({
        currentBooking_id: booking._id,
        timeLine: [
          {
            title: "Booking Rescheduled",
            date: Date.now(),
            newStartDate: isStartUpdate ? BookingStartDateAndTime : "",
            newEndDate: isEndUpdate ? BookingEndDateAndTime : "",
          },
        ],
      });

      res.json({
        success: true,
        isStartUpdate,
        isEndUpdate,
      });
    }
  } catch (error) {
    console.warn(
      "Unable to update or rescheduled booking! try again",
      error?.message
    );
    res.json({
      success: false,
      message: "Unable to update or rescheduled booking! try again.",
    });
  }
};

const deleteBooking = async (req, res) => {
  const { bookingId, userId } = req.body;

  if (!bookingId && !userId) {
    return res.status(400).json({ message: "Booking ID is required" });
  }

  try {
    const deletedBooking = await Booking.findByIdAndDelete(bookingId);

    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({
      message: "Booking deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ message: "Server error while deleting booking" });
  }
};

module.exports = {
  getBookings,
  getBooking,
  initiateBooking,
  createOrderId,
  initiateExtendBooking,
  updateBooking,
  deleteBooking,
};
