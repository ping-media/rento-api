const path = require('path');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();
const Document = require("../../../db/schemas/onboarding/DocumentUpload.Schema");

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
const documentUpload = async (req, res) => {
    try {
        const { _id, userId, documentType } = req.body;

        // Validate userId
        if (!userId || userId.length !== 24) {
            return res.status(400).json({ message: "Invalid user ID provided." });
        }

        // Generate unique file name
        const timestamp = Date.now();
        const safeFileName = `${timestamp}-${path.basename(req.file.originalname)}`;

        // S3 upload parameters
        const params = {
            Bucket: AWS_BUCKET_NAME,
            Key: safeFileName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        };

        // Upload file to S3
        await s3.send(new PutObjectCommand(params));

        // Construct file URL
        const imageUrl = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${safeFileName}`;

        // Check if a document already exists for the user
        const existingDocument = await Document.findOne({ userId });

        if (existingDocument) {
            // Update the document if it exists
            await Document.updateOne({ userId }, { $set: { documentType: imageUrl } });
            return res.status(200).json({
                status: 200,
                message: "File uploaded  successfully.",
                imageUrl,
            });
        }

        // Create a new document if none exists
        const newDocument = new Document({ userId }, { $set: { documentType: imageUrl } });
        await newDocument.save();

        return res.status(200).json({
            status: 200,
            message: "File uploaded successfully.",
            imageUrl,
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return res.status(500).json({
            message: "Failed to upload file to S3.",
            error: error.message,
        });
    }
};

const getDocument = async (req, res) => {
    try {
      const { userId } = req.query;
  
      if (!userId) {
        return res.status(400).json({
          status: 400,
          message: "User ID is required.",
        });
      }
  
      const documents = await Document.find({ userId });
  
      if (!documents || documents.length === 0) {
        return res.status(404).json({
          status: 404,
          message: "No documents found for the provided User ID.",
        });
      }
  
      return res.status(200).json({
        status: 200,
        message: "Documents retrieved successfully.",
        data: documents,
      });
    } catch (error) {
      console.error("Error fetching documents:", error);
      return res.status(500).json({
        status: 500,
        message: "Failed to retrieve documents.",
        error: error.message,
      });
    }
  };
  


module.exports = { documentUpload, getDocument };
