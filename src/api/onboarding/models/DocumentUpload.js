const path = require('path');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();
const Document = require("../../../db/schemas/onboarding/DocumentUpload.Schema");
const Log = require("../models/Logs.model");
const {resizeImg} = require("../../../utils/resizeImage")
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
      const { userId, docType, _id, deleteRec} = req.body;
    //  return console.log(req.files)

      if(_id){
        if(deleteRec){
          await Document.deleteOne({ _id });
          await Log({
            message: `Document with ID ${_id} deleted`,
            functionName: "documentUpload",
            userId,
          });
     return res.status(200).json({
      message: "Document deleted successfully",
      status: 200,
      data:  _id}
    )
     ;
      
        }
      }


      // Validate userId
      if (!userId || userId.length !== 24) {
          return res.status(400).json({ message: "Invalid user ID provided." });
      }

      

      

    const uploadedFiles = [];

    // Helper function to get current timestamp in milliseconds
        const getMilliseconds = () => new Date().getTime();
    
        // Loop through files and upload to S3
        for (let index = 0; index < req.files.length; index++) {
          const file = req.files[index];
          const resizedImageBuffer = await resizeImg(file);
          // Generate a unique file name
          const fileName = `${userId}_${getMilliseconds()}_${index}_${docType}`;
    
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


      // Check if a document already exists for the user
      const existingDocument = await Document.findOne({ userId }).maxTimeMS(30000); // 30 seconds timeout

      if (existingDocument) {
          // Append new files to the existing document
          const updatedFiles = existingDocument.files || [];
          updatedFiles.push(...uploadedFiles);

          await Document.updateOne({ userId }, { $set: { files: updatedFiles } });
          return res.status(200).json({
              status: 200,
              message: "Files uploaded successfully.",
              uploadedFiles,
          });
      }

      // Create a new document if none exists
      const newDocument = new Document({
          userId,
          files: uploadedFiles,
      });
      await newDocument.save();

      return res.status(200).json({
          status: 200,
          message: "Files uploaded successfully.",
          uploadedFiles,
      });
  } catch (error) {
      console.error("Error uploading files:", error);
      return res.status(500).json({
          message: "Failed to upload files to S3.",
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
        return res.json({
          status: 400,
          message: "No documents found for the provided User ID.",
          data:[]
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
