const mongoose = require("mongoose");
const MaintenanceExpense = require("../../../db/schemas/onboarding/maintenanceExpense.schema");

const fail = (res, status, message) =>
  res.json({ status, success: false, message });

const round2 = (n) => Math.round((n || 0) * 100) / 100;
const IST = "+05:30";

// optional station / location filter (locationId must be cast in aggregates)
const scopeMatch = (query) => {
  const match = {};
  if (query.stationId) match.stationId = String(query.stationId);
  if (query.locationId) {
    if (!mongoose.isValidObjectId(query.locationId)) return null;
    match.locationId = new mongoose.Types.ObjectId(query.locationId);
  }
  return match;
};

// "2026-11" -> [start, end) as real instants, using IST month boundaries
const monthRange = (month) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || "")) return null;
  const [y, m] = month.split("-").map(Number);
  const next =
    m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return {
    start: new Date(`${month}-01T00:00:00${IST}`),
    end: new Date(`${next}-01T00:00:00${IST}`),
  };
};

// A. Vehicle-wise monthly expense
// GET ?month=2026-11&stationId=&locationId=
const vehicleMonthlyReport = async (req, res) => {
  try {
    const range = monthRange(req.query.month);
    if (!range) return fail(res, 400, "month is required in YYYY-MM format");
    const scope = scopeMatch(req.query);
    if (!scope) return fail(res, 400, "Invalid locationId");

    const rows = await MaintenanceExpense.aggregate([
      {
        $match: {
          ...scope,
          expenseDate: { $gte: range.start, $lt: range.end },
        },
      },
      {
        $group: {
          _id: "$vehicleTableId",
          total: { $sum: "$amount" },
          repairs: { $addToSet: "$maintenanceRequestId" },
        },
      },
      {
        $lookup: {
          from: "vehicletables",
          localField: "_id",
          foreignField: "_id",
          as: "vehicle",
        },
      },
      {
        $project: {
          _id: 0,
          vehicleTableId: "$_id",
          vehicleNumber: { $arrayElemAt: ["$vehicle.vehicleNumber", 0] },
          total: 1,
          repairCount: { $size: "$repairs" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const vehicles = rows.map((r) => ({ ...r, total: round2(r.total) }));
    const grandTotal = round2(vehicles.reduce((t, r) => t + r.total, 0));

    return res.json({
      status: 200,
      success: true,
      data: { month: req.query.month, vehicles, grandTotal },
    });
  } catch (error) {
    console.error("vehicleMonthlyReport error:", error);
    return fail(res, 500, "Internal server error");
  }
};

// B. Lifetime expense of one vehicle
// GET /:vehicleTableId
const vehicleLifetimeReport = async (req, res) => {
  try {
    const { vehicleTableId } = req.params;
    if (!mongoose.isValidObjectId(vehicleTableId))
      return fail(res, 400, "Invalid vehicleTableId");

    const [result] = await MaintenanceExpense.aggregate([
      {
        $match: { vehicleTableId: new mongoose.Types.ObjectId(vehicleTableId) },
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                total: { $sum: "$amount" },
                repairs: { $addToSet: "$maintenanceRequestId" },
                firstExpense: { $min: "$expenseDate" },
                lastExpense: { $max: "$expenseDate" },
              },
            },
          ],
          byCategory: [
            { $group: { _id: "$category", total: { $sum: "$amount" } } },
            { $sort: { total: -1 } },
          ],
        },
      },
    ]);

    const t = result.totals[0];
    const totalExpense = round2(t?.total);
    const repairCount = t ? t.repairs.length : 0;

    return res.json({
      status: 200,
      success: true,
      data: {
        vehicleTableId,
        totalExpense,
        repairCount,
        averagePerRepair: repairCount ? round2(totalExpense / repairCount) : 0,
        firstExpense: t?.firstExpense || null,
        lastExpense: t?.lastExpense || null,
        byCategory: result.byCategory.map((c) => ({
          category: c._id,
          total: round2(c.total),
        })),
      },
    });
  } catch (error) {
    console.error("vehicleLifetimeReport error:", error);
    return fail(res, 500, "Internal server error");
  }
};

// C. Fleet maintenance summary
// GET ?from=2026-01-01&to=2026-11-30&stationId=&locationId=   (from/to optional, IST dates, both inclusive)
const fleetSummaryReport = async (req, res) => {
  try {
    const scope = scopeMatch(req.query);
    if (!scope) return fail(res, 400, "Invalid locationId");

    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    const { from, to } = req.query;
    if ((from && !dateRe.test(from)) || (to && !dateRe.test(to)))
      return fail(res, 400, "from and to must be in YYYY-MM-DD format");

    const match = { ...scope };
    if (from || to) {
      match.expenseDate = {};
      if (from) match.expenseDate.$gte = new Date(`${from}T00:00:00${IST}`);
      if (to)
        match.expenseDate.$lt = new Date(
          new Date(`${to}T00:00:00${IST}`).getTime() + 24 * 60 * 60 * 1000,
        );
    }

    const [result] = await MaintenanceExpense.aggregate([
      { $match: match },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                total: { $sum: "$amount" },
                repairs: { $addToSet: "$maintenanceRequestId" },
              },
            },
          ],
          byCategory: [
            { $group: { _id: "$category", total: { $sum: "$amount" } } },
            { $sort: { total: -1 } },
          ],
          topVehicles: [
            { $group: { _id: "$vehicleTableId", total: { $sum: "$amount" } } },
            { $sort: { total: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: "vehicletables",
                localField: "_id",
                foreignField: "_id",
                as: "vehicle",
              },
            },
            {
              $project: {
                _id: 0,
                vehicleTableId: "$_id",
                vehicleNumber: { $arrayElemAt: ["$vehicle.vehicleNumber", 0] },
                total: 1,
              },
            },
          ],
          monthly: [
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m",
                    date: "$expenseDate",
                    timezone: "Asia/Kolkata",
                  },
                },
                total: { $sum: "$amount" },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    const t = result.totals[0];
    const totalExpense = round2(t?.total);
    const repairCount = t ? t.repairs.length : 0;

    return res.json({
      status: 200,
      success: true,
      data: {
        totalExpense,
        repairCount,
        averagePerRepair: repairCount ? round2(totalExpense / repairCount) : 0,
        highestExpenseVehicle: result.topVehicles[0]
          ? {
              ...result.topVehicles[0],
              total: round2(result.topVehicles[0].total),
            }
          : null,
        topVehicles: result.topVehicles.map((v) => ({
          ...v,
          total: round2(v.total),
        })),
        byCategory: result.byCategory.map((c) => ({
          category: c._id,
          total: round2(c.total),
        })),
        monthlyTrend: result.monthly.map((m) => ({
          month: m._id,
          total: round2(m.total),
        })),
      },
    });
  } catch (error) {
    console.error("fleetSummaryReport error:", error);
    return fail(res, 500, "Internal server error");
  }
};

const EXPORT_CHUNK_SIZE = 1000;

// EXPORT (expense lines in a date range, cursor based)
// GET ?startDate=2026-11-01&endDate=2026-11-30&stationId=&cursor=
const expenseExport = async (req, res) => {
  const response = {
    status: 200,
    message: "Data fetched successfully",
    data: [],
  };

  try {
    const { cursor, startDate, endDate, stationId } = req.query;

    if (cursor && !mongoose.Types.ObjectId.isValid(cursor)) {
      return res.json({ status: 400, message: "Invalid cursor", data: [] });
    }

    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    const start = new Date(`${startDate}T00:00:00${IST}`);
    if (
      !dateRe.test(startDate || "") ||
      !dateRe.test(endDate || "") ||
      isNaN(start) ||
      isNaN(new Date(`${endDate}T00:00:00${IST}`)) ||
      startDate > endDate
    ) {
      return res.json({
        status: 400,
        message: "startDate and endDate are required (YYYY-MM-DD)",
        data: [],
      });
    }

    // both dates inclusive, IST day boundaries
    const endExclusive = new Date(
      new Date(`${endDate}T00:00:00${IST}`).getTime() + 24 * 60 * 60 * 1000,
    );

    const baseFilter = { expenseDate: { $gte: start, $lt: endExclusive } };
    if (stationId) baseFilter.stationId = String(stationId);

    // first call only: total count so the frontend can show progress
    if (!cursor) {
      response.total = await MaintenanceExpense.countDocuments(baseFilter);

      if (response.total === 0) {
        return res.json({
          ...response,
          message: "No records found",
          pagination: {
            limit: EXPORT_CHUNK_SIZE,
            hasMore: false,
            nextCursor: null,
          },
        });
      }
    }

    const rows = await MaintenanceExpense.aggregate([
      {
        $match: cursor
          ? {
              ...baseFilter,
              _id: { $gt: new mongoose.Types.ObjectId(cursor) },
            }
          : baseFilter,
      },
      { $sort: { _id: 1 } },
      { $limit: EXPORT_CHUNK_SIZE + 1 }, // one extra row tells us if there is a next chunk
      {
        $lookup: {
          from: "vehicletables",
          localField: "vehicleTableId",
          foreignField: "_id",
          as: "vehicleData",
          pipeline: [{ $project: { vehicleNumber: 1 } }],
        },
      },
      {
        $lookup: {
          from: "stations",
          localField: "stationId",
          foreignField: "stationId",
          as: "stationData",
          pipeline: [{ $project: { stationName: 1 } }],
        },
      },
      {
        $lookup: {
          from: "maintenancerequests",
          localField: "maintenanceRequestId",
          foreignField: "_id",
          as: "requestData",
          pipeline: [{ $project: { type: 1 } }],
        },
      },
      {
        $project: {
          expenseDate: 1,
          category: 1,
          description: 1,
          amount: 1,
          entryType: 1,
          vehicleNumber: { $arrayElemAt: ["$vehicleData.vehicleNumber", 0] },
          stationName: { $arrayElemAt: ["$stationData.stationName", 0] },
          workType: { $arrayElemAt: ["$requestData.type", 0] },
        },
      },
    ]);

    const hasMore = rows.length > EXPORT_CHUNK_SIZE;
    const data = hasMore ? rows.slice(0, EXPORT_CHUNK_SIZE) : rows;

    response.data = data;
    response.pagination = {
      limit: EXPORT_CHUNK_SIZE,
      hasMore,
      nextCursor: hasMore ? data[data.length - 1]._id.toString() : null,
    };

    return res.json(response);
  } catch (error) {
    console.error("Error exporting maintenance expenses:", error.message);
    return res.json({
      status: 500,
      message: "An error occurred while exporting expense data",
      data: [],
    });
  }
};

module.exports = {
  expenseExport,
  vehicleMonthlyReport,
  vehicleLifetimeReport,
  fleetSummaryReport,
};
