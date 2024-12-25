const Coupon = require('../../../db/schemas/onboarding/coupons.schema')

const mongoose = require("mongoose"); // Ensure mongoose is imported
const Log = require("../models/Logs.model")

const getCoupons = async (query) => {
  const obj = { status: 200, message: "Data fetched successfully", data: [], pagination: {} };

  try {
      const { _id, page = 1, limit = 10 } = query;

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

      const skip = (page - 1) * limit;

    
      const totalRecords = await Coupon.count();

      
      const coupons = await Coupon.find()
          .select("couponName discount discountType isCouponActive")
          // .skip(skip)
          // .limit(Number(limit))
          // .sort({ createdAt: -1 });
         
      if (!coupons.length) {
          obj.message = "No Records Found";
          return obj;
      }

      obj.data = coupons;
      // obj.pagination = {
      //     totalRecords,
      //     totalPages: Math.ceil(totalRecords / limit),
      //     currentPage: Number(page),
      //     pageSize: Number(limit),
      // };
  } catch (error) {
      console.error("Error fetching coupons:", error);
      obj.status = 500;
      obj.message = "Internal Server Error";
  }

  return obj;
};



const createCoupon = async (body) => {
  const resObj = { status: 200, message: "Coupon processed successfully", data: [] };

  try {
    const {_id, deleteRec, couponName, discount, discountType, isCouponActive}= body

    //console.log( couponName, discount, discountType, isCouponActive)
    
    // Validate required fields
    if(!_id){if (!(couponName && discount && discountType && isCouponActive )) {
      return { status: 400, message: "Invalid data: Required fields are missing." };
    }}

    // Construct data object
    const dataObj = {
      ...(couponName && { couponName }),
      ...(discount && { discount }),
      ...(discountType && { discountType }),
      ...( isCouponActive && { isCouponActive }),
    };

    if (_id) {
      const existingCoupon = await Coupon.findOne({ _id });
      if (!existingCoupon) {
        return { status: 404, message: "Invalid ID: Coupon not found." };
      }

      if (deleteRec) {
        await Coupon.deleteOne({ _id });
        await Log({
          message: `Coupon with ID ${_id} deleted`,
          functionName: "deleteCoupon",
           // Ensure userId is accessible in this scope
        });
        return { status: 200, message: "Coupon deleted successfully." };
      }

      await Coupon.updateOne({ _id }, { $set: dataObj });
      return { 
        status: 200, 
        message: "Coupon updated successfully.", 
        data: dataObj 
      };
    }

    if (couponName) {
      const duplicateCoupon = await Coupon.findOne({ couponName });
      if (duplicateCoupon) {
        return { status: 409, message: "Coupon already exists." };
      }
    }

    const newCoupon = new Coupon(dataObj);
    await newCoupon.save();
    return { 
      status: 200, 
      message: "New coupon created successfully.", 
      data: newCoupon 
    };

  } catch (err) {
    // Handle duplicate key error
    if (err.code === 11000) {
      resObj.status = 400; // Conflict
      resObj.message = `Duplicate key error: ${Object.keys(err.keyValue).join(", ")} already exists.`;
    } else {
      console.error("Error in createCoupon:", err.message);
      resObj.status = 500;
      resObj.message = "Internal server error.";
    }
    return resObj;
  }
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