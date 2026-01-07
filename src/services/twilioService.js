import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

/**
 * Send SMS alert via Twilio
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - Message to send
 * @param {string} userName - Name of user triggering SOS
 * @param {object} location - Location object with latitude and longitude
 * @returns {Promise<object>} - Result of SMS send
 */
export const sendSMSAlert = async (phoneNumber, message, userName, location) => {
  try {
    console.log(`📱 Sending SMS to ${phoneNumber}...`);

    const response = await axios.post(`${API_BASE_URL}/api/sos/send-sms`, {
      phoneNumber,
      message,
      userName,
      location
    }, {
      timeout: 10000 // 10 second timeout
    });

    if (response.data.success) {
      console.log(`✅ SMS sent successfully to ${phoneNumber}`);
      return {
        success: true,
        messageSid: response.data.messageSid,
        status: response.data.status
      };
    } else {
      throw new Error(response.data.error || 'Failed to send SMS');
    }

  } catch (error) {
    console.error(`❌ Error sending SMS to ${phoneNumber}:`, error.message);
    throw error;
  }
};

/**
 * Send WhatsApp alert via Twilio
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - Message to send
 * @param {string} userName - Name of user triggering SOS
 * @param {object} location - Location object with latitude and longitude
 * @returns {Promise<object>} - Result of WhatsApp send
 */
export const sendWhatsAppAlert = async (phoneNumber, message, userName, location) => {
  try {
    console.log(`💬 Sending WhatsApp to ${phoneNumber}...`);

    const response = await axios.post(`${API_BASE_URL}/api/sos/send-whatsapp`, {
      phoneNumber,
      message,
      userName,
      location
    }, {
      timeout: 10000 // 10 second timeout
    });

    if (response.data.success) {
      console.log(`✅ WhatsApp sent successfully to ${phoneNumber}`);
      return {
        success: true,
        messageSid: response.data.messageSid,
        status: response.data.status
      };
    } else {
      throw new Error(response.data.error || 'Failed to send WhatsApp');
    }

  } catch (error) {
    console.error(`❌ Error sending WhatsApp to ${phoneNumber}:`, error.message);
    throw error;
  }
};

/**
 * Send SOS alerts to multiple contacts (SMS + WhatsApp)
 * @param {string} userId - User ID
 * @param {string} userName - User name
 * @param {string} userPhone - User phone number
 * @param {object} location - Location object with latitude and longitude
 * @param {string} message - Custom message (optional)
 * @param {Array} contacts - Array of contact objects with name and phone
 * @returns {Promise<object>} - Results of all alerts sent
 */
export const sendSOSAlertsToContacts = async (userId, userName, userPhone, location, message, contacts) => {
  try {
    console.log(`🚨 Sending SOS alerts to ${contacts.length} contacts...`);

    const response = await axios.post(`${API_BASE_URL}/api/sos/send-alerts`, {
      userId,
      userName,
      userPhone,
      location,
      message,
      contacts
    }, {
      timeout: 30000 // 30 second timeout for multiple contacts
    });

    if (response.data.success) {
      console.log(`✅ SOS alerts sent: ${response.data.summary.smsSent} SMS, ${response.data.summary.whatsappSent} WhatsApp`);
      return {
        success: true,
        results: response.data.results,
        summary: response.data.summary
      };
    } else {
      throw new Error(response.data.error || 'Failed to send SOS alerts');
    }

  } catch (error) {
    console.error('❌ Error sending SOS alerts:', error.message);
    throw error;
  }
};

/**
 * Make emergency voice call via Twilio
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} userName - Name of user triggering SOS
 * @param {object} location - Location object with latitude and longitude
 * @returns {Promise<object>} - Result of voice call
 */
export const makeEmergencyCall = async (phoneNumber, userName, location) => {
  try {
    console.log(`📞 Making emergency call to ${phoneNumber}...`);

    const response = await axios.post(`${API_BASE_URL}/api/sos/make-call`, {
      phoneNumber,
      userName,
      location
    }, {
      timeout: 15000 // 15 second timeout
    });

    if (response.data.success) {
      console.log(`✅ Emergency call initiated to ${phoneNumber}`);
      return {
        success: true,
        callSid: response.data.callSid,
        status: response.data.status
      };
    } else {
      throw new Error(response.data.error || 'Failed to make emergency call');
    }

  } catch (error) {
    console.error(`❌ Error making emergency call to ${phoneNumber}:`, error.message);
    throw error;
  }
};

export default {
  sendSMSAlert,
  sendWhatsAppAlert,
  sendSOSAlertsToContacts,
  makeEmergencyCall
};

