const mongoose = require("mongoose");
const MaintenanceVehicle = require("../db/schemas/onboarding/maintenanceVehicleSchema");
const User = require("../db/schemas/onboarding/user.schema");
const MaintenanceRequest = require("../db/schemas/onboarding/maintenanceRequest.schema");
const vehicleTable = require("../db/schemas/onboarding/vehicle-table.schema");

const REQUEST_TYPES = ["repair", "periodic_service", "accident", "other"];

class BusinessError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.isBusiness = true;
  }
}

// "2026-11-04T16:00:00Z" style, IST wall-clock time with a "Z", like the rest of your data
const nowIstString = () =>
  new Date(Date.now() + 5.5 * 60 * 60 * 1000)
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z");

// "2026-11-05", the IST calendar date, same format as vehicleTable.lastServiceDate
const todayIstDateString = () => nowIstString().slice(0, 10);

/**
 * Unblocks one maintenance record with the same field values as your manual unblock.
 * Returns { ok: true, record } or { ok: false, reason }.
 */
const unblockMaintenanceRecord = async ({
  maintenanceVehicleId,
  endDate,
  userType,
  userId,
  session = null,
}) => {
  const opts = session ? { session } : {};

  const current = await MaintenanceVehicle.findOne(
    { _id: maintenanceVehicleId, status: "active" },
    null,
    opts,
  );
  if (!current) return { ok: false, reason: "not_found_or_already_unblocked" };

  // status: "active" in the filter makes this atomic, so a double click can't unblock twice
  const result = await MaintenanceVehicle.updateOne(
    { _id: maintenanceVehicleId, status: "active" },
    {
      $set: {
        actualEndDate: current.endDate,
        endDate: endDate || nowIstString(),
        status: "inactive",
        finishDate: Date.now(),
        unblockedBy: userType,
        unblockedById: userId,
      },
    },
    opts,
  );

  if (result.modifiedCount === 0)
    return { ok: false, reason: "not_found_or_already_unblocked" };

  return { ok: true };
};

// manager creating -> the manager is the mechanic. admin creating -> optional pick.
const resolveMechanicId = async ({ userType, userId, mechanicId }) => {
  if (userType === "manager") return userId;
  if (!mechanicId) return undefined;
  if (!mongoose.isValidObjectId(mechanicId))
    throw new BusinessError(400, "Invalid manager selected");
  const found = await User.exists({ _id: mechanicId, userType: "manager" });
  if (!found) throw new BusinessError(400, "Selected manager not found");
  return mechanicId;
};

// one repair request per newly created block
const createRepairRequestsForBlocks = async ({
  blocks,
  repair,
  reason,
  userId,
  userType,
  session,
}) => {
  const type = repair.type || "repair";
  if (!REQUEST_TYPES.includes(type))
    throw new BusinessError(400, "Invalid work type");

  const odometer = repair.odometerReading;
  if (
    odometer !== undefined &&
    (typeof odometer !== "number" || !isFinite(odometer) || odometer < 0)
  )
    throw new BusinessError(400, "Invalid odometer reading");

  const mechanicId = await resolveMechanicId({
    userType,
    userId,
    mechanicId: repair.mechanicId,
  });

  const vehicles = await vehicleTable
    .find({ _id: { $in: blocks.map((b) => b.vehicleTableId) } })
    .select("stationId locationId")
    .session(session);
  const byId = new Map(vehicles.map((v) => [String(v._id), v]));

  const docs = blocks.map((b) => {
    const v = byId.get(String(b.vehicleTableId));
    if (!v) throw new BusinessError(404, "Vehicle not found");
    return {
      maintenanceVehicleId: b._id,
      vehicleTableId: b.vehicleTableId,
      stationId: v.stationId,
      locationId: v.locationId,
      mechanicId,
      type,
      problemDescription: repair.problemDescription?.trim() || reason,
      // one odometer value only makes sense for a single vehicle
      odometerReading: blocks.length === 1 ? odometer : undefined,
      status: "pending",
      createdBy: userType,
      createdById: userId,
      timeline: [
        {
          status: "pending",
          note: "Request created",
          by: userType,
          byId: userId,
        },
      ],
    };
  });

  await MaintenanceRequest.insertMany(docs, { session });
};

// manager: always limited to one station (stationId required). admin: all stations unless a filter is sent.
const getStationScope = (req) => {
  const stationId = req.query?.stationId || req.body?.stationId;
  if (req.user.userType === "manager") {
    if (!stationId) return { error: "stationId is required" };
    return { stationId: String(stationId) };
  }
  return { stationId: stationId ? String(stationId) : undefined };
};

module.exports = {
  nowIstString,
  todayIstDateString,
  unblockMaintenanceRecord,
  BusinessError,
  resolveMechanicId,
  createRepairRequestsForBlocks,
  getStationScope,
};
