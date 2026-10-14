const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const eventSchema = new Schema(
  {
    at: { type: Date, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number }, // GPS accuracy in meters, for audit
    distanceMeters: { type: Number, required: true }, // from station, server-calculated
  },
  { _id: false },
);

const attendanceSchema = new Schema(
  {
    stationId: { type: Schema.Types.ObjectId, ref: "station", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true }, // IST day, "YYYY-MM-DD"
    status: {
      type: String,
      enum: ["present", "absent"],
      default: "present",
    },
    checkIn: { type: eventSchema },
    checkOut: { type: eventSchema },
  },
  { timestamps: true },
);

// one record per person per day (this is what blocks double check-in)
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
// station reports
attendanceSchema.index({ stationId: 1, date: -1 });
attendanceSchema.index({ date: -1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
