const Booking = require("../../../db/schemas/onboarding/booking.schema");
const crypto = require("crypto");
const { timelineFunctionServer } = require("./timeline.model");

const RAZORPAY_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

const razorpayWebhook = async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  // const body = req.body.toString("utf8");
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
      const amountInPaise = payment.amount;
      const amountPaid = amountInPaise / 100;
      const razorpayPaymentId = payment.id;
      if (type === "extension") {
        await handleExtendBookingWebhook(
          bookingId,
          razorpayPaymentId,
          amountPaid
        );
      } else {
        await updateBookingAfterPayment(
          bookingId,
          razorpayPaymentId,
          amountPaid
        );
      }
    }

    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;
      const bookingId = payment.notes?.booking_id;
      const amountInPaise = payment.amount;
      const amountPaid = amountInPaise / 100;
      const razorpayPaymentId = payment.id;

      await markBookingAsFailed(bookingId, razorpayPaymentId, amountPaid);
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
  amountPaid
) => {
  if (!bookingId) throw new Error("Booking ID missing");

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  booking.paymentStatus = "paid";
  booking.bookingStatus = "done";
  booking.paySuccessId = razorpayPaymentId;

  await booking.save();

  // Add to timeline
  await timelineFunctionServer({
    currentBooking_id: booking._id,
    timeLine: [
      {
        title: "Payment Completed",
        date: Date.now(),
        paymentAmount: amountPaid,
        paymentId: razorpayPaymentId,
      },
    ],
  });
};

const handleExtendBookingWebhook = async (bookingId, paymentId, amountPaid) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  const extend =
    booking.extendBooking?.extendAmount[
      booking.extendBooking?.extendAmount?.length - 1
    ];
  if (!extend || extend.status === "paid") return;

  extend.status = "paid";
  extend.paymentMethod = "online";
  extend.razorpayPaymentId = paymentId;
  extend.paymentDate = new Date();

  booking.bookingStatus = "extended";
  booking.paymentStatus = "paid";

  booking.extendBooking.transactionIds = [
    ...(booking.extendBooking.transactionIds || []),
    paymentId,
  ];

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
  razorpayWebhook,
  updateBookingAfterPayment,
  markBookingAsFailed,
};
