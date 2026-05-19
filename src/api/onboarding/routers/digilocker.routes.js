const router = require("express").Router();
const axios = require("axios");

// const DigiLocker = require("../models/DigiLocker");
const User = require("../../../db/schemas/onboarding/user.schema");
const generateCfSignature = require("../../../utils/cashfree/cashfreeSignature");
const Authentication = require("../../../middlewares/Authentication");
const DigiLocker = require("../../../db/schemas/onboarding/digiLocker.schema");

const CF_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.cashfree.com"
    : "https://sandbox.cashfree.com";

const getCfHeaders = () => ({
  "x-client-id": process.env.CF_CLIENT_ID,
  "x-client-secret": process.env.CF_CLIENT_SECRET,
  "x-cf-signature": generateCfSignature(),
  "Content-Type": "application/json",
});

// 1. Verify account — userId from body
router.post("/verify-account", async (req, res) => {
  try {
    const { aadhaar_number } = req.body;
    const response = await axios.post(
      `${CF_BASE_URL}/verification/digilocker/verify`,
      { aadhaar_number },
      { headers: getCfHeaders() },
    );
    res.json(response.data);
  } catch (err) {
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { message: "Failed to verify account" });
  }
});

// 2. Create DigiLocker URL — userId from body
router.post("/create-url", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const reference_id = `user_${userId}_${Date.now()}`;

    const response = await axios.post(
      `${CF_BASE_URL}/verification/digilocker`,
      {
        reference_id,
        document_types: ["AADHAAR", "PAN", "DRIVING_LICENSE"],
      },
      { headers: getCfHeaders() },
    );

    await DigiLocker.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        verification_id: response.data.verification_id,
        reference_id,
        status: "PENDING",
        documents: { AADHAAR: null, PAN: null, DRIVING_LICENSE: null },
      },
      { upsert: true, new: true },
    );

    res.json(response.data);
  } catch (err) {
    console.error(
      "DigiLocker create-url error:",
      JSON.stringify(err.response?.data || err.message, null, 2),
    );
    res
      .status(err.response?.status || 500)
      .json(
        err.response?.data || { message: "Failed to create DigiLocker URL" },
      );
  }
  //   } catch (err) {
  //     res
  //       .status(err.response?.status || 500)
  //       .json(
  //         err.response?.data || { message: "Failed to create DigiLocker URL" },
  //       );
  //   }
});

// 3. Get Verification Status — userId from query
router.get("/status", async (req, res) => {
  try {
    const { verification_id, reference_id, userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const response = await axios.get(`${CF_BASE_URL}/verification/digilocker`, {
      headers: getCfHeaders(),
      params: { verification_id, reference_id },
    });

    await DigiLocker.findOneAndUpdate(
      { user: userId },
      { status: response.data.status },
    );

    res.json(response.data);
  } catch (err) {
    res
      .status(err.response?.status || 500)
      .json(
        err.response?.data || { message: "Failed to get verification status" },
      );
  }
});

// 4. Fetch all 3 documents — userId from body + update User kycApproved
router.post("/fetch-documents", async (req, res) => {
  try {
    const { verification_id, userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const DOCUMENT_TYPES = ["AADHAAR", "PAN", "DRIVING_LICENSE"];
    const results = {};

    for (const docType of DOCUMENT_TYPES) {
      try {
        const { data } = await axios.get(
          `${CF_BASE_URL}/verification/digilocker/document/${docType}`,
          {
            headers: getCfHeaders(),
            params: { verification_id },
          },
        );
        results[docType] = { success: true, data };
      } catch (err) {
        results[docType] = {
          success: false,
          error: err.response?.data?.message || "Not available",
        };
      }
    }

    // Save to DigiLocker collection
    await DigiLocker.findOneAndUpdate(
      { user: userId },
      {
        status: "AUTHENTICATED",
        "documents.AADHAAR": results.AADHAAR,
        "documents.PAN": results.PAN,
        "documents.DRIVING_LICENSE": results.DRIVING_LICENSE,
      },
      { upsert: true, new: true },
    );

    // Update User — mark KYC approved and document verified
    await User.findByIdAndUpdate(userId, {
      kycApproved: "yes",
      isDocumentVerified: "yes",
    });

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch documents" });
  }
});

// 5. Get saved DigiLocker record for logged-in user — userId from query
router.get("/my-documents", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const record = await DigiLocker.findOne({ user: userId });
    res.json(record || null);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch saved documents" });
  }
});

// 6. Admin — get any user's documents (JWT + userType check)
router.get("/admin/:userId", Authentication, async (req, res) => {
  try {
    if (req.user.userType !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    const record = await DigiLocker.findOne({ user: req.params.userId });
    res.json(record || null);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user documents" });
  }
});

module.exports = router;
