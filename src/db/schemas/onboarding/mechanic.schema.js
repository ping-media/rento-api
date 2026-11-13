const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const mechanicSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    specialisation: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

mechanicSchema.index({ isActive: 1 });

module.exports = mongoose.model("Mechanic", mechanicSchema);
