const mongoose = require("mongoose");
const Attendance = require("../../../db/schemas/onboarding/attendance.schema");
const Station = require("../../../db/schemas/onboarding/station.schema");
const User = require("../../../db/schemas/onboarding/user.schema");

/* ---------- helpers ---------- */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const weekdayOf = (date) => new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday
const toIst = (d) => new Date(new Date(d).getTime() + IST_OFFSET_MS);
const istDate = (d = new Date()) => toIst(d).toISOString().slice(0, 10);
const istMinutes = (d) => {
  const t = toIst(d);
  return t.getUTCHours() * 60 + t.getUTCMinutes();
};
const hhmmToMinutes = (s) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};
const toNum = (v) =>
  v === undefined || v === null || v === "" ? NaN : Number(v);
const toRad = (d) => (d * Math.PI) / 180;

const distanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
};

const findStationForUser = async (userId) => {
  const station = await Station.findOne({
    $or: [{ userId }, { fleetIds: userId }],
    status: "active",
  })
    .select(
      "stationName latitude longitude attendanceRadiusMeters attendanceRules userId fleetIds",
    )
    .lean();
  if (!station) return { station: null };
  const isManager = (station.userId || []).some(
    (id) => String(id) === String(userId),
  );
  return { station, role: "manager" };
};

// flags are derived at read time; null means "rule not set, not evaluated"
const buildFlags = (rec, rules, today) => {
  const flags = {
    late: null,
    lateByMinutes: null,
    earlyLeave: null,
    earlyByMinutes: null,
    missingCheckOut: false,
    halfDay: false,
    halfDayReason: null,
    dayValue: 1,
  };
  if (rules?.checkInTime && rec.checkIn?.at) {
    const after = istMinutes(rec.checkIn.at) - hhmmToMinutes(rules.checkInTime);
    flags.lateByMinutes = Math.max(0, after);
    flags.late = after > (rules.lateGraceMinutes ?? 15);
  }
  if (rules?.checkOutTime && rec.checkOut?.at) {
    const before =
      hhmmToMinutes(rules.checkOutTime) - istMinutes(rec.checkOut.at);
    flags.earlyByMinutes = Math.max(0, before);
    flags.earlyLeave = before > (rules.earlyLeaveGraceMinutes ?? 0);
  }
  flags.missingCheckOut =
    rec.status !== "absent" && !rec.checkOut?.at && rec.date < today;

  if (rec.status === "absent") {
    flags.dayValue = 0;
    return flags;
  }

  if (rec.checkIn?.at) {
    const hasBoundary = rules?.halfDayCheckInTime || rules?.halfDayCheckOutTime;
    if (hasBoundary) {
      if (
        rules.halfDayCheckInTime &&
        istMinutes(rec.checkIn.at) > hhmmToMinutes(rules.halfDayCheckInTime)
      ) {
        flags.halfDay = true;
        flags.halfDayReason = "late_check_in";
      } else if (
        rules.halfDayCheckOutTime &&
        rec.checkOut?.at &&
        istMinutes(rec.checkOut.at) < hhmmToMinutes(rules.halfDayCheckOutTime)
      ) {
        flags.halfDay = true;
        flags.halfDayReason = "early_check_out";
      }
    } else if (rec.checkOut?.at) {
      const workedMinutes =
        (new Date(rec.checkOut.at) - new Date(rec.checkIn.at)) / 60000;
      if (workedMinutes < (rules?.fullDayHours ?? 8) * 60) {
        flags.halfDay = true;
        flags.halfDayReason = "short_hours";
      }
    }
  }
  flags.dayValue = flags.halfDay ? 0.5 : 1;

  return flags;
};

/* ---------- check-in / check-out ---------- */
async function markAttendance({ userId, type, latitude, longitude, accuracy }) {
  try {
    const lat = toNum(latitude);
    const lng = toNum(longitude);
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180
    ) {
      return {
        status: 400,
        message: "Valid latitude and longitude are required",
        data: {},
      };
    }

    const user = await User.findById(userId).select("status isDeleted").lean();
    if (!user || user.status !== "active" || user.isDeleted === true) {
      return { status: 403, message: "Your account is not active", data: {} };
    }

    const { station } = await findStationForUser(userId);
    if (!station) {
      return {
        status: 404,
        message: "No active station is assigned to you",
        data: {},
      };
    }

    const skipGeofence = process.env.NODE_ENV === "development";

    const sLat = parseFloat(station.latitude);
    const sLng = parseFloat(station.longitude);
    const hasStationCoords = Number.isFinite(sLat) && Number.isFinite(sLng);
    if (!hasStationCoords && !skipGeofence) {
      return {
        status: 422,
        message: "Station location is not set. Please contact admin.",
        data: {},
      };
    }

    const radius = station.attendanceRadiusMeters || 200;
    const distance = hasStationCoords
      ? distanceMeters(lat, lng, sLat, sLng)
      : 0;
    if (!skipGeofence && distance > radius) {
      return {
        status: 403,
        message: `You are ${distance} m from the station. You must be within ${radius} m.`,
        data: { distanceMeters: distance, radiusMeters: radius },
      };
    }

    const now = new Date();
    const date = istDate(now);
    const acc = toNum(accuracy);
    const point = {
      at: now,
      latitude: lat,
      longitude: lng,
      distanceMeters: distance,
      ...(Number.isFinite(acc) && { accuracy: acc }),
    };

    if (type === "checkIn") {
      // a scheduler-created absent row for today turns into present
      const converted = await Attendance.findOneAndUpdate(
        { userId, date, status: "absent" },
        { $set: { status: "present", checkIn: point } },
        { new: true },
      );
      if (converted) {
        return {
          status: 200,
          message: "Checked in successfully",
          data: converted,
        };
      }

      try {
        const doc = await Attendance.create({
          stationId: station._id,
          userId,
          date,
          checkIn: point,
        });
        return { status: 200, message: "Checked in successfully", data: doc };
      } catch (err) {
        if (err.code === 11000) {
          return {
            status: 409,
            message: "You have already checked in today",
            data: {},
          };
        }
        throw err;
      }
    }

    // check-out: atomic, only if checked in and not yet checked out
    const updated = await Attendance.findOneAndUpdate(
      {
        userId,
        date,
        "checkIn.at": { $exists: true },
        "checkOut.at": { $exists: false },
      },
      { $set: { checkOut: point } },
      { new: true },
    );
    if (!updated) {
      const existing = await Attendance.findOne({ userId, date })
        .select("status")
        .lean();
      return existing && existing.status !== "absent"
        ? {
            status: 409,
            message: "You have already checked out today",
            data: {},
          }
        : { status: 400, message: "Please check in first", data: {} };
    }
    return { status: 200, message: "Checked out successfully", data: updated };
  } catch (error) {
    console.error("Error marking attendance:", error.message);
    return { status: 500, message: "Internal server error", data: {} };
  }
}

/* ---------- today's state, drives which button the app shows ---------- */
async function getAttendanceToday({ userId }) {
  try {
    const { station } = await findStationForUser(userId);
    if (!station) {
      return {
        status: 404,
        message: "No active station is assigned to you",
        data: {},
      };
    }
    const date = istDate();
    const record = await Attendance.findOne({ userId, date }).lean();
    return {
      status: 200,
      message: "Data fetched successfully",
      data: {
        date,
        station: {
          _id: station._id,
          stationName: station.stationName,
          latitude: station.latitude,
          longitude: station.longitude,
          radiusMeters: station.attendanceRadiusMeters || 200,
        },
        record: record || null,
        canCheckIn: !record || record.status === "absent",
        canCheckOut: !!record?.checkIn?.at && !record?.checkOut?.at,
      },
    };
  } catch (error) {
    console.error("Error fetching attendance status:", error.message);
    return { status: 500, message: "Internal server error", data: {} };
  }
}

/* ---------- report ---------- */
async function getAttendanceReport({
  requesterId,
  stationId,
  userId,
  from,
  to,
  page = 1,
  limit = 20,
}) {
  const obj = {
    status: 200,
    message: "Data fetched successfully",
    data: [],
    pagination: {},
  };

  try {
    const today = istDate();
    const fromDate = from || to || today;
    const toDate = to || from || today;
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (
      !dateRe.test(fromDate) ||
      !dateRe.test(toDate) ||
      fromDate > toDate ||
      (Date.parse(toDate) - Date.parse(fromDate)) / 86400000 > 92
    ) {
      return {
        ...obj,
        status: 400,
        message: "Invalid date range (max 92 days)",
      };
    }
    if (userId && !mongoose.isValidObjectId(userId)) {
      return { ...obj, status: 400, message: "Invalid id" };
    }

    const me = await User.findById(requesterId)
      .select("userType status")
      .lean();
    if (!me || me.status !== "active" || me.userType === "customer") {
      return { ...obj, status: 403, message: "Not allowed" };
    }

    const filter = { date: { $gte: fromDate, $lte: toDate } };

    if (me.userType === "manager") {
      // station managers and fleet staff only ever see their own records
      filter.userId = requesterId;
    } else if (me.userType === "admin") {
      if (stationId) {
        if (/^[0-9a-fA-F]{24}$/.test(String(stationId))) {
          filter.stationId = stationId;
        } else {
          // station code (like the bookings filter uses)
          const st = await Station.findOne({ stationId: String(stationId) })
            .select("_id")
            .lean();
          if (!st) {
            return { ...obj, status: 404, message: "Station not found" };
          }
          filter.stationId = st._id;
        }
      }
      if (userId) filter.userId = userId;
    } else {
      return { ...obj, status: 403, message: "Not allowed" };
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const [total, records] = await Promise.all([
      Attendance.countDocuments(filter),
      Attendance.find(filter)
        .sort({ date: -1, "checkIn.at": 1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .populate("userId", "firstName lastName contact")
        .populate("stationId", "stationName attendanceRules")
        .lean(),
    ]);

    if (!records.length) {
      return { ...obj, status: 404, message: "No attendance found" };
    }

    obj.data = records.map((r) => ({
      ...r,
      flags: buildFlags(r, r.stationId?.attendanceRules, today),
    }));
    obj.pagination = {
      totalPages: Math.ceil(total / pageSize),
      currentPage: pageNumber,
      limit: pageSize,
    };
  } catch (error) {
    console.error("Error fetching attendance report:", error.message);
    return { ...obj, status: 500, message: "Internal server error" };
  }
  return obj;
}

async function getAttendanceMonth({ requesterId, userId, month }) {
  const fail = (status, message) => ({ status, message, data: {} });
  try {
    const today = istDate();
    const monthStr = /^\d{4}-(0[1-9]|1[0-2])$/.test(month || "")
      ? month
      : today.slice(0, 7);

    const me = await User.findById(requesterId)
      .select("userType status")
      .lean();
    if (!me || me.status !== "active" || me.userType === "customer") {
      return fail(403, "Not allowed");
    }

    let targetId;
    if (me.userType === "admin") {
      if (!userId || !mongoose.isValidObjectId(userId)) {
        return fail(400, "userId is required");
      }
      targetId = userId;
    } else if (me.userType === "manager") {
      targetId = requesterId; // managers and fleet staff only ever see themselves
    } else {
      return fail(403, "Not allowed");
    }

    const user = await User.findById(targetId)
      .select("firstName lastName weeklyOff")
      .lean();
    if (!user) return fail(404, "User not found");

    const records = await Attendance.find({
      userId: targetId,
      date: { $gte: `${monthStr}-01`, $lte: `${monthStr}-31` },
    })
      .populate("stationId", "stationName attendanceRules")
      .lean();
    const byDate = new Map(records.map((r) => [r.date, r]));

    const [y, m] = monthStr.split("-").map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();

    const days = [];
    const summary = {
      present: 0,
      halfDay: 0,
      absent: 0,
      weeklyOff: 0,
      workedMinutes: 0,
    };

    for (let d = lastDay; d >= 1; d--) {
      const date = `${monthStr}-${String(d).padStart(2, "0")}`;
      if (date > today) continue; // future days are not shown

      const rec = byDate.get(date);
      if (rec) {
        const f = buildFlags(rec, rec.stationId?.attendanceRules, today);
        const workedMinutes =
          rec.checkIn?.at && rec.checkOut?.at
            ? Math.round(
                (new Date(rec.checkOut.at) - new Date(rec.checkIn.at)) / 60000,
              )
            : null;
        const status =
          rec.status === "absent"
            ? "absent"
            : f.halfDay
              ? "half_day"
              : "present";

        if (status === "absent") summary.absent++;
        else if (status === "half_day") summary.halfDay++;
        else summary.present++;
        summary.workedMinutes += workedMinutes || 0;

        days.push({
          date,
          status,
          checkIn: rec.checkIn?.at || null,
          checkOut: rec.checkOut?.at || null,
          workedMinutes,
          flags: {
            late: f.late,
            lateByMinutes: f.lateByMinutes,
            earlyLeave: f.earlyLeave,
            earlyByMinutes: f.earlyByMinutes,
            halfDayReason: f.halfDayReason,
            missingCheckOut: f.missingCheckOut,
          },
        });
      } else if (user.weeklyOff === weekdayOf(date)) {
        summary.weeklyOff++;
        days.push({ date, status: "weekly_off" });
      } else if (date === today) {
        days.push({ date, status: "pending" });
      } else {
        days.push({ date, status: "none" }); // before joining or before the job existed
      }
    }

    return {
      status: 200,
      message: "Data fetched successfully",
      data: {
        month: monthStr,
        today,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          weeklyOff: user.weeklyOff ?? null,
        },
        days,
        summary,
      },
    };
  } catch (error) {
    console.error("Error fetching attendance month:", error.message);
    return fail(500, "Internal server error");
  }
}

module.exports = {
  markAttendance,
  getAttendanceToday,
  getAttendanceReport,
  getAttendanceMonth,
};
