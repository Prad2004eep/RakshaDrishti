/**
 * SOS Service - Handles emergency alerts via SMS, WhatsApp, and Voice
 */

const { twilioClient, twilioConfig } = require('../config/twilio');

/**
 * Format phone number with country code
 */
function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return null;
  return phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
}

/**
 * Create SOS message with location
 * Optimized for Twilio Trial (160 char limit for SMS)
 */
function createSOSMessage(userName, latitude, longitude, customMessage = null) {
  if (customMessage) {
    return customMessage;
  }

  const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;

  // Short message for SMS (under 160 chars for Twilio Trial)
  return `🚨 SOS: ${userName} needs help!
Location: ${locationUrl}
Time: ${new Date().toLocaleTimeString('en-IN')}`;
}

/**
 * Send SMS alert
 */
async function sendSMS(phoneNumber, message) {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  if (!formattedPhone) {
    throw new Error('Invalid phone number');
  }

  try {
    const smsMessage = await twilioClient.messages.create({
      body: message,
      from: twilioConfig.phoneNumber,
      to: formattedPhone
    });

    return {
      success: true,
      type: 'sms',
      messageSid: smsMessage.sid,
      status: smsMessage.status,
      to: formattedPhone
    };
  } catch (error) {
    console.error(`❌ SMS send error to ${formattedPhone}:`);
    console.error(`   Error Code: ${error.code}`);
    console.error(`   Error Message: ${error.message}`);
    if (error.moreInfo) {
      console.error(`   More Info: ${error.moreInfo}`);
    }
    throw error;
  }
}

/**
 * Send WhatsApp alert using Twilio WhatsApp Sandbox
 * Note: For production, you need approved message templates
 * For sandbox testing, users must join the sandbox first by sending "join <code>" to the sandbox number
 */
async function sendWhatsApp(phoneNumber, message) {
  const formattedPhone = formatPhoneNumber(phoneNumber);

  if (!formattedPhone) {
    throw new Error('Invalid phone number');
  }

  try {
    console.log(`💬 Attempting to send WhatsApp to ${formattedPhone}...`);

    // Try to send WhatsApp message using sandbox
    // For sandbox: Users must have joined by sending "join <code>" to the sandbox number
    try {
      const whatsappMessage = await twilioClient.messages.create({
        body: message,
        from: twilioConfig.whatsappNumber, // e.g., 'whatsapp:+14155238886'
        to: `whatsapp:${formattedPhone}`
      });

      console.log(`✅ WhatsApp sent successfully to ${formattedPhone}`);
      return {
        success: true,
        type: 'whatsapp',
        messageSid: whatsappMessage.sid,
        status: whatsappMessage.status,
        to: formattedPhone
      };
    } catch (whatsappError) {
      // If WhatsApp fails (user not in sandbox or other error), fallback to SMS
      console.warn(`⚠️ WhatsApp failed for ${formattedPhone}: ${whatsappError.message}`);
      console.log(`📱 Falling back to SMS for ${formattedPhone}...`);

      // Fallback to SMS
      const smsResult = await sendSMS(phoneNumber, message);
      return {
        ...smsResult,
        type: 'sms_fallback',
        originalError: whatsappError.message
      };
    }
  } catch (error) {
    console.error(`❌ WhatsApp/SMS send error to ${formattedPhone}:`);
    console.error(`   Error Code: ${error.code}`);
    console.error(`   Error Message: ${error.message}`);
    if (error.moreInfo) {
      console.error(`   More Info: ${error.moreInfo}`);
    }
    throw error;
  }
}

/**
 * Make emergency voice call
 */
async function makeVoiceCall(phoneNumber, userName, latitude, longitude) {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  if (!formattedPhone) {
    throw new Error('Invalid phone number');
  }

  const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
  
  const twiml = `
    <Response>
      <Say voice="alice" language="en-IN">
        Emergency SOS Alert from Raksha Drishti!
      </Say>
      <Pause length="1"/>
      <Say voice="alice" language="en-IN">
        ${userName} has triggered an emergency alert and needs immediate help.
      </Say>
      <Pause length="1"/>
      <Say voice="alice" language="en-IN">
        Please check your messages for their live location and respond immediately.
      </Say>
      <Pause length="1"/>
      <Say voice="alice" language="en-IN">
        This is an automated emergency call. Thank you.
      </Say>
    </Response>
  `;

  try {
    const call = await twilioClient.calls.create({
      twiml: twiml,
      to: formattedPhone,
      from: twilioConfig.phoneNumber
    });

    return {
      success: true,
      type: 'voice',
      callSid: call.sid,
      status: call.status,
      to: formattedPhone
    };
  } catch (error) {
    console.error(`Voice call error to ${formattedPhone}:`, error.message);
    throw error;
  }
}

/**
 * Send SOS alerts to multiple contacts (SMS + WhatsApp)
 */
async function sendSOSAlerts(contacts, userName, latitude, longitude, customMessage = null) {
  const message = createSOSMessage(userName, latitude, longitude, customMessage);
  
  const results = {
    sms: [],
    whatsapp: [],
    voice: [],
    failed: []
  };

  console.log(`🚨 Sending SOS alerts to ${contacts.length} contacts...`);

  for (const contact of contacts) {
    // Skip null or invalid contacts
    if (!contact || !contact.phone) {
      console.warn(`⚠️ Skipping invalid contact:`, contact);
      results.failed.push({
        name: 'Unknown',
        phone: 'N/A',
        type: 'invalid',
        error: 'Invalid contact data'
      });
      continue;
    }

    const contactName = contact.name || 'Unknown';
    const contactPhone = contact.phone;

    console.log(`📤 Processing: ${contactName} (${contactPhone})`);

    // Send SMS (primary)
    try {
      const smsResult = await sendSMS(contactPhone, message);
      results.sms.push({
        name: contactName,
        ...smsResult
      });
      console.log(`   ✅ SMS sent to ${contactName}`);
    } catch (smsError) {
      console.warn(`   ⚠️  SMS failed for ${contactName}: ${smsError.message}`);
      results.failed.push({
        name: contactName,
        phone: contactPhone,
        type: 'sms',
        error: smsError.message
      });
    }

    // Send WhatsApp (secondary - optional)
    try {
      const whatsappResult = await sendWhatsApp(contactPhone, message);
      results.whatsapp.push({
        name: contactName,
        ...whatsappResult
      });
      console.log(`   ✅ WhatsApp sent to ${contactName}`);
    } catch (whatsappError) {
      console.warn(`   ⚠️  WhatsApp failed for ${contactName}: ${whatsappError.message}`);
      // WhatsApp failure is not critical if SMS succeeded
    }
  }

  return results;
}

module.exports = {
  sendSMS,
  sendWhatsApp,
  makeVoiceCall,
  sendSOSAlerts,
  createSOSMessage,
  formatPhoneNumber
};

