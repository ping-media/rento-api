require("dotenv").config();
const Booking = require("../../../db/schemas/onboarding/booking.schema");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { timelineFunctionServer } = require("./timeline.model");
const { sendMessageAfterBooking } = require("../../../utils");
const User = require("../../../db/schemas/onboarding/user.schema");
const TempExtension = require("../../../db/schemas/onboarding/tempExtension.schema");

const RAZORPAY_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

const razorpay = new Razorpay({
  key_id: process.env.VITE_RAZOR_KEY_ID,
  key_secret: process.env.VITE_RAZOR_KEY_SECRET,
});

const verifyRazorpaySignature = (body, signature) => {
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_SECRET)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
};

const createPaymentLinkUtil = async ({
  bookingId,
  amount,
  orderId,
  type = "",
  typeId = "",
  endDate = "",
  requestFrom = "",
  isTimeLine = true,
}) => {
  if (!bookingId || !amount) {
    throw new Error("Missing required fields: bookingId or amount");
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  const user = await User.findById(booking.userId.toString());
  if (!user) throw new Error("User not found for this booking");

  const oneDayInSeconds = 24 * 60 * 60;
  const expireBy = Math.floor(Date.now() / 1000) + oneDayInSeconds;

  const response = await razorpay.paymentLink.create({
    amount: amount * 100,
    currency: "INR",
    accept_partial: false,
    description: `Payment for your booking Id: #${booking.bookingId}`,
    reference_id: orderId,
    callback_url: "https://rentobikes.com/payment-success",
    callback_method: "get",
    customer: {
      name: user.firstName + " " + user.lastName || "--",
      email: user.email || "--",
      contact: user.contact || "",
    },
    notify: {
      sms: false,
      email: true,
    },
    notes: {
      bookingId: booking._id,
      type,
      typeId,
      razorPayOrderId: orderId || "",
      requestFrom,
    },
    expire_by: expireBy,
  });

  if (!response.id) throw new Error("Failed to create Razorpay payment link");

  if (isTimeLine) {
    const timeLineData = {
      currentBooking_id: booking._id,
      timeLine: [
        {
          title: "Payment Link Created",
          date: Date.now(),
          paymentAmount: amount,
          PaymentLink: response.short_url,
          paymentLinkId: response.id,
          endDate,
        },
      ],
    };

    await timelineFunctionServer(timeLineData);

    return {
      paymentLink: response.short_url,
      paymentLinkId: response.id,
      response,
      timeLineData,
    };
  }

  return {
    paymentLink: response.short_url,
    paymentLinkId: response.id,
    response,
  };
};

// const createPaymentLink = async (req, res) => {
//   const { bookingId, amount, orderId, type, typeId } = req.body;

//   if (!bookingId || !amount) {
//     return res.status(200).json({ message: "Missing fields" });
//   }

//   try {
//     const booking = await Booking.findById(bookingId);
//     if (!booking) return res.status(200).json({ message: "Booking not found" });
//     const user = await User.findById(booking.userId.toString());
//     if (!user) {
//       return res.status(200).json({
//         success: false,
//         message: "User not found for this booking",
//       });
//     }

//     const response = await razorpay.paymentLink.create({
//       amount: amount * 100,
//       currency: "INR",
//       accept_partial: false,
//       description: `Payment for your booking Id: #${booking.bookingId}`,
//       reference_id: orderId,
//       callback_url: "https://rentobikes.com/payment-success",
//       callback_method: "get",
//       customer: {
//         name: user.firstName + " " + user.lastName || "--",
//         email: user.email || "--",
//         contact: user.contact || "",
//       },
//       notify: {
//         sms: false,
//         email: true,
//       },
//       notes: {
//         bookingId: booking._id,
//         type: type || "",
//         typeId: typeId || "",
//       },
//     });

//     const timeLineData = {
//       currentBooking_id: booking._id,
//       timeLine: [
//         {
//           title: "Payment Link Created",
//           date: Date.now(),
//           paymentAmount: amount,
//           PaymentLink: response.short_url,
//           paymentLinkId: response.id,
//         },
//       ],
//     };
//     if (response.id) {
//       await timelineFunctionServer(timeLineData);

//       res.status(200).json({
//         paymentLink: response.short_url,
//         paymentLinkId: response.id,
//         data: timeLineData,
//         linkCreated: true,
//       });
//     } else {
//       res.status(200).json({
//         linkCreated: false,
//         message: "Unable to make payment link",
//       });
//     }
//   } catch (error) {
//     console.warn("Error while creating payment link", error?.message);
//     res.status(200).json({
//       linkCreated: false,
//       message: "Error while creating payment link",
//     });
//   }
// };

const createPaymentLink = async (req, res) => {
  const { bookingId, amount, orderId, type, typeId } = req.body;

  try {
    const result = await createPaymentLinkUtil({
      bookingId,
      amount,
      orderId,
      type,
      typeId,
    });

    res.status(200).json({
      ...result,
      linkCreated: true,
    });
  } catch (error) {
    console.warn("Error while creating payment link", error?.message);
    res.status(200).json({
      linkCreated: false,
      message: "Error while creating payment link",
    });
  }
};

// webhooks code
const razorpayWebhookAdmin = async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const isValid = verifyRazorpaySignature(JSON.stringify(req.body), signature);

  if (!isValid) return res.status(200).send("Invalid signature");

  const entity = req.body.payload?.payment_link?.entity;

  if (!entity) {
    console.log("Missing payment_link.entity in webhook payload");
    return res.status(200).send("Malformed payload");
  }

  const notes = entity.notes || {};
  const amountPaid = (entity.amount || 0) / 100;
  const type = notes?.type?.toLowerCase() || "";
  const requestFrom = notes?.requestFrom?.toLowerCase() || "";
  const noteOrderId = notes?.razorPayOrderId || "";
  const typeId = notes?.typeId || "";
  const bookingId = notes?.bookingId;

  // Validate required fields
  if (!bookingId) {
    console.log("Missing bookingId in notes");
    return res.status(200).send("Missing booking ID");
  }

  let paymentId = "";
  const orderId = entity.order_id;

  for (let attempt = 0; attempt < 3; attempt++) {
    const payments = await razorpay.orders.fetchPayments(orderId);
    // checking whether the payment is successfull or not and getting tran id
    if (payments.items && payments.items.length > 0) {
      const successfulPayment = payments.items.find(
        (p) => p.status === "captured" || p.status === "authorized"
      );
      if (successfulPayment) {
        paymentId = successfulPayment.id;
        break;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  if (type === "" || type === "partiallypay") {
    try {
      await updateBookingAfterPaymentAdmin(
        bookingId,
        amountPaid,
        type,
        paymentId
      );
      return res.status(200).send("Booking Payment received");
    } catch (err) {
      console.error("Error updating booking:", err);
      return res.status(200).send("Booking update failed");
    }
  } else if (
    type === "extension" &&
    requestFrom === "admin" &&
    noteOrderId !== ""
  ) {
    try {
      await updateBookingAdminExtension(typeId, paymentId, noteOrderId);
      return res.status(200).send("Admin Extend Booking Payment received");
    } catch (err) {
      console.error("Error updating booking:", err);
      return res.status(200).send("Booking extend failed");
    }
  } else if (type === "ChangeVehicle") {
    try {
      await updateBookingForVehicleChange(
        bookingId,
        amountPaid,
        typeId,
        paymentId
      );
      return res.status(200).send("Extend Booking Payment received");
    } catch (err) {
      console.error("Error updating booking:", err);
      return res.status(200).send("Booking extend failed");
    }
  } else if (type === "extension") {
    try {
      await updateBookingWithNewExtension(
        bookingId,
        amountPaid,
        typeId,
        paymentId
      );
      return res.status(200).send("Extend Booking Payment received");
    } catch (err) {
      console.error("Error updating booking:", err);
      return res.status(200).send("Booking extend failed");
    }
  }
};

const razorpayWebhook = async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const body = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_SECRET)
    .update(body)
    .digest("hex");

  if (signature !== expectedSignature) {
    return res
      .status(200)
      .json({ success: false, message: "Invalid signature" });
  }

  const event = req.body;

  try {
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const bookingId = payment.notes?.booking_id;
      const type = payment.notes?.type || "";
      const typeId = payment.notes?.typeId || "";
      const amountInPaise = payment.amount;
      const amountPaid = amountInPaise / 100;
      const razorpayPaymentId = payment.id;
      if (type === "extension") {
        await handleExtendBookingWebhook(
          bookingId,
          razorpayPaymentId,
          amountPaid,
          typeId
        );
      } else if (type === "" || type === "partiallyPay") {
        await updateBookingAfterPayment(
          bookingId,
          razorpayPaymentId,
          amountPaid,
          type
        );
        await sendMessageAfterBooking(bookingId);
      }
    }

    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;
      const bookingId = payment.notes?.booking_id;
      const type = payment.notes?.type || "";
      const typeId = payment.notes?.typeId || "";
      const amountInPaise = payment.amount;
      const amountPaid = amountInPaise / 100;
      const razorpayPaymentId = payment.id;

      if (type === "extension") {
        await markExtendBookingAsFailed(
          bookingId,
          razorpayPaymentId,
          amountPaid,
          typeId
        );
      } else {
        await markBookingAsFailed(bookingId, razorpayPaymentId, amountPaid);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook handling failed:", error);
    return res.status(200).json({ success: false, error: "Internal error" });
  }
};

const updateBookingAfterPayment = async (
  bookingId,
  razorpayPaymentId,
  amountPaid,
  type
) => {
  if (!bookingId) throw new Error("Booking ID missing");

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (type === "partiallyPay") {
    booking.paymentStatus = "partially_paid";
  } else {
    booking.paymentStatus = "paid";
  }
  booking.bookingStatus = "done";
  booking.paySuccessId = razorpayPaymentId;

  await booking.save();

  // Add to timeline
  await timelineFunctionServer({
    currentBooking_id: booking._id,
    timeLine: [
      {
        title: "Payment Received",
        date: Date.now(),
        paymentAmount: amountPaid,
        paymentId: razorpayPaymentId,
      },
    ],
  });
};

const updateBookingAfterPaymentAdmin = async (
  bookingId,
  amountPaid,
  type,
  paymentId
) => {
  if (!bookingId) throw new Error("Booking ID missing");
  const booking = await Booking.findById(bookingId);

  if (!booking) return res.status(200).send("Booking not found");

  if (type === "partiallyPay") {
    booking.paymentStatus = "partially_paid";
  } else {
    booking.paymentStatus = "paid";
  }
  booking.bookingStatus = "done";
  booking.paySuccessId = paymentId || "";

  await booking.save();

  // Add to timeline
  await timelineFunctionServer({
    currentBooking_id: booking._id,
    timeLine: [
      {
        title: "Payment Received",
        date: Date.now(),
        paymentAmount: amountPaid,
        paymentId: paymentId || "",
      },
    ],
  });
};

const updateBookingWithNewExtension = async (
  bookingId,
  amountPaid,
  typeId,
  paymentId
) => {
  if (!bookingId) throw new Error("Booking ID missing");
  const booking = await Booking.findById(bookingId);

  if (!booking || !typeId)
    return res.status(200).send("Booking or extension not found");

  const extend = booking.bookingPrice.extendAmount.find(
    (e) => e.id?.toString() === typeId?.toString()
  );
  if (extend) {
    extend.status = "paid";
    extend.paymentMethod = "online";
    extend.paymentDate = new Date();
    extend.transactionId = paymentId;
  }
  booking.bookingStatus = "extended";

  booking.markModified("bookingPrice.extendAmount");

  await booking.save();

  // Add to timeline
  await timelineFunctionServer({
    currentBooking_id: booking._id,
    timeLine: [
      {
        title: "Payment Received",
        date: Date.now(),
        paymentAmount: amountPaid,
        paymentId: paymentId || "",
      },
    ],
  });
};

const updateBookingForVehicleChange = async (
  bookingId,
  amountPaid,
  typeId,
  paymentId
) => {
  if (!bookingId) throw new Error("Booking ID missing");
  const booking = await Booking.findById(bookingId);

  if (!booking || !typeId)
    return res.status(200).send("Booking or extension not found");

  const change = booking.bookingPrice.diffAmount.find(
    (e) => e.id?.toString() === typeId?.toString()
  );
  if (change) {
    change.status = "paid";
    change.paymentMethod = "online";
    change.paymentDate = new Date();
    change.transactionId = paymentId;
  }

  booking.markModified("bookingPrice.diffAmount");

  await booking.save();

  // Add to timeline
  await timelineFunctionServer({
    currentBooking_id: booking._id,
    timeLine: [
      {
        title: "Payment Received",
        date: Date.now(),
        paymentAmount: amountPaid,
        paymentId: paymentId || "",
      },
    ],
  });
};

const updateBookingAdminExtension = async (typeId, paymentId, noteOrderId) => {
  if (!noteOrderId) throw new Error("Extend booking id not found.");
  const temp = await TempExtension.findOne({ razorpayOrderId: noteOrderId });

  if (!temp || temp.isCompleted) {
    return res.status(200).json({ message: "Invalid or already processed" });
  }

  const booking = await Booking.findById(temp.bookingId);
  if (!booking) {
    return res.status(200).json({ message: "Booking not found" });
  }

  const data = temp.extendData;

  booking.BookingEndDateAndTime = data.BookingEndDateAndTime;
  booking.bookingStatus = "extended";

  booking.bookingPrice.extendAmount = booking.bookingPrice.extendAmount || [];
  booking.bookingPrice.extendAmount.push({
    ...data.extendAmount,
    transactionId: paymentId || "",
    paymentMethod: "online",
    status: "paid",
  });

  booking.extendBooking = booking.extendBooking || {};
  booking.extendBooking.oldBooking = booking.extendBooking.oldBooking || [];
  booking.extendBooking.oldBooking.push(data.oldBookings);

  booking.markModified("bookingPrice");
  booking.markModified("extendBooking");

  await booking.save();

  if (typeId !== "") {
    await TempExtension.deleteMany({ extendId: typeId });
  }

  // Add to timeline
  await timelineFunctionServer({
    currentBooking_id: booking._id,
    timeLine: [
      {
        title: "Booking Extended",
        date: Date.now(),
        paymentAmount: data.extendAmount?.amount || 0,
        paymentId: paymentId || "",
        endDate: data.BookingEndDateAndTime,
        extended: true,
      },
    ],
  });
};

const handleExtendBookingWebhook = async (
  bookingId,
  paymentId,
  amountPaid,
  typeId
) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  const extendAmountIndex = booking.bookingPrice?.extendAmount?.findIndex(
    (item) => item.id === typeId
  );

  if (
    extendAmountIndex === -1 ||
    !booking.bookingPrice?.extendAmount?.[extendAmountIndex]
  ) {
    throw new Error(`Extend amount with ID ${typeId} not found`);
  }

  const extend = booking.bookingPrice.extendAmount[extendAmountIndex];

  if (extend.status === "paid") {
    console.log(`Payment for extend amount ID ${typeId} already processed`);
    return;
  }

  extend.status = "paid";
  extend.paymentMethod = "online";
  extend.transactionId = paymentId;
  extend.paymentDate = new Date();

  booking.bookingStatus = "extended";
  booking.paymentStatus = "paid";

  booking.markModified("bookingPrice");

  await booking.save();

  await timelineFunctionServer({
    currentBooking_id: booking._id,
    timeLine: [
      {
        title: "Payment Received",
        date: Date.now(),
        paymentAmount: amountPaid,
        paymentId: paymentId,
      },
    ],
  });

  await timelineFunctionServer({
    currentBooking_id: booking._id,
    timeLine: [
      {
        title: "Booking extended",
        date: Date.now(),
        extendDate: extend.bookingEndDateAndTime,
      },
    ],
  });
};

const markExtendBookingAsFailed = async (
  bookingId,
  razorpayPaymentId,
  amountPaid,
  extendAmountId
) => {
  if (!bookingId) throw new Error("Booking ID missing");

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (extendAmountId && booking.bookingPrice?.extendAmount?.length > 0) {
    const extendAmountIndex = booking.bookingPrice.extendAmount.findIndex(
      (item) => item.id === extendAmountId
    );

    if (extendAmountIndex !== -1) {
      booking.bookingPrice.extendAmount.splice(extendAmountIndex, 1);
      booking.markModified("bookingPrice");
    } else {
      console.warn(`ExtendAmount with ID ${extendAmountId} not found`);
    }
  }

  await booking.save();

  // Add to timeline
  await timelineFunctionServer({
    currentBooking_id: booking._id,
    timeLine: [
      {
        title: "Payment Failed",
        paymentAmount: amountPaid,
        date: Date.now(),
        paymentId: razorpayPaymentId,
      },
    ],
  });
};

const markBookingAsFailed = async (
  bookingId,
  razorpayPaymentId,
  amountPaid
) => {
  if (!bookingId) throw new Error("Booking ID missing");

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  booking.paymentStatus = "failed";
  booking.bookingStatus = "canceled";
  booking.payFailedId = razorpayPaymentId;

  await booking.save();

  // Add to timeline
  await timelineFunctionServer({
    currentBooking_id: booking._id,
    timeLine: [
      {
        title: "Payment Failed",
        paymentAmount: amountPaid,
        date: Date.now(),
        paymentId: razorpayPaymentId,
      },
    ],
  });
};

module.exports = {
  createPaymentLink,
  createPaymentLinkUtil,
  razorpayWebhookAdmin,
  razorpayWebhook,
  updateBookingAfterPaymentAdmin,
  updateBookingAdminExtension,
  updateBookingAfterPayment,
  markExtendBookingAsFailed,
  markBookingAsFailed,
};
