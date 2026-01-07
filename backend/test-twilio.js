/**
 * Automated Twilio Integration Test Suite
 * Tests OTP, SMS, WhatsApp, and Voice features
 */

const axios = require('axios');

// ============================================
// CONFIGURATION
// ============================================
const API_BASE_URL = 'http://localhost:3000';

// ⚠️ IMPORTANT: Replace with your verified phone number
const TEST_PHONE = '+919035484515'; // Your verified number
const TEST_USER_NAME = 'Test User';
const TEST_LOCATION = {
  latitude: 12.9716,
  longitude: 77.5946
};

// Test contacts (must be verified in Twilio)
const TEST_CONTACTS = [
  {
    name: 'Emergency Contact 1',
    phone: '+919035484515' // Use same number for testing
  }
];

// ============================================
// HELPER FUNCTIONS
// ============================================
function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message) {
  console.error(`❌ ${message}`);
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// TEST FUNCTIONS
// ============================================

/**
 * Test 1: Health Check
 */
async function testHealthCheck() {
  log('🏥', 'Testing health check...');
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    
    if (response.data.status === 'ok') {
      logSuccess('Health check passed');
      logInfo(`Twilio Phone: ${response.data.twilio.phoneNumber}`);
      logInfo(`WhatsApp: ${response.data.twilio.whatsappNumber}`);
      logInfo(`Verify Enabled: ${response.data.twilio.verifyEnabled}`);
      return true;
    }
    return false;
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Send OTP
 */
async function testSendOTP() {
  log('📱', 'Testing OTP send...');
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/send-otp`, {
      phoneNumber: TEST_PHONE
    });
    
    if (response.data.success) {
      logSuccess(`OTP sent to ${TEST_PHONE}`);
      logInfo(`Method: ${response.data.method}`);
      logInfo(`Expires in: ${response.data.expiresIn} seconds`);
      return true;
    }
    return false;
  } catch (error) {
    logError(`OTP send failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * Test 3: Verify OTP (Manual)
 */
async function testVerifyOTP() {
  log('🔐', 'Testing OTP verification...');
  logInfo('⚠️  Manual test required - check your phone for OTP');
  logInfo('   Run this command with the OTP you received:');
  console.log(`
  curl -X POST ${API_BASE_URL}/api/auth/verify-otp \\
    -H "Content-Type: application/json" \\
    -d '{"phoneNumber": "${TEST_PHONE}", "otp": "YOUR_OTP_HERE"}'
  `);
  return true;
}

/**
 * Test 4: Send SMS
 */
async function testSendSMS() {
  log('📱', 'Testing SMS alert...');
  try {
    const response = await axios.post(`${API_BASE_URL}/api/sos/sms`, {
      phoneNumber: TEST_PHONE,
      userName: TEST_USER_NAME,
      latitude: TEST_LOCATION.latitude,
      longitude: TEST_LOCATION.longitude
    });
    
    if (response.data.success) {
      logSuccess(`SMS sent to ${TEST_PHONE}`);
      logInfo(`Message SID: ${response.data.messageSid}`);
      logInfo(`Status: ${response.data.status}`);
      return true;
    }
    return false;
  } catch (error) {
    logError(`SMS send failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * Test 5: Send WhatsApp
 */
async function testSendWhatsApp() {
  log('💬', 'Testing WhatsApp alert...');
  try {
    const response = await axios.post(`${API_BASE_URL}/api/sos/whatsapp`, {
      phoneNumber: TEST_PHONE,
      userName: TEST_USER_NAME,
      latitude: TEST_LOCATION.latitude,
      longitude: TEST_LOCATION.longitude
    });
    
    if (response.data.success) {
      logSuccess(`WhatsApp sent to ${TEST_PHONE}`);
      logInfo(`Message SID: ${response.data.messageSid}`);
      logInfo(`Status: ${response.data.status}`);
      return true;
    }
    return false;
  } catch (error) {
    logError(`WhatsApp send failed: ${error.response?.data?.error || error.message}`);
    logInfo('   Make sure you joined WhatsApp sandbox');
    return false;
  }
}

/**
 * Test 6: Make Voice Call
 */
async function testVoiceCall() {
  log('📞', 'Testing voice call...');
  try {
    const response = await axios.post(`${API_BASE_URL}/api/sos/call`, {
      phoneNumber: TEST_PHONE,
      userName: TEST_USER_NAME,
      latitude: TEST_LOCATION.latitude,
      longitude: TEST_LOCATION.longitude
    });

    if (response.data.success) {
      logSuccess(`Voice call initiated to ${TEST_PHONE}`);
      logInfo(`Call SID: ${response.data.callSid}`);
      logInfo(`Status: ${response.data.status}`);
      return true;
    }
    return false;
  } catch (error) {
    logError(`Voice call failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * Test 7: Send SOS Alerts to Multiple Contacts
 */
async function testSOSAlerts() {
  log('🚨', 'Testing SOS alerts to multiple contacts...');
  try {
    const response = await axios.post(`${API_BASE_URL}/api/sos/send-alerts`, {
      userName: TEST_USER_NAME,
      userPhone: TEST_PHONE,
      latitude: TEST_LOCATION.latitude,
      longitude: TEST_LOCATION.longitude,
      contacts: TEST_CONTACTS
    });

    if (response.data.success) {
      logSuccess('SOS alerts sent successfully');
      logInfo(`Total contacts: ${response.data.summary.totalContacts}`);
      logInfo(`SMS sent: ${response.data.summary.smsSent}`);
      logInfo(`WhatsApp sent: ${response.data.summary.whatsappSent}`);
      logInfo(`Failed: ${response.data.summary.failed}`);
      return true;
    }
    return false;
  } catch (error) {
    logError(`SOS alerts failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// ============================================
// RUN ALL TESTS
// ============================================
async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 RakshaDrishti Twilio Integration Test Suite');
  console.log('='.repeat(70));
  console.log(`📱 Test Phone: ${TEST_PHONE}`);
  console.log(`📍 Test Location: ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude}`);
  console.log('='.repeat(70) + '\n');

  const results = {
    healthCheck: false,
    sendOTP: false,
    verifyOTP: true, // Manual test
    sendSMS: false,
    sendWhatsApp: false,
    voiceCall: false,
    sosAlerts: false
  };

  // Test 1: Health Check
  results.healthCheck = await testHealthCheck();
  await sleep(1000);

  if (!results.healthCheck) {
    logError('Health check failed. Make sure backend is running.');
    logInfo('Start backend with: cd backend && npm start');
    process.exit(1);
  }

  console.log('');

  // Test 2: Send OTP
  results.sendOTP = await testSendOTP();
  await sleep(2000);
  console.log('');

  // Test 3: Verify OTP (Manual)
  results.verifyOTP = await testVerifyOTP();
  await sleep(1000);
  console.log('');

  // Test 4: Send SMS
  results.sendSMS = await testSendSMS();
  await sleep(2000);
  console.log('');

  // Test 5: Send WhatsApp
  results.sendWhatsApp = await testSendWhatsApp();
  await sleep(2000);
  console.log('');

  // Test 6: Voice Call
  results.voiceCall = await testVoiceCall();
  await sleep(2000);
  console.log('');

  // Test 7: SOS Alerts
  results.sosAlerts = await testSOSAlerts();
  await sleep(1000);
  console.log('');

  // Summary
  console.log('='.repeat(70));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(70));
  console.log(`Health Check:     ${results.healthCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Send OTP:         ${results.sendOTP ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Verify OTP:       ⚠️  MANUAL TEST REQUIRED`);
  console.log(`Send SMS:         ${results.sendSMS ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Send WhatsApp:    ${results.sendWhatsApp ? '✅ PASS' : '⚠️  FAIL (check sandbox)'}`);
  console.log(`Voice Call:       ${results.voiceCall ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`SOS Alerts:       ${results.sosAlerts ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(70));

  const passCount = Object.values(results).filter(r => r === true).length;
  const totalTests = Object.keys(results).length - 1; // Exclude manual test

  console.log(`\n✅ Passed: ${passCount}/${totalTests} tests`);

  if (passCount === totalTests) {
    console.log('\n🎉 All tests passed! Twilio integration is working correctly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.\n');
  }
}

// ============================================
// MAIN
// ============================================
if (require.main === module) {
  console.log('\n⚠️  IMPORTANT: Update TEST_PHONE with your verified number before running!\n');

  runAllTests().catch(error => {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testHealthCheck,
  testSendOTP,
  testSendSMS,
  testSendWhatsApp,
  testVoiceCall,
  testSOSAlerts
};

