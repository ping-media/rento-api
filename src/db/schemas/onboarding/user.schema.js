const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
 
  otp: {
    type: Number
  },
  password: {
    type: String
  },
 
  // userDocuments: {
  //   type: Array,
  //   default: []
  // },
  
 
 
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
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
 
  contact: {
    type: Number,
    required: true,
    trim: true,
    unique: true
  },
  altContact: {
    type: Number,
    trim: true
  },
  email: {
    type: String,
   // required: true,
  },
  dateofbirth: {
    type: String,
   
  },
  gender: {
    type: String,
    enum: ["male", "female", "not specified", "others"],
    default:"not specified"
  },
  userType: {
    type: String,
    enum: ["manager", "customer", "admin"],
    required: true
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
  status: {
    type: String,
    enum: ["active", "inactive"],
    required: true
  },
}, { timestamps: true });


userSchema.pre('save', function (next) {
  if (this.firstName) {
    this.firstName = this.firstName.toLowerCase(); 
  }
  if (this.lastName) {
    this.lastName = this.lastName.toLowerCase(); 
  }
  if (this.email) {
    this.email = this.email.toLowerCase(); 
  }
 
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
