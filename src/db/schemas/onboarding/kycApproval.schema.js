const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const kycApprovalSchecm = new Schema({
  
    userId: {
       type: Schema.Types.ObjectId,
       required: true,
       ref :"User"
    },
  
    aadharNumber: {
       type: String,
       required: true,
    },
  
    licenseNumber: {
       type: String,
       required: true,
       ref :"User"
    },
    
  }, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });
  
  const kycApproval = mongoose.model('kycApproval', kycApprovalSchecm);
  
  module.exports = kycApproval;