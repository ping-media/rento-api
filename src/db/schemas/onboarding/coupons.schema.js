const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const couponSchema = new Schema({
    couponName: {
      type: String,
      required: true,
      unique: true
    },
    vehicleType: {
      type: String,
      required: true,
      enum: ['all', 'gear', 'non-gear']
    },
    allowedUsers: {
      type: Array
    },
    usageAllowed: {
      type: String,
      required: true
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true      
    },
    isCouponActive: {
      type: String,
      enum: ['active', 'inActive'],
      required: true      
    }
  }, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });
  
  const coupon = mongoose.model('coupon', couponSchema);
  
  module.exports = coupon;
  

  