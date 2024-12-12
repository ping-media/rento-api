const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VehicleSchema = new Schema({
  bookingCount: {
    type: Number,
    required: true
  },
  pricePerday: {
    type: Number,
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
    type: Number,
    required: true
  },
  accessChargePerKm: {
    type: Number,
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


// Pre-save middleware to convert fields to lowercase
VehicleSchema.pre('save', function (next) {
  if (this.name) {
    this.name = this.name.toLowerCase(); // Convert name to lowercase
  }
  if (this.brand) {
    this.brand = this.brand.toLowerCase(); // Convert brand to lowercase
  }
  next();
});

const Vehicle = mongoose.model('Vehicle', VehicleSchema);

module.exports = Vehicle;
