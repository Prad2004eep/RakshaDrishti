/**
 * OTP Service - Handles OTP generation and verification
 * Uses Twilio Verify API when available, falls back to manual OTP
 */

const { twilioClient, twilioConfig } = require('../config/twilio');

// In-memory OTP store (use Redis in production)
const otpStore = new Map();

/**
 * Generate a random 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP using Twilio Verify API
 */
async function sendOTPWithVerify(phoneNumber) {
  try {
    const verification = await twilioClient.verify.v2
      .services(twilioConfig.verifyServiceSid)
      .verifications
      .create({
        to: phoneNumber,
        channel: 'sms'
      });

    return {
      success: true,
      method: 'verify',
      status: verification.status,
      to: verification.to,
      channel: verification.channel,
      valid: verification.valid
    };
  } catch (error) {
    console.error('Twilio Verify API error:', error.message);
    throw error;
  }
}

/**
 * Send OTP using manual generation and SMS
 */
async function sendOTPManual(phoneNumber) {
  try {
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes

    // Store OTP
    otpStore.set(phoneNumber, {
      otp,
      expiresAt,
      attempts: 0,
      createdAt: Date.now()
    });

    // Send via SMS
    const message = await twilioClient.messages.create({
      body: `Your RakshaDrishti verification code is: ${otp}\n\nValid for 5 minutes.\n\nDo not share this code with anyone.`,
      from: twilioConfig.phoneNumber,
      to: phoneNumber
    });

    return {
      success: true,
      method: 'manual',
      messageSid: message.sid,
      status: message.status,
      to: phoneNumber,
      expiresIn: 300 // seconds
    };
  } catch (error) {
    console.error('Manual OTP send error:', error.message);
    throw error;
  }
}

/**
 * Send OTP (automatically chooses best method)
 */
async function sendOTP(phoneNumber) {
  // Format phone number
  const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

  console.log(`📱 Sending OTP to ${formattedPhone}...`);

  try {
    // Use Twilio Verify if available
    if (twilioConfig.hasVerifyService) {
      console.log('   Using Twilio Verify API');
      return await sendOTPWithVerify(formattedPhone);
    } else {
      console.log('   Using manual OTP generation');
      return await sendOTPManual(formattedPhone);
    }
  } catch (error) {
    // If Verify fails, fallback to manual
    if (twilioConfig.hasVerifyService) {
      console.warn('   Twilio Verify failed, falling back to manual OTP');
      return await sendOTPManual(formattedPhone);
    }
    throw error;
  }
}

/**
 * Verify OTP using Twilio Verify API
 */
async function verifyOTPWithVerify(phoneNumber, code) {
  try {
    const verificationCheck = await twilioClient.verify.v2
      .services(twilioConfig.verifyServiceSid)
      .verificationChecks
      .create({
        to: phoneNumber,
        code: code
      });

    return {
      success: verificationCheck.status === 'approved',
      method: 'verify',
      status: verificationCheck.status,
      valid: verificationCheck.valid
    };
  } catch (error) {
    console.error('Twilio Verify check error:', error.message);
    throw error;
  }
}

/**
 * Verify OTP using manual method
 */
function verifyOTPManual(phoneNumber, code) {
  const storedData = otpStore.get(phoneNumber);

  if (!storedData) {
    throw new Error('OTP not found or expired');
  }

  // Check expiry
  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(phoneNumber);
    throw new Error('OTP has expired');
  }

  // Check attempts
  if (storedData.attempts >= 3) {
    otpStore.delete(phoneNumber);
    throw new Error('Too many failed attempts');
  }

  // Verify code
  if (storedData.otp !== code) {
    storedData.attempts++;
    throw new Error(`Invalid OTP (${3 - storedData.attempts} attempts remaining)`);
  }

  // Success - cleanup
  otpStore.delete(phoneNumber);

  return {
    success: true,
    method: 'manual',
    status: 'approved',
    valid: true
  };
}

/**
 * Verify OTP (automatically chooses best method)
 */
async function verifyOTP(phoneNumber, code) {
  // Format phone number
  const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

  console.log(`🔐 Verifying OTP for ${formattedPhone}...`);

  try {
    // Use Twilio Verify if available
    if (twilioConfig.hasVerifyService) {
      console.log('   Using Twilio Verify API');
      return await verifyOTPWithVerify(formattedPhone, code);
    } else {
      console.log('   Using manual OTP verification');
      return verifyOTPManual(formattedPhone, code);
    }
  } catch (error) {
    // If Verify fails, try manual as fallback
    if (twilioConfig.hasVerifyService && otpStore.has(formattedPhone)) {
      console.warn('   Twilio Verify failed, trying manual verification');
      return verifyOTPManual(formattedPhone, code);
    }
    throw error;
  }
}

module.exports = {
  sendOTP,
  verifyOTP,
  generateOTP
};

