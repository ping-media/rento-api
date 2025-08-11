const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();
const pickupImage = require("../../../db/schemas/onboarding/pickupImageUpload");
const Booking = require("../../../db/schemas/onboarding/booking.schema");
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

// Function to upload document
const pickupImageUp = async (req, res) => {
  try {
    const {
      userId,
      bookingId,
      data,
      startMeterReading,
      endMeterReading,
      _id,
      rideOtp,
      PaymentMode,
      paymentStatus,
      isVehicleUpdate,
      diffAmountId,
      vehicleNumber,
      oldVehicleEndMeterReading,
    } = req.body;

    if (!userId || userId.length !== 24) {
      return res.json({ message: "Invalid user ID provided." });
    }

    const booking = await Booking.findOne({ _id }).populate(
      "userId",
      "kycApproved"
    );
    const kycStatus = booking?.userId?.kycApproved;

    if (kycStatus === "no") {
      return res.json({
        status: 400,
        message: "Customer kyc is not Approved",
        isKyc: false,
      });
    }

    const { vehicleBasic, paymentMethod } = booking;

    if (vehicleBasic.startRide !== Number(rideOtp)) {
      return res.json({ status: 400, message: "Invalid Otp" });
    }

    const uploadedFiles = [];

    // Helper function to get current timestamp in milliseconds
    const getMilliseconds = () => new Date().getTime();

    // Loop through files and upload to S3
    if (process.env.NODE_ENV === "production") {
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
    } else {
      for (let index = 0; index < req.files.length; index++) {
        uploadedFiles.push({
          fileName: `dev_file_${index}.jpg`,
          imageUrl: `https://example.com/dev_placeholder_${index}.jpg`,
        });
      }
    }

    const tempObj = {};
    uploadedFiles.forEach((file, index) => {
      tempObj[`file_${index}`] = {
        fileName: file.fileName,
        imageUrl: file.imageUrl,
      };
    });

    if (isVehicleUpdate && diffAmountId) {
      const pickupData = await pickupImage.findOne({ bookingId });

      const updatedData = [
        ...(pickupData?.data?.updatedData ?? []),
        {
          vehicleNumber,
          startMeterReading: pickupData?.startMeterReading,
          oldVehicleEndMeterReading,
        },
      ];

      const newDocument = await pickupImage.findOneAndUpdate(
        { userId, bookingId },
        {
          $set: {
            files: tempObj,
            data: updatedData,
            startMeterReading,
            endMeterReading,
          },
        },
        { new: true }
      );

      // updating diff amount flag
      await Booking.updateOne(
        { _id },
        {
          $set: {
            "bookingPrice.diffAmount.$[elem].rideStatus": true,
          },
        },
        {
          arrayFilters: [{ "elem.id": Number(diffAmountId) }],
          new: true,
        }
      );

      if (newDocument) {
        return res.json({
          status: 200,
          message: "Vehicle changed successfully.",
          newDocument: newDocument.toObject({ flattenMaps: true }),
        });
      }
    }

    const newDocument = new pickupImage({
      userId,
      bookingId,
      files: tempObj,
      data,
      startMeterReading,
      endMeterReading,
    });

    await newDocument.save();
    const OTP = Math.floor(1000 + Math.random() * 9000);

    if (
      paymentStatus === "partially_paid" ||
      paymentStatus === "partiallyPay"
    ) {
      const AmountLeftAfterUserPaid =
        booking?.bookingPrice?.AmountLeftAfterUserPaid ||
        booking?.bookingPrice?.AmountLeftAfterUserPaid?.amount;

      let updatedAmountLeft = {};
      if (
        AmountLeftAfterUserPaid &&
        typeof AmountLeftAfterUserPaid === "object" &&
        !Array.isArray(AmountLeftAfterUserPaid)
      ) {
        updatedAmountLeft = {
          ...AmountLeftAfterUserPaid,
          status: "paid",
          paymentMethod: PaymentMode,
        };
      } else {
        updatedAmountLeft = {
          status: "paid",
          paymentMethod: PaymentMode,
          ...AmountLeftAfterUserPaid,
        };
      }

      await Booking.updateOne(
        { _id },
        {
          $set: {
            "bookingPrice.isPickupImageAdded": true,
            rideStatus: "ongoing",
            "vehicleBasic.endRide": OTP,
            "bookingPrice.AmountLeftAfterUserPaid": updatedAmountLeft,
            paymentStatus: "paid",
          },
        },
        { new: true }
      );
    } else if (
      paymentMethod?.toLowerCase() === "cash" &&
      paymentStatus === "pending"
    ) {
      await Booking.updateOne(
        { _id },
        {
          $set: {
            "bookingPrice.isPickupImageAdded": true,
            rideStatus: "ongoing",
            "vehicleBasic.endRide": OTP,
            "bookingPrice.payOnPickupMethod": PaymentMode,
            paymentStatus: "paid",
          },
        },
        { new: true }
      );
    } else {
      await Booking.updateOne(
        { _id },
        {
          $set: {
            "bookingPrice.isPickupImageAdded": true,
            rideStatus: "ongoing",
            "vehicleBasic.endRide": OTP,
          },
        },
        { new: true }
      );
    }

    return res.json({
      status: 200,
      message: "Ride started successfully.",
      newDocument,
      endOtp: OTP,
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

// function to start ride and save vehicle images
const savePickupImageLinks = async (req, res) => {
  try {
    let {
      userId,
      bookingId,
      data,
      startMeterReading,
      endMeterReading,
      _id,
      rideOtp,
      PaymentMode,
      paymentStatus,
      isVehicleUpdate,
      diffAmountId,
      vehicleNumber,
      oldVehicleEndMeterReading,
      imageLinks,
      startDateAndTime,
    } = req.body;

    if (!userId || userId === "") {
      return res.json({ message: "Invalid user ID provided." });
    }

    if (typeof imageLinks === "string") {
      try {
        imageLinks = JSON.parse(imageLinks);
      } catch {
        return res.status(400).json({ message: "Invalid imageLinks format" });
      }
    }

    if (!Array.isArray(imageLinks)) {
      return res.status(400).json({ message: "imageLinks should be an array" });
    }

    const booking = await Booking.findOne({ _id }).populate(
      "userId",
      "kycApproved"
    );
    const kycStatus = booking?.userId?.kycApproved;

    if (kycStatus === "no") {
      return res.json({
        status: 400,
        message: "Customer kyc is not Approved",
        isKyc: false,
      });
    }

    const { vehicleBasic, paymentMethod } = booking;

    if (vehicleBasic.startRide !== Number(rideOtp)) {
      return res.json({ status: 400, message: "Invalid Otp" });
    }

    const tempObj = {};
    imageLinks.forEach((file, index) => {
      if (!file.fileName || !file.imageUrl) return;
      tempObj[`file_${index}`] = {
        fileName: file.fileName,
        imageUrl: file.imageUrl,
      };
    });

    if (isVehicleUpdate && diffAmountId) {
      const pickupData = await pickupImage.findOne({ bookingId });

      const updatedData = [
        ...(pickupData?.data?.updatedData ?? []),
        {
          vehicleNumber,
          startMeterReading: pickupData?.startMeterReading,
          oldVehicleEndMeterReading,
        },
      ];

      const newDocument = await pickupImage.findOneAndUpdate(
        { userId, bookingId },
        {
          $set: {
            files: tempObj,
            data: updatedData,
            startMeterReading,
            endMeterReading,
          },
        },
        { new: true }
      );

      // updating diff amount flag
      await Booking.updateOne(
        { _id },
        {
          $set: {
            "bookingPrice.diffAmount.$[elem].rideStatus": true,
          },
        },
        {
          arrayFilters: [{ "elem.id": Number(diffAmountId) }],
          new: true,
        }
      );

      if (newDocument) {
        return res.json({
          status: 200,
          message: "Vehicle changed successfully.",
          newDocument: newDocument.toObject({ flattenMaps: true }),
        });
      }
    }

    const newDocument = new pickupImage({
      userId,
      bookingId,
      files: tempObj,
      data,
      startMeterReading,
      endMeterReading,
    });

    await newDocument.save();
    const OTP = Math.floor(1000 + Math.random() * 9000);

    if (
      paymentStatus === "partially_paid" ||
      paymentStatus === "partiallyPay"
    ) {
      const AmountLeftAfterUserPaid =
        booking?.bookingPrice?.AmountLeftAfterUserPaid ||
        booking?.bookingPrice?.AmountLeftAfterUserPaid?.amount;

      let updatedAmountLeft = {};
      if (
        AmountLeftAfterUserPaid &&
        typeof AmountLeftAfterUserPaid === "object" &&
        !Array.isArray(AmountLeftAfterUserPaid)
      ) {
        updatedAmountLeft = {
          ...AmountLeftAfterUserPaid,
          status: "paid",
          paymentMethod: PaymentMode,
        };
      } else {
        updatedAmountLeft = {
          status: "paid",
          paymentMethod: PaymentMode,
          ...AmountLeftAfterUserPaid,
        };
      }

      await Booking.updateOne(
        { _id },
        {
          $set: {
            "bookingPrice.isPickupImageAdded": true,
            rideStatus: "ongoing",
            "vehicleBasic.endRide": OTP,
            "bookingPrice.AmountLeftAfterUserPaid": updatedAmountLeft,
            "vehicleBasic.RideStart": startDateAndTime || "",
            paymentStatus: "paid",
          },
        },
        { new: true }
      );
    } else if (
      paymentMethod?.toLowerCase() === "cash" &&
      paymentStatus === "pending"
    ) {
      await Booking.updateOne(
        { _id },
        {
          $set: {
            "bookingPrice.isPickupImageAdded": true,
            rideStatus: "ongoing",
            "vehicleBasic.endRide": OTP,
            "bookingPrice.payOnPickupMethod": PaymentMode,
            paymentStatus: "paid",
          },
        },
        { new: true }
      );
    } else {
      await Booking.updateOne(
        { _id },
        {
          $set: {
            "bookingPrice.isPickupImageAdded": true,
            rideStatus: "ongoing",
            "vehicleBasic.endRide": OTP,
          },
        },
        { new: true }
      );
    }

    return res.json({
      status: 200,
      message: "Ride started successfully.",
      newDocument,
      endOtp: OTP,
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

const getPickupImage = async (req, res) => {
  try {
    const { userId, bookingId, _id } = req.query;

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
        data: [],
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
};

const getAllPickupImage = async (req, res) => {
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
};

module.exports = {
  pickupImageUp,
  getPickupImage,
  getAllPickupImage,
  savePickupImageLinks,
};
