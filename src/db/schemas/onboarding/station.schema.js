const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const stationSchema = new Schema({
    stationName: {
      type: String,
      required: true
    },
    stationId: {
      type: String,
      required: true,
      unique: true
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'location',
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'user'
    },
    country: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    pinCode: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    latitude: {
      type: String
    },
    longitude: {
      type: String
    }
  }, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });
  
  const station = mongoose.model('station', stationSchema);
  
  module.exports = station;
  

  