const mongoose = require("mongoose");

const cronLockSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  isRunning: { type: Boolean, default: false },
  startedAt: { type: Date },
});

module.exports = mongoose.model("CronLock", cronLockSchema);
