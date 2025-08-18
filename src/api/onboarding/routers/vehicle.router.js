const router = require("express").Router();
const vehiclesService = require("../services/vehicles.service");
const auth = require("../../../middlewares/auth/index");
const User = require("../../../db/schemas/onboarding/user.schema");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload1 = multer({ storage: storage });
require("dotenv").config();
const axios = require("axios");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { fileUpload } = require("../models/locationUpload.model");
const {
  VehicalfileUpload,
  enableOrDisableVehicles,
} = require("../models/createVehicleMasterUpload");
const Location = require("../../../db/schemas/onboarding/location.schema");
const vehicleMaster = require("../../../db/schemas/onboarding/vehicle-master.schema");
const {
  getAllVehiclesData,
  updateMultipleVehicles,
} = require("../models/getAllVehicleDataAdmin");
const { documentUpload, getDocument } = require("../models/DocumentUpload");
const { getAllDocument } = require("../models/getAllDocumentAdmin");
const { emailOtp, verify } = require("../models/otpSendByEmail");
const {
  getPickupImage,
  pickupImageUp,
  getAllPickupImage,
  savePickupImageLinks,
} = require("../models/pickupImageUpload");
const { getAllLogs } = require("../models/getlogs.model");
const Log = require("../models/Logs.model");
const Document = require("../../../db/schemas/onboarding/DocumentUpload.Schema");
const { paymentRec } = require("../models/payment.modol");
const Authentication = require("../../../middlewares/Authentication");
const { deleteS3Bucket } = require("../models/deleteS3Bucket");
const { getBookingGraphData } = require("../models/graphData");
const {
  razorpayWebhook,
  createPaymentLink,
  razorpayWebhookAdmin,
} = require("../models/razorpay.model");
const jwt = require("jsonwebtoken");
const Station = require("../../../db/schemas/onboarding/station.schema");
const { sendInvoiceByEmail } = require("../../../utils/emailSend");
const { kycApprovalFunction } = require("../models/kycapproval.model");
const Booking = require("../../../db/schemas/onboarding/booking.schema");
const {
  maintenanceVehicleFunction,
  getMaintenanceVehicle,
} = require("../models/maintenanceVehicle.model");
const {
  timelineFunction,
  timelineFunctionForGet,
} = require("../models/timeline.model");
const {
  vehicleChangeInBooking,
  vehicleChange,
} = require("../models/vehicleChange.model");
const { extentBooking } = require("../models/extentBooking.model");
const { forgetPasswordFunction } = require("../models/forgetPassword");
const pickupImage = require("../../../db/schemas/onboarding/pickupImageUpload");
const { whatsappMessage } = require("../../../utils/whatsappMessage");
const {
  sendReminderEmail,
  sendCancelEmail,
} = require("../../../utils/emailSend");
const {
  createAndUpdateGeneral,
  getGeneral,
  manageExtraAddOn,
  getExtraAddOns,
  updateGeneralInfo,
  addAndDeleteTestimonial,
  addAndDeleteSlides,
} = require("../models/general.model");
const {
  initiateBooking,
  initiateExtendBooking,
  updateBooking,
  deleteBooking,
  initiateExtendBookingAfterPayment,
  editBooking,
  extendBooking,
} = require("../models/booking.model");
const {
  uploadImageToBucketForPickupImage,
  deleteImageFromBucket,
} = require("../models/uploadAndDeleteImage.modal");
const { sendMessageAfterBooking } = require("../../../utils");
// const { cancelPendingPayments } = require("../utils/cron.js");

// create messages
router.post("/sendBookingDetailesTosocial", async (req, res) => {
  vehiclesService.sendBookingDetailesTosocial(req, res);
});

router.post("/createVehicle", async (req, res) => {
  vehiclesService.createVehicle(req, res);
});

router.post("/updateMultipleVehicles", Authentication, async (req, res) => {
  updateMultipleVehicles(req, res);
});

router.post("/manageAddOn", Authentication, async (req, res) => {
  manageExtraAddOn(req, res);
});

router.post("/updateGeneral", Authentication, async (req, res) => {
  createAndUpdateGeneral(req, res);
});

router.post("/updateGeneralBasic", Authentication, async (req, res) => {
  updateGeneralInfo(req, res);
});

router.post("/updateGeneralTestimonial", Authentication, async (req, res) => {
  addAndDeleteTestimonial(req, res);
});

router.get("/general", async (req, res) => {
  getGeneral(req, res);
});

router.get("/addOn", async (req, res) => {
  getExtraAddOns(req, res);
});

router.post("/createBookingDuration", async (req, res) => {
  vehiclesService.createBookingDuration(req, res);
});

router.post("/createPlan", Authentication, async (req, res) => {
  vehiclesService.createPlan(req, res);
});

router.post("/createInvoice", Authentication, async (req, res) => {
  vehiclesService.createInvoice(req, res);
});

router.post("/createCoupon", Authentication, async (req, res) => {
  vehiclesService.createCoupon(req, res);
});

router.post("/applyCoupon", async (req, res) => {
  vehiclesService.applyCoupon(req, res);
});

router.post("/updateCouponCount", async (req, res) => {
  vehiclesService.updateCouponCount(req, res);
});

router.post("/VehicleBookrecode", async (req, res) => {
  vehiclesService.VehicleBookrecode(req, res);
});

router.post("/createStation", Authentication, async (req, res) => {
  vehiclesService.createStation(req, res);
});

router.post("/searchVehicle", async (req, res) => {
  vehiclesService.searchVehicle(req, res);
});

// get messages
router.get("/getMessages/:chatId", auth(), async (req, res) => {
  vehiclesService.getMessages(req, res);
});

router.post("/getAllVehicles", async (req, res) => {
  vehiclesService.getAllVehicles(req, res);
});

router.get("/getLocations", async (req, res) => {
  vehiclesService.getLocations(req, res);
});

router.get("/getLocation", async (req, res) => {
  vehiclesService.getLocation(req, res);
});

router.get("/getLocationData", async (req, res) => {
  vehiclesService.getLocationData(req, res);
});

router.get("/getPlanData", async (req, res) => {
  vehiclesService.getPlanData(req, res);
});

router.get("/getVehicleTblData", async (req, res) => {
  vehiclesService.getVehicleTblData(req, res);
});

router.get("/getVehicleTblDataAllStation", async (req, res) => {
  vehiclesService.getVehicleTblDataAllStation(req, res);
});

router.get("/getAllVehiclesAvailable", async (req, res) => {
  vehiclesService.getVehicleTbl(req, res);
});

router.get("/getStationData", async (req, res) => {
  vehiclesService.getStationData(req, res);
});

router.get("/getAllBookingDuration", async (req, res) => {
  vehiclesService.getAllBookingDuration(req, res);
});

router.get("/getVehicleMasterData", async (req, res) => {
  vehiclesService.getVehicleMasterData(req, res);
});

router.post("/createBooking", async (req, res) => {
  vehiclesService.booking(req, res);
});

router.post("/initiate-booking", async (req, res) => {
  initiateBooking(req, res);
});

router.post("/delete-booking", async (req, res) => {
  deleteBooking(req, res);
});

router.post("/reschedule-booking", async (req, res) => {
  updateBooking(req, res);
});

router.post("/edit-booking", async (req, res) => {
  editBooking(req, res);
});

router.post("/initiate-extend-booking", async (req, res) => {
  initiateExtendBooking(req, res);
});

router.post("/extend-booking", async (req, res) => {
  extendBooking(req, res);
});

router.post("/initiate-extend-admin-booking", async (req, res) => {
  initiateExtendBookingAfterPayment(req, res);
});

router.post("/create-payment-link", async (req, res) => {
  createPaymentLink(req, res);
});

router.post("/updateBooking", async (req, res) => {
  razorpayWebhook(req, res);
});

router.post("/updateAdminBooking", async (req, res) => {
  razorpayWebhookAdmin(req, res);
});

router.get("/check-booking-status/:bookingId", async (req, res) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId);

  if (!booking) return res.status(404).json({ message: "Booking not found" });

  res.json({
    paymentStatus: booking.paymentStatus,
    bookingStatus: booking.bookingStatus,
  });
});

router.get("/check-booking-status/:bookingId/:action", async (req, res) => {
  const { bookingId, action } = req.params;
  const booking = await Booking.findById(bookingId);

  if (!booking) return res.status(404).json({ message: "Booking not found" });

  if (action === "extend") {
    const extendBooking =
      booking.bookingPrice.extendAmount[
        booking.bookingPrice.extendAmount?.length - 1
      ] || null;

    if (extendBooking !== null) {
      return res.json({
        status: extendBooking.status,
        success: true,
      });
    } else {
      return res.json({
        message: "extension not found",
        success: false,
      });
    }
  }

  res.json({
    paymentStatus: booking.paymentStatus,
    bookingStatus: booking.bookingStatus,
  });
});

router.get("/getBookings", async (req, res) => {
  vehiclesService.getBookings(req, res);
});

//Get Booking for admin
router.get("/getBooking", async (req, res) => {
  vehiclesService.getBooking(req, res);
});

router.post("/createOrder", async (req, res) => {
  vehiclesService.createOrder(req, res);
});

// router.post("/createVehicleMaster", async (req, res) => {
//   vehiclesService.createVehicleMaster(req, res);
// })

router.get("/getOrders", async (req, res) => {
  vehiclesService.getOrders(req, res);
});

//getCoupons bookingAvailability

router.get("/getCoupons", async (req, res) => {
  vehiclesService.getCoupons(req, res);
});

router.get("/getVehicleBookrecode", async (req, res) => {
  vehiclesService.getVehicleBookrecode(req, res);
});

// Configure Multer to use Memory Storage
const upload = multer({
  storage: multer.memoryStorage(),
  // limits: { fileSize: 20 * 1024 * 1024 },
});

router.post(
  "/createLocation",
  Authentication,
  upload.single("image"),
  async (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "File upload failed. No file provided." });
    }
    fileUpload(req, res);
    // vehiclesService.createLocation(req, res);
  }
);

router.post(
  "/addSlides",
  Authentication,
  upload.single("image"),
  async (req, res) => {
    const { action } = req.body;

    if (action === "delete") {
      return addAndDeleteSlides(req, res);
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "File upload failed. No file provided." });
    }
    addAndDeleteSlides(req, res);
  }
);

// Update Location (image is optional)
router.put(
  "/updateLocation",
  Authentication,
  upload.single("image"),
  async (req, res) => {
    const obj = {
      status: 200,
      message: "location update successfully",
      data: [],
    };

    try {
      if (req.file) {
        await fileUpload(req, res);
      }
      const _id = req.body._id;
      const locationName = req.body.locationName;
      const locationStatus = req.body.locationStatus;
      if (_id) {
        const find = await Location.findOne({ _id });
        if (!find) {
          obj.status = 400;
          obj.message = "Location _id is required";
          return res.json(obj);
        }
        const objData = {};
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
      res.json({ message: "An error occurred while updating location" });
    }
  }
);

router.delete("/deleteLocation", async (req, res) => {
  const obj = {
    status: 200,
    message: "Location deleted successfully",
    data: [],
  };

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

    if (find.imageFileName) {
      try {
        // Delete the file from S3
        await deleteS3Bucket(find.imageFileName);
      } catch (error) {
        obj.status = 500;
        obj.message = "Failed to delete associated file from S3";
        return res.json(obj);
      }
    }
    // Delete the location
    await Location.deleteOne({ _id });
    await Log({
      message: `Location with ID ${_id} deleted`,
      functionName: "deleteLoaction",
    });

    //deleteS3Bucket()
    // Success message after deletion
    obj.status = 200;
    obj.message = "Location deleted successfully";
    return res.status(200).json(obj);
  } catch (error) {
    console.error("Error in deleteLocation:", error.message);

    obj.status = 500;
    obj.message = "An error occurred while deleting location";
    return res.json(obj);
  }
});

router.post(
  "/createVehicleMaster",
  Authentication,
  upload.single("image"),
  async (req, res) => {
    if (!req.file) {
      return res.json({
        message: "File upload failed. No file provided.",
        status: 400,
      });
    }
    VehicalfileUpload(req, res);
  }
);

router.put(
  "/updateVehicleMasterwithVehicles",
  Authentication,
  async (req, res) => {
    enableOrDisableVehicles(req, res);
  }
);

router.put(
  "/updateVehicleMaster",
  Authentication,
  upload.single("image"),
  async (req, res) => {
    const obj = {
      status: 200,
      message: "VehicleMaster updated successfully",
      data: [],
    };

    try {
      // If an image is provided, handle the file upload
      if (req.file) {
        await VehicalfileUpload(req, res);
      }

      const { _id, vehicleName, vehicleType, vehicleBrand, vehicleCategory } =
        req.body;

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
      if (vehicleCategory) updateData.vehicleCategory = vehicleCategory;

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
  }
);

router.delete("/deleteVehicleMaster", async (req, res) => {
  const obj = {
    status: 200,
    message: "VehicleMaster update successfully",
    data: [],
  };

  try {
    const _id = req.query._id;
    const vehicleMasterId = req.query._id;
    // console.log(_id)
    if (!_id) {
      obj.message = "Invalid vehicle _id";
      obj.status = 400;
      return res.json(obj);
    }

    const find = await vehicleMaster.findOne({ _id });

    if (!find) {
      obj.message = "VehicleMaster with the given _id not found";
      obj.status = 400;
      return res.json(obj);
    }

    if (find.imageFileName) {
      try {
        // Delete the file from S3
        await deleteS3Bucket(find.imageFileName);
      } catch (error) {
        obj.status = 500;
        obj.message = "Failed to delete associated file from S3";
        return res.json(obj);
      }
    }
    //   if(vehicleMasterId)
    //  {const vehicleRec= await vehicleTable.find({vehicleMasterId});
    //                  //  await vehicleTable.deleteMany({vehicleRec})
    //                  console.log(vehicleRec)
    //                   }
    //console.log(vehicleRec)
    await vehicleMaster.deleteOne({ _id });
    await Log({
      message: `VehicleMaster with ID ${_id} deleted`,
      functionName: "deleteVehicleMaster",
    });
    obj.message = "VehicleMaster deleted successfully";
    obj.status = 200;
    return res.status(200).json(obj);
  } catch (error) {
    console.error("Error in deleteVehicleMaster:", error.message);
    obj.status = 500;
    obj.message = "An error occurred while deleting VehicleMaster";
    return res.json(obj);
  }
});

router.get("/getAllVehiclesData", async (req, res) => {
  getAllVehiclesData(req, res);
});

router.get("/getAllInvoice", async (req, res) => {
  vehiclesService.getAllInvoice(req, res);
});

router.post("/validedToken", async (req, res) => {
  const { token, _id, dataFlag } = req.body;
  const flag = dataFlag !== undefined ? dataFlag : true;
  try {
    let userId = _id;

    if (!userId) {
      if (!token) {
        return res
          .status(401)
          .json({ message: "Authentication token is required" });
      }

      const decoded = jwt.verify(token, process.env.BCRYPT_TOKEN);
      req.user = decoded;
      userId = req.user.id;
    }

    const user = await User.findOne({ _id: userId });
    const userDocument = await Document.findOne({ userId: userId });

    if (!user) {
      return res.json({ isUserValid: false });
    }

    if (user.status === "active" && flag === true) {
      let profileImage = "";
      if (userDocument) {
        const file = userDocument.files?.filter((file) =>
          file?.fileName?.includes("Selfie")
        );
        if (file) {
          profileImage = file[0]?.imageUrl || "";
        }
      }

      const newData = { ...user?._doc, profileImage };
      return res.json({ data: newData, isUserValid: true });
    } else if (user.status === "active" && flag === false) {
      return res.json({ isUserValid: true });
    }

    return res.json({ isUserValid: false });
  } catch (error) {
    console.error("Error during token validation:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

router.post("/uploadDocument", (req, res) => {
  upload.array("images", 5)(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // if (err.code === "LIMIT_FILE_SIZE") {
      //   return res
      //     .status(400)
      //     .json({ message: "File too large. Max size is 2MB per file." });
      // } else
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res
          .status(400)
          .json({ message: "Too many files uploaded. Max is 5." });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res
        .status(500)
        .json({ message: "Something went wrong during file upload." });
    }

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "File upload failed. No files provided." });
    }

    // Proceed to your controller
    documentUpload(req, res);
  });
});

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

router.post("/deleteDocument", async (req, res) => {
  const response = { status: 200, message: "", data: [] };

  try {
    const { _id, fileName } = req.body;

    // Validate input parameters
    if (!_id || !fileName) {
      response.status = 400;
      response.message = "Both fileName and _id are required";
      return res.json(response);
    }

    // Fetch the document by ID
    const document = await Document.findById(_id);

    if (!document) {
      response.status = 400;
      response.message = "Document not found";
      return res.json(response);
    }

    // if (!document.files || !Array.isArray(document.files)) {
    //   response.status = 400;
    //   response.message = "Files array not found in the document";
    //   return res.json(response);
    // }

    // Filter out the file with the specified fileName
    const updatedFiles = document.files.filter(
      (file) => file.fileName !== fileName
    );

    if (fileName) {
      // Delete the file from S3
      //   console.log("enter")
      deleteS3Bucket(fileName);
    }

    if (updatedFiles.length === 0) {
      await Document.deleteOne({ _id });
      await Log({
        message: `Document with ID ${_id} deleted`,
        functionName: "deleteDocument",
      });
      response.message = "Document deleted successfully";
    } else {
      await Document.updateOne({ _id }, { $set: { files: updatedFiles } });
      await Log({
        message: `Document with ID ${_id} deleted`,
        functionName: "deleteDocument",
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
});

// get All Document
router.get("/getAllDocument", async (req, res) => {
  getAllDocument(req, res);
  // await Log({
  //   message: res.message,
  //   functionName: "deleteLoaction",
  //   userId : res.userId,
  // });
});

router.post("/emailOtp", async (req, res) => {
  emailOtp(req, res);
});

router.post("/emailverify", async (req, res) => {
  verify(req, res);
});

router.post("/pickupImage", upload.array("images", 7), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send({ message: "No files uploaded." });
  }
  pickupImageUp(req, res);
});

router.post(
  "/upload-pickup-image",
  upload.single("image"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).send({ message: "No files uploaded." });
    }
    uploadImageToBucketForPickupImage(req, res);
  }
);

router.post("/start-ride", async (req, res) => {
  savePickupImageLinks(req, res);
});

router.post("/delete-image", async (req, res) => {
  deleteImageFromBucket(req, res);
});

router.get("/getPickupImage", async (req, res) => {
  getPickupImage(req, res);
});

router.get("/getAllPickupImage", async (req, res) => {
  getAllPickupImage(req, res);
});

router.get("/getAllLogs", Authentication, async (req, res) => {
  getAllLogs(req, res);
});

router.get("/getGraphData", Authentication, async (req, res) => {
  getBookingGraphData(req, res);
});

router.post("/createOrderId", async (req, res) => {
  const { amount, booking_id, type } = req.body;

  const key_id = process.env.VITE_RAZOR_KEY_ID;
  const key_secret = process.env.VITE_RAZOR_KEY_SECRET;

  // API endpoint for Razorpay order creation
  const url = "https://api.razorpay.com/v1/orders";

  // Prepare the order data to send
  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: "receipt#" + booking_id,
    payment_capture: 1,
    notes: {
      type: type || "",
    },
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

    return res.status(200).send(response.data);
  } catch (error) {
    return res.status(400).send(error.message);
  }
});

router.get("/paymentRec", Authentication, async (req, res) => {
  paymentRec(req, res);
});

router.post("/sendEmailForBookingDetails", async (req, res) => {
  vehiclesService.sendOtpByEmailForBooking(req, res);
});

router.post("/kycApproval", Authentication, async (req, res) => {
  kycApprovalFunction(req, res);
});

router.post("/forgetPassword", async (req, res) => {
  forgetPasswordFunction(req, res);
});

router.post(
  "/sendInvoiceByEmail",
  Authentication,
  upload1.single("file"),
  async (req, res) => {
    // `req.file` will contain the file as a buffer
    const { email, firstName, lastName } = req.body;
    const file = req.file;

    // Process the file, then send the email
    const result = await sendInvoiceByEmail({
      email,
      firstName,
      lastName,
      file,
    });

    if (result) {
      return res.status(200).json({ success: true, message: "Invoice sent" });
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  }
);

// Update booking route
router.put("/rideUpdate", Authentication, async (req, res) => {
  const {
    _id,
    endMeterReading,
    rideStatus,
    userId,
    bookingId,
    rideOtp,
    rideEndDate,
    startMeterReading,
    lateFeeBasedOnHour,
    lateFeeBasedOnKM,
    additionalPrice,
    closingDate,
    paymentMode,
    refundAmount,
    endDateTime,
  } = req.body;

  const obj = { status: 200, message: "", data: {} };
  try {
    const booking = await Booking.findOne({ _id });
    let {
      vehicleBasic,
      bookingPrice,
      BookingEndDateAndTime,
      BookingStartDateAndTime,
    } = booking;
    const rideStatusFromBooking = booking?.rideStatus;
    if (rideStatusFromBooking === "completed") {
      obj.status = 400;
      obj.message = "Ride already finished";
      return res.json(obj);
    }

    let lateFeePaymentMethod = "NA";
    let additionFeePaymentMethod = "NA";

    if (lateFeeBasedOnHour !== 0 || lateFeeBasedOnKM !== 0) {
      lateFeePaymentMethod = paymentMode;
    }
    if (additionalPrice !== 0) {
      additionFeePaymentMethod = paymentMode;
    }

    let newBookingPrice = {
      ...bookingPrice,
      lateFeeBasedOnHour,
      lateFeeBasedOnKM,
      additionalPrice,
      lateFeePaymentMethod,
      additionFeePaymentMethod,
    };

    if (refundAmount) {
      newBookingPrice = { ...newBookingPrice, refundAmount };
    }

    if (!rideOtp || rideOtp?.toString().length != 4) {
      await Log({
        message: `Ride OTP is required or invalid ${_id}`,
        functionName: "rideUpdate",
        userId,
      });
      obj.status = 400;
      obj.message = "Ride OTP is required and must be a 4-digit";
      return res.json(obj);
    }

    if (rideOtp != vehicleBasic.endRide) {
      await Log({
        message: `Invalid Otp ${_id}`,
        functionName: "rideUpdate",
        userId,
      });

      obj.status = 400;
      obj.message = "Invalid Otp";
      return res.json(obj);
    }

    // Update the booking document
    const pickupImageData = await pickupImage.updateOne(
      { bookingId },
      { $set: { endMeterReading, rideEndDate } },
      { new: true }
    );

    if (closingDate) {
      let paymentStatus = booking?.paymentStatus;
      if (refundAmount > 0) {
        paymentStatus = "refunded";
      }
      const updatedBooking = await Booking.updateOne(
        { _id: ObjectId(_id) },
        {
          $set: {
            rideStatus,
            bookingPrice: newBookingPrice,
            BookingEndDateAndTime: closingDate,
            "extendBooking.originalEndDate": BookingEndDateAndTime,
            "vehicleBasic.RideEnd": endDateTime || "",
            paymentStatus: paymentStatus,
          },
        },
        { new: true }
      );
    }

    const updatedBooking = await Booking.updateOne(
      { _id: ObjectId(_id) },
      { $set: { rideStatus, bookingPrice: newBookingPrice } },
      { new: true }
    );

    // Log the booking update
    await Log({
      message: `Booking with ID ${_id} updated`,
      functionName: "rideUpdate",
      userId,
    });

    // Notify about the booking update
    obj.status = 200;
    obj.message = `Ride ${
      rideStatus === "canceled"
        ? "Canceled"
        : rideStatus === "ongoing"
        ? "Start"
        : "Completed"
    } successful`;
    const response = { lateFeeBasedOnHour, lateFeeBasedOnKM, rideStatus };
    obj.data = response;
    return res.status(200).json(obj);
  } catch (error) {
    console.error("Error during booking update:", error);
    return res.json({
      status: 500,
      message: "Internal server error",
    });
  }
});

router.post("/vehicleChange", Authentication, async (req, res) => {
  // vehicleChangeInBooking(req, res);
  vehicleChange(req, res);
});

router.post("/maintenanceVehicle", Authentication, async (req, res) => {
  maintenanceVehicleFunction(req, res);
});

router.get("/maintenanceVehicle", Authentication, async (req, res) => {
  getMaintenanceVehicle(req, res);
});

router.get("/maintenanceVehicle", Authentication, async (req, res) => {
  getMaintenanceVehicle(req, res);
});

router.post("/createTimeline", async (req, res) => {
  timelineFunction(req, res);
});

router.get("/getTimelineData", Authentication, async (req, res) => {
  timelineFunctionForGet(req, res);
});

router.get("/cron", async (req, res) => {
  console.log("Cron job is working");
  //res.send("Cron job is working");
  cancelPendingPayments(req, res);
  res.json({ message: "Cron job executed !" });
});

router.post("/extendBooking", async (req, res) => {
  extentBooking(req, res);
});

router.post("/sendReminder", Authentication, async (req, res) => {
  function convertDateString(dateString) {
    if (!dateString) return "Invalid date";

    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid date";

    const options = {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    return date.toLocaleString("en-US", options);
  }

  try {
    const {
      userEmail,
      firstName,
      vehicleName,
      BookingStartDateAndTime,
      bookingId,
      stationName,
      bookingPrice,
      vehicleBasic,
      managerContact,
      contact,
    } = req.body;

    // Fetch station details
    const station = await Station.findOne({ stationName }).select(
      "latitude longitude"
    );
    if (!station) {
      console.error(`Station not found for stationName: ${stationName}`);
      return res
        .status(400)
        .json({ status: 400, message: "Station not found" });
    }

    const { latitude, longitude } = station;
    const mapLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    // Calculate total price
    const totalPrice =
      bookingPrice.discountTotalPrice > 0
        ? bookingPrice.discountTotalPrice
        : bookingPrice.totalPrice;
    const refundableDeposit = vehicleBasic.refundableDeposit;

    // Prepare message data for WhatsApp
    const messageData = [
      firstName,
      vehicleName,
      convertDateString(BookingStartDateAndTime),
      bookingId,
      stationName,
      mapLink,
      managerContact,
      totalPrice,
      refundableDeposit,
    ];

    const whatsappResult = await whatsappMessage(
      [contact],
      "booking_reminder",
      messageData
    );

    const emailResult = await sendReminderEmail(req.body);

    if (!emailResult.success) {
      return res
        .status(500)
        .json({ status: 500, message: "Failed to send email reminder" });
    }

    return res.json({ status: 200, message: "Reminder sent successfully" });
  } catch (error) {
    console.error("Error occurred:", error);
    return res.status(500).send({ status: 500, message: error.message });
  }
});

router.post("/cancelledBooking", Authentication, async (req, res) => {
  const {
    _id,
    bookingStatus,
    paymentStatus,
    rideStatus,
    notes,
    firstName,
    contact,
    managerContact,
    email,
    managerEmail,
  } = req.body;
  const obj = { status: 200, message: "Data fetched successfully", data: [] };

  try {
    const o = { bookingStatus, paymentStatus, rideStatus, notes };

    const booking = await Booking.findOne({ _id }).populate("userId");
    if (!booking) {
      obj.status = 401;
      obj.message = "Booking not found";
      return res.json(obj);
    }

    if (o.notes && Array.isArray(o.notes) && o.notes.length > 0) {
      o.notes = [...(booking.notes || []), o.notes[0]];
    }

    const UpdatedData = await Booking.findByIdAndUpdate(
      { _id: ObjectId(_id) },
      { $set: o },
      { new: true }
    );

    await Log({
      message: `Booking with ID ${_id} updated`,
      functionName: "cancelledBooking",
    });

    obj.status = 200;
    obj.message = "Booking cancelled successfull";

    const {
      vehicleName,
      BookingStartDateAndTime,
      stationName,
      bookingId,
      bookingPrice,
      userId,
    } = booking;

    const totalPrice =
      bookingPrice.discountTotalPrice > 0
        ? bookingPrice.discountTotalPrice
        : bookingPrice.totalPrice;

    const messageData = [
      userId.firstName,
      vehicleName,
      bookingId,
      BookingStartDateAndTime,
      stationName,
      totalPrice,
      managerContact,
    ];

    whatsappMessage([contact], "booking_cancel", messageData);

    sendCancelEmail(
      email,
      userId.firstName,
      vehicleName,
      bookingId,
      BookingStartDateAndTime,
      stationName,
      totalPrice,
      managerContact
    );

    return res.json(obj);
  } catch (error) {
    return res.json({ status: 500, message: error.message });
  }
});

router.post("/GeneratePaymentToken", async (req, res) => {
  const { payload } = req.body;
  if (!payload) {
    return res.status(401).json({ message: "payload is required" });
  }
  try {
    const decoded = jwt.sign(payload, process.env.BCRYPT_TOKEN);

    return res.status(200).json({ token: decoded });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

router.post("/send-notification", async (req, res) => {
  const { bookingId } = req.body;
  return sendMessageAfterBooking(bookingId);
});

module.exports = router;
