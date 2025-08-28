const Booking = require("../../../db/schemas/onboarding/booking.schema");

// const paymentRec = async (req, res) => {
//   try {
//     const {
//       bookingId,
//       email,
//       paymentStatus,
//       paymentMethod,
//       search,
//       stationId,
//       page = 1,
//       limit = 10,
//     } = req.query;

//     const filters = {};
//     if (bookingId) filters.bookingId = bookingId;
//     if (email) filters.email = email;
//     if (paymentStatus) filters.paymentStatus = paymentStatus;
//     if (paymentMethod) filters.paymentMethod = paymentMethod;
//     if (stationId) filters.stationId = stationId;

//     if (search) {
//       const searchRegex = new RegExp(search, "i");
//       filters.$or = [
//         { bookingId: searchRegex },
//         { paymentMethod: searchRegex },
//         { paymentStatus: searchRegex },
//         { payment_order_id: searchRegex },
//         { payInitFrom: searchRegex },
//         { paySuccessId: searchRegex },
//       ];
//     }

//     const skip = (page - 1) * limit;
//     // Fetch all bookings from the database
//     const bookings = await Booking.find(filters, {
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
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(Number(limit));

//     // Check if bookings exist
//     if (!bookings || bookings.length === 0) {
//       return res.json({
//         status: 404,
//         message: "No bookings found.",
//         data: [],
//       });
//     }

//     const totalRecords = await Booking.count(filters);
//     const pagination = {
//       // totalRecords,
//       totalPages: Math.ceil(totalRecords / limit),
//       currentPage: Number(page),
//       limit: Number(limit),
//     };
//     // Return the retrieved bookings and userIds
//     return res.status(200).json({
//       status: 200,
//       message: "Bookings retrieved successfully.",
//       data: bookings,
//       pagination: pagination,
//     });
//   } catch (error) {
//     console.error("Error fetching bookings:", error);

//     // Return an error response
//     return res.json({
//       status: 500,
//       message: "Failed to retrieve bookings.",
//       error: error.message,
//     });
//   }
// };

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
//     } = req.query;

//     const filters = {};
//     if (bookingId) filters.bookingId = bookingId;
//     if (email) filters.email = email;
//     if (paymentStatus) filters.paymentStatus = paymentStatus;
//     if (paymentMethod) filters.paymentMethod = paymentMethod;
//     if (stationId) filters.stationId = stationId;

//     if (search) {
//       const searchRegex = new RegExp(search, "i");
//       filters.$or = [
//         { bookingId: searchRegex },
//         { paymentMethod: searchRegex },
//         { paymentStatus: searchRegex },
//         { payment_order_id: searchRegex },
//         { payInitFrom: searchRegex },
//         { paySuccessId: searchRegex },
//       ];
//     }

//     const skip = (page - 1) * limit;

//     // Fetch all bookings
//     const bookings = await Booking.find(filters, {
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
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(Number(limit));

//     if (!bookings || bookings.length === 0) {
//       return res.json({
//         status: 404,
//         message: "No bookings found.",
//         data: [],
//       });
//     }

//     let transactions = [];
//     bookings.forEach((booking) => {
//       // Main booking payment
//       transactions.push({
//         bookingId: booking.bookingId,
//         transactionType: "Main Booking",
//         amount: booking.bookingPrice?.totalPrice || 0,
//         payInitFrom: booking.payInitFrom,
//         payment_order_id: booking.payment_order_id,
//         paySuccessId: booking.paySuccessId,
//         paymentgatewayOrderId: booking.paymentgatewayOrderId,
//         paymentStatus: booking.paymentStatus,
//         paymentMethod: booking.paymentMethod,
//         paymentInitiatedDate: booking.paymentInitiatedDate,
//         createdAt: booking.createdAt,
//         updatedAt: booking.updatedAt,
//         userId: booking.userId,
//       });

//       // Extend payments
//       if (Array.isArray(booking.bookingPrice?.extendAmount)) {
//         booking.bookingPrice.extendAmount.forEach((ext) => {
//           transactions.push({
//             bookingId: booking.bookingId,
//             transactionType: "Extend booking",
//             amount: Math.round(
//               Number(ext.amount) +
//                 Number(ext?.tax || 0) +
//                 Number(ext?.addonTax || 0)
//             ),
//             paymentgatewayOrderId: ext.orderId,
//             paySuccessId: ext.transactionId,
//             paymentStatus: ext.status || "pending",
//             payInitFrom: ext?.paymentMethod === "online" ? "razorPay" : "cash",
//             createdAt: booking.createdAt,
//             updatedAt: booking.updatedAt,
//             userId: booking.userId,
//           });
//         });
//       }

//       // Diff payments
//       if (Array.isArray(booking.bookingPrice?.diffAmount)) {
//         booking.bookingPrice.diffAmount.forEach((diff) => {
//           if (diff.amount && diff.amount > 0) {
//             transactions.push({
//               bookingId: booking.bookingId,
//               transactionType: "Vehicle Change",
//               amount: Math.round(
//                 Number(diff.amount) +
//                   Number(diff?.tax || 0) +
//                   Number(diff?.addonTax || 0)
//               ),
//               paymentgatewayOrderId: diff.orderId,
//               paySuccessId: diff.transactionId,
//               paymentStatus: diff.status || "pending",
//               payInitFrom:
//                 diff?.paymentMethod === "online" ? "razorPay" : "cash",
//               createdAt: booking.createdAt,
//               updatedAt: booking.updatedAt,
//               userId: booking.userId,
//             });
//           }
//         });
//       }
//     });

//     if (transactionType) {
//       const regex = new RegExp(transactionType, "i");
//       transactions = transactions.filter((t) => regex.test(t.transactionType));
//     }

//     if (search) {
//       const regex = new RegExp(search, "i");
//       transactions = transactions.filter(
//         (t) =>
//           regex.test(t.bookingId) ||
//           regex.test(t.transactionType) ||
//           regex.test(t.paymentMethod) ||
//           regex.test(t.paymentStatus) ||
//           regex.test(t.payment_order_id || "") ||
//           regex.test(t.payInitFrom || "") ||
//           regex.test(t.paySuccessId || "")
//       );
//     }

//     const totalRecords = transactions.length;
//     const paginatedData = transactions.slice(skip, skip + Number(limit));

//     const pagination = {
//       totalPages: Math.ceil(totalRecords / limit),
//       currentPage: Number(page),
//       limit: Number(limit),
//     };

//     return res.status(200).json({
//       status: 200,
//       message: "Transactions retrieved successfully.",
//       data: paginatedData,
//       pagination,
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
            bookingId: booking.bookingId,
            transactionType: "Extend booking",
            amount: Math.round(
              Number(ext.amount) +
                Number(ext?.tax || 0) +
                Number(ext?.addonTax || 0)
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
              bookingId: booking.bookingId,
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
