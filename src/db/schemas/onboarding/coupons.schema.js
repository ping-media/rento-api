const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const couponSchema = new Schema({
    couponName: {
      type: String,
      required: true,
      unique: true
    },
    allowedUsers: {
      type: Array,
    },
    usageAllowed: {
      type: String,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true      
    },
    discount: {
      type: String,

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
  

  