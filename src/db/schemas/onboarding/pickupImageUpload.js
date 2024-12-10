const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pickupImageSchema = new Schema({
    pickupImage: {
      type: String,
      required: true,
     
    },
    userId: {
       type: Schema.Types.ObjectId,
       required: true,
       ref :"user"
    },
    
  }, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });
  
  const pickupImage = mongoose.model('pickupImage', pickupImageSchema);
  
  module.exports = pickupImage;
  

  