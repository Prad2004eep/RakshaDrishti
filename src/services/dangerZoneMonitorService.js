import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { getDangerZones } from './dangerZoneService';
import { getAddressFromCoordinates as getGoogleAddress } from './googlePlacesService';

let locationSubscription = null;
let monitoringActive = false;

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Check if current location is near a danger zone
 */
const isNearDangerZone = async (currentLat, currentLon, dangerZones, threshold = 0.5) => {
  console.log(`🔍 Checking if near danger zones (threshold: ${threshold}km)...`);
  
  for (const zone of dangerZones) {
    // Check if zone has coordinates
    if (zone.fromCoordinates && zone.toCoordinates) {
      const distanceToFrom = calculateDistance(
        currentLat,
        currentLon,
        zone.fromCoordinates.latitude,
        zone.fromCoordinates.longitude
      );

      const distanceToTo = calculateDistance(
        currentLat,
        currentLon,
        zone.toCoordinates.latitude,
        zone.toCoordinates.longitude
      );

      console.log(`📍 Distance to "${zone.name}": From=${distanceToFrom.toFixed(2)}km, To=${distanceToTo.toFixed(2)}km`);

      // Alert if within threshold of either point
      if (distanceToFrom <= threshold || distanceToTo <= threshold) {
        console.log(`⚠️ DANGER ZONE ALERT: Near "${zone.name}"`);
        return { isNear: true, zone, distance: Math.min(distanceToFrom, distanceToTo) };
      }
    }
  }

  return { isNear: false, zone: null, distance: null };
};

/**
 * Send danger zone alert notification
 */
const sendDangerZoneAlert = async (zone, distance) => {
  console.log(`🚨 Sending danger zone alert for: ${zone.name}`);
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚠️ Danger Zone Alert!',
      body: `You are ${distance.toFixed(2)}km from "${zone.name}". Stay alert!`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      vibrate: [0, 250, 250, 250],
      data: { zoneId: zone.id, zoneName: zone.name },
    },
    trigger: null, // Send immediately
  });

  console.log('✅ Danger zone alert sent');
};

/**
 * Start monitoring for danger zones
 */
export const startDangerZoneMonitoring = async (userId) => {
  try {
    console.log('🔍 Starting danger zone monitoring...');

    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    // Request notification permissions
    const { status: notifStatus } = await Notifications.requestPermissionsAsync();
    if (notifStatus !== 'granted') {
      console.warn('⚠️ Notification permission denied');
    }

    // Fetch user's danger zones
    const dangerZones = await getDangerZones(userId);
    console.log(`✅ Loaded ${dangerZones.length} danger zones for monitoring`);

    if (dangerZones.length === 0) {
      console.log('ℹ️ No danger zones to monitor');
      return false;
    }

    // Start location tracking
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 30000, // Check every 30 seconds
        distanceInterval: 100, // Check every 100 meters
      },
      async (location) => {
        const { latitude, longitude } = location.coords;
        console.log(`📍 Current location: (${latitude}, ${longitude})`);

        // Check if near any danger zone
        const { isNear, zone, distance } = await isNearDangerZone(
          latitude,
          longitude,
          dangerZones,
          0.5 // 500m threshold
        );

        if (isNear) {
          await sendDangerZoneAlert(zone, distance);
        }
      }
    );

    monitoringActive = true;
    console.log('✅ Danger zone monitoring started');
    return true;
  } catch (error) {
    console.error('❌ Error starting danger zone monitoring:', error);
    throw error;
  }
};

/**
 * Stop monitoring for danger zones
 */
export const stopDangerZoneMonitoring = () => {
  console.log('🛑 Stopping danger zone monitoring...');
  
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
    monitoringActive = false;
    console.log('✅ Danger zone monitoring stopped');
    return true;
  }

  return false;
};

/**
 * Check if monitoring is active
 */
export const isDangerZoneMonitoringActive = () => {
  return monitoringActive;
};

