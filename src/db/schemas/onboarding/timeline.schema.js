const mongoose = require ("mongoose");
const Schema = mongoose.Schema;


const timelineSchema= new mongoose.Schema({
    bookingId:{
        type:String,
        require:true,
    },
    userId:{
      type: Schema.Types.ObjectId,
      require:true,
      ref: 'User'
    },
    currentBooking_id:{
      type: Schema.Types.ObjectId,

      ref: 'Booking'
    },
    timeLine:[{
        type:Object,
        require:true
    }]
},{timestamps:{ createdAt: 'createdAt', updatedAt: 'updatedAt' }})

const Timeline = mongoose.model('Timeline', timelineSchema);
  
  module.exports = Timeline;