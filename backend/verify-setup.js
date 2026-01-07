/**
 * Setup Verification Script
 * Checks if all required configuration is in place
 */

require('dotenv').config();

console.log('\n' + '='.repeat(70));
console.log('🔍 RakshaDrishti Setup Verification');
console.log('='.repeat(70) + '\n');

let allGood = true;
const warnings = [];
const errors = [];

// ============================================
// CHECK ENVIRONMENT VARIABLES
// ============================================
console.log('📋 Checking Environment Variables...\n');

const requiredVars = {
  'TWILIO_ACCOUNT_SID': 'Twilio Account SID',
  'TWILIO_AUTH_TOKEN': 'Twilio Auth Token',
  'TWILIO_PHONE_NUMBER': 'Twilio Phone Number',
  'TWILIO_WHATSAPP_NUMBER': 'Twilio WhatsApp Number'
};

const optionalVars = {
  'TWILIO_VERIFY_SERVICE_SID': 'Twilio Verify Service SID (recommended for production)',
  'PORT': 'Server Port',
  'NODE_ENV': 'Node Environment'
};

// Check required variables
for (const [key, description] of Object.entries(requiredVars)) {
  if (process.env[key]) {
    const value = key.includes('TOKEN') ? '***' + process.env[key].slice(-4) : process.env[key];
    console.log(`✅ ${description}: ${value}`);
  } else {
    console.log(`❌ ${description}: MISSING`);
    errors.push(`Missing required variable: ${key}`);
    allGood = false;
  }
}

console.log('');

// Check optional variables
for (const [key, description] of Object.entries(optionalVars)) {
  if (process.env[key]) {
    const value = process.env[key];
    console.log(`✅ ${description}: ${value}`);
  } else {
    console.log(`⚠️  ${description}: Not set (optional)`);
    warnings.push(`Optional variable not set: ${key}`);
  }
}

console.log('');

// ============================================
// CHECK TWILIO CONFIGURATION
// ============================================
console.log('🔧 Checking Twilio Configuration...\n');

// Check Account SID format
if (process.env.TWILIO_ACCOUNT_SID) {
  if (process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
    console.log('✅ Account SID format is correct');
  } else {
    console.log('❌ Account SID should start with "AC"');
    errors.push('Invalid Account SID format');
    allGood = false;
  }
}

// Check Verify Service SID format
if (process.env.TWILIO_VERIFY_SERVICE_SID) {
  if (process.env.TWILIO_VERIFY_SERVICE_SID.startsWith('VA')) {
    console.log('✅ Verify Service SID format is correct');
  } else {
    console.log('❌ Verify Service SID should start with "VA"');
    errors.push('Invalid Verify Service SID format');
    allGood = false;
  }
} else {
  console.log('⚠️  Verify Service not configured (will use manual OTP)');
}

// Check phone number format
if (process.env.TWILIO_PHONE_NUMBER) {
  if (process.env.TWILIO_PHONE_NUMBER.startsWith('+')) {
    console.log('✅ Phone number format is correct');
  } else {
    console.log('⚠️  Phone number should start with "+" (e.g., +1234567890)');
    warnings.push('Phone number format may be incorrect');
  }
}

// Check WhatsApp number
if (process.env.TWILIO_WHATSAPP_NUMBER) {
  if (process.env.TWILIO_WHATSAPP_NUMBER.includes('whatsapp:')) {
    console.log('✅ WhatsApp number format is correct');
  } else {
    console.log('⚠️  WhatsApp number should include "whatsapp:" prefix');
    warnings.push('WhatsApp number format may be incorrect');
  }
}

console.log('');

// ============================================
// CHECK DEPENDENCIES
// ============================================
console.log('📦 Checking Dependencies...\n');

try {
  require('express');
  console.log('✅ express installed');
} catch (e) {
  console.log('❌ express not installed');
  errors.push('Missing dependency: express');
  allGood = false;
}

try {
  require('twilio');
  console.log('✅ twilio installed');
} catch (e) {
  console.log('❌ twilio not installed');
  errors.push('Missing dependency: twilio');
  allGood = false;
}

try {
  require('dotenv');
  console.log('✅ dotenv installed');
} catch (e) {
  console.log('❌ dotenv not installed');
  errors.push('Missing dependency: dotenv');
  allGood = false;
}

try {
  require('cors');
  console.log('✅ cors installed');
} catch (e) {
  console.log('❌ cors not installed');
  errors.push('Missing dependency: cors');
  allGood = false;
}

console.log('');

// ============================================
// SUMMARY
// ============================================
console.log('='.repeat(70));
console.log('📊 Verification Summary');
console.log('='.repeat(70) + '\n');

if (errors.length > 0) {
  console.log('❌ ERRORS FOUND:\n');
  errors.forEach((error, i) => {
    console.log(`   ${i + 1}. ${error}`);
  });
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:\n');
  warnings.forEach((warning, i) => {
    console.log(`   ${i + 1}. ${warning}`);
  });
  console.log('');
}

if (allGood && errors.length === 0) {
  console.log('✅ All required configuration is in place!\n');
  console.log('📝 Next Steps:\n');
  console.log('   1. Start the server: npm start');
  console.log('   2. Run tests: npm test');
  console.log('   3. Check health: curl http://localhost:3000/health\n');
} else {
  console.log('❌ Setup is incomplete. Please fix the errors above.\n');
  console.log('📝 Setup Instructions:\n');
  console.log('   1. Copy .env.example to .env');
  console.log('   2. Fill in your Twilio credentials');
  console.log('   3. Run: npm install');
  console.log('   4. See: QUICK_START.md for detailed instructions\n');
}

console.log('='.repeat(70) + '\n');

process.exit(allGood && errors.length === 0 ? 0 : 1);

