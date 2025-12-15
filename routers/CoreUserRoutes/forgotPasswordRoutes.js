const express = require('express');
const router = express.Router();
const {
  requestPasswordReset,
  verifyOTP,
  resetPassword,
  resendOTP,
  testEmail
} = require('../../controllers/CoreUserController/forgotPasswordController');
const { protect } = require('../../middlewares/authMiddleware');

// Test email functionality
router.post('/test-email', testEmail);

// Request password reset (send OTP)
router.post('/request-reset', requestPasswordReset);

// Verify OTP
router.post('/verify-otp', verifyOTP);

// Reset password with token
router.post('/reset-password', resetPassword);

// Resend OTP
router.post('/resend-otp', resendOTP);

module.exports = router;
