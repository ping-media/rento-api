const Coupon = require('../../../db/schemas/onboarding/coupons.schema')

const getCoupons = async (query) => {
    const obj = { status: 200, message: "Data fetched successfully", data: [] };
    try {
      const Coupons = await Coupon.find(); // Fetch bookings from DB
      if(!Coupons){
        obj.message = "No Records Found"
        return obj
      }
  
      obj.message = "Data Fetched Successfully"
      obj.data = Coupons
    } catch (error) {
      console.error("Error fetching Coupons:", error);
      obj.message = "error"
    }
  
    return obj
  };



const createCoupon = async ({ _id, couponName, discount, discountType, isCouponActive, deleteRec }) => {
    const resObj = { status: 200, message: "Coupon created successfully", data: [] }
    try {
      if (_id || (couponName && discount && discountType && isCouponActive  )) {
            let dataObj = { _id, couponName, discount, discountType, isCouponActive }

            // for updating and deleting
            if(_id){
                const result = await Coupon.findOne({ _id });
                if (result) {
                    if (deleteRec) {
                        await Coupon.deleteOne({ _id })
                        resObj.message = "Coupon deleted successfully"
                        return resObj
                    }

                    await Coupon.updateOne(
                    { _id },
                    {
                        $set: dataObj
                    },
                    { new: true }
                    );
                    resObj.message = "Coupon updated successfully"
                    resObj.data = dataObj
                } else {
                    resObj.status = 401
                    resObj.message = "Id is invalid"
                    return resObj
                }
            }


            if (couponName) {
            const find = await Coupon.findOne({ couponName })
                if (find) {
                    resObj.status = 401
                    resObj.message = "coupon already exists"
                    return resObj
                }
            }

            const SaveCoupon = new Coupon(dataObj)
            SaveCoupon.save()
            resObj.message = "new Coupon created successfully"
            resObj.data = dataObj

            // if (discount && discount > 0) {
            //     resObj.status = 401
            //     resObj.message = "invalid discount"
            //     return resObj
            // }
    
        }else{
            resObj.status = 401
            resObj.message = "Invalid data"
        }
    } catch (err) {
      console.log(err)
    }
    return resObj
  }

//   const updateCoupon = async (_id) => {
//     const obj = { status: 200, message: "Data updated successfully", data: null };
  
//     try {
//       const updatedCoupon = await Coupon.findByIdAndUpdate(
//         _id,
        
//         { new: true } 
//       );
  
//       if (!updatedCoupon) {
//         obj.status = 404;
//         obj.message = "Coupon not found";
//         return obj;
//       }
  
//       obj.data = updatedCoupon;
//     } catch (error) {
//       console.error("Error updating coupon:", error);
//       obj.status = 500;
//       obj.message = "Error updating coupon";
//     }
  
//     return obj;
//   };
  
  
  module.exports = {createCoupon, getCoupons,}