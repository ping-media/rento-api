const Authentication = require("../../../middlewares/Authentication");
const {
  markAttendance,
  getAttendanceToday,
  getAttendanceReport,
  getAttendanceMonth,
} = require("../models/attendance.model");

const router = require("express").Router();

router.post("/attendance/check-in", Authentication, async (req, res) => {
  const { latitude, longitude, accuracy } = req.body;
  const result = await markAttendance({
    userId: req.user.id,
    type: "checkIn",
    latitude,
    longitude,
    accuracy,
  });
  return res.json(result);
});

router.post("/attendance/check-out", Authentication, async (req, res) => {
  const { latitude, longitude, accuracy } = req.body;
  const result = await markAttendance({
    userId: req.user.id,
    type: "checkOut",
    latitude,
    longitude,
    accuracy,
  });
  return res.json(result);
});

router.get("/attendance/today", Authentication, async (req, res) => {
  return res.json(await getAttendanceToday({ userId: req.user.id }));
});

router.get("/attendance/report", Authentication, async (req, res) => {
  return res.json(
    await getAttendanceReport({ requesterId: req.user.id, ...req.query }),
  );
});

router.get("/attendance/month", Authentication, async (req, res) => {
  const { userId, month } = req.query;
  return res.json(
    await getAttendanceMonth({ requesterId: req.user.id, userId, month }),
  );
});

module.exports = router;
