const vehicleTable = require("../db/schemas/onboarding/vehicle-table.schema");

const updateVehicleMeter = async (vehicleNumber, reading) => {
  try {
    const value = Number(reading);
    if (
      !vehicleNumber ||
      reading === "" ||
      reading == null ||
      !Number.isFinite(value)
    )
      return;
    await vehicleTable.updateOne(
      { vehicleNumber },
      { $set: { kmsRun: value } },
    );
  } catch (err) {
    console.error("updateVehicleMeter failed:", err.message);
  }
};
module.exports = {
  updateVehicleMeter,
};
