const router = require("express").Router();
const vehiclesService = require("../services/vehicles.service");
const auth = require("../../../middlewares/auth/index");
const Booking = require("../../../api/./onboarding/./models/./booking.model")
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
require('dotenv').config();
const axios = require("axios");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { fileUpload } = require("../models/locationUpload.model")
const { VehicalfileUpload } = require("../models/createVehicleMasterUpload")
const VehicleMaster = require("../../../db/schemas/onboarding/vehicle-master.schema");
const Location = require("../../../db/schemas/onboarding/location.schema");
const vehicleMaster = require("../../../db/schemas/onboarding/vehicle-master.schema");
const { getAllVehiclesData, updateMultipleVehicles } = require("../models/getAllVehicleDataAdmin")
const { documentUpload, getDocument } = require("../models/DocumentUpload")
const { getAllDocument } = require("../models/getAllDocumentAdmin")
const { emailOtp, verify } = require("../models/otpSendByEmail")
const { getPickupImage, pickupImageUp, getAllPickupImage } = require("../models/pickupImageUpload")
const { getAllLogs } = require("../models/getlogs.model")
const {handler}=require("../../../utils/cron");
const vehicleTable = require("../../../db/schemas/onboarding/vehicle-table.schema");
const requestIp = require('request-ip')
const Log = require("../models/Logs.model")
const Document = require("../../../db/schemas/onboarding/DocumentUpload.Schema");
const {paymentRec} = require ("../models/payment.modol")
const Authentication = require ("../../../middlewares/Authentication")

// create messages
router.post("/sendBookingDetailesTosocial", async (req, res) => {
  vehiclesService.sendBookingDetailesTosocial(req, res);
})
router.post("/createVehicle",Authentication, async (req, res) => {
  vehiclesService.createVehicle(req, res);
})

router.post("/updateMultipleVehicles",Authentication, async (req, res) => {
  updateMultipleVehicles(req, res);
  
})

router.post("/createBookingDuration", async (req, res) => {
  vehiclesService.createBookingDuration(req, res);
})



router.post("/createPlan",Authentication, async (req, res) => {
  vehiclesService.createPlan(req, res);
})

router.post("/createInvoice", Authentication,async (req, res) => {
  vehiclesService.createInvoice(req, res);
})

// router.post("/discountCoupons",Authentication, async (req, res) => {
//   vehiclesService.discountCoupons(req, res);
// })

router.post("/createCoupon",Authentication, async (req, res) => {
  vehiclesService.createCoupon(req, res);
})

router.post("/applyCoupon", async (req, res) => {
  vehiclesService.applyCoupon(req, res);
})

router.post("/updateCouponCount", async (req, res) => {
  vehiclesService.updateCouponCount(req, res);
})

router.post("/VehicleBookrecode", async (req, res) => {
  vehiclesService.VehicleBookrecode(req, res);
})

router.post("/createStation",Authentication, async (req, res) => {
  vehiclesService.createStation(req, res);
})

router.post("/searchVehicle", async (req, res) => {
  vehiclesService.searchVehicle(req, res);
})

// get messages
router.get("/getMessages/:chatId", auth(), async (req, res) => {
  vehiclesService.getMessages(req, res);
})

router.post("/getAllVehicles", async (req, res) => {
  vehiclesService.getAllVehicles(req, res);
})

router.get("/getLocations", async (req, res) => {
  vehiclesService.getLocations(req, res);
})
router.get("/getLocation", async (req, res) => {
  vehiclesService.getLocation(req, res);
})
router.get("/getLocationData", async (req, res) => {
  vehiclesService.getLocationData(req, res);
})


router.get("/getPlanData", async (req, res) => {
  vehiclesService.getPlanData(req, res);
})
router.get("/getVehicleTblData", async (req, res) => {
  vehiclesService.getVehicleTblData(req, res);
})
router.get("/getStationData", async (req, res) => {
  vehiclesService.getStationData(req, res);
})

router.get("/getAllBookingDuration", async (req, res) => {
  vehiclesService.getAllBookingDuration(req, res);
})

router.get("/getVehicleMasterData", async (req, res) => {
  vehiclesService.getVehicleMasterData(req, res);
})

router.post("/createBooking", async (req, res) => {
  vehiclesService.booking(req, res);
})

//Get Booking for admin
router.get("/getBookings", async (req, res) => {
  vehiclesService.getBookings(req, res);
})

router.get("/getBooking", async (req, res) => {
  vehiclesService.getBooking(req, res);
})



router.post("/createOrder", async (req, res) => {
  vehiclesService.createOrder(req, res);
})

// router.post("/createVehicleMaster", async (req, res) => {
//   vehiclesService.createVehicleMaster(req, res);
// })

router.get("/getOrders", async (req, res) => {
  vehiclesService.getOrders(req, res);
})

//getCoupons bookingAvailability

router.get("/getCoupons", async (req, res) => {
  vehiclesService.getCoupons(req, res);
})

router.get("/getVehicleBookrecode", async (req, res) => {
  vehiclesService.getVehicleBookrecode(req, res);
})






// Configure Multer to use Memory Storage
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory for manual upload to S3
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB file size limit
});


router.post("/createLocation",Authentication, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File upload failed. No file provided.' });
  }
  fileUpload(req, res)
  // vehiclesService.createLocation(req, res);
})




// Update Location (image is optional)
router.put("/updateLocation",Authentication, upload.single('image'), async (req, res) => {
  const obj = { status: 200, message: "location update successfully", data: [] }

  try {
    if (req.file) {
      await fileUpload(req, res);
    }
    const _id = req.body._id;
    const locationName = req.body.locationName;
    const locationStatus = req.body.locationStatus;
    if (_id) {
      const find = await Location.findOne({ _id })
      if (!find) {

        obj.status = 400;
        obj.message = "Location _id is required";
        return res.json(obj);

      }
       const objData={};
       if (locationName) objData.locationName = locationName;
       if (locationStatus) objData.locationStatus = locationStatus;
//console.log(objData)
const updatedLocation = await Location.updateOne(
  { _id },
  { $set: objData }
);

//console.log(updatedLocation)
      obj.message = "location updated successfully";
      obj.status = 200;
      return res.status(200).json(obj);

    }

  } catch (error) {
    console.error("Error updating location:", error.message);
    res.json({ message: 'An error occurred while updating location' });
  }
});



router.delete("/deleteLocation", async (req, res) => {
  const obj = { status: 200, message: "Location deleted successfully", data: [] };

  try {
    let _id = req.query._id;

    // Check if _id is provided
    if (!_id) {
      obj.status = 400; // Bad request
      obj.message = "Location _id is required";
      return res.json(obj); // Return the response with status 400
    }

    // Find the location by _id
    const find = await Location.findOne({ _id });

    // If the location is not found
    if (!find) {
      obj.status = 404; // Not found
      obj.message = "Location with the given _id not found";
      return res.json(obj); // Return the response with status 404
    }

    // Delete the location
    await Location.deleteOne({ _id });
    await Log({
      message: `Location with ID ${_id} deleted`,
      functionName: "deleteLoaction",
      userId,
    });
    // Success message after deletion
    obj.status = 200;
    obj.message = "Location deleted successfully";
    return res.status(200).json(obj); // Return the response with status 200

  } catch (error) {
    // console.error("Error in deleteLocation:", error.message);


    obj.status = 500;
    obj.message = "An error occurred while deleting location";
    return res.json(obj); // Return the response with status 500
  }
});




router.post("/createVehicleMaster",Authentication, upload.single('image'), async (req, res) => {


  if (!req.file) {
    return res.status(400).json({ message: 'File upload failed. No file provided.' });
  }
  VehicalfileUpload(req, res)
  // vehiclesService.createLocation(req, res);
})



router.put("/updateVehicleMaster",Authentication, upload.single('image'), async (req, res) => {
  const obj = { status: 200, message: "VehicleMaster updated successfully", data: [] };

  try {
    // If an image is provided, handle the file upload
    if (req.file) {
      await VehicalfileUpload(req, res);
    }

    const { _id, vehicleName, vehicleType, vehicleBrand } = req.body;

    // Check if the `_id` is valid
    if (!_id) {
      obj.message = "Vehicle ID (_id) is required";
      obj.status = 400;
      return res.json(obj);
    }

    const find = await vehicleMaster.findOne({ _id });
    if (!find) {
      obj.message = "Invalid vehicle ID (_id)";
      obj.status = 400;
      return res.json(obj);
    }

    // Dynamically build the update object
    const updateData = {};
    if (vehicleName) updateData.vehicleName = vehicleName;
    if (vehicleType) updateData.vehicleType = vehicleType;
    if (vehicleBrand) updateData.vehicleBrand = vehicleBrand;

    // Only perform the update if there is something to update
    if (Object.keys(updateData).length > 0) {
      await vehicleMaster.updateOne(
        { _id },
        { $set: updateData },
        { new: true }
      );
    } else {
      obj.message = "No valid fields provided for update";
      obj.status = 400;
      return res.json(obj);
    }

    obj.message = "VehicleMaster updated successfully";
    obj.status = 200;
    return res.status(200).json(obj);

  } catch (error) {
    console.error("Error updating VehicleMaster:", error.message);

    obj.status = 500;
    obj.message = "An error occurred while updating VehicleMaster";
    return res.json(obj);
  }
});



router.delete("/deleteVehicleMaster", async (req, res) => {
  const obj = { status: 200, message: "VehicleMaster update successfully", data: [] };

  try {
    const _id = req.query._id;
    const vehicleMasterId= req.query._id;
    // console.log(_id)
    if (!_id) {
      obj.message = "Invalid vehicle _id"
      obj.status = 400
      return res.status(400).json(obj);
    }

    const find = await vehicleMaster.findOne({ _id });

    if (!find) {
      obj.message = "VehicleMaster with the given _id not found"
      obj.status = 400
      return res.status(404).json(obj);
    }
   const vehicleRec= await vehicleTable.find({vehicleMasterId});
                     await vehicleTable.deleteMany({vehicleRec})
   //console.log(vehicleRec)
    await vehicleMaster.deleteOne({ _id });
    await Log({
      message: `VehicleMaster with ID ${_id} deleted`,
      functionName: "deleteVehicleMaster",
      userId,
    });
    obj.message = "VehicleMaster deleted successfully"
    obj.status = 200
    return res.status(200).json(obj);

  } catch (error) {
    console.error("Error in deleteVehicleMaster:", error.message);
    obj.status = 500;
    obj.message = "An error occurred while deleting VehicleMaster";
    return res.status(500).json(obj);
  }
});


router.get("/getAllVehiclesData",Authentication, async (req, res) => {
  getAllVehiclesData(req, res);
  // const ipAddress = 
  //   req.headers['x-forwarded-for'] || // For clients behind a proxy
  //   req.socket.remoteAddress || // Direct connection
  //   null;
  // console.log(ipAddress)

})

router.get("/getAllInvoice", async (req, res) => {
  vehiclesService.getAllInvoice(req, res);
})



router.post("/uploadDocument", upload.array('images', 5), async (req, res) => {


  if (!req.files || req.files.length === 0) {
    return res.status(400).send({ message: 'File upload failed. No files provided.' });
  }
  documentUpload(req, res)
})


// router.delete("/deleteDocument", async (req, res) => {
//   const obj = { status: 200, message: "Document deleted successfully", data: [] };

//   try {
//     const { _id, userId } = req.query;

//     // Validate the presence of `_id`
//     if (!_id) {
//       obj.status = 400; // Bad Request
//       obj.message = "Document _id is required";
//       return res.status(400).json(obj);
//     }

//     // Validate the presence of `userId` for logging
//     // if (!userId) {
//     //   obj.status = 400;
//     //   obj.message = "User ID is required for logging";
//     //   return res.status(400).json(obj);
//     // }

//     // Check if the document exists
//     const document = await Document.findById(_id);
//     if (!document) {
//       obj.status = 404; // Not Found
//       obj.message = "Document with the given _id not found";
//       return res.status(404).json(obj);
//     }

//     // Delete the document
//     await Document.deleteOne({ _id });

//     // Log the deletion
//     await Log({
//       message: `Document with ID ${_id} deleted successfully`,
//       functionName: "deleteDocument",
//       userId,
//     });

//     // Send success response
//     return res.status(200).json(obj);

//   } catch (error) {
//     console.error("Error in deleteDocument:", error.message);

//     // Handle unexpected errors
//     obj.status = 500;
//     obj.message = "An error occurred while deleting the document";
//     return res.status(500).json(obj);
//   }
// });





router.delete("/deleteDocument", async (req, res) => {
  const response = { status: 200, message: "", data: [] };

  try {
    const { _id, fileName } = req.query;

    // Validate input parameters
    if (!_id || !fileName) {
      response.status = 400;
      response.message = "Both fileName and _id are required";
      return res.json(response);
    }

    // Ensure _id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      response.status = 400;
      response.message = "Invalid _id format";
      return res.json(response);
    }

    // Fetch the document by ID
    const document = await Document.findById(_id);

    if (!document) {
      response.status = 400;
      response.message = "Document not found";
      return res.json(response);
    }

    if (!document.files || !Array.isArray(document.files)) {
      response.status = 400;
      response.message = "Files array not found in the document";
      return res.json(response);
    }

    // Filter out the file with the specified fileName
    const updatedFiles = document.files.filter(file => file.fileName !== fileName);

    // Update the document or delete it if no files remain
    if (updatedFiles.length === 0) {
      await Document.deleteOne({ _id });
      await Log({
        message: `Document with ID ${_id} deleted`,
        functionName: "deleteDocument",
        userId,
      });
      response.message = "Document deleted successfully";

    } else {
      await Document.updateOne({ _id }, { $set: { files: updatedFiles } });
      await Log({
        message: `Document with ID ${_id} deleted`,
        functionName: "deleteDocument",
        userId,
      });
      response.message = "Document deleted successfully";

    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in deleteDocument:", error.message);
    response.status = 500;
    response.message = "An error occurred while deleting the file";
    return res.json(response);
  }
});



router.get("/getDocument", async (req, res) => {
  getDocument(req, res);
})


router.get("/getAllDocument", async (req, res) => {
  getAllDocument(req, res);
  // await Log({
  //   message: res.message,
  //   functionName: "deleteLoaction",
  //   userId : res.userId,
  // });
})


router.post("/emailOtp", async (req, res) => {
  emailOtp(req, res);
})

router.post("/emailverify", async (req, res) => {
  verify(req, res);
})


router.post("/pickupImage", upload.array('images', 10), async (req, res) => {


  if (!req.files || req.files.length === 0) {
    return res.send({ message: 'File upload failed. No files provided.' });
  }
//console.log(req.files)
  pickupImageUp(req, res)
})

router.get("/getPickupImage", async (req, res) => {
  getPickupImage(req, res);
})

router.get("/getAllPickupImage", async (req, res) => {
  getAllPickupImage(req, res);
})


router.get("/getAllLogs", Authentication,async (req, res) => {
  getAllLogs(req, res);
})

router.post("/createOrderId", async (req, res) => {
  const { amount, booking_id } = req.body

  const key_id = process.env.VITE_RAZOR_KEY_ID;
  const key_secret = process.env.VITE_RAZOR_KEY_SECRET;

  // API endpoint for Razorpay order creation
  const url = "https://api.razorpay.com/v1/orders";


  // Prepare the order data to send
  const options = {
    amount: amount * 100, // Razorpay expects the amount in paise (100 paise = 1 INR)
    currency: "INR",
    receipt: "receipt#" + booking_id,
    payment_capture:1
  };

  try {
    // Make the API request to Razorpay using axios
    const response = await axios.post(url, options, {
      headers: {
        "Content-Type": "application/json",
      },
      auth: {
        username: key_id,
        password: key_secret,
      },
    });

    // console.log("Order created:", response);

    return res.status(200).send(response.data);

  } catch (error) {
    //     console.error(
    //       "Error creating Razorpay order:",
    //       error.response ? error.response.data : error.message
    //     );

    return res.status(400).send(error.message);


  }


})


router.get("/paymentRec",Authentication, async (req, res) => {

  paymentRec(req,res);

})



// router.get("/api/cron", async (req, res) => {
//   console.log("Cron job is working (FROM ROUTE)");
//   //res.send("Cron job is working");
//   handler(req,res)
// });


module.exports = router;
