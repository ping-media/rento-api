const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const locationSchema = new Schema({
    locationName: {
      type: String,
      required: true
    },
    locationImage: {
      type: String,
      required: true
    },
    imageFileName: {
      type: String,
      
    },
    locationStatus: {
      type: String,
    //  required: true,
      default: "active"
    },
  }, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

  locationSchema.pre('save', function (next) {
    if (this.locationName) {
      this.locationName = this.locationName.toLowerCase(); 
    }
    if (this.locationStatus) {
      this.locationStatus = this.locationStatus.toLowerCase(); 
    }
   
    next();
  });
  
  
  const location = mongoose.model('location', locationSchema);
  
  module.exports = location;
  

  