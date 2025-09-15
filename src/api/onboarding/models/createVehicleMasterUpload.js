const path = require("path");
// const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();
const VehicleMaster = require("../../../db/schemas/onboarding/vehicle-master.schema");
const vehicleTable = require("../../../db/schemas/onboarding/vehicle-table.schema");
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

// Route to upload the image
const VehicalfileUpload = async (req, res) => {
  try {
    const {
      _id,
      deleteRec,
      vehicleBrand,
      vehicleName,
      vehicleType,
      vehicleCategory,
      gstPercentage,
      status,
    } = req.body;

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

    const params = {
      Bucket: AWS_BUCKET_NAME,
      Key: safeFileName,
      Body: resizedImageBuffer,
      ContentType: req.file.mimetype,
    };

    // Upload to S3
    await s3.send(new PutObjectCommand(params));

    // Construct the file URL
    const imageUrl = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${safeFileName}`;

    let vehicleImage = imageUrl;

    if (vehicleType) {
      let statusCheck = ["gear", "non-gear"].includes(vehicleType);

      if (!statusCheck) {
        return res.json({
          status: 400,
          message: "Invalid vehicle type",
        });
      }
    }
    if (_id && _id.length !== 24) {
      return res.json({
        status: 400,
        message: "Invalid _id",
      });
    }

    if (_id) {
      const find = await VehicleMaster.findOne({ _id });

      if (!find) {
        return res.json({
          status: 400,
          message: "Invalid vehicle _id",
        });
      }

      if (deleteRec) {
        await VehicleMaster.deleteOne({ _id });
        await Log({
          message: `Booking with ID ${_id} deleted`,
          functionName: "deletebooking",
          userId,
        });
        return res.status(200).json({
          message: "Vehicle master deleted successfully",
          vehicleName: vehicleName,
        });
      }

      await VehicleMaster.updateOne(
        { _id },
        {
          $set: {
            vehicleBrand,
            vehicleImage,
            vehicleType,
            vehicleName,
            vehicleCategory,
            gstPercentage: Number(gstPercentage),
            imageFileName: safeFileName,
            status,
          },
        },
        { new: true }
      );

      return res.status(200).json({
        status: 200,
        message: "vehicle master updated successfully",
      });
    } else {
      if (
        vehicleName &&
        vehicleType &&
        vehicleBrand &&
        vehicleImage &&
        vehicleCategory &&
        gstPercentage
      ) {
        const find = await VehicleMaster.findOne({ vehicleName });
        if (find) {
          return res.json({
            status: 400,
            message: "vehicle master name already exists",
          });
        }

        if (isNaN(Number(gstPercentage))) {
          return res.json({
            status: 400,
            message: "Gst percentage is not valid! try again",
          });
        }

        const SaveUser = new VehicleMaster({
          vehicleName,
          vehicleBrand,
          vehicleType,
          vehicleCategory,
          gstPercentage: Number(gstPercentage),
          vehicleImage,
          _id,
          imageFileName: safeFileName,
          status,
        });
        SaveUser.save();

        return res.status(200).json({
          message: "vehicle master saved successfully",
          status: 200,
          obj: {
            vehicleName,
            vehicleBrand,
            vehicleType,
            vehicleCategory,
            vehicleImage,
            _id,
          },
        });
      } else {
        return res.json({
          status: 400,
          message: "Invalid vehicle master details",
        });
      }
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

const enableOrDisableVehicles = async (req, res) => {
  try {
    const { _id, status, stationId = [], all = false } = req.body;

    if (!_id && !status) {
      return res.json({
        status: 400,
        message: "Invalid or missing id or status",
      });
    }

    if (!["active", "inactive"].includes(status)) {
      return res.json({
        status: 400,
        message: "Invalid status. Must be 'active' or 'inactive'",
      });
    }

    await VehicleMaster.updateOne({ _id: _id }, { $set: { status: status } });

    const filter = { vehicleMasterId: _id };

    if (Array.isArray(stationId) && stationId.length > 0) {
      filter.stationId = { $in: stationId };
    } else if (!all) {
      return res.status(400).json({
        status: 400,
        message: "Either provide station(s) or all flag to update all stations",
      });
    }

    await vehicleTable.updateMany(filter, {
      $set: { vehicleStatus: status },
    });

    return res.status(200).json({
      status: 200,
      success: true,
      message: `vehicle master ${status} successfully`,
    });
  } catch (error) {
    console.error("Error updating vehicle master and vehicles:", error);
    return res.json({
      status: 500,
      success: false,
      message: "Failed to update the status! try again",
      error: error.message,
    });
  }
};

module.exports = { VehicalfileUpload, enableOrDisableVehicles };
