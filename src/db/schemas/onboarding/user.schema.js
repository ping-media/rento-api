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
  // userDocuments: {
  //   type: Array,
  //   default: []
  // },
  status: {
    type: String,
    enum: ["active", "inactive"],
    required: true
  },
  gender: {
    type: String,
    enum: ["male", "female", "not specified", "others"],
    default:"not specified"
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
   // required: true,
  },
  dateofbirth: {
    type: String,
   
  }
}, { timestamps: true });


userSchema.pre('save', function (next) {
  if (this.firstName) {
    this.firstName = this.firstName.toLowerCase(); 
  }
  if (this.lastName) {
    this.lastName = this.lastName.toLowerCase(); 
  }
 
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
