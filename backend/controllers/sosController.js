/**
 * SOS Controller
 * Handles emergency alert endpoints
 */

const { sendSMS, sendWhatsApp, makeVoiceCall, sendSOSAlerts } = require('../services/sosService');

/**
 * Send SMS alert
 * POST /api/sos/sms
 */
async function sendSMSHandler(req, res) {
  try {
    const { phoneNumber, phone, message, userName, latitude, longitude, location } = req.body;
    const phoneToUse = phoneNumber || phone;

    // Validation
    if (!phoneToUse) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
        code: 'MISSING_PHONE'
      });
    }

    if (!message && (!latitude || !longitude) && !location) {
      return res.status(400).json({
        success: false,
        error: 'Message or location is required',
        code: 'MISSING_CONTENT'
      });
    }

    console.log(`\n📱 SMS Alert to: ${phoneToUse}`);

    // Prepare message
    let messageToSend = message;
    if (!messageToSend && (latitude || location)) {
      const lat = latitude || location?.latitude;
      const lng = longitude || location?.longitude;
      const name = userName || 'User';
      messageToSend = `🚨 SOS ALERT from RakshaDrishti!\n\n${name} is in danger!\n\nLocation: https://maps.google.com/?q=${lat},${lng}`;
    }

    // Send SMS
    const result = await sendSMS(phoneToUse, messageToSend);

    console.log(`✅ SMS sent successfully`);

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ SMS send error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send SMS',
      code: error.code || 'SMS_SEND_ERROR'
    });
  }
}

/**
 * Send WhatsApp alert
 * POST /api/sos/whatsapp
 */
async function sendWhatsAppHandler(req, res) {
  try {
    const { phoneNumber, phone, message, userName, latitude, longitude, location } = req.body;
    const phoneToUse = phoneNumber || phone;

    // Validation
    if (!phoneToUse) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
        code: 'MISSING_PHONE'
      });
    }

    if (!message && (!latitude || !longitude) && !location) {
      return res.status(400).json({
        success: false,
        error: 'Message or location is required',
        code: 'MISSING_CONTENT'
      });
    }

    console.log(`\n💬 WhatsApp Alert to: ${phoneToUse}`);

    // Prepare message
    let messageToSend = message;
    if (!messageToSend && (latitude || location)) {
      const lat = latitude || location?.latitude;
      const lng = longitude || location?.longitude;
      const name = userName || 'User';
      messageToSend = `🚨 SOS ALERT from RakshaDrishti!\n\n${name} is in danger!\n\nLocation: https://maps.google.com/?q=${lat},${lng}`;
    }

    // Send WhatsApp
    const result = await sendWhatsApp(phoneToUse, messageToSend);

    console.log(`✅ WhatsApp sent successfully`);

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ WhatsApp send error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send WhatsApp',
      code: error.code || 'WHATSAPP_SEND_ERROR'
    });
  }
}

/**
 * Make emergency voice call
 * POST /api/sos/call
 */
async function makeCallHandler(req, res) {
  try {
    const { phoneNumber, phone, userName, latitude, longitude, location } = req.body;
    const phoneToUse = phoneNumber || phone;

    // Validation
    if (!phoneToUse) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
        code: 'MISSING_PHONE'
      });
    }

    const lat = latitude || location?.latitude || 0;
    const lng = longitude || location?.longitude || 0;
    const name = userName || 'User';

    console.log(`\n📞 Voice Call to: ${phoneToUse}`);

    // Make call
    const result = await makeVoiceCall(phoneToUse, name, lat, lng);

    console.log(`✅ Voice call initiated successfully`);

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Voice call error:', error.message);

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to make voice call',
      code: error.code || 'VOICE_CALL_ERROR'
    });
  }
}

/**
 * Send SOS alerts to multiple contacts (SMS + WhatsApp)
 * POST /api/sos/send-alerts
 */
async function sendAlertsHandler(req, res) {
  try {
    const {
      contacts,
      userName,
      userPhone,
      latitude,
      longitude,
      location,
      message
    } = req.body;

    // Validation
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Contacts array is required',
        code: 'MISSING_CONTACTS'
      });
    }

    const lat = latitude || location?.latitude;
    const lng = longitude || location?.longitude;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Location (latitude and longitude) is required',
        code: 'MISSING_LOCATION'
      });
    }

    const name = userName || 'User';

    console.log(`\n🚨 SOS ALERT triggered by ${name} (${userPhone || 'unknown'})`);
    console.log(`📍 Location: ${lat}, ${lng}`);
    console.log(`👥 Sending to ${contacts.length} contacts...`);

    // Send alerts
    const results = await sendSOSAlerts(contacts, name, lat, lng, message);

    const summary = {
      totalContacts: contacts.length,
      smsSent: results.sms.length,
      whatsappSent: results.whatsapp.length,
      voiceCalls: results.voice.length,
      failed: results.failed.length
    };

    console.log(`✅ SOS Alerts completed:`);
    console.log(`   SMS: ${summary.smsSent}/${summary.totalContacts}`);
    console.log(`   WhatsApp: ${summary.whatsappSent}/${summary.totalContacts}`);
    console.log(`   Failed: ${summary.failed}`);

    res.json({
      success: true,
      results,
      summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Send alerts error:', error.message);

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send SOS alerts',
      code: error.code || 'SOS_ALERTS_ERROR'
    });
  }
}

module.exports = {
  sendSMSHandler,
  sendWhatsAppHandler,
  makeCallHandler,
  sendAlertsHandler
};

