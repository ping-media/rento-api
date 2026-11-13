const mongoose = require("mongoose");
const MaintenanceVehicle = require("../../../db/schemas/onboarding/maintenanceVehicleSchema");
const MaintenanceRequest = require("../../../db/schemas/onboarding/maintenanceRequest.schema");
const vehicleTable = require("../../../db/schemas/onboarding/vehicle-table.schema");
const User = require("../../../db/schemas/onboarding/user.schema");
const MaintenanceExpense = require("../../../db/schemas/onboarding/maintenanceExpense.schema");
const {
  todayIstDateString,
  unblockMaintenanceRecord,
  BusinessError,
  resolveMechanicId,
  getStationScope,
} = require("../../../helper/maintenanceHelper");
const Booking = require("../../../db/schemas/onboarding/booking.schema");
const pickupImage = require("../../../db/schemas/onboarding/pickupImageUpload");
const { timelineFunctionServer } = require("./timeline.model");

const OPEN_STATUSES = ["pending", "in_progress", "completed"];
const EDITABLE_STATUSES = ["pending", "in_progress"];
const REQUEST_TYPES = ["repair", "periodic_service", "accident", "other"];
const COST_CATEGORIES = ["parts", "labour", "other"];
const MAX_PHOTOS = 4;

const isValidISO8601 = (s) => {
  if (
    typeof s !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s)
  )
    return false;
  return !isNaN(new Date(s).getTime());
};

const fail = (res, status, message) =>
  res.json({ status, success: false, message });

// returns { status, message } when a manager touches another station's request, else null
const outOfScope = (req, stationId) => {
  const scope = getStationScope(req);
  if (scope.error) return { status: 400, message: scope.error };
  if (scope.stationId && scope.stationId !== String(stationId))
    return { status: 403, message: "This request belongs to another station" };
  return null;
};

// returns an error message or null
const validateCostItems = (items) => {
  if (!Array.isArray(items)) return "costItems must be an array";
  for (const it of items) {
    if (!COST_CATEGORIES.includes(it?.category)) return "Invalid cost category";
    if (!it.description?.trim()) return "Each cost item needs a description";
    if (typeof it.amount !== "number" || !isFinite(it.amount) || it.amount < 0)
      return "Each cost item needs a valid amount (0 or more)";
  }
  return null;
};

const MAINTENANCE_URL_PREFIX = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/maintenance/`;

const validateAttachments = (items) => {
  if (!Array.isArray(items)) return "attachments must be an array";
  for (const it of items) {
    if (!it?.url || typeof it.url !== "string")
      return "Each attachment needs a url";
    if (!it.url.startsWith(MAINTENANCE_URL_PREFIX))
      return "Invalid attachment url";
  }
  return null;
};

const sumCost = (items) =>
  Math.round(items.reduce((t, i) => t + i.amount, 0) * 100) / 100;

// CREATE
const createMaintenanceRequest = async (req, res) => {
  try {
    const { _id, userType } = req.user;
    const {
      maintenanceVehicleId,
      mechanicId,
      type,
      problemDescription,
      odometerReading,
    } = req.body;

    if (!mongoose.isValidObjectId(maintenanceVehicleId))
      return fail(res, 400, "Valid maintenanceVehicleId is required");
    if (!problemDescription?.trim())
      return fail(res, 400, "Problem description is required");
    if (type && !REQUEST_TYPES.includes(type))
      return fail(res, 400, "Invalid request type");
    if (
      odometerReading !== undefined &&
      (typeof odometerReading !== "number" || odometerReading < 0)
    )
      return fail(res, 400, "Invalid odometer reading");

    const block = await MaintenanceVehicle.findById(maintenanceVehicleId);
    if (!block) return fail(res, 404, "Maintenance block not found");
    if (block.status !== "active")
      return fail(res, 400, "This maintenance block is already unblocked");

    const existing = await MaintenanceRequest.findOne({
      maintenanceVehicleId,
      status: { $in: OPEN_STATUSES },
    });
    if (existing)
      return fail(res, 400, "A repair request is already open for this block");

    const vehicle = await vehicleTable
      .findById(block.vehicleTableId)
      .select("stationId locationId");
    if (!vehicle) return fail(res, 404, "Vehicle not found");

    const denied = outOfScope(req, vehicle.stationId);
    if (denied) return fail(res, denied.status, denied.message);

    const assignedMechanicId = await resolveMechanicId({
      userType,
      userId: _id,
      mechanicId,
    });

    const request = await MaintenanceRequest.create({
      maintenanceVehicleId,
      vehicleTableId: block.vehicleTableId,
      stationId: vehicle.stationId,
      locationId: vehicle.locationId,
      mechanicId: assignedMechanicId,
      type: type || "repair",
      problemDescription,
      odometerReading,
      createdBy: userType,
      createdById: _id,
      status: "pending",
      timeline: [
        { status: "pending", note: "Request created", by: userType, byId: _id },
      ],
    });

    return res.json({
      status: 200,
      success: true,
      message: "Repair request created",
      data: request,
    });
  } catch (error) {
    if (error.isBusiness) return fail(res, error.status, error.message);
    console.error("createMaintenanceRequest error:", error);
    return fail(res, 500, "Internal server error");
  }
};

// MECHANIC UPDATE
const updateMaintenanceRequest = async (req, res) => {
  try {
    const { _id, userType } = req.user;
    const {
      requestId,
      mechanicId,
      mechanicNotes,
      problemDescription,
      odometerReading,
      status,
      costItems,
      attachments,
      newEndDate,
      readingAfterService,
    } = req.body;

    if (!mongoose.isValidObjectId(requestId))
      return fail(res, 400, "Valid requestId is required");

    const request = await MaintenanceRequest.findById(requestId);
    if (!request) return fail(res, 404, "Repair request not found");
    const denied = outOfScope(req, request.stationId);
    if (denied) return fail(res, denied.status, denied.message);
    if (!EDITABLE_STATUSES.includes(request.status))
      return fail(
        res,
        400,
        `Request is ${request.status} and can no longer be edited`,
      );

    const block = request.maintenanceVehicleId
      ? await MaintenanceVehicle.findById(request.maintenanceVehicleId)
      : null;
    if (request.maintenanceVehicleId && (!block || block.status !== "active"))
      return fail(res, 400, "The linked maintenance block is no longer active");

    //  validate everything before changing anything
    if (mechanicId) {
      if (!mongoose.isValidObjectId(mechanicId))
        return fail(res, 400, "Invalid manager selected");
      const found = await User.exists({ _id: mechanicId, userType: "manager" });
      if (!found) return fail(res, 400, "Selected manager not found");
    }
    if (costItems !== undefined) {
      const err = validateCostItems(costItems);
      if (err) return fail(res, 400, err);
    }
    if (attachments !== undefined) {
      const err = validateAttachments(attachments);
      if (err) return fail(res, 400, err);
      if (request.attachments.length + attachments.length > MAX_PHOTOS)
        return fail(res, 400, `A maximum of ${MAX_PHOTOS} photos is allowed`);
    }
    if (
      odometerReading !== undefined &&
      (typeof odometerReading !== "number" || odometerReading < 0)
    )
      return fail(res, 400, "Invalid odometer reading");
    if (status !== undefined && !["in_progress", "completed"].includes(status))
      return fail(res, 400, "status can only be in_progress or completed");
    if (newEndDate !== undefined) {
      if (!block)
        return fail(
          res,
          400,
          "A vehicle on a booking has no maintenance end date to extend",
        );
      if (!isValidISO8601(newEndDate))
        return fail(res, 400, "Invalid newEndDate format");
      if (newEndDate <= block.endDate)
        return fail(
          res,
          400,
          "newEndDate must be later than the current block end date",
        );
    }
    if (readingAfterService !== undefined) {
      if (!request.bookingId)
        return fail(
          res,
          400,
          "Reading after service applies only to a vehicle on a booking",
        );
      if (
        typeof readingAfterService !== "number" ||
        !isFinite(readingAfterService) ||
        readingAfterService < 0
      )
        return fail(res, 400, "Invalid meter reading after service");
    }

    // apply
    if (mechanicId) request.mechanicId = mechanicId;
    if (mechanicNotes !== undefined) request.mechanicNotes = mechanicNotes;
    if (problemDescription !== undefined) {
      if (!problemDescription.trim())
        return fail(res, 400, "Problem description cannot be empty");
      request.problemDescription = problemDescription;
    }
    if (odometerReading !== undefined)
      request.odometerReading = odometerReading;
    if (readingAfterService !== undefined)
      request.set("serviceReadings.readingAfterService", readingAfterService);
    if (costItems !== undefined) {
      request.costItems = costItems;
      request.totalCost = sumCost(costItems);
    }
    if (attachments?.length) {
      attachments.forEach((a) =>
        request.attachments.push({
          url: a.url,
          uploadedBy: userType,
          uploadedById: _id,
        }),
      );
    }

    if (status && status !== request.status) {
      if (
        status === "completed" &&
        request.bookingId &&
        request.serviceReadings?.readingAfterService == null
      )
        return fail(
          res,
          400,
          "Enter the meter reading after service before completing",
        );
      if (status === "completed" && !request.mechanicId) {
        if (userType === "manager")
          request.mechanicId = _id; // the manager did the work
        else
          return fail(
            res,
            400,
            "Assign a manager before marking the repair completed",
          );
      }
      request.status = status;
      if (status === "completed") {
        request.completedAt = new Date();
        request.rejectionNote = undefined;
      }
      request.timeline.push({ status, by: userType, byId: _id });
    }

    await request.save();

    if (newEndDate !== undefined) {
      // only extends the planned end of the block, never shortens it
      await MaintenanceVehicle.updateOne(
        { _id: block._id, status: "active" },
        { $set: { endDate: newEndDate } },
      );
    }

    return res.json({
      status: 200,
      success: true,
      message: "Repair request updated",
      data: request,
    });
  } catch (error) {
    console.error("updateMaintenanceRequest error:", error);
    return fail(res, 500, "Internal server error");
  }
};

// LIST
const listMaintenanceRequests = async (req, res) => {
  try {
    const { status, vehicleTableId, mechanicId, type, search } = req.query;
    const scope = getStationScope(req);
    if (scope.error) return fail(res, 400, scope.error);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const filter = {};
    if (status) filter.status = status;
    if (scope.stationId) filter.stationId = scope.stationId;
    if (vehicleTableId && mongoose.isValidObjectId(vehicleTableId))
      filter.vehicleTableId = vehicleTableId;
    if (mechanicId && mongoose.isValidObjectId(mechanicId))
      filter.mechanicId = mechanicId;

    if (REQUEST_TYPES.includes(type)) filter.type = type;

    if (search?.trim() && !filter.vehicleTableId) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const ids = await vehicleTable
        .find({ vehicleNumber: { $regex: escaped, $options: "i" } })
        .select("_id")
        .limit(500)
        .lean();
      filter.vehicleTableId = { $in: ids.map((v) => v._id) };
    }

    const [data, total] = await Promise.all([
      MaintenanceRequest.find(filter)
        .select("-timeline -attachments -costItems")
        .populate("vehicleTableId", "vehicleNumber")
        .populate("bookingId", "bookingId")
        .populate("mechanicId", "firstName lastName phone")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      MaintenanceRequest.countDocuments(filter),
    ]);

    return res.json({ status: 200, success: true, data, page, limit, total });
  } catch (error) {
    console.error("listMaintenanceRequests error:", error);
    return fail(res, 500, "Internal server error");
  }
};

//  DETAILS
const getMaintenanceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    if (!mongoose.isValidObjectId(requestId))
      return fail(res, 400, "Invalid requestId");

    const request = await MaintenanceRequest.findById(requestId)
      .populate(
        "vehicleTableId",
        "vehicleNumber lastMeterReading lastServiceDate",
      )
      .populate("mechanicId", "firstName lastName phone")
      .populate(
        "maintenanceVehicleId",
        "startDate endDate actualEndDate status reason",
      )
      .populate("bookingId", "bookingId");
    if (!request) return fail(res, 404, "Repair request not found");
    const denied = outOfScope(req, request.stationId);
    if (denied) return fail(res, denied.status, denied.message);

    return res.json({ status: 200, success: true, data: request });
  } catch (error) {
    console.error("getMaintenanceRequest error:", error);
    return fail(res, 500, "Internal server error");
  }
};

// APPROVE
const approveMaintenanceRequest = async (req, res) => {
  const { _id, userType } = req.user;
  const { requestId } = req.body;

  if (!mongoose.isValidObjectId(requestId))
    return fail(res, 400, "Valid requestId is required");

  const scope = getStationScope(req);
  if (scope.error) return fail(res, 400, scope.error);

  const session = await mongoose.startSession();
  try {
    let approved;

    await session.withTransaction(async () => {
      const now = new Date();

      // 1. atomic claim: only a "completed" request can be approved, once
      const request = await MaintenanceRequest.findOneAndUpdate(
        {
          _id: requestId,
          status: "completed",
          ...(scope.stationId && { stationId: scope.stationId }),
        },
        {
          $set: {
            status: "approved",
            approvedAt: now,
            approvedBy: userType,
            approvedById: _id,
          },
          $push: {
            timeline: { status: "approved", by: userType, byId: _id, at: now },
          },
        },
        { new: true, session },
      );
      if (!request)
        throw new BusinessError(
          400,
          "Only a completed request can be approved",
        );

      // 2. unblock the vehicle (only for a free vehicle that was blocked)
      if (request.maintenanceVehicleId) {
        const unblock = await unblockMaintenanceRecord({
          maintenanceVehicleId: request.maintenanceVehicleId,
          userType,
          userId: _id,
          session,
        });
        if (!unblock.ok)
          throw new BusinessError(
            400,
            "The linked maintenance block is already unblocked. Cancel this request instead.",
          );
      }

      // 2b. vehicle on an ongoing ride: sync the odometer, same shape as your vehicle-change flow
      if (request.bookingId) {
        const before = request.serviceReadings?.readingBeforeService;
        const after = request.serviceReadings?.readingAfterService;
        if (before == null || after == null)
          throw new BusinessError(
            400,
            "Meter readings are missing for this service",
          );

        const booking = await Booking.findById(request.bookingId)
          .select("bookingId rideStatus vehicleBasic")
          .session(session);
        if (!booking || booking.rideStatus !== "ongoing")
          throw new BusinessError(
            400,
            "The ride is no longer ongoing. Cancel this request instead.",
          );

        const pickupDoc = await pickupImage
          .findOne({ bookingId: booking.bookingId })
          .session(session);
        if (!pickupDoc)
          throw new BusinessError(
            400,
            "Pickup record not found for this booking",
          );

        // km run before the service is kept, then the new reading becomes the start reading
        await pickupImage.updateOne(
          { _id: pickupDoc._id },
          {
            $push: {
              "data.updatedData": {
                vehicleNumber: booking.vehicleBasic?.vehicleNumber,
                startMeterReading: Number(pickupDoc.startMeterReading || 0),
                oldVehicleEndMeterReading: before,
              },
            },
            $set: { startMeterReading: after },
          },
          { session },
        );

        // kmsRun = total run, set directly (it may go backward). lastMeterReading only for a periodic service
        await vehicleTable.updateOne(
          { _id: request.vehicleTableId },
          {
            $set: {
              kmsRun: after,
              ...(request.type === "periodic_service" && {
                lastMeterReading: after,
              }),
            },
          },
          { session },
        );
      }

      // 3. permanent expense records (zero-amount lines are skipped)
      const expenseDocs = request.costItems
        .filter((i) => i.amount > 0)
        .map((i) => ({
          maintenanceRequestId: request._id,
          vehicleTableId: request.vehicleTableId,
          stationId: request.stationId,
          locationId: request.locationId,
          category: i.category,
          description: i.description,
          amount: i.amount,
          entryType: "charge",
          sourceLineId: i._id,
          expenseDate: now,
          createdBy: userType,
          createdById: _id,
        }));
      if (expenseDocs.length)
        await MaintenanceExpense.insertMany(expenseDocs, { session });

      // 4. vehicle details: meter only moves forward
      if (typeof request.odometerReading === "number") {
        await vehicleTable.updateOne(
          {
            _id: request.vehicleTableId,
            lastMeterReading: { $lt: request.odometerReading },
          },
          { $set: { lastMeterReading: request.odometerReading } },
          { session },
        );
      }
      if (request.type === "periodic_service") {
        await vehicleTable.updateOne(
          { _id: request.vehicleTableId },
          { $set: { lastServiceDate: todayIstDateString() } },
          { session },
        );
      }

      approved = request;
    });

    if (approved?.bookingId) {
      try {
        const b = await Booking.findById(approved.bookingId).select(
          "bookingId userId",
        );
        const tl = await timelineFunctionServer({
          bookingId: b.bookingId,
          userId: b.userId,
          currentBooking_id: b._id,
          timeLine: [
            {
              title: "Service finished",
              serviceType: approved.type,
              meterReadingBeforeService:
                approved.serviceReadings?.readingBeforeService,
              meterReadingAfterService:
                approved.serviceReadings?.readingAfterService,
              serviceCost: approved.totalCost,
              date: Date.now(),
              createdBy: { id: _id, firstName: req.user.firstName },
            },
          ],
        });
        if (tl?.status !== 200)
          console.error("Service timeline failed:", tl?.message);
      } catch (e) {
        console.error("Service timeline failed:", e.message);
      }
    }

    return res.json({
      status: 200,
      success: true,
      message: "Repair approved and vehicle unblocked",
      data: approved,
    });
  } catch (error) {
    if (error.isBusiness) return fail(res, error.status, error.message);
    console.error("approveMaintenanceRequest error:", error);
    return fail(res, 500, "Internal server error");
  } finally {
    await session.endSession();
  }
};

// REJECT (sends back to in_progress)
const rejectMaintenanceRequest = async (req, res) => {
  try {
    const { _id, userType } = req.user;
    const { requestId, rejectionNote } = req.body;

    if (!mongoose.isValidObjectId(requestId))
      return fail(res, 400, "Valid requestId is required");
    if (!rejectionNote?.trim())
      return fail(res, 400, "Rejection note is required");

    const scope = getStationScope(req);
    if (scope.error) return fail(res, 400, scope.error);

    const request = await MaintenanceRequest.findOneAndUpdate(
      {
        _id: requestId,
        status: "completed",
        ...(scope.stationId && { stationId: scope.stationId }),
      },
      {
        $set: { status: "in_progress", rejectionNote },
        $push: {
          timeline: {
            status: "rejected",
            note: rejectionNote,
            by: userType,
            byId: _id,
            at: new Date(),
          },
        },
      },
      { new: true },
    );
    if (!request)
      return fail(res, 400, "Only a completed request can be rejected");

    return res.json({
      status: 200,
      success: true,
      message: "Request sent back to the mechanic",
      data: request,
    });
  } catch (error) {
    console.error("rejectMaintenanceRequest error:", error);
    return fail(res, 500, "Internal server error");
  }
};

// CANCEL
// The block stays active; after cancelling, admin can unblock it manually as before.
const cancelMaintenanceRequest = async (req, res) => {
  try {
    const { _id, userType } = req.user;
    const { requestId, note } = req.body;

    if (!mongoose.isValidObjectId(requestId))
      return fail(res, 400, "Valid requestId is required");

    const scope = getStationScope(req);
    if (scope.error) return fail(res, 400, scope.error);

    const request = await MaintenanceRequest.findOneAndUpdate(
      {
        _id: requestId,
        status: { $in: OPEN_STATUSES },
        ...(scope.stationId && { stationId: scope.stationId }),
      },
      {
        $set: { status: "cancelled" },
        $push: {
          timeline: {
            status: "cancelled",
            note,
            by: userType,
            byId: _id,
            at: new Date(),
          },
        },
      },
      { new: true },
    );
    if (!request)
      return fail(res, 400, "Only an open request can be cancelled");

    return res.json({
      status: 200,
      success: true,
      message: "Repair request cancelled",
      data: request,
    });
  } catch (error) {
    console.error("cancelMaintenanceRequest error:", error);
    return fail(res, 500, "Internal server error");
  }
};

// ADJUSTMENT (correction after approval)
// amount can be negative (refund / correction) but never zero.
const addExpenseAdjustment = async (req, res) => {
  try {
    const { _id, userType } = req.user;
    const { requestId, amount, category, description } = req.body;

    if (!mongoose.isValidObjectId(requestId))
      return fail(res, 400, "Valid requestId is required");
    if (typeof amount !== "number" || !isFinite(amount) || amount === 0)
      return fail(res, 400, "amount must be a non-zero number");
    if (!COST_CATEGORIES.includes(category))
      return fail(res, 400, "Invalid category");
    if (!description?.trim())
      return fail(res, 400, "Description is required for an adjustment");

    const request = await MaintenanceRequest.findById(requestId);
    if (!request) return fail(res, 404, "Repair request not found");
    const denied = outOfScope(req, request.stationId);
    if (denied) return fail(res, denied.status, denied.message);
    if (request.status !== "approved")
      return fail(
        res,
        400,
        "Adjustments are allowed only on approved requests",
      );

    // the request's total must never go below zero
    const [current] = await MaintenanceExpense.aggregate([
      { $match: { maintenanceRequestId: request._id } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    if ((current?.total || 0) + amount < 0)
      return fail(res, 400, "Adjustment would make the request total negative");

    const expense = await MaintenanceExpense.create({
      maintenanceRequestId: request._id,
      vehicleTableId: request.vehicleTableId,
      stationId: request.stationId,
      locationId: request.locationId,
      category,
      description,
      amount,
      entryType: "adjustment",
      expenseDate: new Date(),
      createdBy: userType,
      createdById: _id,
    });

    return res.json({
      status: 200,
      success: true,
      message: "Adjustment added",
      data: expense,
    });
  } catch (error) {
    console.error("addExpenseAdjustment error:", error);
    return fail(res, 500, "Internal server error");
  }
};

// SERVICE HISTORY (one vehicle)
const getVehicleServiceHistory = async (req, res) => {
  try {
    const { vehicleTableId } = req.params;
    if (!mongoose.isValidObjectId(vehicleTableId))
      return fail(res, 400, "Invalid vehicleTableId");

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const scope = getStationScope(req);
    if (scope.error) return fail(res, 400, scope.error);
    const filter = {
      vehicleTableId,
      status: "approved",
      ...(scope.stationId && { stationId: scope.stationId }),
    };

    const [requests, total] = await Promise.all([
      MaintenanceRequest.find(filter)
        .select(
          "type problemDescription odometerReading serviceReadings bookingId mechanicNotes mechanicId attachments approvedAt completedAt createdAt",
        )
        .populate("mechanicId", "firstName lastName phone")
        .populate("bookingId", "bookingId")
        .sort({ approvedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      MaintenanceRequest.countDocuments(filter),
    ]);

    const expenses = await MaintenanceExpense.find({
      maintenanceRequestId: { $in: requests.map((r) => r._id) },
    })
      .sort({ expenseDate: 1 })
      .lean();

    const byRequest = {};
    for (const e of expenses) {
      const key = String(e.maintenanceRequestId);
      (byRequest[key] ||= []).push(e);
    }

    const data = requests.map((r) => {
      const lines = byRequest[String(r._id)] || [];
      const totalCost =
        Math.round(lines.reduce((t, e) => t + e.amount, 0) * 100) / 100;
      return { ...r, expenses: lines, totalCost };
    });

    return res.json({ status: 200, success: true, data, page, limit, total });
  } catch (error) {
    console.error("getVehicleServiceHistory error:", error);
    return fail(res, 500, "Internal server error");
  }
};

// SEARCH VEHICLES ON AN ONGOING RIDE
const searchOngoingBookingVehicles = async (req, res) => {
  try {
    const search = req.query.search?.trim();
    if (!search || search.length < 2)
      return fail(
        res,
        400,
        "Enter at least 2 characters of the vehicle number",
      );

    const scope = getStationScope(req);
    if (scope.error) return fail(res, 400, scope.error);

    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const bookings = await Booking.find({
      rideStatus: "ongoing",
      "vehicleBasic.vehicleNumber": { $regex: escaped, $options: "i" },
      ...(scope.stationId && { stationId: scope.stationId }),
    })
      .select(
        "bookingId stationName vehicleName vehicleBasic.vehicleNumber userId BookingEndDateAndTime",
      )
      .populate("userId", "firstName lastName contact")
      .limit(20)
      .lean();

    const bookingIds = bookings.map((b) => b.bookingId);
    const [pickups, openRequests] = await Promise.all([
      pickupImage
        .find({ bookingId: { $in: bookingIds } })
        .select("bookingId startMeterReading")
        .lean(),
      MaintenanceRequest.find({
        bookingId: { $in: bookings.map((b) => b._id) },
        status: { $in: OPEN_STATUSES },
      })
        .select("bookingId")
        .lean(),
    ]);

    const startByBooking = new Map(
      pickups.map((p) => [p.bookingId, p.startMeterReading]),
    );
    const openSet = new Set(openRequests.map((r) => String(r.bookingId)));

    const data = bookings.map((b) => ({
      _id: b._id,
      bookingId: b.bookingId,
      vehicleNumber: b.vehicleBasic?.vehicleNumber,
      vehicleName: b.vehicleName,
      customerName:
        `${b.userId?.firstName || ""} ${b.userId?.lastName || ""}`.trim(),
      contact: b.userId?.contact,
      rideEndsAt: b.BookingEndDateAndTime,
      startMeterReading: startByBooking.get(b.bookingId) ?? 0,
      hasOpenService: openSet.has(String(b._id)),
    }));

    return res.json({ status: 200, success: true, data });
  } catch (error) {
    console.error("searchOngoingBookingVehicles error:", error);
    return fail(res, 500, "Internal server error");
  }
};

// SEND A VEHICLE ON AN ONGOING RIDE FOR SERVICE
const sendBookingVehicleForService = async (req, res) => {
  try {
    const { _id, userType, firstName } = req.user;
    const {
      bookingId,
      type,
      problemDescription,
      readingBeforeService,
      mechanicId,
    } = req.body;

    if (!mongoose.isValidObjectId(bookingId))
      return fail(res, 400, "Valid bookingId is required");
    if (!problemDescription?.trim())
      return fail(res, 400, "Problem description is required");

    const workType = type || "repair";
    if (!REQUEST_TYPES.includes(workType))
      return fail(res, 400, "Invalid work type");

    const before = readingBeforeService;
    if (typeof before !== "number" || !isFinite(before) || before < 0)
      return fail(res, 400, "Enter the current meter reading");

    const booking = await Booking.findById(bookingId).select(
      "bookingId userId stationId rideStatus vehicleBasic",
    );
    if (!booking) return fail(res, 404, "Booking not found");
    if (booking.rideStatus !== "ongoing")
      return fail(
        res,
        400,
        "Only a vehicle on an ongoing ride can be sent for service this way",
      );

    const vehicle = await vehicleTable
      .findOne({ vehicleNumber: booking.vehicleBasic?.vehicleNumber })
      .select("stationId locationId");
    if (!vehicle) return fail(res, 404, "Vehicle not found");

    const denied = outOfScope(req, vehicle.stationId);
    if (denied) return fail(res, denied.status, denied.message);

    const existing = await MaintenanceRequest.exists({
      bookingId: booking._id,
      status: { $in: OPEN_STATUSES },
    });
    if (existing)
      return fail(
        res,
        400,
        "A service request is already open for this booking",
      );

    const pickupDoc = await pickupImage
      .findOne({ bookingId: booking.bookingId })
      .select("startMeterReading");
    if (!pickupDoc)
      return fail(res, 400, "Pickup record not found for this booking");

    const startReading = Number(pickupDoc.startMeterReading || 0);
    if (before < startReading)
      return fail(
        res,
        400,
        `Meter reading must be at least ${startReading} km (the reading at pickup)`,
      );

    const assignedMechanicId = await resolveMechanicId({
      userType,
      userId: _id,
      mechanicId,
    });

    const request = await MaintenanceRequest.create({
      bookingId: booking._id,
      vehicleTableId: vehicle._id,
      stationId: vehicle.stationId,
      locationId: vehicle.locationId,
      mechanicId: assignedMechanicId,
      type: workType,
      problemDescription: problemDescription.trim(),
      serviceReadings: { readingBeforeService: before },
      status: "pending",
      createdBy: userType,
      createdById: _id,
      timeline: [
        {
          status: "pending",
          note: "Sent for service",
          by: userType,
          byId: _id,
        },
      ],
    });

    // booking timeline: never fail the request because of it
    try {
      const tl = await timelineFunctionServer({
        bookingId: booking.bookingId,
        userId: booking.userId,
        currentBooking_id: booking._id,
        timeLine: [
          {
            title: "Vehicle sent for service",
            serviceType: workType,
            reason: problemDescription.trim(),
            meterReadingBeforeService: before,
            date: Date.now(),
            createdBy: { id: _id, firstName },
          },
        ],
      });
      if (tl?.status !== 200)
        console.error("Service timeline failed:", tl?.message);
    } catch (e) {
      console.error("Service timeline failed:", e.message);
    }

    return res.json({
      status: 200,
      success: true,
      message: "Vehicle sent for service",
      data: request,
    });
  } catch (error) {
    if (error.isBusiness) return fail(res, error.status, error.message);
    console.error("sendBookingVehicleForService error:", error);
    return fail(res, 500, "Internal server error");
  }
};

module.exports = {
  createMaintenanceRequest,
  updateMaintenanceRequest,
  listMaintenanceRequests,
  getMaintenanceRequest,
  approveMaintenanceRequest,
  rejectMaintenanceRequest,
  cancelMaintenanceRequest,
  addExpenseAdjustment,
  getVehicleServiceHistory,
  searchOngoingBookingVehicles,
  sendBookingVehicleForService,
};
