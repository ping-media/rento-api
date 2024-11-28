const router = require("express").Router();
const vehiclesService = require("../services/vehicles.service");
const auth = require("../../../middlewares/auth/index");
const Booking=require("../../../api/./onboarding/./models/./booking.model")
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
require('dotenv').config();

const {fileUpload} = require ("../models/locationUpload.model")
const{VehicalfileUpload} = require ("../models/createVehicleMasterUpload")
const VehicleMaster = require("../../../db/schemas/onboarding/vehicle-master.schema");
const Location = require("../../../db/schemas/onboarding/location.schema");
const vehicleMaster = require("../../../db/schemas/onboarding/vehicle-master.schema");
const {getAllVehiclesData}=require("../models/getAllVehicleDataAdmin")


// create messages
router.post("/createVehicle", async (req, res) => {
  vehiclesService.createVehicle(req, res);
})

router.post("/createBookingDuration", async (req, res) => {
  vehiclesService.createBookingDuration(req, res);
})



router.post("/createPlan", async (req, res) => {
  vehiclesService.createPlan(req, res);
})

router.post("/createInvoice", async (req, res) => {
  vehiclesService.createInvoice(req, res);
})

router.post("/discountCoupons", async (req, res) => {
  vehiclesService.discountCoupons(req, res);
})

router.post("/createCoupon", async (req, res) => {
  vehiclesService.createCoupon(req, res);
})

router.post("/VehicleBookrecode", async (req, res) => {
  vehiclesService.VehicleBookrecode(req, res);
})

router.post("/createStation", async (req, res) => {
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

router.get("/getBookings", async (req, res) => {
  vehiclesService.getBookings(req, res);
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB file size limit
});


router.post("/createLocation", upload.single('image'), async (req, res) => {
  if (!req.file) {
      return res.status(400).json({ message: 'File upload failed. No file provided.' });
  }
  fileUpload(req, res)
  // vehiclesService.createLocation(req, res);
})




// Update Location (image is optional)
router.put("/updateLocation/", upload.single('image'), async (req, res) => {
  const obj = { status: 200, message: "location update successfully", data: [] }

  try {
    // If an image is provided, handle the file upload
    if (req.file) {
      await fileUpload(req, res);
      // Add logic to update the image URL in the database (e.g., vehiclesService.updateLocationImage)
    }
    const _id= req.body._id;
    const locationName = req.body.locationName; 
    const deleteRec=req.body.deleteRec;
     if (_id) {
            const find = await Location.findOne({ _id})
            if (!find) {
              
              obj.status = 400; 
              obj.message = "Location _id is required";
              return res.status(400).json(obj);
                          
            }
         
            await Location.updateOne(
              { _id },
              {
                $set: {locationName}
              },
              { new: true }
            );
            
            
                obj.message="location updated successfully";
                obj.status=200;
                return res.status(400).json(obj);
                          
          }

  } catch (error) {
    console.error("Error updating location:", error.message);
    res.status(500).json({ message: 'An error occurred while updating location' });
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
      return res.status(400).json(obj); // Return the response with status 400
    }

    // Find the location by _id
    const find = await Location.findOne({ _id });

    // If the location is not found
    if (!find) {
      obj.status = 404; // Not found
      obj.message = "Location with the given _id not found";
      return res.status(404).json(obj); // Return the response with status 404
    }

    // Delete the location
    await Location.deleteOne({ _id });

    // Success message after deletion
    obj.status = 200;
    obj.message = "Location deleted successfully";
    return res.status(200).json(obj); // Return the response with status 200

  } catch (error) {
    console.error("Error in deleteLocation:", error.message);

    
    obj.status = 500; 
    obj.message = "An error occurred while deleting location";
    return res.status(500).json(obj); // Return the response with status 500
  }
});




router.post("/createVehicleMaster", upload.single('image'), async (req, res) => {
  
  
  if (!req.file) {
      return res.status(400).json({ message: 'File upload failed. No file provided.' });
  }
  VehicalfileUpload(req, res)
  // vehiclesService.createLocation(req, res);
})


// Update Location (image is optional)
router.put("/updateVehicleMaster", upload.single('image'), async (req, res) => {
  const obj = { status: 200, message: "VehicleMaster update successfully", data: [] };

  try {
    // If an image is provided, handle the file upload
    if (req.file) {
      await VehicalfileUpload(req, res);
    }

    let _id= req.body._id;
    let vehicleName = req.body.vehicleName;
    let vehicleType = req.body.vehicleType;
    let vehicleBrand = req.body.vehicleBrand;


     if (_id) {
            const find = await vehicleMaster.findOne({ _id})
            if (!find) {
              obj.message="Invalid vehicle _id"
              obj.status=401
              return res.status(401).json(
                obj
                           );
            }
            
            await vehicleMaster.updateOne(
              { _id },
              {
                $set: {vehicleName,vehicleBrand,vehicleType}
              },
              { new: true }
            );
            
            obj.message="VehicleMaster upadate successfully"
              obj.status=200
              return res.status(200).json(
                obj
                           );
          }

  } catch (error) {
    console.error("Error updating VehicleMaster:", error.message);

    obj.status = 500; 
    obj.message = "An error occurred while updating VehicleMaster";
    return res.status(500).json(obj);
  }
});



router.delete("/deleteVehicleMaster", async (req, res) => {
  const obj = { status: 200, message: "VehicleMaster update successfully", data: [] };

  try {
    let _id= req.query._id;
   // console.log(_id)
    if (!_id) {
      obj.message="Invalid vehicle _id"
      obj.status=400
      return res.status(400).json( obj );
    }

    const find = await vehicleMaster.findOne({ _id });

    if (!find) {
      obj.message="VehicleMaster with the given _id not found"
      obj.status=400
      return res.status(404).json(obj );
    }

    await vehicleMaster.deleteOne({ _id });
    obj.message="VehicleMaster deleted successfully"
    obj.status=200
    return res.status(200).json( obj );

  } catch (error) {
    console.error("Error in deleteVehicleMaster:", error.message);
    obj.status = 500; 
    obj.message = "An error occurred while deleting VehicleMaster";
    return res.status(500).json(obj);
  }
});


router.get("/getAllVehiclesData", async (req, res) => {
  getAllVehiclesData(req, res);
})



module.exports = router;
