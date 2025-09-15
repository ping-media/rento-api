const kycApproval = require("../../../db/schemas/onboarding/kycApproval.schema");
const User = require("../../../db/schemas/onboarding/user.schema");

const kycApprovalFunction = async (req, res) => {
  const { userId, aadharNumber, licenseNumber } = req.body;

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

    const existingKyc = await kycApproval.findOne({
      $or: [{ aadharNumber }, { licenseNumber }],
    });

    if (existingKyc && existingKyc.userId.toString() !== userId) {
      return res.status(400).json({
        status: 400,
        message: "Aadhaar or License already assigned to another user",
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
      }
    );

    return res.status(200).json({
      status: 200,
      message: "KYC approval completed successfully",
    });
  } catch (error) {
    console.error("Error during KYC approval:", error);
    return res.json({
      status: 500,
      message: "Internal server error",
    });
  }
};

module.exports = { kycApprovalFunction };
