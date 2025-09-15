const multer = require("multer");
const { resizeImg } = require("../../../utils/resizeImage");
const {
  DeleteObjectCommand,
  S3Client,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");

require("dotenv").config();

const upload = multer({
  storage: multer.memoryStorage(),
});

const {
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_BUCKET_NAME,
} = process.env;

if (
  !AWS_REGION ||
  !AWS_ACCESS_KEY_ID ||
  !AWS_SECRET_ACCESS_KEY ||
  !AWS_BUCKET_NAME
) {
  console.error(
    "Missing required environment variables for AWS configuration."
  );
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

// const uploadImageToBucketForDocument = async (req, res) => {
//   upload.single("image")(req, res, async function (err) {
//     if (err) {
//       return res
//         .status(500)
//         .json({ message: "Upload failed", error: err.message });
//     }

//     const { userId, docType } = req.body;

//     if (!req.file) {
//       return res.status(400).json({ message: "No file provided." });
//     }

//     if (!userId || userId.length !== 24) {
//       return res.status(400).json({ message: "Invalid or missing user ID." });
//     }

//     try {
//       const file = req.file;
//       const resizedImageBuffer = await resizeImg(file);

//       const fileName = `${userId}_${Date.now()}_${docType || "image"}`;
//       const params = {
//         Bucket: process.env.AWS_BUCKET_NAME,
//         Key: fileName,
//         Body: resizedImageBuffer,
//         ContentType: file.mimetype,
//       };

//       await s3.send(new PutObjectCommand(params));

//       const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

//       return res.status(200).json({
//         status: 200,
//         message: "File uploaded successfully.",
//         data: { imageUrl, fileName },
//       });
//     } catch (error) {
//       console.error("Upload error:", error);
//       return res.status(500).json({
//         message: "Failed to upload image to S3.",
//         error: error.message,
//       });
//     }
//   });
// };

const uploadImageToBucketForPickupImage = async (req, res) => {
  const { userId } = req.body;
  try {
    if (!userId || userId.length !== 24) {
      return res.status(400).json({ message: "Invalid user ID provided." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const file = req.file;
    const resizedImageBuffer = await resizeImg(file);
    const fileName = `${userId}_${Date.now()}_${Math.floor(
      Math.random() * 1000
    )}.${file.mimetype.split("/")[1] || "jpg"}`;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: resizedImageBuffer,
      ContentType: file.mimetype,
    };

    await s3.send(new PutObjectCommand(params));

    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Image uploaded successfully.",
      data: { imageUrl, fileName },
    });
  } catch (error) {
    console.error("S3 Upload Error:", error);
    return res.status(500).json({
      message: "Failed to upload image.",
      success: false,
      error: error.message,
    });
  }
};

const deleteImageFromBucket = async (req, res) => {
  const { fileName } = req.body;

  if (!fileName) {
    return res.status(400).json({ message: "fileName is required." });
  }

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
  };

  try {
    await s3.send(new DeleteObjectCommand(params));

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Image deleted successfully.",
      fileName,
    });
  } catch (error) {
    console.error("Error deleting image from S3:", error);
    return res.status(500).json({
      message: "Failed to delete image from S3.",
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  //   uploadImageToBucketForDocument,
  uploadImageToBucketForPickupImage,
  deleteImageFromBucket,
};
