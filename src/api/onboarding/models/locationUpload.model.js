const path = require("path");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();
const Location = require("../../../db/schemas/onboarding/location.schema");
const Station = require("../../../db/schemas/onboarding/station.schema");
const Log = require("../models/Logs.model");
const { resizeImg } = require("../../../utils/resizeImage");

// Validate required environment variables
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

// Configure Multer to use Memory Storage
// const upload = multer({
//   storage: multer.memoryStorage(), // Store files in memory for manual upload to S3
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB file size limit
// });

const parseBool = (v) =>
  v === undefined || v === ""
    ? undefined
    : v === true || v === "true" || v === "1";

const uploadLocationImage = async (file) => {
  const allowedMimeTypes = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return {
      error: "Invalid file format. Only PNG, JPG, and WEBP are allowed.",
    };
  }
  const resizedImageBuffer = await resizeImg(file);
  const safeFileName = `${Date.now()}-${path.basename(file.originalname)}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: safeFileName,
      Body: resizedImageBuffer,
      ContentType: file.mimetype,
    }),
  );
  return {
    imageUrl: `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${safeFileName}`,
    imageFileName: safeFileName,
  };
};

// Route to upload the image
const fileUpload = async (req, res) => {
  try {
    const {
      _id,
      deleteRec,
      locationName,
      locationStatus,
      latitude,
      longitude,
      radiusKm,
      showLocationName,
    } = req.body;

    const showName = parseBool(showLocationName);

    if (!_id) {
      const findName = await Location.findOne({ locationName });
      if (findName) {
        return res.json({
          status: 400,
          message: "Location exists",
        });
      }
    }

    const allowedMimeTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.json({
        status: 400,
        message: "Invalid file format. Only PNG, JPG, and WEBP are allowed.",
      });
    }

    const resizedImageBuffer = await resizeImg(req.file);

    // Generate safe file name
    const timestamp = Date.now();
    const safeFileName = `${timestamp}-${path.basename(req.file.originalname)}`;
    const imageFileName = safeFileName;
    //console.log(imageFileName)
    const params = {
      Bucket: AWS_BUCKET_NAME, // Your bucket name
      Key: safeFileName, // File name in the bucket
      Body: resizedImageBuffer, // File content
      ContentType: req.file.mimetype, // File MIME type
    };

    // Upload to S3
    await s3.send(new PutObjectCommand(params));

    // Construct the file URL
    const imageUrl = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${safeFileName}`;

    if (_id && _id.length == 24) {
      const find = await Location.findOne({ _id });
      if (!find) {
        return res.json({
          status: 400,
          message: "Invalid location id",
        });
      }
      if (deleteRec) {
        await Location.deleteOne({ _id });
        await Log({
          message: `Booking with ID ${_id} deleted`,
          functionName: "deletebooking",
        });
        return res.json({
          status: 200,
          message: "location deleted successfully",
        });
      }

      if (!locationName) {
        return res.json({
          status: 200,
          message: "Location name required",
        });
      }

      await Location.updateOne(
        { _id },
        {
          $set: {
            locationName,
            locationImage: imageUrl,
            locationStatus,
            imageFileName,
            ...(showName !== undefined && { showLocationName: showName }),
            ...(latitude !== undefined && { latitude: Number(latitude) }),
            ...(longitude !== undefined && { longitude: Number(longitude) }),
            ...(radiusKm !== undefined && { radiusKm: Number(radiusKm) }),
          },
        },
        { new: true },
      );
      // Update city name for all stations belonging to this location
      await Station.updateMany(
        { locationId: _id },
        { $set: { city: locationName } },
      );

      return res.status(200).json({
        status: 200,
        message: "location updated successfully",
      });
    } else {
      const SaveLocation = new Location({
        locationName,
        locationImage: imageUrl,
        _id,
        locationStatus,
        imageFileName,
        ...(showName !== undefined && { showLocationName: showName }),
        ...(latitude !== undefined && { latitude: Number(latitude) }),
        ...(longitude !== undefined && { longitude: Number(longitude) }),
        ...(radiusKm !== undefined && { radiusKm: Number(radiusKm) }),
      });
      SaveLocation.save();

      return res.status(200).json({
        status: 200,
        message: "File uploaded successfully",
        imageUrl,
        locationName,
        _id,
      });
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.json({
      status: 500,
      message: "Failed to upload file to S3",
      error: error.message,
    });
  }
};

const updateLocation = async (req, res) => {
  const {
    _id,
    locationName,
    locationStatus,
    latitude,
    longitude,
    radiusKm,
    showLocationName,
  } = req.body;

  const obj = {
    status: 200,
    message: "location update successfully",
    data: [],
  };

  try {
    // if (req.file) {
    //   await fileUpload(req, res);
    // }
    // const _id = req.body._id;
    // const locationName = req.body.locationName;
    // const locationStatus = req.body.locationStatus;
    // const latitude = req.body.latitude;
    // const longitude = req.body.longitude;
    // const radiusKm = req.body.radiusKm;

    if (_id) {
      const find = await Location.findOne({ _id });

      if (!find) {
        obj.status = 400;
        obj.message = "Location id is required";
        return res.json(obj);
      }

      const objData = {};
      if (locationName) objData.locationName = locationName;
      if (locationStatus) objData.locationStatus = locationStatus;
      if (latitude) objData.latitude = Number(latitude);
      if (longitude) objData.longitude = Number(longitude);
      if (radiusKm) objData.radiusKm = Number(radiusKm);

      const showName = parseBool(showLocationName);
      if (showName !== undefined) objData.showLocationName = showName;

      if (req.file) {
        const { imageUrl, imageFileName, error } = await uploadLocationImage(
          req.file,
        );
        if (error) {
          return res.json({ status: 400, message: error });
        }
        objData.locationImage = imageUrl;
        objData.imageFileName = imageFileName;
      }

      await Location.updateOne({ _id }, { $set: objData });

      if (locationName) {
        await Station.updateMany(
          { locationId: _id },
          { $set: { city: locationName } },
        );
      }

      obj.message = "location updated successfully";
      obj.status = 200;
      return res.status(200).json(obj);
    }
  } catch (error) {
    console.error("Error updating location:", error.message);
    res.json({ message: "An error occurred while updating location" });
  }
};

module.exports = { fileUpload, updateLocation };
