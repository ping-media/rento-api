const router = require("express").Router();
const accountService = require("../services/account.service");
const auth = require("../../../middlewares/auth/index")
const upload = require('../../../utils/file-upload/file-upload');

// Update User
router.post("/profile", async (req, res) => {
  accountService.updateUser(req, res);
});

router.get("/getAllUsers", async (req, res) => {
  accountService.getAllUsers(req, res);
});

router.post("/image-upload", upload.single('profileImg'), async (req, res) => {
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

router.post("/sendOtp", async (req, res) => {
  accountService.sendOtp(req, res);
});

router.post("/verifyOtp", async (req, res) => {
  accountService.verify(req, res);
});

module.exports = router;
