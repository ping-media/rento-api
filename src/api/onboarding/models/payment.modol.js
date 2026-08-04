const Booking = require("../../../db/schemas/onboarding/booking.schema");

const getDisplayDate = (primary, ...fallbacks) => {
  if (primary) return primary;
  for (const f of fallbacks) {
    if (f) return f;
  }
  return "";
};

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

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // When searching, each booking can produce 3+ transactions,
    // so fetch a larger window. For direct filters, normal pagination works.
    const isSearching = !!(search || transactionType);
    const dbLimit = isSearching ? 0 : limitNum * 5; // 0 = no limit only when searching
    const dbSkip = isSearching ? 0 : Math.floor(skip / 3); // rough offset for non-search

    // const query = Booking.find(filters, {
    //   userId: 1,
    //   bookingId: 1,
    //   bookingPrice: 1,
    //   payInitFrom: 1,
    //   payment_order_id: 1,
    //   paySuccessId: 1,
    //   payment_type: 1,
    //   paymentgatewayOrderId: 1,
    //   paymentStatus: 1,
    //   rideStatus: 1,
    //   paymentMethod: 1,
    //   paymentInitiatedDate: 1,
    //   createdAt: 1,
    //   updatedAt: 1,
    // })
    //   .populate("userId", "firstName lastName contact email")
    //   .sort({ createdAt: sortOrder === "asc" ? 1 : -1 })
    //   .lean(); // ← lean() for better performance, returns plain objects

    // if (!isSearching) {
    //   query.skip(dbSkip).limit(dbLimit);
    // }

    // const bookings = await query;
    const projection = {
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
      rideStatus: 1,
      createdAt: 1,
      updatedAt: 1,
    };

    // Query 1 — all bookings for main booking transactions
    const mainBookings = await Booking.find(filters, projection)
      .populate("userId", "firstName lastName contact email")
      .lean();

    // Query 2 — old bookings that have paid extensions or diffs
    // these won't be in mainBookings if filters restrict by date etc.
    const extensionBookings = await Booking.find(
      {
        ...filters,
        $or: [
          { "bookingPrice.extendAmount": { $elemMatch: { status: "paid" } } },
          { "bookingPrice.diffAmount": { $elemMatch: { status: "paid" } } },
        ],
      },
      projection,
    )
      .populate("userId", "firstName lastName contact email")
      .lean();

    // Merge and deduplicate by _id
    const bookingMap = new Map();
    [...mainBookings, ...extensionBookings].forEach((b) => {
      bookingMap.set(b._id.toString(), b);
    });
    const bookings = Array.from(bookingMap.values());

    if (!bookings || bookings.length === 0) {
      return res.json({ status: 404, message: "No bookings found.", data: [] });
    }

    let transactions = [];

    bookings.forEach((booking) => {
      const isDiscountApplied =
        (booking.bookingPrice?.discountTotalPrice ?? 0) > 0;
      const isPartiallyPaid = (booking.bookingPrice?.userPaid ?? 0) > 0;

      const mainBookingAmount = isDiscountApplied
        ? booking.bookingPrice.discountTotalPrice
        : isPartiallyPaid
          ? booking.bookingPrice.userPaid
          : (booking.bookingPrice?.totalPrice ?? 0);

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
        paymentInitiatedDate: getDisplayDate(
          booking.paymentInitiatedDate,
          booking.createdAt,
        ),
        // paymentInitiatedDate:
        //   booking.paymentInitiatedDate || booking.createdAt || "",
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        userId: booking.userId,
        __sortTime: getSortTime(
          booking.paymentInitiatedDate || booking.createdAt,
          booking.updatedAt,
          booking.createdAt,
        ),
      });

      // Extend payments
      if (Array.isArray(booking.bookingPrice?.extendAmount)) {
        booking.bookingPrice.extendAmount.forEach((ext) => {
          if (!ext) return; // ← null guard
          transactions.push({
            bookingId: `${booking.bookingId}_ext_${ext.id}`,
            transactionType: "Extend booking",
            amount: Math.round(
              Number(ext.amount || 0) +
                Number(ext?.tax || 0) +
                Number(ext?.addonTax || 0),
            ),
            paymentgatewayOrderId: ext.orderId,
            paySuccessId: ext.transactionId,
            paymentStatus: ext.status || "pending",
            paymentInitiatedDate: getDisplayDate(
              ext.paymentInitiatedDate,
              ext.paymentSuccessDate,
              ext.paymentDate,
              booking.createdAt,
            ),
            // paymentInitiatedDate:
            //   ext.paymentInitiatedDate ||
            //   ext.paymentSuccessDate ||
            //   ext.paymentDate ||
            //   "",
            payInitFrom: ext?.paymentMethod === "online" ? "razorPay" : "cash",
            rrnNumber: ext?.rrnNumber || "NA",
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            userId: booking.userId,
            __sortTime: getSortTime(
              ext.paymentInitiatedDate ||
                ext.paymentSuccessDate ||
                ext.paymentDate,
              booking.updatedAt,
              booking.createdAt,
            ),
          });
        });
      }

      // Diff payments
      if (Array.isArray(booking.bookingPrice?.diffAmount)) {
        booking.bookingPrice.diffAmount.forEach((diff) => {
          if (!diff) return; // ← null guard
          if (diff.amount && diff.amount > 0) {
            transactions.push({
              bookingId: `${booking.bookingId}_chan_${diff.id}`,
              transactionType: "Vehicle Change",
              amount: Math.round(
                Number(diff.amount || 0) +
                  Number(diff?.tax || 0) +
                  Number(diff?.addonTax || 0),
              ),
              paymentgatewayOrderId: diff.orderId,
              paySuccessId: diff.transactionId,
              paymentStatus: diff.status || "pending",
              paymentInitiatedDate: getDisplayDate(
                diff.paymentInitiatedDate,
                booking.updatedAt,
                booking.createdAt,
              ),
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

    // Apply filters
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
    const paginatedData = transactions
      .slice(skip, skip + limitNum)
      .map(({ __sortTime, ...rest }) => rest);

    return res.status(200).json({
      status: 200,
      message: "Transactions retrieved successfully.",
      data: paginatedData,
      pagination: {
        totalPages: Math.ceil(totalRecords / limitNum),
        currentPage: pageNum,
        limit: limitNum,
      },
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
// const paymentRec = async (req, res) => {
//   try {
//     const {
//       bookingId,
//       email,
//       paymentStatus,
//       paymentMethod,
//       search,
//       stationId,
//       transactionType,
//       page = 1,
//       limit = 10,
//       sortOrder = "desc",
//     } = req.query;

//     const filters = {};
//     if (bookingId) filters.bookingId = bookingId;
//     if (email) filters.email = email;
//     if (paymentStatus) filters.paymentStatus = paymentStatus;
//     if (paymentMethod) filters.paymentMethod = paymentMethod;
//     if (stationId) filters.stationId = stationId;

//     const pageNum = Number(page);
//     const limitNum = Number(limit);
//     const skip = (pageNum - 1) * limitNum;

//     // When searching, each booking can produce 3+ transactions,
//     // so fetch a larger window. For direct filters, normal pagination works.
//     const isSearching = !!(search || transactionType);
//     const dbLimit = isSearching ? 0 : limitNum * 5; // 0 = no limit only when searching
//     const dbSkip = isSearching ? 0 : Math.floor(skip / 3); // rough offset for non-search

//     const query = Booking.find(filters, {
//       userId: 1,
//       bookingId: 1,
//       bookingPrice: 1,
//       payInitFrom: 1,
//       payment_order_id: 1,
//       paySuccessId: 1,
//       payment_type: 1,
//       paymentgatewayOrderId: 1,
//       paymentStatus: 1,
//       paymentMethod: 1,
//       paymentInitiatedDate: 1,
//       createdAt: 1,
//       updatedAt: 1,
//     })
//       .populate("userId", "firstName lastName contact email")
//       .sort({ createdAt: sortOrder === "asc" ? 1 : -1 })
//       .lean(); // ← lean() for better performance, returns plain objects

//     if (!isSearching) {
//       query.skip(dbSkip).limit(dbLimit);
//     }

//     const bookings = await query;

//     if (!bookings || bookings.length === 0) {
//       return res.json({ status: 404, message: "No bookings found.", data: [] });
//     }

//     let transactions = [];

//     bookings.forEach((booking) => {
//       const isDiscountApplied =
//         (booking.bookingPrice?.discountTotalPrice ?? 0) > 0;
//       const isPartiallyPaid = (booking.bookingPrice?.userPaid ?? 0) > 0;

//       const mainBookingAmount = isDiscountApplied
//         ? booking.bookingPrice.discountTotalPrice
//         : isPartiallyPaid
//           ? booking.bookingPrice.userPaid
//           : (booking.bookingPrice?.totalPrice ?? 0);

//       transactions.push({
//         bookingId: booking.bookingId,
//         transactionType: "Main Booking",
//         amount: mainBookingAmount,
//         payInitFrom: booking.payInitFrom,
//         rrnNumber: booking.bookingPrice?.rrnNumber || "NA",
//         payment_order_id: booking.payment_order_id,
//         paySuccessId: booking?.paySuccessId || "NA",
//         paymentgatewayOrderId: booking?.paymentgatewayOrderId || "NA",
//         paymentStatus: booking.paymentStatus,
//         paymentMethod: booking.paymentMethod,
//         paymentInitiatedDate: booking.paymentInitiatedDate,
//         createdAt: booking.createdAt,
//         updatedAt: booking.updatedAt,
//         userId: booking.userId,
//         __sortTime: getSortTime(
//           booking.paymentInitiatedDate,
//           booking.updatedAt,
//           booking.createdAt,
//         ),
//       });

//       // Extend payments
//       if (Array.isArray(booking.bookingPrice?.extendAmount)) {
//         booking.bookingPrice.extendAmount.forEach((ext) => {
//           if (!ext) return; // ← null guard
//           transactions.push({
//             bookingId: `${booking.bookingId}_ext_${ext.id}`,
//             transactionType: "Extend booking",
//             amount: Math.round(
//               Number(ext.amount || 0) +
//                 Number(ext?.tax || 0) +
//                 Number(ext?.addonTax || 0),
//             ),
//             paymentgatewayOrderId: ext.orderId,
//             paySuccessId: ext.transactionId,
//             paymentStatus: ext.status || "pending",
//             paymentInitiatedDate: ext.paymentInitiatedDate,
//             payInitFrom: ext?.paymentMethod === "online" ? "razorPay" : "cash",
//             rrnNumber: ext?.rrnNumber || "NA",
//             createdAt: booking.createdAt,
//             updatedAt: booking.updatedAt,
//             userId: booking.userId,
//             __sortTime: getSortTime(
//               ext.paymentInitiatedDate,
//               booking.updatedAt,
//               booking.createdAt,
//             ),
//           });
//         });
//       }

//       // Diff payments
//       if (Array.isArray(booking.bookingPrice?.diffAmount)) {
//         booking.bookingPrice.diffAmount.forEach((diff) => {
//           if (!diff) return; // ← null guard
//           if (diff.amount && diff.amount > 0) {
//             transactions.push({
//               bookingId: `${booking.bookingId}_chan_${diff.id}`,
//               transactionType: "Vehicle Change",
//               amount: Math.round(
//                 Number(diff.amount || 0) +
//                   Number(diff?.tax || 0) +
//                   Number(diff?.addonTax || 0),
//               ),
//               paymentgatewayOrderId: diff.orderId,
//               paySuccessId: diff.transactionId,
//               paymentStatus: diff.status || "pending",
//               paymentInitiatedDate: "",
//               payInitFrom:
//                 diff?.paymentMethod === "online" ? "razorPay" : "cash",
//               rrnNumber: diff?.rrnNumber || "NA",
//               createdAt: booking.createdAt,
//               updatedAt: booking.updatedAt,
//               userId: booking.userId,
//               __sortTime: getSortTime(
//                 diff.paymentInitiatedDate,
//                 booking.updatedAt,
//                 booking.createdAt,
//               ),
//             });
//           }
//         });
//       }
//     });

//     // Apply filters
//     if (transactionType) {
//       const regex = new RegExp(transactionType, "i");
//       transactions = transactions.filter((t) => regex.test(t.transactionType));
//     }

//     if (search) {
//       const regex = new RegExp(search, "i");
//       transactions = transactions.filter(
//         (t) =>
//           regex.test(t.bookingId || "") ||
//           regex.test(t.transactionType || "") ||
//           regex.test(t.paymentMethod || "") ||
//           regex.test(t.paymentStatus || "") ||
//           regex.test(t.payment_order_id || "") ||
//           regex.test(t.payInitFrom || "") ||
//           regex.test(t.paySuccessId || ""),
//       );
//     }

//     transactions.sort((a, b) =>
//       sortOrder === "asc"
//         ? a.__sortTime - b.__sortTime
//         : b.__sortTime - a.__sortTime,
//     );

//     const totalRecords = transactions.length;
//     const paginatedData = transactions
//       .slice(skip, skip + limitNum)
//       .map(({ __sortTime, ...rest }) => rest);

//     return res.status(200).json({
//       status: 200,
//       message: "Transactions retrieved successfully.",
//       data: paginatedData,
//       pagination: {
//         totalPages: Math.ceil(totalRecords / limitNum),
//         currentPage: pageNum,
//         limit: limitNum,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching bookings:", error);
//     return res.json({
//       status: 500,
//       message: "Failed to retrieve bookings.",
//       error: error.message,
//     });
//   }
// };

module.exports = { paymentRec };
