const router = require("express").Router();
const accountService = require("../services/account.service");
const auth = require("../../../middlewares/auth/index");
const upload = require("../../../utils/file-upload/file-upload");
const { otpGenerat, verify } = require("../models/otp.model");
const { emailOtp } = require("../models/otpSendByEmail");
const Authentication = require("../../../middlewares/Authentication");

// Update User
router.post("/profile", async (req, res) => {
  accountService.updateUser(req, res);
});

router.post("/mobileToken", async (req, res) => {
  accountService.addOrUpdateMobileToken(req, res);
});

router.get("/getAllUsers", async (req, res) => {
  accountService.getAllUsers(req, res);
});

router.post("/manager-station", Authentication, async (req, res) => {
  accountService.updateStationInfo(req, res);
});

router.post("/image-upload", upload.single("profileImg"), async (req, res) => {
  accountService.updateImage(req, res);
});

router.post("/signup", async (req, res) => {
  accountService.saveUser(req, res);
});

router.get("/getAllDataCount", async (req, res) => {
  accountService.getAllDataCount(req, res);
});
// Update image
router.post("/getUsersByContact", async (req, res) => {
  accountService.getUserByContact(req, res);
});

router.post("/otpGenerat", async (req, res) => {
  otpGenerat(req, res);
});

router.post("/verifyOtp", async (req, res) => {
  verify(req, res);
});

router.post("/emailOtp", async (req, res) => {
  emailOtp(req, res);
});

module.exports = router;
