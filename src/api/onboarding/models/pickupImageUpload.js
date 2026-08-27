const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();
const pickupImage = require("../../../db/schemas/onboarding/pickupImageUpload");
const Booking = require("../../../db/schemas/onboarding/booking.schema");
const { resizeImg } = require("../../../utils/resizeImage");
const User = require("../../../db/schemas/onboarding/user.schema");
const {
  checkVehicleAvailability,
} = require("../../../utils/booking/checkVehicleAvailability");
const {
  updateRideStartDetails,
} = require("../../../helper/updateRideStartDetails");

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

const isDev = process.env.NODE_ENV === "development";

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
      "kycApproved",
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

      const formattedOldVehicleEndMeterReading = isNaN(
        Number(oldVehicleEndMeterReading),
      )
        ? 0
        : Number(oldVehicleEndMeterReading);

      const updatedData = [
        ...(pickupData?.data?.updatedData ?? []),
        {
          vehicleNumber,
          startMeterReading: pickupData?.startMeterReading,
          oldVehicleEndMeterReading: formattedOldVehicleEndMeterReading,
        },
      ];

      const newDocument = await pickupImage.findOneAndUpdate(
        { userId, bookingId },
        {
          $set: {
            files: tempObj,
            data: { updatedData: updatedData },
            // data: updatedData,
            startMeterReading,
            endMeterReading,
          },
        },
        { new: true },
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
        },
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
        { new: true },
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
        { new: true },
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
        { new: true },
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

const normalizeAltContact = (value) => {
  if (!value) return null;
  const cleaned = value.trim();
  return /^\d{10}$/.test(cleaned) ? cleaned : null;
};

// function to start ride and save vehicle images
const savePickupImageLinks = async (req, res) => {
  try {
    let {
      userId,
      bookingId,
      assignVehicleTableId,
      assignVehicleNumber,
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
      altContact,
      address,
    } = req.body;

    let normalizedAltContact = null;

    if (Array.isArray(altContact)) {
      normalizedAltContact = altContact.find(
        (v) => typeof v === "string" && v.trim() !== "",
      );
    } else if (typeof altContact === "string" && altContact.trim() !== "") {
      normalizedAltContact = altContact.trim();
    }

    const isValidIndianMobile = (num) => /^\d{10}$/.test(num);

    if (normalizedAltContact && !isValidIndianMobile(normalizedAltContact)) {
      return res.json({
        message: "Invalid alternate contact number",
      });
    }

    if (!userId || userId === "") {
      return res.json({ message: "Invalid user ID provided." });
    }

    // updating user altContact and address if send from frontend
    const userUpdate = {};

    if (normalizedAltContact) {
      const currentUser = await User.findById(userId).select("contact");

      if (currentUser?.contact === normalizedAltContact) {
        return res.status(200).json({
          success: false,
          message:
            "Alternate contact number cannot be same as primary contact number",
        });
      }

      const existingUser = await User.findOne({
        contact: normalizedAltContact,
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(200).json({
          success: false,
          message: `This number already belongs to ${existingUser.firstName} ${existingUser.lastName}`,
        });
      }

      userUpdate.altContact = normalizedAltContact;
    }

    if (address && address.trim() !== "") {
      const trimmedAddress = address.trim();
      const currentUser = await User.findById(userId).select(
        "addressProof addresses",
      );

      if (!currentUser.addressProof || currentUser.addressProof.trim() === "") {
        // addressProof is empty, save here first
        userUpdate.addressProof = trimmedAddress;
      } else if ((currentUser?.addresses?.length ?? 0) < 5) {
        // addressProof already has value, push to addresses array
        await User.findByIdAndUpdate(
          userId,
          { $addToSet: { addresses: trimmedAddress } },
          { new: true },
        );
      }
      // if addresses.length >= 5, silently skip
    }

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(userId, { $set: userUpdate }, { new: true });
    }

    // continue with rest of the code
    let parsedImageLinks = [];

    // if (!isDev) {
    // if (!imageLinks) {
    //   return res.status(400).json({ message: "imageLinks required" });
    // }

    if (imageLinks) {
      if (typeof imageLinks === "string") {
        try {
          parsedImageLinks = JSON.parse(imageLinks);
        } catch {
          return res.status(400).json({ message: "Invalid imageLinks format" });
        }
      } else if (Array.isArray(imageLinks)) {
        parsedImageLinks = imageLinks;
      } else {
        return res.status(400).json({ message: "Invalid imageLinks format" });
      }
    }
    // }

    const booking = await Booking.findOne({ _id }).populate(
      "userId",
      "kycApproved",
    );

    if (!booking) {
      return res.json({
        status: 404,
        message: "Booking not found",
      });
    }

    const kycStatus = booking?.userId?.kycApproved;

    // before starting the ride, check if booking is canceled or not
    if ((booking?.bookingStatus ?? "canceled") === "canceled") {
      return res.json({
        status: 400,
        message: "Cannot start ride for a canceled booking",
      });
    }

    if (kycStatus === "no") {
      return res.json({
        status: 400,
        message: "Customer kyc is not Approved",
        isKyc: false,
      });
    }

    const { vehicleBasic, paymentMethod, bookingStatus } = booking;

    const RRN_CHECK_START_DATE = new Date("2026-04-01");

    if (
      (paymentMethod === "partiallyPay" || paymentMethod === "online") &&
      booking.createdAt >= RRN_CHECK_START_DATE
    ) {
      const isRrnNumberFound =
        (booking?.bookingPrice?.rrnNumber || "")?.trim() !== "";

      if (!isRrnNumberFound) {
        return res.json({
          status: 400,
          message:
            paymentMethod === "partiallyPay"
              ? "Initial payment for this booking has not been completed yet. Please collect the initial amount before starting the ride."
              : "Online payment for this booking has not been completed yet. Please complete the payment before starting the ride.",
        });
      }
    }

    if (booking.vehicleAssigned === false) {
      if (
        booking.vehicleTableId !== null &&
        booking.vehicleAssigned === false
      ) {
        await Booking.updateOne(
          { _id },
          {
            $set: {
              vehicleAssigned: true,
            },
          },
        );

        booking.vehicleAssigned = true;
      }

      if (booking.vehicleTableId === null) {
        // Vehicle not yet assigned — validate and assign now
        if (!assignVehicleTableId || !assignVehicleNumber) {
          return res.json({
            status: 400,
            message:
              "vehicleTableId and vehicleNumber are required to start the ride",
          });
        }

        const availabilityCheck = await checkVehicleAvailability({
          vehicleTableId: assignVehicleTableId,
          BookingStartDateAndTime: booking.BookingStartDateAndTime,
          BookingEndDateAndTime: booking.BookingEndDateAndTime,
          excludeBookingId: _id,
        });

        if (!availabilityCheck.available) {
          return res.json({
            status: 400,
            message: availabilityCheck.reason,
          });
        }

        await Booking.updateOne(
          { _id },
          {
            $set: {
              vehicleTableId: assignVehicleTableId,
              vehicleAssigned: true,
              "vehicleBasic.vehicleNumber": assignVehicleNumber,
            },
          },
        );

        // sync in-memory so rest of function uses correct vehicleNumber
        booking.vehicleTableId = assignVehicleTableId;
        booking.vehicleAssigned = true;
        booking.vehicleBasic.vehicleNumber = assignVehicleNumber;
      }
    }

    const newBookingStatus =
      bookingStatus === "pending" ? "done" : bookingStatus;

    if (vehicleBasic.startRide !== Number(rideOtp)) {
      return res.json({ status: 400, message: "Invalid Otp" });
    }

    const tempObj = {};
    // if (!isDev) {
    if (parsedImageLinks?.length > 0) {
      parsedImageLinks.forEach((file, index) => {
        if (!file.fileName || !file.imageUrl) return;
        tempObj[`file_${index}`] = {
          fileName: file.fileName,
          imageUrl: file.imageUrl,
        };
      });
    }

    // const isFirstVehicleAssignment =
    //   booking?.changeVehicle?.vehicleNumber === "unassigned" &&
    //   booking?.changeVehicle?.vehicleTableId === null;
    // const isFirstVehicleAssignment = wasUnassigned;

    if (isVehicleUpdate && diffAmountId) {
      if (
        // isFirstVehicleAssignment === false &&
        booking.rideStatus !== "pending" &&
        (oldVehicleEndMeterReading === undefined ||
          oldVehicleEndMeterReading === null ||
          oldVehicleEndMeterReading === "")
      ) {
        return res.json({
          status: 400,
          success: false,
          message: "Old vehicle end meter reading is required.",
        });
      }

      const pickupData = await pickupImage.findOne({ bookingId });

      let updatedData = [];

      // if (isFirstVehicleAssignment === false) {
      if (booking.rideStatus !== "pending") {
        const formattedOldVehicleEndMeterReading = isNaN(
          Number(oldVehicleEndMeterReading),
        )
          ? 0
          : Number(oldVehicleEndMeterReading);

        const oldVehicleNumber =
          booking?.changeVehicle?.vehicleNumber || vehicleNumber; // fallback to sent value

        updatedData = [
          ...(pickupData?.data?.updatedData ?? []),
          {
            vehicleNumber: oldVehicleNumber,
            startMeterReading: pickupData?.startMeterReading || 0,
            oldVehicleEndMeterReading: formattedOldVehicleEndMeterReading,
          },
        ];
      }

      const newDocument = await pickupImage.findOneAndUpdate(
        { userId, bookingId },
        {
          $set: {
            files: tempObj,
            data: { updatedData: updatedData },
            startMeterReading,
            endMeterReading,
          },
        },
        { new: true, upsert: true },
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
        },
      );

      // if (isFirstVehicleAssignment === true) {
      if (booking.rideStatus === "pending") {
        const OTP = Math.floor(1000 + Math.random() * 9000);

        await updateRideStartDetails({
          booking,
          _id,
          OTP,
          PaymentMode,
          paymentStatus,
          startDateAndTime,
          newBookingStatus,
          paymentMethod,
        });
      }

      if (newDocument) {
        return res.json({
          status: 200,
          message: "Ride updated successfully.",
          newDocument: newDocument.toObject({ flattenMaps: true }),
          vehicleNumber: vehicleBasic?.vehicleNumber,
        });
      }
    }

    const newDocument = new pickupImage({
      userId,
      bookingId,
      files: tempObj,
      // data,
      data: { updatedData: [] },
      startMeterReading,
      endMeterReading,
    });

    await newDocument.save();

    const OTP = Math.floor(1000 + Math.random() * 9000);

    await updateRideStartDetails({
      booking,
      _id,
      OTP,
      PaymentMode,
      paymentStatus,
      startDateAndTime,
      newBookingStatus,
      paymentMethod,
    });

    return res.json({
      status: 200,
      message: "Ride started successfully.",
      newDocument,
      vehicleNumber: vehicleBasic?.vehicleNumber,
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
