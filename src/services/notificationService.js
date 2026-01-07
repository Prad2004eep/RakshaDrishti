import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { db } from '../config/firebase';
import { doc, setDoc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import Constants from 'expo-constants';

// Suppress expo-notifications warnings in Expo Go
const originalWarn = console.warn;
const suppressedWarnings = [
  'expo-notifications',
  'expo-av',
  'Push notifications',
  'Expo AV has been deprecated',
];

const filteredWarn = (message, ...args) => {
  if (suppressedWarnings.some(warning => String(message).includes(warning))) {
    return; // Suppress these warnings
  }
  originalWarn(message, ...args);
};

// Only suppress in development/Expo Go
if (__DEV__) {
  console.warn = filteredWarn;
}

/**
 * Configure notification handler
 */
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    }),
  });
} catch (error) {
  console.log('ℹ️ Notification handler configuration skipped (expected in Expo Go)');
}

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async () => {
  try {
    if (!Device.isDevice) {
      console.warn('⚠️ Notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Notification permission not granted');
      return false;
    }

    console.log('✅ Notification permission granted');
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Get Expo Push Token for this device
 */
export const getExpoPushToken = async () => {
  try {
    if (!Device.isDevice) {
      console.warn('⚠️ Push tokens only work on physical devices');
      return null;
    }

    // Request permissions first
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Get the token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn('⚠️ No projectId found in app.json');
      console.warn('ℹ️ Push notifications require EAS project configuration');
      console.warn('ℹ️ For testing in Expo Go, this is expected. For production, run: eas build:configure');
      console.warn('ℹ️ Or update app.json with: "extra": { "eas": { "projectId": "your-project-id" } }');
      return null;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      console.log('✅ Expo Push Token obtained:', tokenData.data);
      return tokenData.data;
    } catch (tokenError) {
      // Suppress the 400 error in Expo Go - it's expected
      if (tokenError.message && tokenError.message.includes('400')) {
        console.log('ℹ️ Push token unavailable in Expo Go (expected behavior)');
        console.log('ℹ️ Local notifications will work fine');
        return null;
      }
      throw tokenError;
    }
  } catch (error) {
    console.log('ℹ️ Push notifications unavailable (expected in Expo Go)');
    console.log('ℹ️ Local notifications will still work perfectly');
    return null;
  }
};

/**
 * Save user's push token to Firestore
 */
export const saveUserPushToken = async (userId, pushToken) => {
  try {
    if (!pushToken) {
      console.warn('⚠️ No push token to save');
      return false;
    }

    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      pushToken,
      pushTokenUpdatedAt: new Date(),
      platform: Platform.OS,
      deviceName: Device.deviceName || 'Unknown Device',
    }, { merge: true });

    console.log('✅ Push token saved to Firestore');
    return true;
  } catch (error) {
    console.error('Error saving push token:', error);
    return false;
  }
};

/**
 * Initialize notifications for a user
 * Call this when user logs in
 */
export const initializeNotifications = async (userId) => {
  try {
    console.log('🔔 Initializing notifications for user:', userId);

    // Request permissions
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('⚠️ Notification permissions not granted');
      return false;
    }

    // Get push token
    const pushToken = await getExpoPushToken();
    if (!pushToken) {
      console.warn('⚠️ Could not get push token (this is expected in Expo Go)');
      console.warn('ℹ️ Local notifications will still work');
      console.warn('ℹ️ Push notifications to other devices require development build');
      // Don't return false - local notifications still work
    } else {
      // Save to Firestore only if we have a token
      await saveUserPushToken(userId, pushToken);
    }

    console.log('✅ Notifications initialized');
    return true;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return false;
  }
};

/**
 * Send local notification (on this device)
 */
export const sendLocalNotification = async (title, body, data = {}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 250, 250, 250],
      },
      trigger: null, // Send immediately
    });

    console.log('✅ Local notification sent');
    return true;
  } catch (error) {
    console.error('Error sending local notification:', error);
    return false;
  }
};

/**
 * Send SOS notification to trusted contacts
 * This sends push notifications to all trusted contacts
 */
export const sendSOSNotificationToContacts = async (userId, userProfile, location, sosId) => {
  try {
    console.log('📧 Sending SOS notifications to trusted contacts...');

    // Get trusted contacts
    const contactsRef = collection(db, 'users', userId, 'trusted_contacts');
    const contactsSnap = await getDocs(contactsRef);

    if (contactsSnap.empty) {
      console.warn('⚠️ No trusted contacts found');
      return { success: false, message: 'No trusted contacts' };
    }

    const notifications = [];
    const failedContacts = [];

    // For each contact, get their push token and send notification
    for (const contactDoc of contactsSnap.docs) {
      const contact = contactDoc.data();

      // Skip invalid contacts
      if (!contact || !contact.phone) {
        console.warn(`⚠️ Skipping invalid contact: ${contactDoc.id}`);
        failedContacts.push('Unknown Contact');
        continue;
      }

      const contactName = contact.name || 'Unknown Contact';

      try {
        // Try to find the contact's user document by phone number
        // This assumes contacts who also use the app have their phone in their profile
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('phone', '==', contact.phone));
        const userSnap = await getDocs(q);

        if (!userSnap.empty) {
          // Contact is also a user of the app
          const contactUserDoc = userSnap.docs[0];
          const contactUserData = contactUserDoc.data();
          const contactPushToken = contactUserData.pushToken;

          if (contactPushToken) {
            // Send push notification via Expo Push Notification service
            const message = {
              to: contactPushToken,
              sound: 'default',
              title: '🚨 EMERGENCY SOS ALERT',
              body: `${userProfile.name} has triggered an SOS alert! Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
              data: {
                type: 'sos_alert',
                sosId,
                userId,
                userName: userProfile.name,
                userPhone: userProfile.phone,
                location,
                timestamp: new Date().toISOString(),
              },
              priority: 'high',
              channelId: 'sos-alerts',
            };

            notifications.push(message);
            console.log(`✅ Notification prepared for ${contactName}`);
          } else {
            console.warn(`⚠️ No push token for contact: ${contactName}`);
            failedContacts.push(contactName);
          }
        } else {
          // Contact is not a user of the app
          console.log(`ℹ️ Contact ${contactName} is not an app user`);
          failedContacts.push(contactName);
        }
      } catch (error) {
        console.error(`Error processing contact ${contactName}:`, error);
        failedContacts.push(contactName);
      }
    }

    // Send all notifications in batch
    if (notifications.length > 0) {
      console.log(`📤 Sending ${notifications.length} push notifications...`);
      
      // Send via Expo Push Notification API
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notifications),
      });

      const result = await response.json();
      console.log('✅ Push notifications sent:', result);

      return {
        success: true,
        sent: notifications.length,
        failed: failedContacts.length,
        failedContacts,
      };
    } else {
      console.warn('⚠️ No notifications to send (no contacts are app users with push tokens)');
      return {
        success: false,
        message: 'No contacts have the app installed',
        failedContacts,
      };
    }
  } catch (error) {
    console.error('❌ Error sending SOS notifications:', error);
    throw error;
  }
};

/**
 * Send in-app notification to admin when SOS is triggered
 */
export const sendSOSNotificationToAdmin = async (adminEmail, userName, userPhone, location, sosId) => {
  try {
    console.log('📧 Sending SOS notification to admin:', adminEmail);

    // Find admin user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', adminEmail));
    const userSnap = await getDocs(q);

    if (!userSnap.empty) {
      const adminUserDoc = userSnap.docs[0];
      const adminUserData = adminUserDoc.data();
      const adminPushToken = adminUserData.pushToken;

      if (adminPushToken) {
        // Send push notification via Expo Push Notification service
        const message = {
          to: adminPushToken,
          sound: 'default',
          title: '🚨 SOS ALERT',
          body: `${userName} has triggered an SOS alert!`,
          data: {
            type: 'sos_alert',
            sosId,
            userName,
            userPhone,
            location,
            timestamp: new Date().toISOString(),
          },
          priority: 'high',
          channelId: 'sos-alerts',
        };

        // Send via Expo Push Notification API
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([message]),
        });

        const result = await response.json();
        console.log('✅ Admin notification sent:', result);
        return true;
      } else {
        console.warn('⚠️ No push token for admin');
        return false;
      }
    } else {
      console.warn('⚠️ Admin user not found');
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending admin notification:', error);
    return false;
  }
};

/**
 * Send test notification
 */
export const sendTestNotification = async () => {
  try {
    await sendLocalNotification(
      'Test Notification',
      'This is a test notification from RakshaDrishti',
      { type: 'test' }
    );
    return true;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
};

/**
 * Configure notification channels (Android)
 */
export const configureNotificationChannels = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('sos-alerts', {
      name: 'SOS Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
      lightColor: '#FF0000',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });

    console.log('✅ Notification channels configured');
  }
};

export default {
  requestNotificationPermissions,
  getExpoPushToken,
  saveUserPushToken,
  initializeNotifications,
  sendLocalNotification,
  sendSOSNotificationToContacts,
  sendSOSNotificationToAdmin,
  sendTestNotification,
  configureNotificationChannels,
};

