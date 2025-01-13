
const path = require('path');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();
const Location = require("../../../db/schemas/onboarding/location.schema");
const Log = require("../models/Logs.model")



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
const fileUpload =async (req, res) => {
    try {
      const {_id,deleteRec,locationName,locationStatus}=req.body
        // const  _id= req.body._id;
        // const  deleteRec=req.body.deleteRec;
        // const locationName = req.body.locationName;
        // const locationStatus= req.body.locationStatus;
       
        if (!_id){
            const findName = await Location.findOne({ locationName })
            if (findName) {
                return res.json({
                    status:400,
                    message: 'Location exists',
                });
          }
            
            }
    
        const allowedMimeTypes = ["image/png", "image/jpeg", "image/webp"];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
            return res.json({
                status:400,
                message: "Invalid file format. Only PNG, JPG, and WEBP are allowed.",
            });
        }
       
        
        // Generate safe file name
        const timestamp = Date.now();
        const safeFileName = `${timestamp}-${path.basename(req.file.originalname)}`;
        const imageFileName = safeFileName
        console.log(imageFileName)
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

        if (_id && _id.length == 24) {
            const find = await Location.findOne({ _id })
    if (!find) {
     
      return res.json({
        status:400,
        message: 'Invalid _id',
    });
    }
    if (deleteRec) {
      await Location.deleteOne({ _id})
      await Log({
        message: `Booking with ID ${_id} deleted`,
        functionName: "deletebooking",
      
      });
      return res.json({
        status:200,
        message: 'location deleted successfully',
    });
    }
    
    if(!locationName){
        return res.json({
            status:200,
            message: 'Location name required',
        });
    }

  
    await Location.updateOne(
        { _id },
        {
          $set: { locationName, locationImage:imageUrl,locationStatus,imageFileName }
        },
        { new: true }
      );
     
      return res.status(200).json({
        status:200,
        message: 'location updated successfully',
    });
}
        else{
            const SaveLocation = new Location({ locationName, locationImage: imageUrl,_id, locationStatus, imageFileName })
        SaveLocation.save()
        
        return res.status(200).json({
            status:200,
            message: 'File uploaded successfully',
            imageUrl, locationName, _id
        });
        }

        
    } catch (error) {
        console.error('Error uploading file:', error);
        return res.json({
            status:500,
            message: 'Failed to upload file to S3',
            error: error.message,
        });
    }
}

module.exports={fileUpload}
