const path = require('path');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();
const pickupImage = require("../../../db/schemas/onboarding/pickupImageUpload");
const Booking = require('../../../db/schemas/onboarding/booking.schema');
const {resizeImg} = require('../../../utils/resizeImage');
const {timelineFunction} = require("../models/timeline.model");


// Validate required environment variables
const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME } = process.env;

if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_BUCKET_NAME) {
    console.error("Missing required environment variables for AWS configuration.");
    process.exit(1);
}

// Configure AWS S3 Client
const s3 = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});

// Configure Multer for Memory Storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit to 10 MB
});

// Function to upload document
const pickupImageUp = async (req, res) => {
  try {
    const { userId, bookingId, data, startMeterReading, endMeterReading, _id,rideOtp,paymentMode,paymentStatus } = req.body;
  

    if (!userId || userId.length !== 24) {
      return res.json({ message: "Invalid user ID provided." });
    }

    const booking= await Booking.findOne({_id}).populate("userId", "kycApproved");
    const kycStatus = booking?.userId?.kycApproved;

    if(kycStatus==="no"){
      return res.json(
        { status:400,
       message:"Customer kyc is not Approved",
       isKyc:false
      }

         );
    }

    const {vehicleBasic}=booking;
    //console.log(vehicleBasic.startRide,rideOtp)
    if(rideOtp && rideOtp.length===4){
      if(vehicleBasic.startRide!==Number(rideOtp)){
  
    
        // Notify about the booking update
       
        return res.json(
       { status:400,
      message:"Invalid Otp",}
        );
      }
    }
    const uploadedFiles = [];

    // Helper function to get current timestamp in milliseconds
    const getMilliseconds = () => new Date().getTime();

    // Loop through files and upload to S3
    for (let index = 0; index < req.files.length; index++) {
      const file = req.files[index];
      const resizedImageBuffer = await resizeImg(file);
      // Generate a unique file name
      const fileName = `${userId}_${getMilliseconds()}_${index}`;

      const params = {
        Bucket: process.env.AWS_BUCKET_NAME, // S3 Bucket Name
        Key: fileName, // Unique File Name
        Body: resizedImageBuffer, // File Content
        ContentType: file.mimetype, // MIME Type
      };

      // Upload to S3
      await s3.send(new PutObjectCommand(params));

      // Construct the S3 File URL
      const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      uploadedFiles.push({ fileName, imageUrl });
    }

   //console.log(uploadedFiles)
    // Construct the tempObj with proper keys and values
    const tempObj = {};
    uploadedFiles.forEach((file, index) => {
      tempObj[`file_${index}`] = {
        fileName: file.fileName,
        imageUrl: file.imageUrl,
      };
    });

    // Save the document to the database
    const newDocument = new pickupImage({
      userId,
      bookingId,
      files: tempObj,
      data,
      startMeterReading,
      endMeterReading
       
    });

    await newDocument.save();
    const OTP=Math.floor(1000 + Math.random() * 9000);

    if(paymentStatus=="partially_paid" || paymentStatus=="partiallyPay"){
   
      const updateResult = await Booking.updateOne(
        { _id },
        { $set: { "bookingPrice.isPickupImageAdded": true ,"rideStatus":"ongoing","vehicleBasic.endRide":OTP,"bookingPrice.AmountLeftAfterUserPaid.status":"paid","bookingPrice.AmountLeftAfterUserPaid.paymentMethod":paymentMode} },
        { new: true }
      );
    }
    else{
      const updateResult = await Booking.updateOne(
        { _id },
        { $set: { "bookingPrice.isPickupImageAdded": true ,"rideStatus":"ongoing","vehicleBasic.endRide":OTP} },
        { new: true }
      );
    }


   

    // const currentBooking_id = _id
    // const timeline={"Pick-up done":updateResult.updatedAt}
    // timelineFunction(userId, bookingId, currentBooking_id, timeline  )

//console.log(updateResult)
    return res.json({
      status: 200,
      message: "Ride started successfully.",
      newDocument,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    return res.json({
      status: 500,
      message: "Failed to upload files to S3.",
      error: error.message,
    });
  }
};




// const pickupImageUp = async (req, res) => {
//   try {
//     const { userId, images } = req.body;

//     if (!userId || userId.length !== 24) {
//       return res.status(400).json({ message: "Invalid user ID provided." });
//     }

//     const uploadedFiles = [];

//     const getMilliseconds = () => new Date().getTime();

//     // Validate req.files existence
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ message: "No files uploaded." });
//     }

//     // Loop through files and upload to S3
//     for (const [index, file] of req.files.entries()) {
//       // Generate a unique file name
//       const fileName = `${userId}_${getMilliseconds()}_${index}`;

//       const params = {
//         Bucket: process.env.AWS_BUCKET_NAME, // S3 Bucket Name
//         Key: fileName, // Unique File Name
//         Body: file.buffer, // File Content
//         ContentType: file.mimetype, // MIME Type
//       };

//       // Upload to S3
//       try {
//         await s3.send(new PutObjectCommand(params));
//       } catch (err) {
//         console.error(`Error uploading file ${fileName}:`, err);
//         throw new Error(`Failed to upload file ${fileName}`);
//       }

//       // Construct the S3 File URL
//       const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
//       uploadedFiles.push({ fileName, imageUrl });
//     }

//     // Map files for database insertion
//     const filesToInsert = uploadedFiles.map(file => ({
//       userId,
//       fileName: file.fileName,
//       imageUrl: file.imageUrl,
//     }));

//     // Save all files to the database
//     await pickupImage.insertMany(filesToInsert);

//     // Respond with success
//     return res.status(200).json({
//       status: 200,
//       message: "Files uploaded successfully.",
//       uploadedFiles,
//     });
//   } catch (error) {
//     console.error("Error uploading files:", error);

//     // Respond with error
//     return res.status(500).json({
//       status: 500,
//       message: "Failed to upload files to S3.",
//       error: error.message,
//     });
//   }
// };





const getPickupImage = async (req, res) => {
    try {
      const { userId,bookingId,_id } = req.query;
    //console.log(userId,bookingId,_id)
      const filter = {};
      if (_id) filter._id = _id;
      if (bookingId) filter.bookingId = bookingId;
      if (userId) filter.userId = userId;
     // if (paidInvoice) filter.paidInvoice = paidInvoice;

      
      
      const documents = await pickupImage.find(filter);
  
      if (!documents || documents.length === 0) {
        return res.json({
          status: 400,
          message: "No data found .",
          data:[]
        });

      }
      return res.status(200).json({
        status: 200,
        message: "Image retrieved successfully.",
        data: documents,
      });
    

    // const documents = await pickupImage.find();
  
    // if (!documents || documents.length === 0) {
    //   return res.json({
    //     status: 400,
    //     message: "No data found for the provided User ID.",
    //   });

    // }
    //   return res.status(200).json({
    //     status: 200,
    //     message: "Image retrieved successfully.",
    //     data: documents,
    //   });
    } catch (error) {
      console.error("Error fetching documents:", error);
      return res.json({
        status: 500,
        message: "Failed to retrieve Image.",
        error: error.message,
      });
    }
  };
  

  const getAllPickupImage= async(req,res)=>{
    try {
      const documents = await pickupImage.find();
  
      if (!documents || documents.length === 0) {
        return res.json({
          status: 400,
          message: "No data found for the provided User ID.",
        });
      }
  
      return res.status(200).json({
        status: 200,
        message: "Image retrieved successfully.",
        data: documents,
      });
    } catch (error) {
      console.error("Error fetching documents:", error);
      return res.json({
        status: 500,
        message: "Failed to retrieve Image.",
        error: error.message,
      });
    }
  }

module.exports = { pickupImageUp, getPickupImage, getAllPickupImage };
