const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const maintenanceExpenseSchema = new Schema(
  {
    maintenanceRequestId: {
      type: Schema.Types.ObjectId,
      ref: "MaintenanceRequest",
      required: true,
    },
    vehicleTableId: {
      type: Schema.Types.ObjectId,
      ref: "vehicleTable",
      required: true,
    },
    stationId: { type: String, required: true },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "location",
      required: true,
    },

    category: {
      type: String,
      enum: ["parts", "labour", "other"],
      required: true,
    },
    description: { type: String, trim: true },
    amount: { type: Number, required: true }, // adjustments may be negative
    entryType: {
      type: String,
      enum: ["charge", "adjustment"],
      default: "charge",
    },
    // _id of the costItems line this was created from (charges only)
    sourceLineId: { type: Schema.Types.ObjectId },
    expenseDate: { type: Date, required: true, default: Date.now },
    createdBy: { type: String, enum: ["admin", "manager"] },
    createdById: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// a retried approval can never insert the same line twice
maintenanceExpenseSchema.index(
  { maintenanceRequestId: 1, sourceLineId: 1 },
  {
    unique: true,
    partialFilterExpression: { sourceLineId: { $exists: true } },
  },
);
maintenanceExpenseSchema.index({ vehicleTableId: 1, expenseDate: -1 });
maintenanceExpenseSchema.index({ stationId: 1, expenseDate: -1 });

module.exports = mongoose.model("MaintenanceExpense", maintenanceExpenseSchema);
