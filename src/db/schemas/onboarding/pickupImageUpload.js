// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const pickupImageSchema = new Schema({
//   files: [
//     {
//       fileName: { type: String, required: true }, // Name of the file
//       imageUrl: { type: String, required: true }, // URL of the file in S3
//     },
//   ],
//     userId: {
//        type: Schema.Types.ObjectId,
//        required: true,
//        ref :"user"
//     },
    
//   }, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });
  
//   const pickupImage = mongoose.model('pickupImage', pickupImageSchema);
  
//   module.exports = pickupImage;
  

const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  imageUrl: { type: String, required: true },
});

const pickupImageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  bookingId: {type: String, ref: 'Booking' ,required:true },
  files: { type: Map, of: fileSchema },
  data:{type:Object},
  adminNotes:{type:Object},
  managerNotes:{type:Object},
  vehicleMeterReading:{type:Number},
  
   
},
{timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }}
);

const pickupImage = mongoose.model('pickupImage', pickupImageSchema);

module.exports = pickupImage;
