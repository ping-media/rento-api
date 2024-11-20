const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VehicleSchema = new Schema({
  bookingCount: {
    type: Number,
    required: true
  },
  pricePerday: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  distanceLimit: {
    type: String,
    required: true
  },
  accessChargePerKm: {
    type: String,
    required: true
  },
  transmissionType: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const Vehicle = mongoose.model('Vehicle', VehicleSchema);

module.exports = Vehicle;
