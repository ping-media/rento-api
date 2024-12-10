const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pickupImageSchema = new Schema({
  files: [
    {
      fileName: { type: String, required: true }, // Name of the file
      imageUrl: { type: String, required: true }, // URL of the file in S3
    },
  ],
    userId: {
       type: Schema.Types.ObjectId,
       required: true,
       ref :"user"
    },
    
  }, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });
  
  const pickupImage = mongoose.model('pickupImage', pickupImageSchema);
  
  module.exports = pickupImage;
  

  