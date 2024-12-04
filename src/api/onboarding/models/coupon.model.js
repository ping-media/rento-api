const Coupon = require('../../../db/schemas/onboarding/coupons.schema')

const mongoose = require("mongoose"); // Ensure mongoose is imported

const getCoupons = async (query) => {
    const obj = { status: 200, message: "Data fetched successfully", data: [] };

    try {
        const { _id } = query;

        // Fetch by ID if provided
        if (_id) {
            if (!mongoose.Types.ObjectId.isValid(_id)) {
                obj.status = 400;
                obj.message = "Invalid _id format";
                return obj;
            }

            const coupon = await Coupon.findById(_id); // Fetch by ID
            if (!coupon) {
                obj.message = "No Records Found";
                return obj;
            }

            obj.data = [coupon]; // Return as an array for consistency
            return obj;
        }

        // Fetch all coupons if no _id provided
        const coupons = await Coupon.find();
        if (!coupons.length) {
            obj.message = "No Records Found";
            return obj;
        }

        obj.data = coupons;
    } catch (error) {
        console.error("Error fetching coupons:", error);
        obj.status = 500;
        obj.message = "Internal Server Error";
    }

    return obj;
};



  const createCoupon = async ({ 
    _id, 
    couponName, 
    discount, 
    discountType, 
    isCouponActive, 
    deleteRec, 
    allowedUsers 
  }) => {
    const resObj = { status: 200, message: "Coupon processed successfully", data: [] };
  
    try {
      if (!_id && !(couponName && discount && discountType && isCouponActive)) {
        resObj.status = 401;
        resObj.message = "Invalid data: Required fields are missing.";
        return resObj;
      }
  
      // Prepare the coupon data object
      const dataObj = {
        ...(couponName && { couponName }),
        ...(discount && { discount }),
        ...(discountType && { discountType }),
        ...(isCouponActive !== undefined && { isCouponActive }),
        ...(Array.isArray(allowedUsers) && { allowedUsers }),
      };
  
     
      if (_id) {
        const existingCoupon = await Coupon.findOne({ _id });
  
        if (!existingCoupon) {
          resObj.status = 401;
          resObj.message = "Invalid ID: Coupon not found.";
          return resObj;
        }
  
       
        if (deleteRec) {
          await Coupon.deleteOne({ _id });
          resObj.message = "Coupon deleted successfully.";
          return resObj;
        }
  
     
        await Coupon.updateOne(
          { _id },
          { $set: dataObj },
          { new: true }
        );
  
        resObj.message = "Coupon updated successfully.";
        resObj.data = { ...existingCoupon.toObject(), ...dataObj };
        return resObj;
      }
  
      // If `couponName` is provided, ensure it is unique
      if (couponName) {
        const duplicateCoupon = await Coupon.findOne({ couponName });
        if (duplicateCoupon) {
          resObj.status = 401;
          resObj.message = "Coupon already exists.";
          return resObj;
        }
      }
  
      // Create a new coupon
      const newCoupon = new Coupon(dataObj);
      await newCoupon.save();
  
      resObj.message = "New coupon created successfully.";
      resObj.data = newCoupon;
    } catch (err) {
      console.error("Error in createCoupon:", err.message);
      resObj.status = 500;
      resObj.message = "Internal server error.";
    }
  
    return resObj;
  };
  

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