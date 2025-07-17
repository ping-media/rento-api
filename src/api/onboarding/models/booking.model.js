const Booking = require("../../../db/schemas/onboarding/booking.schema.js");
const General = require("../../../db/schemas/onboarding/general.schema.js");
const Log = require("../../../api/onboarding/models/Logs.model.js");
const station = require("../../../db/schemas/onboarding/station.schema.js");
const pickupImage = require("../../../db/schemas/onboarding/pickupImageUpload.js");
const TempExtension = require("../../../db/schemas/onboarding/tempExtension.schema.js");
const { booking } = require("./vehicles.model.js");
const { timelineFunctionServer } = require("./timeline.model.js");
const { default: axios } = require("axios");
const Timeline = require("../../../db/schemas/onboarding/timeline.schema.js");
const { createPaymentLinkUtil } = require("./razorpay.model.js");
const { sendMessageAfterBooking } = require("../../../utils/index.js");
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
      vehicleNumber,
      fullName,
      contact,
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
      const booking = await Booking.findById(_id).populate(
        "userId",
        "firstName lastName contact createdAt updatedAt"
      );

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

    const pipeline = [];

    const matchFilters = {};
    if (bookingId) {
      matchFilters.bookingId = {
        $regex: bookingId,
        $options: "i",
      };
    }
    if (vehicleBrand) matchFilters.vehicleBrand = vehicleBrand;
    if (vehicleName) matchFilters.vehicleName = vehicleName;
    if (vehicleNumber) {
      matchFilters["vehicleBasic.vehicleNumber"] = {
        $regex: vehicleNumber,
        $options: "i",
      };
    }
    if (stationName) matchFilters.stationName = stationName;
    if (bookingStatus) matchFilters.bookingStatus = bookingStatus;
    if (paymentStatus) matchFilters.paymentStatus = paymentStatus;
    if (userId) matchFilters.userId = userId;
    if (rideStatus) matchFilters.rideStatus = rideStatus;
    if (paymentMethod) matchFilters.paymentMethod = paymentMethod;
    if (payInitFrom) matchFilters.payInitFrom = payInitFrom;
    if (stationId) matchFilters.stationId = stationId;

    if (Object.keys(matchFilters).length > 0) {
      pipeline.push({ $match: matchFilters });
    }

    pipeline.push({
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userId",
        pipeline: [
          {
            $project: {
              firstName: 1,
              lastName: 1,
              contact: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
      },
    });

    pipeline.push({
      $unwind: {
        path: "$userId",
        preserveNullAndEmptyArrays: true,
      },
    });

    pipeline.push({
      $addFields: {
        "userId.fullName": {
          $concat: [
            { $ifNull: ["$userId.firstName", ""] },
            {
              $cond: {
                if: {
                  $and: [
                    { $ne: ["$userId.firstName", null] },
                    { $ne: ["$userId.lastName", null] },
                  ],
                },
                then: " ",
                else: "",
              },
            },
            { $ifNull: ["$userId.lastName", ""] },
          ],
        },
      },
    });

    const populatedFilters = {};
    if (fullName) {
      populatedFilters["userId.fullName"] = {
        $regex: fullName,
        $options: "i",
      };
    }
    if (contact) {
      populatedFilters["userId.contact"] = {
        $regex: contact,
        $options: "i",
      };
    }

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, "i");

      const searchConditions = [
        { bookingId: searchRegex },
        { vehicleBrand: searchRegex },
        { vehicleName: searchRegex },
        { "vehicleBasic.vehicleNumber": searchRegex },
        { stationName: searchRegex },
        { bookingStatus: searchRegex },
        { paymentStatus: searchRegex },
        { paymentMethod: searchRegex },
        { rideStatus: searchRegex },
        { payInitFrom: searchRegex },
        { BookingStartDateAndTime: { $regex: searchRegex } },
        { BookingEndDateAndTime: { $regex: searchRegex } },
        { "userId.fullName": searchRegex },
        { "userId.contact": searchRegex },
      ];

      if (Object.keys(populatedFilters).length > 0) {
        populatedFilters.$and = [{ $or: searchConditions }, populatedFilters];
      } else {
        populatedFilters.$or = searchConditions;
      }
    }

    if (Object.keys(populatedFilters).length > 0) {
      pipeline.push({ $match: populatedFilters });
    }

    const skip = (page - 1) * limit;
    const countPipeline = [...pipeline, { $count: "total" }];

    pipeline.push({ $sort: { [sortby]: sortorder } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: Number(limit) });

    const [bookings, countResult] = await Promise.all([
      Booking.aggregate(pipeline),
      Booking.aggregate(countPipeline),
    ]);

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

    obj.data = bookings;

    const totalRecords = countResult.length > 0 ? countResult[0].total : 0;
    obj.pagination = {
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: Number(page),
      limit: Number(limit),
    };
  } catch (error) {
    console.error("Error fetching bookings:", error);
    await Log({
      message: `Error fetching bookings: ${error.message}`,
      functionName: "booking",
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
            extendId: `extend_${booking.bookingId}_${data.extendAmount.id}`,
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

const extendBooking = async (req, res) => {
  const { _id, bookingId, amount, data } = req.body;

  // Validate required fields
  if (!_id || !bookingId || !amount || !data?.extendAmount?.id) {
    return res.status(400).json({
      message: "Missing required fields! try again",
    });
  }

  let paymentDetails;
  try {
    paymentDetails = await axios.get(
      `https://api.razorpay.com/v1/payments/${data?.extendAmount?.transactionId}`,
      {
        auth: {
          username: process.env.VITE_RAZOR_KEY_ID,
          password: process.env.VITE_RAZOR_KEY_SECRET,
        },
      }
    );
  } catch (err) {
    console.error("Razorpay API error:", err?.response?.data || err.message);
    return res.status(400).json({
      success: false,
      message: "Unable to verify payment with Razorpay. Please try again.",
    });
  }

  if (paymentDetails.data?.status !== "captured") {
    return res.status(400).json({
      success: false,
      message: "Payment not captured! Contact Admin for support.",
    });
  }

  try {
    const booking = await Booking.findById(_id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Update properties individually
    if (data.BookingEndDateAndTime) {
      booking.BookingEndDateAndTime = data.BookingEndDateAndTime;
    }

    if (!booking.bookingPrice.extendAmount) {
      booking.bookingPrice.extendAmount = [];
    }

    const existingIds = booking.bookingPrice.extendAmount.map((e) => e.id);
    if (!existingIds.includes(data.extendAmount.id)) {
      booking.bookingPrice.extendAmount.push(data.extendAmount);
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
            title: "Booking Extended",
            date: Date.now(),
            paymentAmount: amount || 0,
            endDate: data.BookingEndDateAndTime,
            extended: true,
          },
        ],
      });

      // await sendMessageAfterBooking(booking.bookingId);

      res.json({
        success: true,
        message: "Booking extended successfully",
      });
    } else {
      res.json({
        success: false,
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

const initiateExtendBookingAfterPayment = async (req, res) => {
  const { _id, bookingId, amount, data, createPaymentLink = true } = req.body;

  console.log(_id);
  if (!_id || !bookingId || !amount || !data) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const booking = await Booking.findById(_id);
    if (!booking) {
      return res.status(200).json({ message: "Booking not found" });
    }

    const extendId =
      `extend_${booking.bookingId}_${data.extendAmount.id}` || "";

    if (extendId === "") {
      return res
        .status(200)
        .json({ message: "Unable to create extend id! try again" });
    }

    const razorpayOrder = await createOrderId({
      amount: amount,
      booking_id: bookingId,
      _id: _id,
      type: "extension",
      typeId: extendId,
      requestFrom: "admin",
    });

    await TempExtension.create({
      extendId: extendId,
      bookingId: booking._id || _id,
      userId: booking.userId,
      razorpayOrderId: razorpayOrder.id,
      amount,
      extendData: {
        ...data,
        extendAmount: { ...data.extendAmount, orderId: razorpayOrder.id },
      },
      isCompleted: false,
    });

    const paymentLink = await createPaymentLinkUtil({
      bookingId: _id,
      amount,
      orderId: razorpayOrder.id,
      type: "extension",
      typeId: extendId,
      endDate: data.extendAmount.bookingEndDateAndTime,
      requestFrom: "admin",
    });

    if (paymentLink?.paymentLinkId) {
      res.status(200).json({
        success: true,
        message: "extend request placed",
        timeLine: paymentLink?.timeLineData || null,
      });
    } else {
      res.status(200).json({
        success: false,
        message: "unable to complete extend request! try again",
      });
    }
  } catch (error) {
    console.error("initiateExtendBooking error:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

const updateBooking = async (req, res) => {
  const { BookingStartDateAndTime, BookingEndDateAndTime, _id } = req.body;

  if (!_id || !BookingStartDateAndTime || !BookingEndDateAndTime) {
    return res.status(400).json({
      message: "Missing required fields! try again",
    });
  }

  try {
    const booking = await Booking.findById(_id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const oldStart = booking.BookingStartDateAndTime;
    const oldEnd = booking.BookingEndDateAndTime;
    const newStart = BookingStartDateAndTime;
    const newEnd = BookingEndDateAndTime;

    const isStartUpdate = newStart !== oldStart;
    const isEndUpdate = newEnd !== oldEnd;

    const shouldCheckConflicts =
      (isStartUpdate && newStart < oldStart) ||
      (isEndUpdate && newEnd > oldEnd);

    if (shouldCheckConflicts) {
      const conflict = await Booking.findOne({
        vehicleTableId: booking.vehicleTableId,
        _id: { $ne: booking._id },
        $or: [
          {
            BookingStartDateAndTime: { $lt: newEnd },
            BookingEndDateAndTime: { $gt: newStart },
          },
        ],
      });

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: "The vehicle is already booked during the selected time.",
        });
      }
    }

    // Perform update
    booking.BookingStartDateAndTime = newStart;
    booking.BookingEndDateAndTime = newEnd;
    await booking.save();

    await timelineFunctionServer({
      currentBooking_id: booking._id,
      timeLine: [
        {
          title: "Booking Rescheduled",
          date: Date.now(),
          newStartDate: isStartUpdate ? newStart : "",
          newEndDate: isEndUpdate ? newEnd : "",
        },
      ],
    });

    res.json({
      success: true,
      isStartUpdate,
      isEndUpdate,
    });
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

const editBooking = async (req, res) => {
  const { addOn, totalAddOnPrice, _id } = req.body;

  if (!_id || !addOn) {
    return res.status(400).json({
      message: "Missing required fields! try again",
    });
  }

  try {
    const booking = await Booking.findById(_id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const bookingPrice = booking.bookingPrice;
    addOn.forEach((item) => {
      const exists = bookingPrice.extraAddonDetails.some(
        (existing) => existing._id === item._id
      );

      if (!exists) {
        bookingPrice.extraAddonDetails.push(item);
      }
    });
    bookingPrice.extraAddonPrice += totalAddOnPrice;

    let amount = 0;
    if (!bookingPrice?.isDiscountZero && bookingPrice.discountTotalPrice > 0) {
      bookingPrice.discountTotalPrice += totalAddOnPrice;
      amount = bookingPrice.discountTotalPrice;
    } else {
      bookingPrice.totalPrice += totalAddOnPrice;
      amount = bookingPrice?.totalPrice;
    }

    booking.markModified("bookingPrice");
    await booking.save();

    const timeLineData = {
      currentBooking_id: booking._id,
      timeLine: [
        {
          title: "Booking Updated",
          paymentAmount: amount,
          date: Date.now(),
        },
      ],
    };

    await timelineFunctionServer(timeLineData);

    res.json({
      success: true,
      message: "Booking updated successfully",
      data: bookingPrice,
      timeLineData,
    });
  } catch (error) {
    console.warn("Unable to update booking! try again", error?.message);
    res.json({
      success: false,
      message: "Unable to update booking! try again.",
    });
  }
};

const removeExtendByExtendId = async (extendId) => {
  try {
    const doc = await Timeline.findOne({ "timeLine.extendId": extendId });

    if (!doc) {
      console.log("No timeline entry found with extendId:", extendId);
      return { success: false, message: "No matching document" };
    }

    const result = await Timeline.updateOne(
      { "timeLine.extendId": extendId },
      { $pull: { timeLine: { extendId: extendId } } }
    );

    if (result.modifiedCount > 0) {
      console.log("Successfully removed extend entry from timeLine");
      return { success: true };
    } else {
      console.log("Extend ID found, but entry was not removed");
      return { success: false };
    }
  } catch (error) {
    console.error("Error removing extend entry:", error);
    return { success: false, error };
  }
};

const deleteBooking = async (req, res) => {
  const { bookingId, userId, type, typeId } = req.body;

  if (!bookingId && !userId) {
    return res.status(400).json({ message: "Booking ID is required" });
  }

  try {
    if (type === "extend" && typeId && Number(typeId) != 0) {
      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return res
          .status(404)
          .json({ success: false, message: "Booking not found" });
      }

      const extendArray = booking.bookingPrice.extendAmount || [];

      const index = extendArray.findIndex((item) => item.id === Number(typeId));

      if (index === -1) {
        return res
          .status(404)
          .json({ success: false, message: "Extend item not found" });
      }

      const { extendId, originalBookingEndDateAndTime } = extendArray[index];
      extendArray.splice(index, 1);

      if (originalBookingEndDateAndTime) {
        booking.BookingEndDateAndTime = originalBookingEndDateAndTime;
      }

      if (
        !booking.bookingPrice.extendAmount ||
        booking.bookingPrice.extendAmount?.length === 0
      ) {
        booking.bookingStatus = "done";
      }

      booking.markModified("bookingPrice");

      // Save updated booking
      await booking.save();

      if (extendId) {
        await removeExtendByExtendId(extendId);
      }

      return res.status(200).json({
        message: "Extend entry and related timeline deleted",
        success: true,
      });
    }

    const deletedBooking = await Booking.findByIdAndDelete(bookingId);

    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (bookingId) {
      await Timeline.deleteMany({ currentBooking_id: bookingId });
    }

    res.status(200).json({
      message: "Booking and timeline deleted successfully",
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
  extendBooking,
  initiateExtendBooking,
  initiateExtendBookingAfterPayment,
  editBooking,
  updateBooking,
  deleteBooking,
};
