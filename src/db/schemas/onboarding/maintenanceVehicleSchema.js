const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const maintenanceVehicleSchema = new Schema(
  {
    vehicleTableId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "vehicleTable",
    },
    startDate: {
      type: String,
      require: true,
    },
    createDate: {
      type: Number,
    },
    endDate: {
      type: String,
      require: true,
    },
    actualEndDate: {
      type: String,
    },
    finishDate: {
      type: Number,
    },
    reason: {
      type: String,
      default: "general maintenance",
      require: true,
      lowercase: true,
    },
    createdBy: {
      type: String,
      enum: ["admin", "manager"],
      default: "admin",
    },
    unblockedBy: {
      type: String,
      enum: ["admin", "manager"],
      default: "admin",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } },
);

// indexing
maintenanceVehicleSchema.index({ vehicleTableId: 1 });
maintenanceVehicleSchema.index({
  vehicleTableId: 1,
  status: 1,
  startDate: 1,
  endDate: 1,
});

const MaintenanceVehicle = mongoose.model(
  "MaintenanceVehicle",
  maintenanceVehicleSchema,
);

module.exports = MaintenanceVehicle;
