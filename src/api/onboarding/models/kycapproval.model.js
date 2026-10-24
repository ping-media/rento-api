const kycApproval = require("../../../db/schemas/onboarding/kycApproval.schema");
const Document = require("../../../db/schemas/onboarding/DocumentUpload.Schema");
const User = require("../../../db/schemas/onboarding/user.schema");
const Log = require("./Logs.model");

const kycApprovalFunction = async (req, res) => {
  const { userId, aadharNumber, licenseNumber } = req.body;
  const actorId = req.user?._id?.toString() || "Admin";
  const actorType = req.user?.userType || "unknown";

  if (!userId || !aadharNumber || !licenseNumber) {
    return res.json({
      status: 400,
      message:
        "Missing required fields: userId, aadharNumber, or licenseNumber",
    });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.json({
        status: 404,
        message: "User not found",
      });
    }

    const userDocument = await Document.findOne({ userId });

    if (!userDocument?.files?.length) {
      return res.status(200).json({
        status: 400,
        message: "Please upload KYC documents before approval.",
      });
    }

    const existingKyc = await kycApproval.findOne({
      $or: [{ aadharNumber }, { licenseNumber }],
    });

    if (existingKyc && existingKyc.userId.toString() !== userId) {
      const user = await User.findById(existingKyc.userId);

      await Log({
        message: `KYC approval blocked for ${userId}: Aadhaar or license already assigned to ${existingKyc.userId} (attempted by ${actorType} ${actorId})`,
        functionName: "kycApproval",
        userId: actorId,
      });

      return res.status(200).json({
        status: 400,
        message: `Aadhaar or License already assigned to another user named ${
          user?.firstName || "USER"
        }`,
        userInfo: {
          name: `${user?.firstName || "USER"} ${user?.lastName}`,
          phone: user?.contact || "--",
          email: user?.email || "--",
        },
      });
    }

    if (aadharNumber.length != 12) {
      return res.json({
        status: 400,
        message: "Invalid Aadhar number",
      });
    }

    const ObjDta = { userId, aadharNumber, licenseNumber };

    // Save the log to the database
    const newData = new kycApproval(ObjDta);
    await newData.save();

    await User.updateOne(
      { _id: userId },
      {
        kycApproved: "yes",
        isDocumentVerified: "yes",
        drivingLicence: licenseNumber,
      },
    );

    await Log({
      message: `KYC approved for ${user.firstName} ${user.lastName} (${userId}) by ${actorType} ${actorId}`,
      functionName: "kycApproval",
      userId: actorId,
    });

    return res.status(200).json({
      status: 200,
      message: "KYC approval completed successfully",
    });
  } catch (error) {
    console.error("Error during KYC approval:", error);
    await Log({
      message: `KYC approval failed for ${userId} by ${actorType} ${actorId}: ${error.message}`,
      functionName: "kycApproval",
      userId: actorId,
    });
    return res.json({
      status: 500,
      message: "Internal server error",
    });
  }
};

const kycUnverifyFunction = async (req, res) => {
  const { userId } = req.body;
  const actorId = req.user?._id?.toString() || "Admin";
  const actorType = req.user?.userType || "unknown";

  if (!userId || typeof userId !== "string" || userId.length !== 24) {
    return res.json({ status: 400, message: "Invalid userId" });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.json({ status: 404, message: "User not found" });
    }

    if (user.kycApproved !== "yes" && user.isDocumentVerified !== "yes") {
      return res.json({ status: 400, message: "User is not verified" });
    }

    // delete first: if the user update fails afterwards, the same call can be
    // retried safely, and no stale record is left blocking the Aadhaar/license
    await kycApproval.deleteMany({ userId });

    await User.updateOne(
      { _id: userId },
      { kycApproved: "no", isDocumentVerified: "no" },
    );

    await Log({
      message: `KYC marked un-verified for ${user.firstName} ${user.lastName} (${userId}) by ${actorType} ${actorId}`,
      functionName: "kycUnverify",
      userId: actorId,
    });

    return res.status(200).json({
      status: 200,
      message: "User marked as un-verified",
    });
  } catch (error) {
    console.error("Error during KYC un-verify:", error);

    await Log({
      message: `KYC un-verify failed for ${userId} by ${actorType} ${actorId}: ${error.message}`,
      functionName: "kycUnverify",
      userId: actorId,
    });

    return res.json({ status: 500, message: "Internal server error" });
  }
};

const getKycData = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.json({
      status: 400,
      message: "Missing required fields: userId",
    });
  }

  try {
    const response = await kycApproval.findOne({ userId });

    if (!response) {
      return res.status(200).json({
        status: 404,
        message: "No data found",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "KYC data fetched successfully",
      data: response,
    });
  } catch (error) {
    console.error("Error during KYC approval:", error);
    return res.json({
      status: 500,
      message: "Internal server error",
    });
  }
};

module.exports = { kycApprovalFunction, kycUnverifyFunction, getKycData };
