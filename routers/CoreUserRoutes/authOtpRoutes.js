const express = require("express");
const router = express.Router();
const { requestOtp, verifyOtpLogin } = require("../../controllers/CoreUserController/authOtpController");

router.post("/otp/request", requestOtp);
router.post("/otp/verify", verifyOtpLogin);

module.exports = router;
