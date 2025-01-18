const mongoose = require ("mongoose");

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
    timeline:{
        type:Object,
        require:true
    }
},{timestamps:{ createdAt: 'createdAt', updatedAt: 'updatedAt' }})

const Timeline = mongoose.model('Timeline', timelineSchema);
  
  module.exports = Timeline;