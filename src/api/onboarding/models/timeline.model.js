const Timeline = require("../../../db/schemas/onboarding/timeline.schema");

const timelineFunction = async (req, res) => {
  try {
    const { bookingId, userId, timeline, currentBooking_id } = req.body;

    if (!bookingId || !userId || !timeline) {
      return res.status(400).json({
        status: 400,
        message: "Missing required fields: userId, bookingId, or timeline.",
      });
    }

    const ObjData = { userId, bookingId, timeline };

    if (currentBooking_id) {
      const existingData = await Timeline.findOne({ currentBooking_id });

      if (!existingData) {
        return res.status(404).json({
          status: 404,
          message: "Document not found",
        });
      }

      const updatedTimeline = [...existingData.timeline, ...timeline];

      await Timeline.updateOne(
        { currentBooking_id },
        { $set: { timeline: updatedTimeline } }
      );

      return res.status(200).json({
        status: 200,
        message: "Timeline updated successfully",
      });
    }

    const newData = new Timeline(ObjData);
    await newData.save();

    return res.status(200).json({
      status: 200,
      message: "Timeline added successfully",
    });
  } catch (error) {
    console.error("Error in timelineFunction:", error.message);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

module.exports = { timelineFunction };
