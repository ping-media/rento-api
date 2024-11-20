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
    }
  }, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });
  
  const location = mongoose.model('location', locationSchema);
  
  module.exports = location;
  

  