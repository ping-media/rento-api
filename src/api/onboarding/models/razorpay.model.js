require("dotenv").config();
const Booking = require("../../../db/schemas/onboarding/booking.schema");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { timelineFunctionServer } = require("./timeline.model");
const { sendMessageAfterBooking } = require("../../../utils");
const User = require("../../../db/schemas/onboarding/user.schema");

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

const createPaymentLink = async (req, res) => {
  const { bookingId, amount, orderId, type } = req.body;

  if (!bookingId || !amount) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    const user = await User.findById(booking.userId.toString());
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found for this booking",
      });
    }

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
        type: type || "",
      },
    });

    if (response.id) {
      await timelineFunctionServer({
        currentBooking_id: booking._id,
        timeLine: [
          {
            title: "Payment Link Created",
            date: Date.now(),
            paymentAmount: amount,
            PaymentLink: response.short_url,
            paymentLinkId: response.id,
          },
        ],
      });

      res.json({
        paymentLink: response.short_url,
        paymentLinkId: response.id,
        linkCreated: true,
      });
    } else {
      res.json({
        linkCreated: false,
        message: "Unable to make payment link",
      });
    }
  } catch (error) {
    console.warn("Error while creating payment link", error?.message);
    res.json({
      linkCreated: false,
      message: "Error while creating payment link",
    });
  }
};

// webhooks code

// const razorpayWebhookAdmin = async (req, res) => {
//   const signature = req.headers["x-razorpay-signature"];

//   const isValid = verifyRazorpaySignature(JSON.stringify(req.body), signature);
//   if (!isValid) return res.status(400).send("Invalid signature");

//   const event = req.body.event;

//   const paymentLinkPayload = req.body.payload?.payment_link?.entity;

//   if (!paymentLinkPayload) {
//     console.error("Missing payment_link.entity in webhook payload");
//     return res.status(400).send("Malformed payload");
//   }

//   const entity = paymentLinkPayload;
//   const notes = entity.notes || {};
//   const amountInPaise = entity.amount || 0;
//   const amountPaid = amountInPaise / 100;

//   if (event === "payment_link.paid") {
//     const paymentLinkId = entity.id;
//     const type = notes?.type?.toLowerCase() || "";

//     if (type === "" || type === "partiallypay") {
//       await updateBookingAfterPaymentAdmin(paymentLinkId, amountPaid, type);
//     }
//   }

//   res.status(200).send("Payment received");
// };
const razorpayWebhookAdmin = async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const isValid = verifyRazorpaySignature(JSON.stringify(req.body), signature);

  if (!isValid) return res.status(400).send("Invalid signature");

  const event = req.body.event;
  const entity = req.body.payload?.payment_link?.entity;

  if (!entity) {
    console.error("Missing payment_link.entity in webhook payload");
    return res.status(400).send("Malformed payload");
  }

  // Add some debugging logs
  console.log("Entity object:", entity);
  console.log("Entity notes:", entity.notes);
  console.log("Entity amount:", entity.amount);

  const notes = entity.notes || {};
  const amountPaid = (entity.amount || 0) / 100;
  const type = notes?.type?.toLowerCase() || "";
  const bookingId = notes?.bookingId;

  console.log("Extracted values:", { amountPaid, type, bookingId });

  // Validate required fields
  if (!bookingId) {
    console.error("Missing bookingId in notes");
    return res.status(400).send("Missing booking ID");
  }

  if (type === "" || type === "partiallypay") {
    try {
      const paymentId = entity.payment_id || "";
      await updateBookingAfterPaymentAdmin(
        bookingId,
        amountPaid,
        type,
        paymentId
      );
    } catch (err) {
      console.error("Error updating booking:", err);
      return res.status(500).send("Booking update failed");
    }
  }

  res.status(200).send("Payment received");
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
      .status(400)
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
    return res.status(500).json({ success: false, error: "Internal error" });
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

  if (!booking) return res.status(404).send("Booking not found");

  // const extend = booking.bookingPrice.extendAmount.find(
  //   (e) => e.paymentLinkId === paymentLinkId
  // );
  // if (extend) {
  //   extend.paid = true;
  //   extend.paymentId = entity.payment_id;
  // }
  if (type === "partiallyPay") {
    booking.paymentStatus = "partially_paid";
  } else {
    booking.paymentStatus = "paid";
  }
  booking.bookingStatus = "done";
  booking.paySuccessId = paySuccessId || "";

  await booking.save();

  // Add to timeline
  await timelineFunctionServer({
    currentBooking_id: booking._id,
    timeLine: [
      {
        title: "Payment Completed",
        date: Date.now(),
        paymentAmount: amountPaid,
        paymentId: paymentId || "",
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
  razorpayWebhookAdmin,
  razorpayWebhook,
  updateBookingAfterPaymentAdmin,
  updateBookingAfterPayment,
  markExtendBookingAsFailed,
  markBookingAsFailed,
};
