const Booking = require("../../../db/schemas/onboarding/booking.schema.js");
const General = require("../../../db/schemas/onboarding/general.schema.js");
const Log = require("../../../api/onboarding/models/Logs.model.js");
const station = require("../../../db/schemas/onboarding/station.schema.js");
const pickupImage = require("../../../db/schemas/onboarding/pickupImageUpload.js");

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

module.exports = { getBookings, getBooking };
