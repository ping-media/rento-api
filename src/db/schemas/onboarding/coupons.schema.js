const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const couponSchema = new Schema({
    couponName: {
      type: String,
      required: true,
      unique: true
    },
    allowedUsersCount: {
      type: Number,
    },
    couponCount: {
      type:Number,
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

  // couponSchema.pre('save', function (next) {
  //   if (this.couponName) {
  //     this.couponName = this.couponName.toLowerCase(); 
  //   }
    
   
  //   next();
  // });
  
  
  const coupon = mongoose.model('coupon', couponSchema);
  
  module.exports = coupon;
  

  