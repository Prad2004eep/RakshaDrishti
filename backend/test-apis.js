require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

// Test phone number (replace with your actual phone number for testing)
const TEST_PHONE = '+918016298847'; // REPLACE WITH YOUR PHONE NUMBER

console.log('\n🧪 Testing RakshaDrishti APIs...\n');

// Test 1: Health Check
async function testHealthCheck() {
  try {
    console.log('1️⃣ Testing Health Check...');
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health Check:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
    return false;
  }
}

// Test 2: Send SMS
async function testSMS() {
  try {
    console.log('\n2️⃣ Testing SMS Send...');
    const response = await axios.post(`${API_BASE_URL}/api/sos/send-sms`, {
      phoneNumber: TEST_PHONE,
      message: '🧪 TEST: This is a test SMS from RakshaDrishti. Please ignore.',
      userName: 'Test User',
      location: {
        latitude: 12.9716,
        longitude: 77.5946
      }
    });
    console.log('✅ SMS Sent:', response.data);
    return true;
  } catch (error) {
    console.error('❌ SMS Failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 3: Send WhatsApp
async function testWhatsApp() {
  try {
    console.log('\n3️⃣ Testing WhatsApp Send...');
    const response = await axios.post(`${API_BASE_URL}/api/sos/send-whatsapp`, {
      phoneNumber: TEST_PHONE,
      message: '🧪 TEST: This is a test WhatsApp message from RakshaDrishti. Please ignore.',
      userName: 'Test User',
      location: {
        latitude: 12.9716,
        longitude: 77.5946
      }
    });
    console.log('✅ WhatsApp Sent:', response.data);
    return true;
  } catch (error) {
    console.error('❌ WhatsApp Failed:', error.response?.data || error.message);
    console.log('ℹ️  Note: WhatsApp requires business account approval and recipient opt-in');
    return false;
  }
}

// Test 4: Send SOS Alerts to Multiple Contacts
async function testSOSAlerts() {
  try {
    console.log('\n4️⃣ Testing SOS Alerts to Multiple Contacts...');
    const response = await axios.post(`${API_BASE_URL}/api/sos/send-alerts`, {
      userId: 'test-user-123',
      userName: 'Test User',
      userPhone: TEST_PHONE,
      location: {
        latitude: 12.9716,
        longitude: 77.5946
      },
      message: null, // Use default message
      contacts: [
        { name: 'Contact 1', phone: TEST_PHONE }
      ]
    });
    console.log('✅ SOS Alerts Sent:', response.data.summary);
    return true;
  } catch (error) {
    console.error('❌ SOS Alerts Failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 5: Make Voice Call
async function testVoiceCall() {
  try {
    console.log('\n5️⃣ Testing Voice Call...');
    const response = await axios.post(`${API_BASE_URL}/api/sos/make-call`, {
      phoneNumber: TEST_PHONE,
      userName: 'Test User',
      location: {
        latitude: 12.9716,
        longitude: 77.5946
      }
    });
    console.log('✅ Voice Call Initiated:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Voice Call Failed:', error.response?.data || error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('📱 Test Phone Number:', TEST_PHONE);
  console.log('⚠️  Make sure to replace TEST_PHONE with your actual phone number!\n');
  
  const results = {
    healthCheck: await testHealthCheck(),
    sms: await testSMS(),
    whatsapp: await testWhatsApp(),
    sosAlerts: await testSOSAlerts(),
    voiceCall: await testVoiceCall()
  };

  console.log('\n\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Health Check: ${results.healthCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`SMS Send: ${results.sms ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`WhatsApp Send: ${results.whatsapp ? '✅ PASS' : '⚠️  SKIP (requires setup)'}`);
  console.log(`SOS Alerts: ${results.sosAlerts ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Voice Call: ${results.voiceCall ? '✅ PASS' : '❌ FAIL'}`);
  
  const passCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n✅ Passed: ${passCount}/${totalCount}`);
  
  if (passCount === totalCount) {
    console.log('\n🎉 All tests passed! APIs are working correctly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.\n');
  }
}

// Run tests
runAllTests().catch(console.error);

