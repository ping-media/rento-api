const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const logSchema = new Schema(
  {
    message: {
      type: String,
      required: true,
    },
    otherInfo: {
      type: Object,
    },
    functionName: {
      type: String,
    },
    platform: {
      type: String,
      enum: ["website", "app"],
      default: "website",
    },
    userId: {
      type: String,
      //required: true,
    },
    ipAddress: {
      type: Object,
      //required: true,
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } },
);

logSchema.pre("save", function (next) {
  if (this.message) {
    this.message = this.message.toLowerCase();
  }
  if (this.functionName) {
    this.functionName = this.functionName.toLowerCase();
  }

  next();
});

logSchema.index({ createdAt: -1 });
logSchema.index({ message: "text", functionName: "text" });
logSchema.index({ userId: 1 });

const Logs = mongoose.model("Logs", logSchema);

module.exports = Logs;
