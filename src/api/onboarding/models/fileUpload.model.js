
const path = require('path');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();
const Location = require("../../../db/schemas/onboarding/location.schema");



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

      //  let _id= req.body._id
    
        if(req.body && !req.body.locationName){
            return res.status(500).json({
                message: 'Location name required',
            });
        }

        let locationName = req.body.locationName

        const find = await Location.findOne({ locationName })
        if (find) {
            return res.status(401).json({
                message: 'Location exists',
            });
        }

        
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

        const SaveLocation = new Location({ locationName, locationImage: imageUrl })
        SaveLocation.save()
        
        return res.status(200).json({
            message: 'File uploaded successfully',
            imageUrl,
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return res.status(500).json({
            message: 'Failed to upload file to S3',
            error: error.message,
        });
    }
}

module.exports={fileUpload}
