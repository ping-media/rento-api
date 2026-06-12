const Booking = require("../../db/schemas/onboarding/booking.schema");
const MaintenanceVehicle = require("../../db/schemas/onboarding/maintenanceVehicleSchema");
const vehicleMaster = require("../../db/schemas/onboarding/vehicle-master.schema");
const vehicleTable = require("../../db/schemas/onboarding/vehicle-table.schema");

const checkVehicleAvailability = async ({
  vehicleTableId,
  BookingStartDateAndTime,
  BookingEndDateAndTime,
  excludeBookingId,
}) => {
  // 1. Get vehicle + check active
  const vehicle = await vehicleTable
    .findById(vehicleTableId)
    .select("vehicleMasterId stationId vehicleStatus");

  if (!vehicle) return { available: false, reason: "Vehicle not found" };
  if (vehicle.vehicleStatus !== "active")
    return { available: false, reason: "Vehicle is not active" };

  // 2. Check vehicle master status
  const master = await vehicleMaster
    .findById(vehicle.vehicleMasterId)
    .select("status");
  if (master?.status === "inactive")
    return { available: false, reason: "Vehicle model is inactive" };

  // 3. Check maintenance conflict for THIS specific vehicle
  const maintenanceConflict = await MaintenanceVehicle.findOne({
    vehicleTableId: vehicleTableId,
    status: "active",
    $or: [
      {
        startDate: {
          $gte: BookingStartDateAndTime,
          $lt: BookingEndDateAndTime,
        },
      },
      {
        endDate: { $gt: BookingStartDateAndTime, $lte: BookingEndDateAndTime },
      },
      {
        startDate: { $lte: BookingStartDateAndTime },
        endDate: { $gte: BookingEndDateAndTime },
      },
    ],
  });

  if (maintenanceConflict)
    return { available: false, reason: "Vehicle is under maintenance" };

  // 4. Get all active vehicle IDs in this model+station group
  const activeVehiclesInGroup = await vehicleTable
    .find({
      vehicleMasterId: vehicle.vehicleMasterId,
      stationId: vehicle.stationId,
      vehicleStatus: "active",
    })
    .select("_id");

  const activeVehicleIds = activeVehiclesInGroup.map((v) => v._id);

  // 5. Count vehicles under maintenance in group during this period
  const vehiclesUnderMaintenanceInGroup = await MaintenanceVehicle.distinct(
    "vehicleTableId",
    {
      vehicleTableId: { $in: activeVehicleIds },
      status: "active",
      $or: [
        {
          startDate: {
            $gte: BookingStartDateAndTime,
            $lt: BookingEndDateAndTime,
          },
        },
        {
          endDate: {
            $gt: BookingStartDateAndTime,
            $lte: BookingEndDateAndTime,
          },
        },
        {
          startDate: { $lte: BookingStartDateAndTime },
          endDate: { $gte: BookingEndDateAndTime },
        },
      ],
    },
  );

  const operationalCount =
    activeVehicleIds.length - vehiclesUnderMaintenanceInGroup.length;

  // 6. Count conflicting pool-based bookings (exclude current booking)
  const conflictQuery = {
    vehicleMasterId: vehicle.vehicleMasterId,
    stationId: vehicle.stationId,
    bookingStatus: { $ne: "canceled" },
    rideStatus: { $nin: ["completed", "canceled"] },
    $or: [
      {
        BookingStartDateAndTime: {
          $gte: BookingStartDateAndTime,
          $lt: BookingEndDateAndTime,
        },
      },
      {
        BookingEndDateAndTime: {
          $gt: BookingStartDateAndTime,
          $lte: BookingEndDateAndTime,
        },
      },
      {
        BookingStartDateAndTime: { $lte: BookingStartDateAndTime },
        BookingEndDateAndTime: { $gte: BookingEndDateAndTime },
      },
    ],
  };

  if (excludeBookingId) {
    conflictQuery._id = { $ne: excludeBookingId };
  }

  const conflictingBookingsCount = await Booking.countDocuments(conflictQuery);
  const availableSlots = operationalCount - conflictingBookingsCount;

  if (availableSlots <= 0) {
    return {
      available: false,
      reason: "No available slots for this vehicle model at this station",
    };
  }

  return { available: true };
};

module.exports = { checkVehicleAvailability };
