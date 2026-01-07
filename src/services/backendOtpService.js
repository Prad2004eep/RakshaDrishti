import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

/**
 * Send OTP to phone number via backend
 * @param {string} phoneNumber - Phone number to send OTP to
 * @returns {Promise<object>} - Response with success status and expiry time
 */
export const sendOTPViaBackend = async (phoneNumber) => {
  try {
    console.log('📱 Sending OTP via backend to:', phoneNumber);

    // Format phone number
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

    const response = await axios.post(
      `${API_BASE_URL}/api/auth/send-otp`,
      { phoneNumber: formattedPhone },
      { timeout: 10000 }
    );

    if (response.data.success) {
      console.log('✅ OTP sent successfully');
      return {
        success: true,
        phone: response.data.phone,
        expiresIn: response.data.expiresIn,
        message: response.data.message
      };
    } else {
      throw new Error(response.data.error || 'Failed to send OTP');
    }
  } catch (error) {
    console.error('❌ Error sending OTP:', error.message);
    throw new Error(error.response?.data?.error || error.message || 'Failed to send OTP');
  }
};

/**
 * Verify OTP code via backend
 * @param {string} phoneNumber - Phone number to verify
 * @param {string} otp - OTP code to verify
 * @returns {Promise<object>} - Response with verification status
 */
export const verifyOTPViaBackend = async (phoneNumber, otp) => {
  try {
    console.log('🔐 Verifying OTP via backend for:', phoneNumber);

    // Format phone number
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

    const response = await axios.post(
      `${API_BASE_URL}/api/auth/verify-otp`,
      { phoneNumber: formattedPhone, otp },
      { timeout: 10000 }
    );

    if (response.data.success) {
      console.log('✅ OTP verified successfully');
      return {
        success: true,
        phone: response.data.phone,
        verified: true,
        message: response.data.message
      };
    } else {
      throw new Error(response.data.error || 'Failed to verify OTP');
    }
  } catch (error) {
    console.error('❌ Error verifying OTP:', error.message);
    const errorMessage = error.response?.data?.error || error.message || 'Failed to verify OTP';
    throw new Error(errorMessage);
  }
};

export default {
  sendOTPViaBackend,
  verifyOTPViaBackend
};

