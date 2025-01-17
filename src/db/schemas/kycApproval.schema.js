const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const kycApprovalSchecm = new Schema({
  
    userId: {
       type: Schema.Types.ObjectId,
       required: true,
       ref :"User"
    },
  
    add: {
       type: String,
       required: true,
    },
  
    userId: {
       type: Schema.Types.ObjectId,
       required: true,
       ref :"User"
    },
    
  }, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });
  
  const kycApproval = mongoose.model('pickupImage', kycApprovalSchecm);
  
  module.exports = kycApproval;