const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const costItemSchema = new Schema({
  category: {
    type: String,
    enum: ["parts", "labour", "other"],
    required: true,
  },
  description: { type: String, trim: true, required: true },
  amount: { type: Number, required: true, min: 0 },
});

const attachmentSchema = new Schema(
  {
    url: { type: String, required: true },
    uploadedBy: { type: String, enum: ["admin", "manager"] },
    uploadedById: { type: Schema.Types.ObjectId, ref: "User" },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const timelineSchema = new Schema(
  {
    status: { type: String, required: true },
    note: { type: String, trim: true },
    by: { type: String, enum: ["admin", "manager"] },
    byId: { type: Schema.Types.ObjectId, ref: "User" },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const maintenanceRequestSchema = new Schema(
  {
    maintenanceVehicleId: {
      type: Schema.Types.ObjectId,
      ref: "MaintenanceVehicle",
    },
    // booking _id, set only for a vehicle that is on an ongoing booking
    bookingId: { type: Schema.Types.ObjectId, ref: "booking" },
    // odometer sync for an ongoing booking
    serviceReadings: {
      readingBeforeService: { type: Number, min: 0 },
      readingAfterService: { type: Number, min: 0 },
    },
    vehicleTableId: {
      type: Schema.Types.ObjectId,
      ref: "vehicleTable",
      required: true,
    },
    // copied from vehicle at creation, used for report filters
    stationId: { type: String, required: true },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "location",
      required: true,
    },

    mechanicId: { type: Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: ["repair", "periodic_service", "accident", "other"],
      default: "repair",
    },
    problemDescription: { type: String, trim: true, required: true },
    odometerReading: { type: Number, min: 0 },
    mechanicNotes: { type: String, trim: true },

    costItems: [costItemSchema], // drafts, become MaintenanceExpense on approval
    totalCost: { type: Number, default: 0, min: 0 },
    attachments: [attachmentSchema],

    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "approved", "cancelled"],
      default: "pending",
    },
    rejectionNote: { type: String, trim: true },
    completedAt: { type: Date },
    approvedAt: { type: Date },
    approvedBy: { type: String, enum: ["admin", "manager"] },
    approvedById: { type: Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: String, enum: ["admin", "manager"], default: "admin" },
    createdById: { type: Schema.Types.ObjectId, ref: "User" },

    timeline: [timelineSchema],
  },
  { timestamps: true },
);

maintenanceRequestSchema.pre("validate", function (next) {
  const hasBlock = !!this.maintenanceVehicleId;
  const hasBooking = !!this.bookingId;
  if (hasBlock === hasBooking)
    return next(
      new Error("A request needs either a maintenance block or a booking"),
    );
  next();
});

maintenanceRequestSchema.index({ bookingId: 1 });
maintenanceRequestSchema.index({ maintenanceVehicleId: 1 });
maintenanceRequestSchema.index({ vehicleTableId: 1, status: 1 });
maintenanceRequestSchema.index({ stationId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("MaintenanceRequest", maintenanceRequestSchema);
