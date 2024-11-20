const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userType: {
    type: String,
    enum: ["manager", "customer", "admin"],
    required: true
  },
  otp: {
    type: String
  },
  password: {
    type: String
  },
  isEmailVerified: {
    type: String,
    enum: ["yes", "no"],
    default: "no"
  },
  isContactVerified: {
    type: String,
    enum: ["yes", "no"],
    default: "no"
  },
  kycApproved: {
    type: String,
    enum: ["yes", "no"],
    default: "no"
  },
  userDocuments: {
    type: Array,
    default: []
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    required: true
  },
  altContact: {
    type: String,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  drivingLicence: {
    type: String,
   // required: true,
    trim: true
  },
  idProof: {
    type: String,
    //required: true,
    trim: true
  },
  addressProof: {
    type: String,
   // required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  contact: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
