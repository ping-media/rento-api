
const path = require('path');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();
const VehicleMaster = require("../../../db/schemas/onboarding/vehicle-master.schema");



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

// Configure Multer to use Memory Storage
const upload = multer({
    storage: multer.memoryStorage(), // Store files in memory for manual upload to S3
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB file size limit
});


// Route to upload the image
const VehicalfileUpload =async (req, res) => {
    //const response = { status: "200", message: "data fetched successfully", data: [] }

    try {

        let _id= req.body._id;
        let deleteRec=req.body.deleteRec;
        let vehicleName = req.body.vehicleName;
        let vehicleType = req.body.vehicleType;
        let vehicleBrand = req.body.vehicleBrand;

    
        
       
        
        // Generate safe file name
        const timestamp = Date.now();
        const safeFileName = `${timestamp}-${path.basename(req.file.originalname)}`;

        const params = {
            Bucket: AWS_BUCKET_NAME, // Your bucket name
            Key: safeFileName, // File name in the bucket
            Body: req.file.buffer, // File content
            ContentType: req.file.mimetype, // File MIME type
        };

        // Upload to S3
        await s3.send(new PutObjectCommand(params));

        // Construct the file URL
        const imageUrl = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${safeFileName}`;

        let vehicleImage=imageUrl

        //console.log(_id,deleteRec,vehicleBrand,vehicleName,vehicleType,vehicleImage)


        if (vehicleType) {
            let statusCheck = ["gear", "non-gear"].includes(vehicleType)
            if (!statusCheck) {
             
              return res.status(401).json({
                message: "Invalid vehicle type",
                           });
            }
          }
          if (_id && _id.length !== 24) {
            return res.status(401).json({
                message: "Invalid _id",
                           });
            
          }
          if (_id) {
            const find = await VehicleMaster.findOne({ _id})
            if (!find) {
              
              return res.status(401).json({
                message: "Invalid vehicle _id",
                           });
            }
            if (deleteRec) {
              await VehicleMaster.deleteOne({ _id})
           
              return res.status(200).json({
                message: "Vehicle master deleted successfully",
                "vehicleName":vehicleName
                           });
            }
            await VehicleMaster.updateOne(
              { _id },
              {
                $set: {vehicleBrand,vehicleImage,vehicleType,vehicleName}
              },
              { new: true }
            );
            
            return res.status(200).json({
                message: "vehicle master updated successfully",
                           });
          } else {
            if (vehicleName && vehicleType && vehicleBrand && vehicleImage) {
              const find = await VehicleMaster.findOne({ vehicleName })
              if (find) {
                
                return res.status(401).json({
                    message: "vehicle master name already exists",
                               });
                
              }
              const SaveUser = new VehicleMaster({vehicleName, vehicleBrand, vehicleType, vehicleImage, _id})
              SaveUser.save()
              
              return res.status(200).json({
                message: "vehicle master saved successfully",
                status:200,
                obj:{vehicleName, vehicleBrand, vehicleType, vehicleImage, _id}
                           });
              
            } else {
            
              return res.status(401).json({
                message: "Invalid vehicle master details",
                           });
            }
          }

        
    } catch (error) {
        console.error('Error uploading file:', error);
        return res.status(500).json({
            message: 'Failed to upload file to S3',
            error: error.message,
        });
    }
}

module.exports={VehicalfileUpload}