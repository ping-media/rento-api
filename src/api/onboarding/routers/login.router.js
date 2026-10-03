const router = require("express").Router();
const loginService = require("../services/login.service");
const auth = require("../../../middlewares/auth/index");
const Authentication = require("../../../middlewares/Authentication");

// guest login
router.post("/guest", async (req, res) => {
  loginService.guestLogin(req, res);
});

// Login User
router.post("/login", async (req, res) => {
  loginService.loginUser(req, res);
});

router.post("/adminLogin", async (req, res) => {
  loginService.adminLogin(req, res);
});

router.post("/logout", async (req, res) => {
  loginService.logout(req, res);
});

router.post("/refreshToken", async (req, res) => {
  loginService.refreshToken(req, res);
});

router.post("/updateProfile", Authentication, async (req, res) => {
  loginService.updateProfile(req, res);
});

router.post("/change-password", Authentication, async (req, res) => {
  loginService.changePassword(req, res);
});

// Verify Otp
router.post("/verify-otp", async (req, res) => {
  loginService.verifyOtp(req, res);
});

// Resend Otp
router.post("/resend-otp", async (req, res) => {
  loginService.resendOtp(req, res);
});

// Update Notifications Settings
router.post("/notifications", auth(), async (req, res) => {
  loginService.updateNotificationsSettings(req, res);
});

// Get Notifications Settings
router.get("/notifications", auth(), async (req, res) => {
  loginService.getNotificationsSettings(req, res);
});

module.exports = router;
