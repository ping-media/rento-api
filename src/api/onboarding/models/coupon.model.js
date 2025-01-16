const Coupon = require('../../../db/schemas/onboarding/coupons.schema')

const mongoose = require("mongoose"); // Ensure mongoose is imported
const Log = require("../models/Logs.model")

// const getCouponsUser = async()=>{
//   const obj = { status: 200, message: "Data fetched successfully", data: [], pagination: {} };
// try {
//   if (_id) {
//     if (!mongoose.Types.ObjectId.isValid(_id)) {
//         obj.status = 400;
//         obj.message = "Invalid _id format";
//         return obj;
//     }

//     const coupon = await Coupon.findById(_id); 
//     if (!coupon) {
//         obj.message = "No Records Found";
//         return obj;
//     }

//     if (coupon.couponCount==0) {
//         obj.message = "Coupon usage limit exceeded";
//         return obj;
//     }
//   }

// } catch (error) {
//   console.error("Error fetching coupons:", error); 
//       obj.status = 500;
//       obj.message = "Internal Server Error";
// } 
// return obj;
// }

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

          const coupon = await Coupon.findById(_id); 
          if (!coupon) {
              obj.message = "No Records Found";
              return obj;
          }

         

          obj.data = [coupon]; 
          return obj;
      }

      const skip = (page - 1) * limit;

    
      const totalRecords = await Coupon.count();

      
      const coupons = await Coupon.find()
          //.select("couponName discount discountType ")
          .skip(skip)
          .limit(Number(limit))
          .sort({ createdAt: -1 });
         
      if (!coupons.length) {
          obj.message = "No Records Found";
          return obj;
      }

      obj.data = coupons;
      obj.pagination = {
          totalPages: Math.ceil(totalRecords / limit),
          currentPage: Number(page),
          limit: Number(limit),
      };
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
    const {_id, deleteRec, couponName, discount, discountType, isCouponActive, allowedUsersCount, couponCount}= body

    //console.log( couponName, discount, discountType, isCouponActive)
    
    // Validate required fields
    if(!_id){if (!(couponName && discount && discountType && isCouponActive && couponCount )) {
      return { status: 400, message: "Invalid data: Required fields are missing." };
    }}

    // Construct data object
    const dataObj = {
      ...(couponName && { couponName }),
      ...(discount && { discount }),
      ...(discountType && { discountType }),
      ...( isCouponActive && { isCouponActive }),
      ...( couponCount && { couponCount }),
      ...( allowedUsersCount && { allowedUsersCount }),
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


  

const updateCouponCount = async (query) => {
  const obj = { status: 200, message: "Data updated successfully", data: [] };

  try {
    const {_id}=query;
    // Fetch coupon by ID
   // console.log(_id)
    const coupon = await Coupon.findById(_id);
    if (!coupon) {
      obj.status = 400;
      obj.message = "No records found for the given ID";
      return obj;
    }


     const { allowedUsersCount, couponCount } = coupon;
    // let allowedUsersCount = couponCount - 1;

    // Ensure allowedUsersCount does not go below 0

if(couponCount !== -1){
    if (allowedUsersCount == 0 ) {
      obj.status = 400;
      obj.message = "Coupon usage limit exceeded";
      return obj;
    }

     

    // Update the coupon document
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      _id, 
      { $inc: { allowedUsersCount: -1 } }, 
      { new: true } 
        );
    

    if (!updatedCoupon) {
      obj.status = 400;
      obj.message = "Failed to update coupon";
      return obj;
    }

    obj.data = updatedCoupon;
  }
  } catch (error) {
    console.error("Error updating coupon:", error);
    obj.status = 500;
    obj.message = "An error occurred while updating the coupon";
  }

  return obj;
};


const applyCoupon = async (body) => {
  const { couponName, totalAmount, isExtra} = body;

   const obj = { status: 200, message: "Coupon applied successfully", data: {} };

  try {
   
    if (!couponName && !totalAmount && !isExtra) {
     
        obj.status=400;
       obj.message="Coupon name and total amount are required";
        return obj;
     
    }

    // Fetch the coupon from the database
    const coupon = await Coupon.findOne({ couponName });

    // Validate the coupon
    if (!coupon || !coupon.isCouponActive) {
      
        obj.status= 400;
        obj.message= "Invalid or inactive coupon";
        return obj;
      
    }

    // Check if the coupon has expired
    // if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
     
    //     obj.status= 400;
    //     obj.message= "Coupon has expired";
    //     return obj;
   
    // }

    // Check coupon usage limits
   if(coupon.couponCount !== -1){
     if (coupon.allowedUsersCount == 0) {
    
        obj.status= 400;
        obj.message= "Coupon usage limit reached";
        return obj;
     
    }}
    

    // Calculate the discount
    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = (totalAmount * coupon.discount) / 100;
    } else if (coupon.discountType === "fixed") {
      discount = coupon.discount;
    }

    const finalAmount = totalAmount<coupon.discount ? 0 : totalAmount - discount;

   const isDiscountZero= finalAmount===0 ? true :false
    
    obj.data = { discount, finalAmount, isExtra, coupon , isDiscountZero};

   
  } catch (error) {
    console.error("Error applying coupon=", error);
      obj.status= 500;
      error= error.message;
      obj.message= error;
      return obj;
   
  }
  return obj;
};

  
  
  module.exports = {createCoupon, getCoupons, updateCouponCount, applyCoupon}