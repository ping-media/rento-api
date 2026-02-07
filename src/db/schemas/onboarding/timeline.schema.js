const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const timelineSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      require: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      require: true,
      ref: "User",
    },
    currentBooking_id: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
    },
    timeLine: [
      {
        type: Object,
        require: true,
      },
    ],
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } },
);

// Primary lookup
timelineSchema.index({ bookingId: 1 }, { unique: true });

// Booking reference
timelineSchema.index({ currentBooking_id: 1 });

// User timelines
timelineSchema.index({ userId: 1 });

// Recent activity
timelineSchema.index({ userId: 1, updatedAt: -1 });

const Timeline = mongoose.model("Timeline", timelineSchema);

module.exports = Timeline;
