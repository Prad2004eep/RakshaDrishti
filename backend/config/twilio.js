/**
 * Twilio Configuration and Client Setup
 * Handles all Twilio service initialization
 */

require('dotenv').config();
const twilio = require('twilio');

// Validate required environment variables
const requiredEnvVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'TWILIO_WHATSAPP_NUMBER'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ ERROR: Missing required Twilio environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease check your backend/.env file');
  process.exit(1);
}

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Twilio configuration object
const twilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER,
  verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
  
  // Feature flags
  hasVerifyService: !!process.env.TWILIO_VERIFY_SERVICE_SID,
};

// Validate Twilio client on startup
async function validateTwilioConfig() {
  try {
    console.log('🔍 Validating Twilio configuration...');
    
    // Test account access
    const account = await twilioClient.api.accounts(twilioConfig.accountSid).fetch();
    console.log(`✅ Twilio account validated: ${account.friendlyName}`);
    console.log(`   Account Status: ${account.status}`);
    console.log(`   Account Type: ${account.type}`);
    
    // Check if Verify Service is configured
    if (twilioConfig.hasVerifyService) {
      try {
        const verifyService = await twilioClient.verify.v2
          .services(twilioConfig.verifyServiceSid)
          .fetch();
        console.log(`✅ Twilio Verify Service validated: ${verifyService.friendlyName}`);
      } catch (error) {
        console.warn('⚠️  Twilio Verify Service SID is invalid or not accessible');
        console.warn('   OTP will use fallback method (manual generation)');
        twilioConfig.hasVerifyService = false;
      }
    } else {
      console.warn('⚠️  TWILIO_VERIFY_SERVICE_SID not configured');
      console.warn('   OTP will use fallback method (manual generation)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Twilio configuration validation failed:', error.message);
    return false;
  }
}

module.exports = {
  twilioClient,
  twilioConfig,
  validateTwilioConfig
};

