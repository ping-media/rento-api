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
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

const MaintenanceVehicle = mongoose.model(
  "MaintenanceVehicle",
  maintenanceVehicleSchema
);

module.exports = MaintenanceVehicle;
