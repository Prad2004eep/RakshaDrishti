import { db } from '../config/firebase';
import { doc, collection, query, where, getDocs, addDoc, updateDoc, getDoc } from 'firebase/firestore';
import { getCurrentLocation } from './locationService';
import { autoCaptureEvidence } from './evidenceCaptureService';
import { sendSOSNotificationToContacts, sendSOSNotificationToAdmin, sendLocalNotification } from './notificationService';
import { sendSOSAlertsToContacts } from './twilioService';
import axios from 'axios';
import { Linking, Platform, Alert } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// Emergency numbers by country (India focused)
const EMERGENCY_NUMBERS = {
  police: '100',
  ambulance: '102',
  fire: '101',
  women_helpline: '1091',
  national_emergency: '112', // Universal emergency number in India
};

// Trigger device emergency call
export const triggerDeviceEmergencyCall = async (emergencyType = 'national_emergency') => {
  try {
    const phoneNumber = EMERGENCY_NUMBERS[emergencyType] || EMERGENCY_NUMBERS.national_emergency;
    const url = Platform.OS === 'ios' ? `telprompt:${phoneNumber}` : `tel:${phoneNumber}`;

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    } else {
      throw new Error('Cannot make emergency call on this device');
    }
  } catch (error) {
    console.error('Error triggering device emergency call:', error);
    throw error;
  }
};

// Trigger SOS with device integration
export const triggerSOS = async (userId, userProfile, options = {}) => {
  try {
    console.log('🚨 Triggering SOS for user:', userId);

    // Send INSTANT local notification FIRST (before any async operations)
    try {
      await sendLocalNotification(
        '🚨 SOS ACTIVATED',
        'Emergency alert has been triggered. Notifying your trusted contacts...',
        { sosId: 'activating', type: 'sos_instant' }
      );
      console.log('✅ Instant SOS notification sent');
    } catch (notifError) {
      console.error('⚠️ Instant notification failed:', notifError);
    }

    // Get current location
    const location = await getCurrentLocation();
    console.log('📍 Location obtained:', location);

    // Create SOS record
    const sosRef = collection(db, 'users', userId, 'sos_alerts');
    const sosData = {
      userId,
      location,
      userProfile: {
        name: userProfile?.name || 'Unknown',
        phone: userProfile?.phone || '',
        bloodGroup: userProfile?.bloodGroup || '',
        emergencyNotes: userProfile?.emergencyNotes || '',
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      triggerMethod: options.triggerMethod || 'manual', // manual, shake, power_button, voice
    };

    const sosDoc = await addDoc(sosRef, sosData);
    console.log('✅ SOS record created:', sosDoc.id);

    // Auto-capture evidence (audio/video) - Run in background, don't await
    // This allows the function to return immediately while evidence is captured
    // Skip if skipEvidenceCapture is true (when using SOSEvidenceRecorder component)
    if (!options.skipEvidenceCapture) {
      autoCaptureEvidence(userId, sosDoc.id)
        .then(() => {
          console.log('✅ Evidence capture completed in background');
        })
        .catch((evidenceError) => {
          console.error('⚠️ Evidence capture failed:', evidenceError);
        });
    } else {
      console.log('ℹ️ Skipping auto-evidence capture (will use SOSEvidenceRecorder)');
    }

    // Get trusted contacts
    const contactsRef = collection(db, 'users', userId, 'trusted_contacts');
    const contactsSnap = await getDocs(contactsRef);

    // Send alerts to trusted contacts
    const alerts = [];
    const contactsForTwilio = [];
    contactsSnap.forEach((doc) => {
      const contact = doc.data();

      // Skip contacts without phone numbers
      if (!contact || !contact.phone) {
        console.warn(`⚠️ Skipping contact without phone: ${doc.id}`);
        return;
      }

      alerts.push({
        contactId: doc.id,
        contactPhone: contact.phone,
        contactEmail: contact.email,
        sosId: sosDoc.id,
      });

      // Format for Twilio (needs name and phone)
      contactsForTwilio.push({
        name: contact.name || 'Trusted Contact',
        phone: contact.phone,
      });
    });

    // Send push notifications to trusted contacts
    try {
      console.log('📧 Sending push notifications to trusted contacts...');
      const notificationResult = await sendSOSNotificationToContacts(
        userId,
        userProfile,
        location,
        sosDoc.id
      );
      console.log('✅ Notification result:', notificationResult);
    } catch (notificationError) {
      console.error('⚠️ Failed to send push notifications:', notificationError);
      // Continue with SOS even if notifications fail
    }

    // Send in-app notification to admin (if user has admin in trusted contacts)
    try {
      console.log('📧 Checking for admin in trusted contacts...');
      contactsSnap.forEach(async (doc) => {
        const contact = doc.data();
        if (contact.email) {
          // Send notification to admin
          await sendSOSNotificationToAdmin(
            contact.email,
            userProfile.name,
            userProfile.phone,
            location,
            sosDoc.id
          );
          console.log('✅ Admin notification sent to:', contact.email);
        }
      });
    } catch (adminNotifError) {
      console.error('⚠️ Failed to send admin notification:', adminNotifError);
      // Continue with SOS even if admin notification fails
    }

    // Send SMS and WhatsApp alerts via Twilio (if available)
    if (contactsForTwilio.length > 0) {
      try {
        console.log('📧 Sending SMS + WhatsApp alerts to', contactsForTwilio.length, 'contacts via Twilio...');

        // Use Twilio service for SMS and WhatsApp
        const twilioResult = await sendSOSAlertsToContacts(
          userId,
          userProfile.name,
          userProfile.phone,
          location,
          null, // Use default message
          contactsForTwilio
        );

        console.log('✅ Twilio alerts sent:', twilioResult.summary);

      } catch (twilioError) {
        console.error('⚠️ Failed to send Twilio alerts:', twilioError);

        // Fallback to old backend API method
        try {
          console.log('📧 Falling back to backend API for SMS...');
          await sendSOSAlerts(userId, userProfile, location, alerts);
        } catch (smsError) {
          console.error('⚠️ Failed to send SMS alerts:', smsError);
          // Continue with SOS even if SMS fails
        }
      }
    }

    // Send local notification to user
    try {
      await sendLocalNotification(
        '🚨 SOS Activated',
        `Emergency alert sent to ${alerts.length} trusted contacts. Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
        { type: 'sos_confirmation', sosId: sosDoc.id }
      );
    } catch (localNotifError) {
      console.error('⚠️ Failed to send local notification:', localNotifError);
    }

    // Optionally trigger device emergency call
    if (options.callEmergency) {
      console.log('📞 Triggering device emergency call...');
      try {
        await triggerDeviceEmergencyCall(options.emergencyType);
      } catch (callError) {
        console.error('⚠️ Emergency call failed:', callError);
        // Don't fail the entire SOS if call fails
      }
    }

    console.log('✅ SOS triggered successfully');
    return {
      id: sosDoc.id,
      ...sosData,
    };
  } catch (error) {
    console.error('❌ Error triggering SOS:', error);
    throw error;
  }
};

// Send SOS alerts to trusted contacts
export const sendSOSAlerts = async (userId, userProfile, location, contacts) => {
  try {
    const alertData = {
      userId,
      userName: userProfile.name,
      userPhone: userProfile.phone,
      location,
      message: `${userProfile.name} has triggered an SOS alert. Location: ${location.latitude}, ${location.longitude}`,
      contacts,
    };

    // Send via backend API
    await axios.post(`${API_BASE_URL}/api/sos/send-alerts`, alertData);

    return true;
  } catch (error) {
    console.error('Error sending SOS alerts:', error);
    throw error;
  }
};

// Deactivate SOS
export const deactivateSOS = async (userId, sosId) => {
  try {
    const sosRef = doc(db, 'users', userId, 'sos_alerts', sosId);

    // Get current SOS data to calculate duration
    let sosData = {};
    try {
      const sosSnap = await getDoc(sosRef);
      sosData = sosSnap.data() || {};
    } catch (error) {
      console.warn('Could not fetch SOS data:', error);
    }

    const deactivatedAt = new Date();
    const duration = sosData?.createdAt
      ? Math.floor((deactivatedAt - sosData.createdAt.toDate()) / 1000)
      : 0;

    // Update SOS record with deactivation info
    console.log('📝 Updating SOS document:', sosId);
    await updateDoc(sosRef, {
      status: 'inactive',
      deactivatedAt: deactivatedAt,
      duration: duration, // Duration in seconds
      stoppedBy: 'user', // Can be 'user', 'timeout', 'system'
      updatedAt: new Date(),
    });

    console.log('✅ SOS document updated');

    // Store deactivation event in evidence collection
    try {
      const evidenceRef = collection(db, 'users', userId, 'sos_alerts', sosId, 'events');
      await addDoc(evidenceRef, {
        type: 'sos_stopped',
        timestamp: deactivatedAt,
        duration: duration,
        stoppedBy: 'user',
        reason: 'User manually stopped SOS',
      });
      console.log('✅ Stop event stored in Firebase');
    } catch (eventError) {
      console.warn('Could not store event:', eventError);
      // Don't fail the entire deactivation if event storage fails
    }

    console.log('✅ SOS deactivated successfully');
    return true;
  } catch (error) {
    console.error('Error deactivating SOS:', error);
    throw error;
  }
};

// Get active SOS alerts
export const getActiveSOSAlerts = async (userId) => {
  try {
    const sosRef = collection(db, 'users', userId, 'sos_alerts');
    const q = query(sosRef, where('status', '==', 'active'));
    const sosSnap = await getDocs(q);

    const alerts = [];
    sosSnap.forEach((doc) => {
      alerts.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return alerts;
  } catch (error) {
    console.error('Error getting active SOS alerts:', error);
    throw error;
  }
};

// Get SOS history
export const getSOSHistory = async (userId, limit = 10) => {
  try {
    const sosRef = collection(db, 'users', userId, 'sos_alerts');
    const sosSnap = await getDocs(sosRef);

    const alerts = [];
    sosSnap.forEach((doc) => {
      alerts.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Sort by date and limit
    return alerts
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting SOS history:', error);
    throw error;
  }
};

