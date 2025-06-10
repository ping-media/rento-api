const Timeline = require("../../../db/schemas/onboarding/timeline.schema");
const { whatsappMessage } = require("../../../utils/whatsappMessage");
const {
  sendEmailForExtendOrVehicleChange,
} = require("../../../utils/emailSend");
const Booking = require("../../../db/schemas/onboarding/booking.schema");

const timelineFunction = async (req, res) => {
  try {
    const { bookingId, userId, currentBooking_id, timeLine, isStart } =
      req.body;

    if (isStart && isStart === true) {
      if (!bookingId || !userId || !timeLine || !currentBooking_id) {
        return res.json({
          status: 400,
          message: "Missing required fields: userId, bookingId, or timeline.",
        });
      }

      const ObjData = { userId, bookingId, timeLine, currentBooking_id };
      const newData = new Timeline(ObjData);
      await newData.save();

      return res.json({
        status: 200,
        message: "Timeline added successfully",
      });
    } else {
      const existingData = await Timeline.findOne({ currentBooking_id });

      if (!existingData) {
        return res.json({
          status: 404,
          message: "Document not found",
        });
      }

      const booking = await Booking.findOne({ _id: currentBooking_id })
        .populate("userId", "firstName contact email")
        .populate("stationMasterUserId", "contact")
        .select("stationMasterUserId userId");

      const updatedTimeline = [...existingData.timeLine, ...timeLine];

      await Timeline.updateOne(
        { currentBooking_id },
        { $set: { timeLine: updatedTimeline } }
      );

      if (
        timeLine[timeLine.length - 1].PaymentLink &&
        timeLine[timeLine.length - 1].PaymentLink !== ""
      ) {
        const link = `https://${timeLine[timeLine.length - 1].PaymentLink}`;
        const amount = timeLine[timeLine.length - 1].paymentAmount;
        const flag =
          timeLine[timeLine.length - 1].changeToVehicle == ""
            ? "Extend vehicle"
            : "Change vehicle";
        const firstName = booking.userId.firstName;
        const email = booking.userId.email;
        const contact = booking.userId.contact;
        const managerContact = booking.stationMasterUserId.contact;
        const bookingId = existingData.bookingId;

        const messageData = [
          firstName,
          flag,
          bookingId,
          amount,
          link,
          managerContact,
        ];

        whatsappMessage(contact, "booking_payment_link", messageData);
        sendEmailForExtendOrVehicleChange(
          email,
          firstName,
          flag,
          bookingId,
          amount,
          link,
          managerContact
        );
      }
      return res.status(200).json({
        status: 200,
        message: "Timeline updated successfully",
      });
    }
  } catch (error) {
    console.error("Error in timelineFunction:", error.message);
    return res.json({
      status: 500,
      message: error.message,
    });
  }
};

const timelineFunctionServer = async ({
  bookingId,
  userId,
  currentBooking_id,
  timeLine,
  isStart,
}) => {
  try {
    if (isStart && isStart === true) {
      if (!bookingId || !userId || !timeLine || !currentBooking_id) {
        return {
          status: 400,
          message: "Missing required fields: userId, bookingId, or timeline.",
        };
      }

      const ObjData = { userId, bookingId, timeLine, currentBooking_id };
      const newData = new Timeline(ObjData);
      await newData.save();

      return {
        status: 200,
        message: "Timeline added successfully",
      };
    } else {
      const existingData = await Timeline.findOne({ currentBooking_id });

      if (!existingData) {
        return res.json({
          status: 404,
          message: "Document not found",
        });
      }

      const booking = await Booking.findOne({ _id: currentBooking_id })
        .populate("userId", "firstName contact email")
        .populate("stationMasterUserId", "contact")
        .select("stationMasterUserId userId");

      const updatedTimeline = [...existingData.timeLine, ...timeLine];

      await Timeline.updateOne(
        { currentBooking_id },
        { $set: { timeLine: updatedTimeline } }
      );

      if (
        timeLine[timeLine.length - 1].PaymentLink &&
        timeLine[timeLine.length - 1].PaymentLink !== ""
      ) {
        const link = `https://${timeLine[timeLine.length - 1].PaymentLink}`;
        const amount = timeLine[timeLine.length - 1].paymentAmount;
        const flag =
          timeLine[timeLine.length - 1].changeToVehicle == ""
            ? "Extend vehicle"
            : "Change vehicle";
        const firstName = booking.userId.firstName;
        const email = booking.userId.email;
        const contact = booking.userId.contact;
        const managerContact = booking.stationMasterUserId.contact;
        const bookingId = existingData.bookingId;

        const messageData = [
          firstName,
          flag,
          bookingId,
          amount,
          link,
          managerContact,
        ];

        whatsappMessage(contact, "booking_payment_link", messageData);
        sendEmailForExtendOrVehicleChange(
          email,
          firstName,
          flag,
          bookingId,
          amount,
          link,
          managerContact
        );
      }
      return {
        status: 200,
        message: "Timeline updated successfully",
      };
    }
  } catch (error) {
    console.error("Error in timelineFunction:", error.message);
    return {
      status: 500,
      message: error.message,
    };
  }
};

const timelineFunctionForGet = async (req, res) => {
  try {
    const { bookingId } = req.query;

    const data = await Timeline.findOne({ bookingId });

    if (data) {
      return res.json({
        status: 200,
        message: "data get successfully",
        data: data,
      });
    }
    return res.json({
      status: 402,
      message: "data not found",
      data: [],
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
    });
  }
};
module.exports = {
  timelineFunction,
  timelineFunctionServer,
  timelineFunctionForGet,
};
