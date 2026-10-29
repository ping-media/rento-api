const multer = require("multer");
const { resizeImg } = require("../../../utils/resizeImage");
const {
  DeleteObjectCommand,
  S3Client,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const Booking = require("../../../db/schemas/onboarding/booking.schema");
const pickupImage = require("../../../db/schemas/onboarding/pickupImageUpload");
const Log = require("./Logs.model");

require("dotenv").config();

// const upload = multer({
//   storage: multer.memoryStorage(),
// });

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
    "Missing required environment variables for AWS configuration.",
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
      Math.random() * 1000,
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

const replacePickupImage = async (req, res) => {
  const actorId = String(req.user?._id || "unknown");
  const { userId, bookingId, fileId } = req.body;
  let newFileName = null;

  try {
    if (!userId || userId.length !== 24) {
      return res.status(400).json({ message: "Invalid user ID provided." });
    }
    if (!bookingId) {
      return res.status(400).json({ message: "bookingId is required." });
    }
    if (!fileId || fileId.length !== 24) {
      return res.status(400).json({ message: "Invalid file ID provided." });
    }
    const booking = await Booking.findOne({ bookingId }).select("rideStatus");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }
    if (booking.rideStatus !== "ongoing") {
      await Log({
        message: "Pickup image replace blocked: ride is not ongoing",
        functionName: "replacePickupImage",
        userId: actorId,
        otherInfo: { bookingId, fileId, rideStatus: booking.rideStatus },
      });
      return res.status(400).json({
        message: "Images can only be replaced while the ride is ongoing.",
      });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const doc = await pickupImage.findOne({ userId, bookingId });
    if (!doc) {
      return res.status(404).json({ message: "Pickup images not found." });
    }

    // files is a Map of subdocuments, so find the key (file_0, file_1...) by _id
    let targetKey = null;
    let oldFile = null;
    for (const [key, value] of doc.files.entries()) {
      if (String(value._id) === String(fileId)) {
        targetKey = key;
        oldFile = value;
        break;
      }
    }

    if (!targetKey) {
      return res
        .status(404)
        .json({ message: "File not found in pickup images." });
    }

    const file = req.file;
    const resizedImageBuffer = await resizeImg(file);
    newFileName = `${userId}_${Date.now()}_${Math.floor(
      Math.random() * 1000,
    )}.${file.mimetype.split("/")[1] || "jpg"}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: newFileName,
        Body: resizedImageBuffer,
        ContentType: file.mimetype,
      }),
    );

    const newImageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${newFileName}`;

    // $set on the nested fields keeps the existing _id intact
    let updatedDoc;
    try {
      updatedDoc = await pickupImage.findOneAndUpdate(
        { _id: doc._id },
        {
          $set: {
            [`files.${targetKey}.fileName`]: newFileName,
            [`files.${targetKey}.imageUrl`]: newImageUrl,
          },
        },
        { new: true },
      );
    } catch (dbError) {
      // DB failed, so remove the just-uploaded object to avoid an orphan
      await s3
        .send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: newFileName,
          }),
        )
        .catch(() => {});
      throw dbError;
    }

    // Delete the old object last, and don't fail the request if this fails
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: oldFile.fileName,
        }),
      );
    } catch (delError) {
      console.error("Old pickup image delete failed:", delError.message);
    }

    await Log({
      message: "Pickup image replaced",
      functionName: "replacePickupImage",
      userId: actorId,
      otherInfo: {
        bookingId,
        customerId: userId,
        fileId,
        slot: targetKey,
        oldFileName: oldFile.fileName,
        newFileName,
      },
    });

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Pickup image replaced successfully.",
      data: {
        key: targetKey,
        file: updatedDoc.files.get(targetKey),
      },
    });
  } catch (error) {
    await Log({
      message: `Pickup image replace failed: ${error.message}`,
      functionName: "replacePickupImage",
      userId: String(req.user?._id || "unknown"),
      otherInfo: { bookingId, fileId },
    }).catch(() => {});

    console.error("Replace pickup image error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to replace pickup image.",
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
  replacePickupImage,
  uploadImageToBucketForPickupImage,
  deleteImageFromBucket,
};
