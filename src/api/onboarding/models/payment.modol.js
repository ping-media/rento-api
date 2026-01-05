const Booking = require("../../../db/schemas/onboarding/booking.schema");

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
      // Main booking payment
      transactions.push({
        bookingId: booking.bookingId,
        transactionType: "Main Booking",
        amount: booking.bookingPrice?.totalPrice || 0,
        payInitFrom: booking.payInitFrom,
        payment_order_id: booking.payment_order_id,
        paySuccessId: booking.paySuccessId,
        paymentgatewayOrderId: booking.paymentgatewayOrderId,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        paymentInitiatedDate: booking.paymentInitiatedDate,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        userId: booking.userId,
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
                Number(ext?.addonTax || 0) +
                Number(ext?.addOnAmount || 0)
            ),
            paymentgatewayOrderId: ext.orderId,
            paySuccessId: ext.transactionId,
            paymentStatus: ext.status || "pending",
            payInitFrom: ext?.paymentMethod === "online" ? "razorPay" : "cash",
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            userId: booking.userId,
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
                  Number(diff?.addonTax || 0)
              ),
              paymentgatewayOrderId: diff.orderId,
              paySuccessId: diff.transactionId,
              paymentStatus: diff.status || "pending",
              payInitFrom:
                diff?.paymentMethod === "online" ? "razorPay" : "cash",
              createdAt: booking.createdAt,
              updatedAt: booking.updatedAt,
              userId: booking.userId,
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
          regex.test(t.paySuccessId || "")
      );
    }

    // transactions.sort((a, b) => {
    //   const dateA = new Date(a.updatedAt);
    //   const dateB = new Date(b.updatedAt);
    //   return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    // });
    transactions.sort((a, b) => {
      const getTime = (t) => {
        if (t?.paymentInitiatedDate) {
          const ts = Number(t.paymentInitiatedDate);
          if (!Number.isNaN(ts)) return ts;
        }

        if (t?.updatedAt) return new Date(t.updatedAt).getTime();
        if (t?.createdAt) return new Date(t.createdAt).getTime();

        return 0;
      };

      const timeA = getTime(a);
      const timeB = getTime(b);

      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    });

    const totalRecords = transactions.length;
    const paginatedData = transactions.slice(skip, skip + Number(limit));

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
