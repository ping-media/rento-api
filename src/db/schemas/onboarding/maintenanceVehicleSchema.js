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

    endDate: {
      type: String,
      require: true,
    },
    reason: {
      type: String,
      default: "general maintenance",
      require: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: { createsdAt: "createdAt", updatedAt: "updatedAt" } },
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
