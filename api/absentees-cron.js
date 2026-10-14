const mongoose = require("mongoose");

const Attendance = require("../src/db/schemas/onboarding/attendance.schema");
const Station = require("../src/db/schemas/onboarding/station.schema");
const User = require("../src/db/schemas/onboarding/user.schema");

async function ensureDBConnection() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve) => {
      mongoose.connection.once("connected", resolve);
    });
    return;
  }

  mongoose.set("strictQuery", false);
  await mongoose.connect(process.env.DB_URL);
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const istDate = (d) =>
  new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
const weekdayOf = (date) => new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday

async function markAbsentees(now = new Date()) {
  const hourNow = new Date(now.getTime() + IST_OFFSET_MS).getUTCHours();
  const today = istDate(now);
  const yesterday = istDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));

  const stations = await Station.find({ status: "active" })
    .select("userId fleetIds openEndTime")
    .lean();

  const passes = [
    // today: only stations whose closing hour has passed
    // (openEndTime 0 means midnight, so it is never "closed" during the day)
    {
      date: today,
      list: stations.filter((st) => {
        const close = st.openEndTime === 0 ? 24 : st.openEndTime;
        return close <= hourNow;
      }),
    },
  ];
  // yesterday catch-up for server downtime, only in the early hours so staff
  // added later in the day are not marked absent for a day before they joined
  if (hourNow < 6) passes.push({ date: yesterday, list: stations });

  let created = 0;
  for (const { date, list } of passes) {
    if (!list.length) continue;
    const weekday = weekdayOf(date);

    const stationOfUser = new Map();
    list.forEach((st) => {
      [...(st.userId || []), ...(st.fleetIds || [])].forEach((id) =>
        stationOfUser.set(String(id), st._id),
      );
    });
    const staffIds = [...stationOfUser.keys()];
    if (!staffIds.length) continue;

    const [users, existing] = await Promise.all([
      User.find({
        _id: { $in: staffIds },
        status: "active",
        isDeleted: { $ne: true },
        weeklyOff: { $ne: weekday }, // also matches people with no weekly off set
      })
        .select("_id")
        .lean(),
      Attendance.find({ date, userId: { $in: staffIds } })
        .select("userId")
        .lean(),
    ]);

    const done = new Set(existing.map((r) => String(r.userId)));
    const ops = users
      .filter((u) => !done.has(String(u._id)))
      .map((u) => ({
        updateOne: {
          filter: { userId: u._id, date },
          update: {
            $setOnInsert: {
              stationId: stationOfUser.get(String(u._id)),
              userId: u._id,
              date,
              status: "absent",
            },
          },
          upsert: true,
        },
      }));
    if (!ops.length) continue;

    try {
      const res = await Attendance.bulkWrite(ops, { ordered: false });
      created += res.upsertedCount || 0;
    } catch (err) {
      // a check-in racing the job causes a duplicate key, which is fine
      const onlyDuplicates =
        err.code === 11000 ||
        (err.writeErrors || []).every((e) => (e.code ?? e.err?.code) === 11000);
      if (!onlyDuplicates) throw err;
    }
  }
  return created;
}

module.exports = async (req, res) => {
  // Verify the request is from Vercel Cron
  if (process.env.NODE_ENV !== "production") {
    console.log("Development mode: Skipping cron authorization");
  } else {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    console.log("Cron job started: marking absent...");

    // Connect to database
    await ensureDBConnection();

    const created = await markAbsentees();
    return res.status(200).json({ status: 200, created });
  } catch (error) {
    console.error("markAbsentees failed:", error.message);
    return res.status(500).json({ status: 500, message: "Job failed" });
  }
};
