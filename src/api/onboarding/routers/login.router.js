const router = require("express").Router();
// const elementService = require('../services/user.service');
const loginService = require("../services/login.service");
const auth = require("../../../middlewares/auth/index");

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
