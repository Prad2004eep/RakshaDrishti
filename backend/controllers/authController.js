/**
 * Authentication Controller
 * Handles OTP-based authentication
 */

const { sendOTP, verifyOTP } = require('../services/otpService');

/**
 * Send OTP to phone number
 * POST /api/auth/send-otp
 */
async function sendOTPHandler(req, res) {
  try {
    const { phoneNumber, phone } = req.body;
    const phoneToUse = phoneNumber || phone;

    // Validation
    if (!phoneToUse) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
        code: 'MISSING_PHONE'
      });
    }

    console.log(`\n📱 OTP Request for: ${phoneToUse}`);

    // Send OTP
    const result = await sendOTP(phoneToUse);

    console.log(`✅ OTP sent successfully via ${result.method}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      phone: result.to || phoneToUse,
      method: result.method,
      expiresIn: result.expiresIn || 300,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Send OTP error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send OTP',
      code: error.code || 'OTP_SEND_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * Verify OTP code
 * POST /api/auth/verify-otp
 */
async function verifyOTPHandler(req, res) {
  try {
    const { phoneNumber, phone, otp, code } = req.body;
    const phoneToUse = phoneNumber || phone;
    const codeToUse = otp || code;

    // Validation
    if (!phoneToUse || !codeToUse) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and OTP code are required',
        code: 'MISSING_FIELDS'
      });
    }

    console.log(`\n🔐 OTP Verification for: ${phoneToUse}`);

    // Verify OTP
    const result = await verifyOTP(phoneToUse, codeToUse);

    if (result.success) {
      console.log(`✅ OTP verified successfully via ${result.method}`);
      
      res.json({
        success: true,
        message: 'OTP verified successfully',
        phone: phoneToUse,
        verified: true,
        method: result.method,
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn(`⚠️  OTP verification failed: ${result.status}`);
      
      res.status(400).json({
        success: false,
        error: 'Invalid OTP code',
        code: 'INVALID_OTP',
        status: result.status
      });
    }

  } catch (error) {
    console.error('❌ Verify OTP error:', error.message);
    
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to verify OTP',
      code: error.code || 'OTP_VERIFY_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

module.exports = {
  sendOTPHandler,
  verifyOTPHandler
};

