/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const { sendOTPHandler, verifyOTPHandler } = require('../controllers/authController');

// Send OTP
router.post('/send-otp', sendOTPHandler);

// Verify OTP
router.post('/verify-otp', verifyOTPHandler);

module.exports = router;

