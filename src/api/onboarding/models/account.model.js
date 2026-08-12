const bcrypt = require("bcrypt");
require("dotenv").config();
const { mongoose } = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
// const { Auth } = require("two-step-auth");
const User = require("../../../db/schemas/onboarding/user.schema");
const Booking = require("../../../db/schemas/onboarding/booking.schema");
const Vehicle = require("../../../db/schemas/onboarding/vehicle.schema");
const Document = require("../../../db/schemas/onboarding/DocumentUpload.Schema");
const Station = require("../../../db/schemas/onboarding/station.schema");
const {
  contactValidation,
  emailValidation,
  convertTo24Hour,
} = require("../../../constant");
const { whatsappMessage } = require("../../../utils/whatsappMessage");
const { sendOtpByEmail } = require("../../../utils/emailSend");

async function updateUser({
  _id,
  userType,
  firstName,
  contact,
  lastName,
  email,
}) {
  const o = { status: 200, message: "data fetched successfully", data: [] };
  try {
    const result = await User.findOne({ _id: ObjectId(_id) });
    if (result) {
      const obj = {
        userType: userType ? userType : "USER",
        firstName: firstName ? firstName : "",
        lastName: lastName ? lastName : "",
        contact: contact ? contact : "",
        email: email ? email : "",
      };
      await User.updateOne(
        { _id: ObjectId(_id) },
        {
          $set: obj,
        },
        { new: true },
      );
      o.message = "user updated successfully";
    } else {
      ((o.message = "Invalid details"), (o.status = "401"));
    }
    return "Updated Successfully";
  } catch (error) {
    throw new Error(error);
  }
}

async function addOrUpdateMobileToken({ _id, token }) {
  const o = {
    status: 200,
    success: true,
    message: "data fetched successfully",
    data: [],
  };
  try {
    if (!token || !token.trim()) {
      o.status = 400;
      o.message = "Token is required";
      return o;
    }

    const user = await User.findOne({ _id: ObjectId(_id) });

    if (!user) {
      o.status = 401;
      o.success = false;
      o.message = "Invalid user ID";
      return o;
    }

    if (user.mobileToken === token) {
      o.message = "Token already up-to-date";
      return o;
    }

    await User.updateOne(
      { _id: ObjectId(_id) },
      {
        $set: {
          mobileToken: token,
        },
      },
    );

    o.message = "Token updated successfully";
    return o;
  } catch (error) {
    throw new Error(error);
  }
}

const getAllUsers = async (query) => {
  const obj = {
    status: 200,
    message: "Data fetched successfully",
    data: [],
  };

  const { _id } = query;

  if (!_id) {
    obj.status = 400;
    obj.message = "User ID is required";
    return obj;
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      obj.status = 400;
      obj.message = "Invalid User ID";
      return obj;
    }

    const user = await User.findById(_id).select("-otp -password");

    if (!user) {
      obj.status = 404;
      obj.message = "User not found";
      return obj;
    }

    if (user.userType !== "customer") {
      obj.status = 403;
      obj.message = "Unauthorized";
      return obj;
    }

    const documents = await Document.find({ userId: user._id });
    let userWithDocs = {
      ...user.toObject(),
      documents: documents[0]?.files || [],
    };

    obj.data = [userWithDocs];
    return obj;
  } catch (error) {
    console.error("Error fetching users:", error.message);
    obj.status = 500;
    obj.message = `Server error: ${error.message}`;
  }

  return obj;
};

const getAllUsersAdmin = async (query) => {
  const obj = {
    status: 200,
    message: "Data fetched successfully",
    data: [],
    pagination: {},
  };

  try {
    const {
      _id,
      userType,
      firstName,
      lastName,
      email,
      contact,
      search,
      status,
      kycApproved,
      isEmailVerified,
      isContactVerified,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = query;

    // Validate and normalize inputs
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    if (isNaN(pageNumber) || pageNumber <= 0) {
      throw new Error("Invalid 'page' parameter");
    }
    if (isNaN(pageSize) || pageSize <= 0) {
      throw new Error("Invalid 'limit' parameter");
    }

    const filter = {};
    if (_id) {
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        throw new Error("Invalid '_id' format");
      }
      filter._id = mongoose.Types.ObjectId(_id);
    }
    if (firstName) filter.firstName = firstName;
    if (lastName) filter.lastName = lastName;
    if (email) filter.email = email;
    if (contact) filter.contact = contact;
    if (userType) filter.userType = userType;
    if (kycApproved) filter.kycApproved = kycApproved;
    if (isEmailVerified) filter.isEmailVerified = isEmailVerified;
    if (isContactVerified) filter.isContactVerified = isContactVerified;
    if (status) filter.status = status;

    // Handle search functionality
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { contact: { $regex: search, $options: "i" } },
        { userType: { $regex: search, $options: "i" } },
        { isDocumentVerified: { $regex: search, $options: "i" } },
        { isContactVerified: { $regex: search, $options: "i" } },
        { isEmailVerified: { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
        { kycApproved: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sortFields = ["createdAt", "firstName", "lastName", "email"];
    const sort = {};
    sort[sortBy] = sortFields.includes(sortBy)
      ? order === "asc"
        ? 1
        : -1
      : -1;

    // Pagination logic
    const skip = (pageNumber - 1) * pageSize;
    const totalRecords = await User.count(filter);

    // Fetch users with pagination and sorting
    const users = await User.find(filter, { otp: 0, password: 0 })
      .sort(sort)
      .skip(skip)
      .limit(pageSize);

    if (_id) {
      const user = await User.findById(_id).select("-otp -password");
      if (!user) {
        obj.status = 404;
        obj.message = "User not found";
        return obj;
      }

      const documents = await Document.find({ userId: user._id });
      let userWithDocs = {
        ...user.toObject(),
        documents: documents[0]?.files || [],
      };

      if (user.userType === "manager") {
        const station = await Station.find({ userId: user._id });

        userWithDocs = {
          ...userWithDocs,
          station: station || null,
        };
      }

      obj.data = [userWithDocs];
      obj.pagination = {
        totalPages: 1,
        currentPage: 1,
        limit: 1,
      };
      return obj;
    }

    if (users.length === 0) {
      obj.status = 404;
      obj.message = "No data found";
      return obj;
    }

    // Prepare response
    obj.data = users;
    obj.pagination = {
      totalPages: Math.ceil(totalRecords / pageSize),
      currentPage: pageNumber,
      limit,
    };
  } catch (error) {
    console.error("Error fetching users:", error.message);
    obj.status = 500;
    obj.message = `Server error: ${error.message}`;
  }

  return obj;
};

const updateStationInfo = async (query) => {
  try {
    const {
      _id,
      openStartTime,
      openEndTime,
      weekendPriceIncrease,
      weekendPercentage,
    } = query;

    if (!_id) {
      console.log(_id);
      return {
        success: false,
        message: "Station id not found!",
      };
    }

    const updateFields = {};

    if (openStartTime !== undefined)
      updateFields.openStartTime = convertTo24Hour(openStartTime);
    if (openEndTime !== undefined)
      updateFields.openEndTime = convertTo24Hour(openEndTime);
    if (weekendPriceIncrease !== undefined)
      updateFields.weekendPriceIncrease = weekendPriceIncrease;
    if (weekendPercentage !== undefined)
      updateFields.weekendPercentage = Number(weekendPercentage);

    const updatedStation = await Station.findOneAndUpdate(
      { _id },
      { $set: updateFields },
      { new: true },
    );

    return {
      success: true,
      message: "Station info updated successfully",
      data: updatedStation,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Error updating station info",
      error: error.message,
    };
  }
};

async function getAllDataCount(query) {
  try {
    const obj = { status: 200, message: "Data fetched successfully", data: {} };
    const { stationId, month, year } = query;
    const matchFilter = {};

    // Apply stationId if present
    if (stationId) matchFilter.stationId = stationId;

    let dateRange = null;

    if (month && year) {
      const monthMap = {
        january: 1,
        february: 2,
        march: 3,
        april: 4,
        may: 5,
        june: 6,
        july: 7,
        august: 8,
        september: 9,
        october: 10,
        november: 11,
        december: 12,
      };
      const monthNum = monthMap[month.toLowerCase()];
      const yearNum = parseInt(year);

      if (monthNum && !isNaN(yearNum)) {
        dateRange = {
          start: new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0)),
          end: new Date(Date.UTC(yearNum, monthNum, 1, 0, 0, 0)), // exclusive upper bound
        };
      }
    }

    // Filter 1: bookings actually CREATED in this period (for bookingsCount, cancelBookingsCount)
    const createdFilter = { ...matchFilter };
    if (dateRange) {
      createdFilter.createdAt = { $gte: dateRange.start, $lt: dateRange.end };
    }

    // Filter 2: bookings with MONEY MOVEMENT in this period — created this period,
    // OR extended this period, OR had a vehicle-change diff paid this period.
    const revenueFilter = { ...matchFilter };
    if (dateRange) {
      revenueFilter.$and = [
        { ...matchFilter },
        {
          $or: [
            {
              $or: [
                {
                  paymentInitiatedDate: {
                    $gte: dateRange.start.getTime(),
                    $lt: dateRange.end.getTime(),
                  },
                },
                {
                  paymentInitiatedDate: {
                    $gte: Math.floor(dateRange.start.getTime() / 1000),
                    $lt: Math.floor(dateRange.end.getTime() / 1000),
                  },
                },
              ],
            },
            {
              "bookingPrice.extendAmount": {
                $elemMatch: {
                  status: "paid",
                  paymentDate: { $gte: dateRange.start, $lt: dateRange.end },
                },
              },
            },
            {
              "bookingPrice.extendAmount": {
                $elemMatch: {
                  status: "paid",
                  paymentSuccessDate: {
                    $gte: dateRange.start.getTime(),
                    $lt: dateRange.end.getTime(),
                  },
                },
              },
            },
            {
              "bookingPrice.extendAmount": {
                $elemMatch: {
                  status: "paid",
                  paymentInitiatedDate: {
                    $gte: dateRange.start.getTime(),
                    $lt: dateRange.end.getTime(),
                  },
                },
              },
            },
            {
              "bookingPrice.diffAmount": {
                $elemMatch: {
                  status: "paid",
                  paymentInitiatedDate: {
                    $gte: dateRange.start.getTime(),
                    $lt: dateRange.end.getTime(),
                  },
                },
              },
            },
          ],
        },
      ];
    }

    const createdBookings = await Booking.find(createdFilter);
    const revenueBookings = await Booking.find(revenueFilter);

    const cancelBookings = createdBookings.filter((booking) =>
      booking.bookingStatus?.toLowerCase().includes("cancel"),
    );
    const nonCancelledBookings = createdBookings.filter(
      (booking) => !booking.bookingStatus?.toLowerCase().includes("cancel"),
    );

    const payOnPickupCount = nonCancelledBookings.filter(
      (b) =>
        b.bookingPrice?.payOnPickupMethod !== undefined &&
        b.bookingPrice?.payOnPickupMethod !== null,
    ).length;

    const amountLeftObjectCount = nonCancelledBookings.filter(
      (b) =>
        b.bookingPrice?.AmountLeftAfterUserPaid &&
        typeof b.bookingPrice.AmountLeftAfterUserPaid === "object" &&
        !Array.isArray(b.bookingPrice.AmountLeftAfterUserPaid) &&
        b.bookingPrice.AmountLeftAfterUserPaid?.status === "paid",
    ).length;

    // FIXED: Calculate total amount including extend bookings properly
    const amount = revenueBookings.reduce(
      (acc, item) => {
        if (
          item.bookingStatus?.toLowerCase().includes("cancel") ||
          item.bookingStatus === "pending"
        )
          return acc;

        const bp = item.bookingPrice;
        const rawPaymentDate = item.paymentInitiatedDate || null;
        let paymentInitiatedDateMs = null;
        if (rawPaymentDate) {
          const ts = Number(rawPaymentDate);
          if (!isNaN(ts)) {
            paymentInitiatedDateMs = ts < 1e12 ? ts * 1000 : ts; // normalize seconds → ms
          }
        }
        const paidInRange =
          !dateRange ||
          (paymentInitiatedDateMs &&
            paymentInitiatedDateMs >= dateRange.start.getTime() &&
            paymentInitiatedDateMs < dateRange.end.getTime());

        // ─── BASE PRICE — only counts if the booking was actually created in this period
        let basePrice = 0;
        if (paidInRange) {
          const payInitFrom = item.payInitFrom || "";
          const paySuccessId = item.paySuccessId || "";

          const rideStatus = item.rideStatus || "";

          const isPaymentVerified =
            payInitFrom?.toLowerCase() === "cash"
              ? ["ongoing", "completed"].includes(rideStatus?.toLowerCase()) // cash only if ride actually started or done
              : paySuccessId !== "" && paySuccessId?.toLowerCase() !== "na";

          if (isPaymentVerified) {
            const fullPrice =
              bp.isDiscountZero === true ||
              (bp.discountTotalPrice && bp.discountTotalPrice > 0)
                ? Number(bp.discountTotalPrice) || 0
                : Number(bp.totalPrice) || 0;

            if (item.paymentStatus === "paid") {
              basePrice = fullPrice;
            } else if (
              item.paymentStatus === "partiallyPay" ||
              item.paymentStatus === "partially_paid"
            ) {
              if (bp.AmountLeftAfterUserPaid?.status === "paid") {
                basePrice = fullPrice;
              } else {
                basePrice = Number(bp.userPaid) || 0;
              }
            }
          }
        }

        // ─── EXTEND BOOKING — only count entries actually paid within this period
        let extendTotal = 0;
        let extendCount = 0;
        if (Array.isArray(bp.extendAmount)) {
          bp.extendAmount.forEach((extend) => {
            if (extend.status !== "paid") return;

            // fallback to paymentInitiatedDate (unix ms) or paymentSuccessDate if paymentDate missing
            const extendPaymentDate = extend.paymentDate
              ? new Date(extend.paymentDate)
              : extend.paymentSuccessDate
                ? new Date(extend.paymentSuccessDate)
                : extend.paymentInitiatedDate
                  ? new Date(extend.paymentInitiatedDate)
                  : null;

            const paidInRange =
              !dateRange ||
              (extendPaymentDate &&
                extendPaymentDate >= dateRange.start &&
                extendPaymentDate < dateRange.end);

            if (paidInRange) {
              extendTotal +=
                (Number(extend.amount) || 0) +
                // (Number(extend.addOnAmount) || 0) +
                (Number(extend.tax) || 0) +
                (Number(extend.addonTax) || 0);
              extendCount += 1;
            }
          });
        }

        // ─── VEHICLE CHANGE DIFF — only count entries paid within this period
        const diffTotal = Array.isArray(bp.diffAmount)
          ? bp.diffAmount.reduce((sum, d) => {
              if (d.status !== "paid") return sum;
              const paidInRange =
                !dateRange ||
                (d.paymentInitiatedDate &&
                  d.paymentInitiatedDate >= dateRange.start.getTime() &&
                  d.paymentInitiatedDate < dateRange.end.getTime());
              // const rawAmount = d?.amount ? Number(d.amount) : 0;
              // return paidInRange ? sum + rawAmount : sum;
              const rawAmount = Number(d?.amount) || 0;
              const rawRefund = Number(d?.refundAmount) || 0;
              return paidInRange ? sum + rawAmount - rawRefund : sum;
            }, 0)
          : 0;

        // ─── LATE FEES — no independent payment date exists on this field today,
        // so it's still tied to the booking's createdAt window (see note below).
        const lateFeeTotal = paidInRange
          ? (Number(bp.lateFeeBasedOnHour) > 0
              ? Number(bp.lateFeeBasedOnHour)
              : 0) +
            (Number(bp.lateFeeBasedOnKM) > 0 ? Number(bp.lateFeeBasedOnKM) : 0)
          : 0;

        // ─── ADDITIONAL FEES — same caveat as late fees
        const additionalFeeTotal =
          paidInRange &&
          bp.additionFeePaymentMethod &&
          bp.additionFeePaymentMethod !== "NA"
            ? Number(bp.additionalPrice) || 0
            : 0;

        return {
          total:
            acc.total +
            basePrice +
            extendTotal +
            diffTotal +
            lateFeeTotal +
            additionalFeeTotal,
          extendCount: acc.extendCount + extendCount,
        };
      },
      { total: 0, extendCount: 0 },
    );

    const extendBookingCount = amount.extendCount;
    const Amount = amount.total;
    const cancelBookingsCount = cancelBookings.length;

    const bookingsCount = await Booking.countDocuments(createdFilter);

    obj.data = {
      bookingsCount,
      cancelBookingsCount,
      extendBookingCount,
      CashPaymentReceivedCount: payOnPickupCount + amountLeftObjectCount,
      Amount,
    };

    return obj;
  } catch (error) {
    return {
      status: 500,
      message: "An error occurred",
      error: error.message,
    };
  }
}

async function getTransactionReport(req, res) {
  const { userType } = req.user;

  if (userType !== "admin")
    return res.json({ status: 401, message: "Not authorized" });

  const { stationId, date, startDate, endDate } = req.query;

  if (!date && !startDate)
    return res.json({ status: 400, message: "date or startDate is required" });

  try {
    const toISTDayStart = (dateStr) =>
      new Date(dateStr + "T00:00:00.000+05:30");
    const toISTDayEnd = (dateStr) => new Date(dateStr + "T23:59:59.999+05:30");

    const dayStart = startDate ? toISTDayStart(startDate) : toISTDayStart(date);
    const dayEnd = endDate ? toISTDayEnd(endDate) : toISTDayEnd(date);

    const filter = {};
    if (stationId) filter.stationId = stationId;

    filter.$and = [
      { ...(stationId ? { stationId } : {}) },
      {
        $or: [
          { createdAt: { $gte: dayStart, $lt: dayEnd } },
          {
            "bookingPrice.extendAmount": {
              $elemMatch: {
                status: "paid",
                paymentDate: { $gte: dayStart, $lt: dayEnd },
              },
            },
          },
          {
            "bookingPrice.extendAmount": {
              $elemMatch: {
                status: "paid",
                paymentSuccessDate: {
                  $gte: dayStart.getTime(),
                  $lt: dayEnd.getTime(),
                },
              },
            },
          },
          {
            "bookingPrice.extendAmount": {
              $elemMatch: {
                status: "paid",
                paymentInitiatedDate: {
                  $gte: dayStart.getTime(),
                  $lt: dayEnd.getTime(),
                },
              },
            },
          },
          {
            "bookingPrice.diffAmount": {
              $elemMatch: {
                status: "paid",
                paymentInitiatedDate: {
                  $gte: dayStart.getTime(),
                  $lt: dayEnd.getTime(),
                },
              },
            },
          },
        ],
      },
    ];

    filter.bookingStatus = { $not: /cancel/i };

    const bookings = await Booking.find(filter).populate(
      "userId",
      "firstName lastName contact email",
    );

    const rows = [];

    bookings.forEach((item) => {
      const bp = item.bookingPrice;
      const customer = item.userId;
      const customerName = customer
        ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim()
        : "N/A";

      const commonFields = {
        stationName: item.stationName || "",
        stationId: item.stationId || "",
        vehicleName: item.vehicleName || "",
        vehicleBrand: item.vehicleBrand || "",
        vehicleNumber: item.vehicleBasic?.vehicleNumber || "",
        bookingStartDate: item.BookingStartDateAndTime
          ? new Date(item.BookingStartDateAndTime).toLocaleString("en-GB", {
              timeZone: "UTC",
            })
          : "",
        bookingEndDate: item.BookingEndDateAndTime
          ? new Date(item.BookingEndDateAndTime).toLocaleString("en-GB", {
              timeZone: "UTC",
            })
          : "",
        customerName,
        customerEmail: customer?.email || "",
        customerPhone: customer?.contact || "",
      };

      // base booking
      const createdInRange =
        item.createdAt >= dayStart && item.createdAt < dayEnd;

      if (createdInRange) {
        const payInitFrom = item.payInitFrom || "";
        const paySuccessId = item.paySuccessId || "";
        const rideStatus = item.rideStatus || "";

        const isPaymentVerified =
          payInitFrom?.toLowerCase() === "cash"
            ? ["ongoing", "completed"].includes(rideStatus?.toLowerCase())
            : paySuccessId !== "" && paySuccessId?.toLowerCase() !== "na";

        if (isPaymentVerified) {
          const fullPrice =
            bp.isDiscountZero === true ||
            (bp.discountTotalPrice && bp.discountTotalPrice > 0)
              ? Number(bp.discountTotalPrice) || 0
              : Number(bp.totalPrice) || 0;

          let amount = 0;
          if (item.paymentStatus === "paid") {
            amount = fullPrice;
          } else if (
            item.paymentStatus === "partiallyPay" ||
            item.paymentStatus === "partially_paid"
          ) {
            amount =
              bp.AmountLeftAfterUserPaid?.status === "paid"
                ? fullPrice
                : Number(bp.userPaid) || 0;
          }

          const lateFee =
            bp.lateFeePaymentMethod && bp.lateFeePaymentMethod !== "NA"
              ? (Number(bp.lateFeeBasedOnHour) || 0) +
                (Number(bp.lateFeeBasedOnKM) || 0)
              : 0;

          const additionalFee =
            bp.additionFeePaymentMethod && bp.additionFeePaymentMethod !== "NA"
              ? Number(bp.additionalPrice) || 0
              : 0;

          const totalAmount = amount + lateFee + additionalFee;

          if (totalAmount > 0) {
            rows.push({
              ...commonFields,
              bookingId: item.bookingId,
              transactionType: "Main Booking",
              amount: totalAmount,
              lateFee,
              additionalFee,
              paymentMethod: payInitFrom,
              paymentStatus: item.paymentStatus,
              paySuccessId: item.paySuccessId || "",
              orderId: item.payment_order_id || "",
              rrnNumber: item.bookingPrice?.rrnNumber || "",
              transactionDate: new Date(item.createdAt).toLocaleString(
                "en-GB",
                { timeZone: "Asia/Kolkata" },
              ),
            });
          }
        }
      }

      // extensions
      if (Array.isArray(bp.extendAmount)) {
        bp.extendAmount.forEach((extend) => {
          if (extend.status !== "paid") return;

          const extendDateRaw = extend.paymentDate
            ? new Date(extend.paymentDate)
            : extend.paymentSuccessDate
              ? new Date(extend.paymentSuccessDate)
              : extend.paymentInitiatedDate
                ? new Date(extend.paymentInitiatedDate)
                : null;

          if (!extendDateRaw) return;

          const inRange = extendDateRaw >= dayStart && extendDateRaw < dayEnd;
          if (!inRange) return;

          rows.push({
            ...commonFields,
            bookingStartDate: extend.BookingStartDateAndTime
              ? new Date(extend.BookingStartDateAndTime).toLocaleString(
                  "en-GB",
                  { timeZone: "UTC" },
                )
              : commonFields.bookingStartDate,
            bookingEndDate: extend.bookingEndDateAndTime
              ? new Date(extend.bookingEndDateAndTime).toLocaleString("en-GB", {
                  timeZone: "UTC",
                })
              : commonFields.bookingEndDate,
            bookingId: `${item.bookingId}_ext_${extend.id}`,
            transactionType: "Extension",
            amount:
              (Number(extend.amount) || 0) +
              (Number(extend.tax) || 0) +
              (Number(extend.addonTax) || 0),
            lateFee: 0,
            additionalFee: 0,
            paymentMethod: extend.paymentMethod || "online",
            paymentStatus: extend.status,
            paySuccessId: extend.transactionId || "",
            orderId: extend.orderId || "",
            rrnNumber: extend.rrnNumber || "",
            transactionDate: extendDateRaw.toLocaleString("en-GB", {
              timeZone: "Asia/Kolkata",
            }),
          });
        });
      }

      // diff
      if (Array.isArray(bp.diffAmount)) {
        bp.diffAmount.forEach((diff) => {
          if (diff.status !== "paid" || !diff.paymentInitiatedDate) return;

          const paidDate = new Date(diff.paymentInitiatedDate);
          const inRange = paidDate >= dayStart && paidDate < dayEnd;
          if (!inRange) return;

          const netAmount =
            (Number(diff.amount) || 0) - (Number(diff.refundAmount) || 0);

          rows.push({
            ...commonFields,
            bookingId: `${item.bookingId}_chan_${diff.id}`,
            transactionType: "Vehicle Change",
            amount: netAmount,
            lateFee: 0,
            additionalFee: 0,
            paymentMethod: diff.paymentMethod || "online",
            paymentStatus: diff.status,
            paySuccessId: diff.transactionId || "",
            orderId: diff.orderId || "",
            rrnNumber: diff.rrnNumber || "",
            transactionDate: paidDate.toLocaleString("en-GB", {
              timeZone: "Asia/Kolkata",
            }),
          });
        });
      }
    });

    // sort by transaction date desc
    rows.sort(
      (a, b) => new Date(b.transactionDate) - new Date(a.transactionDate),
    );

    const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0);

    return res.json({
      status: 200,
      message: "Report data fetched successfully",
      data: {
        startDate: dayStart.toLocaleDateString("en-GB", {
          timeZone: "Asia/Kolkata",
        }),
        endDate: dayEnd.toLocaleDateString("en-GB", {
          timeZone: "Asia/Kolkata",
        }),
        totalTransactions: rows.length,
        totalAmount,
        rows,
      },
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: "An error occurred",
      error: error.message,
    });
  }
}

async function saveUser(userData) {
  const {
    _id,
    userType = "customer",
    status = "active",
    altContact,
    firstName,
    lastName,
    contact,
    email,
    password,
    deleteRec,
    kycApproved = "no",
    isEmailVerified = "no",
    isContactVerified = "no",
    isDocumentVerified = "no",
    drivingLicence,
    idProof,
    addressProof,
    dateofbirth = "Na",
    gender,
    otp,
  } = userData;

  const response = {
    status: 200,
    message: "Data processed successfully",
    data: [],
  };
  //console.log(userData)

  function isAtLeast18(dob) {
    const dobDate = new Date(dob); // Parse the DOB string into a Date object
    const today = new Date();

    // Calculate the difference in years
    const age = today.getFullYear() - dobDate.getFullYear();

    // Adjust if the birth date has not yet occurred this year
    const hasHadBirthdayThisYear =
      today.getMonth() > dobDate.getMonth() ||
      (today.getMonth() === dobDate.getMonth() &&
        today.getDate() >= dobDate.getDate());

    return hasHadBirthdayThisYear ? age >= 18 : age - 1 >= 18;
  }

  try {
    const validateId = (id) => id && id.length === 24;
    const isValidContact = (number) => contactValidation(number);
    const isValidEmail = (email) => emailValidation(email);
    const isValidEnum = (value, validList) => validList.includes(value);

    if (_id && !validateId(_id)) {
      return { status: 400, message: "Invalid _id" };
    }
    if (!_id) {
      if (userType == "manager" || userType == "admin") {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return { status: 409, message: "This email  already exists" };
        }
      }
    }

    if (contact) {
      if (!isValidContact(contact)) {
        return { status: 400, message: "Invalid phone number" };
      }
      if (!_id) {
        const existingUser = await User.findOne({ contact });
        // const existingUser = await User.findOne({
        //   $or: [{ contact }, { altContact: contact }],
        // });
        if (existingUser) {
          return { status: 409, message: "This contact number already exists" };
        }
      }
    }

    if (altContact) {
      if (!isValidContact(altContact)) {
        return { status: 400, message: "Invalid alternative contact number" };
      }
      if (contact && altContact === contact) {
        return {
          status: 400,
          message:
            "Alternate contact should not be the same as primary contact.",
        };
      }
      if (!_id) {
        const existingAltUser = await User.findOne({ contact: altContact });
        if (existingAltUser) {
          return {
            status: 409,
            message: "This contact number already exists",
          };
        }
      }
    }

    // if (altContact && !isValidContact(altContact)) {
    //   return { status: 400, message: "Invalid alternative contact number" };
    // }

    const validUserTypes = ["manager", "customer", "admin"];
    if (!isValidEnum(userType, validUserTypes)) {
      return { status: 400, message: "Invalid user type" };
    }

    if ((userType === "admin" || userType === "manager") && !password && !_id) {
      return {
        status: 400,
        message: "Password is required for admin or manager",
      };
    }

    const validStatuses = ["active", "inactive"];
    if (!isValidEnum(status, validStatuses)) {
      return { status: 400, message: "Invalid user status" };
    }

    const validKycStatuses = ["yes", "no"];
    if (!isValidEnum(kycApproved, validKycStatuses)) {
      return { status: 400, message: "Invalid KYC approval status" };
    }
    if (!isValidEnum(isEmailVerified, validKycStatuses)) {
      return { status: 400, message: "Invalid email verification status" };
    }
    if (!isValidEnum(isContactVerified, validKycStatuses)) {
      return { status: 400, message: "Invalid contact verification status" };
    }

    if (email && !isValidEmail(email)) {
      return { status: 400, message: "Invalid email address" };
    }

    const userObj = {
      addressProof,
      drivingLicence,
      idProof,
      isContactVerified,
      isEmailVerified,
      isDocumentVerified,
      kycApproved,
      userType,
      status,
      altContact,
      firstName,
      lastName,
      contact,
      email,
      password,
      dateofbirth,
      gender,
    };
    if (password) {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
      if (!passwordRegex.test(password)) {
        return {
          status: 400,
          message:
            "Password must be 8–20 chars, with uppercase, lowercase, number & special.",
        };
      }
      userObj.password = bcrypt.hashSync(password, 8);
    }
    // Handle user update or creation
    if (_id) {
      const existingUser = await User.findById(_id);
      if (!existingUser) {
        return { status: 404, message: "User not found" };
      }

      if (deleteRec) {
        await User.findByIdAndDelete(_id);
        return {
          status: 200,
          message: "User deleted successfully.",
          data: { _id },
        };
      }

      if (userType !== "admin") {
        if (!userObj.altContact || userObj.altContact === "") {
          return { status: 400, message: "AltContact is required." };
        }

        const existingAltUser = await User.findOne({
          contact: userObj.altContact,
        });
        if (existingAltUser) {
          return {
            status: 409,
            message: "This contact number already exists",
          };
        }

        if (userObj.altContact === existingUser.contact) {
          return {
            status: 400,
            message:
              "Alternate contact should not be the same as primary contact.",
          };
        }

        if (userObj.dateofbirth && !isAtLeast18(userObj.dateofbirth)) {
          return { status: 400, message: "User should be 18 or older." };
        }
      }

      if (userType !== "admin" && userType !== "manager") {
        if (userObj.dateofbirth && !isAtLeast18(userObj.dateofbirth)) {
          return { status: 400, message: "User should be 18 or older." };
        }
      }

      Object.keys(userObj).forEach((key) => {
        if (
          userObj[key] === undefined ||
          userObj[key] === null ||
          userObj[key] === ""
        ) {
          delete userObj[key];
        }
      });

      const updateQuery = {
        $set: userObj,
      };

      if (
        userObj.addressProof &&
        existingUser.addressProof &&
        userObj.addressProof !== existingUser.addressProof
      ) {
        updateQuery.$push = {
          addresses: existingUser.addressProof,
        };
      }

      // const data = await User.findByIdAndUpdate(
      //   _id,
      //   { $set: userObj },
      //   { new: true },
      // );
      const data = await User.findByIdAndUpdate(_id, updateQuery, {
        new: true,
      });

      return { status: 200, message: "User updated successfully", data: data };
    } else {
      if (!firstName || !lastName || !contact || !email) {
        return { status: 400, message: "Missing required fields for new user" };
      }

      //const name = firstName + lastName;
      const newUser = new User(userObj);
      await newUser.save();
      whatsappMessage([contact], "welcome_customer", [firstName]);
      sendOtpByEmail(email, firstName, lastName);
      return {
        status: 200,
        message: "User created successfully",
        data: newUser.toObject(),
      };
    }
  } catch (error) {
    console.error("Error in saveUser:", error.message);
    return { status: 500, message: "Internal server error" };
  }
}

async function updateImage(req) {
  const obj = { status: 200, message: "image updated successfully", data: "" };
  console.log(req.file);
  const url = req.protocol + "://" + req.get("host");
  obj.data = url + "/public/" + req.file.filename;
  return obj;
}

async function getUserProfile(userId) {
  const obj = { status: 200, message: "data fetched successfully", data: [] };
  try {
    const result = await User.findOne(
      { _id: ObjectId(userId) },
      {
        name: 1,
        contact: 1,
        profileImage: 1,
        userName: 1,
        status: 1,
        gender: 1,
        dob: 1,
      },
    );
    if (result) {
      obj.data = result;
    } else {
      obj.status = 401;
      obj.message = "data not found";
    }
    return obj;
  } catch (error) {
    throw new Error(error);
  }
}

async function getUserByContact(body) {
  const obj = { status: 200, message: "data fetched successfully", data: [] };
  const { contact, userType } = body;
  const o = { contact };
  o.userType = "USER";
  if (userType) {
    o.userType = userType;
  }
  try {
    const result = await User.findOne({ ...o });
    if (result) {
      const findBookings = await Booking.find({ contact });
      obj.data = result._doc;
      if (findBookings && findBookings.length) {
        let arr = [];
        for (let i = 0; i < findBookings.length; i++) {
          const o = findBookings[i];
          const vehicleData = await Vehicle.findOne({
            _id: ObjectId(o.vehicleId),
          });
          arr.push({ bookingData: o, vehicleData: vehicleData });
        }
        obj.data = { ...obj.data, bookings: arr };
      }
    } else {
      obj.status = 401;
      obj.message = "data not found";
    }
    return obj;
  } catch (error) {
    throw new Error(error);
  }
}

async function searchUser(data) {
  let obj = { status: 200, message: "data fetched successfully", data: [] };
  try {
    const { email, Contact } = data;
    let colName = "Contact";
    let val = Contact;
    if (email) {
      colName = "email";
      val = email;
    }
    const result = await User.find({
      [colName]: { $regex: ".*" + val + ".*" },
    });
    if (result) {
      obj.data = result;
    } else {
      obj.status = 401;
      obj.message = "data not found";
    }
    return obj;
  } catch (error) {
    throw new Error(error);
  }
}

module.exports = {
  getAllDataCount,
  getTransactionReport,
  getAllUsers,
  getAllUsersAdmin,
  updateUser,
  saveUser,
  getUserProfile,
  searchUser,
  updateImage,
  getUserByContact,
  addOrUpdateMobileToken,
  updateStationInfo,
};
