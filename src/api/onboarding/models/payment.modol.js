const Booking = require("../../../db/schemas/onboarding/booking.schema");

const getSortTime = (paymentInitiatedDate, updatedAt, createdAt) => {
  if (paymentInitiatedDate) {
    let ts = Number(paymentInitiatedDate);

    if (!Number.isNaN(ts)) {
      if (ts < 1e12) ts *= 1000;
      return ts;
    }
  }

  if (updatedAt) return new Date(updatedAt).getTime();
  if (createdAt) return new Date(createdAt).getTime();

  return 0;
};

const paymentRec = async (req, res) => {
  try {
    const {
      bookingId,
      email,
      paymentStatus,
      paymentMethod,
      search,
      stationId,
      transactionType,
      page = 1,
      limit = 10,
      sortOrder = "desc",
    } = req.query;

    const filters = {};
    if (bookingId) filters.bookingId = bookingId;
    if (email) filters.email = email;
    if (paymentStatus) filters.paymentStatus = paymentStatus;
    if (paymentMethod) filters.paymentMethod = paymentMethod;
    if (stationId) filters.stationId = stationId;

    const skip = (page - 1) * limit;

    // Fetch bookings
    const bookings = await Booking.find(filters, {
      userId: 1,
      bookingId: 1,
      bookingPrice: 1,
      payInitFrom: 1,
      payment_order_id: 1,
      paySuccessId: 1,
      payment_type: 1,
      paymentgatewayOrderId: 1,
      paymentStatus: 1,
      paymentMethod: 1,
      paymentInitiatedDate: 1,
      createdAt: 1,
      updatedAt: 1,
    })
      .populate("userId", "firstName lastName contact email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    if (!bookings || bookings.length === 0) {
      return res.json({
        status: 404,
        message: "No bookings found.",
        data: [],
      });
    }

    let transactions = [];

    bookings.forEach((booking) => {
      const isDiscountApplied =
        booking.bookingPrice.discountTotalPrice > 0 ?? false;
      const isPartiallyPaid = booking.bookingPrice.userPaid > 0 ?? false;
      const mainBookingAmount =
        (isDiscountApplied
          ? booking.bookingPrice.discountTotalPrice
          : isPartiallyPaid
            ? booking.bookingPrice.userPaid
            : booking.bookingPrice?.totalPrice) ?? 0;

      // Main booking payment
      transactions.push({
        bookingId: booking.bookingId,
        transactionType: "Main Booking",
        amount: mainBookingAmount,
        payInitFrom: booking.payInitFrom,
        rrnNumber: booking.bookingPrice?.rrnNumber || "NA",
        payment_order_id: booking.payment_order_id,
        paySuccessId: booking?.paySuccessId || "NA",
        paymentgatewayOrderId: booking?.paymentgatewayOrderId || "NA",
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        paymentInitiatedDate: booking.paymentInitiatedDate,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        userId: booking.userId,

        __sortTime: getSortTime(
          booking.paymentInitiatedDate,
          booking.updatedAt,
          booking.createdAt,
        ),
      });

      // Extend payments
      if (Array.isArray(booking.bookingPrice?.extendAmount)) {
        booking.bookingPrice.extendAmount.forEach((ext) => {
          transactions.push({
            bookingId: `${booking.bookingId}_ext_${ext.id}`,
            transactionType: "Extend booking",
            amount: Math.round(
              Number(ext.amount) +
                Number(ext?.tax || 0) +
                Number(ext?.addonTax || 0),
              // Number(ext?.addOnAmount || 0),
            ),
            paymentgatewayOrderId: ext.orderId,
            paySuccessId: ext.transactionId,
            paymentStatus: ext.status || "pending",
            paymentInitiatedDate: ext.paymentInitiatedDate,
            payInitFrom: ext?.paymentMethod === "online" ? "razorPay" : "cash",
            rrnNumber: ext?.rrnNumber || "NA",
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            userId: booking.userId,

            __sortTime: getSortTime(
              ext.paymentInitiatedDate,
              booking.updatedAt,
              booking.createdAt,
            ),
          });
        });
      }

      // Diff payments
      if (Array.isArray(booking.bookingPrice?.diffAmount)) {
        booking.bookingPrice.diffAmount.forEach((diff) => {
          if (diff.amount && diff.amount > 0) {
            transactions.push({
              bookingId: `${booking.bookingId}_chan_${diff.id}`,
              transactionType: "Vehicle Change",
              amount: Math.round(
                Number(diff.amount) +
                  Number(diff?.tax || 0) +
                  Number(diff?.addonTax || 0),
              ),
              paymentgatewayOrderId: diff.orderId,
              paySuccessId: diff.transactionId,
              paymentStatus: diff.status || "pending",
              paymentInitiatedDate: "",
              payInitFrom:
                diff?.paymentMethod === "online" ? "razorPay" : "cash",
              rrnNumber: diff?.rrnNumber || "NA",
              createdAt: booking.createdAt,
              updatedAt: booking.updatedAt,
              userId: booking.userId,

              __sortTime: getSortTime(
                diff.paymentInitiatedDate,
                booking.updatedAt,
                booking.createdAt,
              ),
            });
          }
        });
      }
    });

    if (transactionType) {
      const regex = new RegExp(transactionType, "i");
      transactions = transactions.filter((t) => regex.test(t.transactionType));
    }

    if (search) {
      const regex = new RegExp(search, "i");
      transactions = transactions.filter(
        (t) =>
          regex.test(t.bookingId || "") ||
          regex.test(t.transactionType || "") ||
          regex.test(t.paymentMethod || "") ||
          regex.test(t.paymentStatus || "") ||
          regex.test(t.payment_order_id || "") ||
          regex.test(t.payInitFrom || "") ||
          regex.test(t.paySuccessId || ""),
      );
    }

    transactions.sort((a, b) =>
      sortOrder === "asc"
        ? a.__sortTime - b.__sortTime
        : b.__sortTime - a.__sortTime,
    );

    const totalRecords = transactions.length;
    // const paginatedData = transactions.slice(skip, skip + Number(limit));
    const paginatedData = transactions
      .slice(skip, skip + Number(limit))
      .map(({ __sortTime, ...rest }) => rest);

    const pagination = {
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: Number(page),
      limit: Number(limit),
    };

    return res.status(200).json({
      status: 200,
      message: "Transactions retrieved successfully.",
      data: paginatedData,
      pagination,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return res.json({
      status: 500,
      message: "Failed to retrieve bookings.",
      error: error.message,
    });
  }
};

module.exports = { paymentRec };
