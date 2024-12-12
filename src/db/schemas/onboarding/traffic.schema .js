const mongoose = require('mongoose');

const trafficSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: false,
    trim: true
  },
  Contact: {
    type: Number,
    required: false,
    trim: true,
    // unique: true
  },
  email: {
    type: String,
    required: false,
    trim: true,
    //unique: true
  },
  Gender: {
    type: String,
    required: false,
    enum: ['Male', 'Female', 'Other','male', 'female', 'other'],
  },
  DOB: {
    type: Date,
    required: false
  },
}, { timestamps: true });

trafficSchema.pre('save', function (next) {
  if (this.Name) {
    this.Name = this.Name.toLowerCase(); 
  }
  if (this.Gender) {
    this.Gender = this.Gender.toLowerCase(); 
  }
 
  next();
});

const Traffic = mongoose.model('Traffic', trafficSchema);

module.exports = Traffic;
