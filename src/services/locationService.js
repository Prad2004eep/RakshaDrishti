import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { db } from '../config/firebase';
import { doc, setDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { locationLogger } from '../utils/logger';

const BACKGROUND_LOCATION_TASK = 'background-location-task';
let locationSubscription = null;
let isBackgroundTaskRegistered = false;

// Define background location task
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    locationLogger.error('Background location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    const location = locations[0];

    if (location) {
      try {
        // Get userId from AsyncStorage or pass it when starting the task
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const userId = await AsyncStorage.getItem('userId');

        if (userId) {
          const locationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            speed: location.coords.speed,
            heading: location.coords.heading,
            timestamp: new Date(location.timestamp),
          };

          locationLogger.locationUpdate(
            locationData.latitude,
            locationData.longitude,
            locationData.accuracy
          );

          // Update current location in user document
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            currentLocation: locationData,
            lastLocationUpdate: new Date(),
          });

          // Also save to location history
          const locationHistoryRef = collection(db, 'users', userId, 'location_history');
          await addDoc(locationHistoryRef, locationData);

          locationLogger.success('Background location updated to Firebase');
        }
      } catch (error) {
        locationLogger.error('Error updating background location:', error);
      }
    }
  }
});

// Request location permissions (both foreground and background)
export const requestLocationPermission = async (background = false) => {
  try {
    locationLogger.info('Requesting location permissions...', { background });

    // Request foreground permission first
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      locationLogger.error('Foreground location permission denied');
      throw new Error('Foreground location permission denied');
    }
    locationLogger.success('Foreground location permission granted');

    // Request background permission if needed
    if (background) {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        locationLogger.warn('Background location permission denied');
        return { foreground: true, background: false };
      }
      locationLogger.success('Background location permission granted');
      return { foreground: true, background: true };
    }

    return { foreground: true, background: false };
  } catch (error) {
    locationLogger.error('Error requesting location permission:', error);
    throw error;
  }
};

// Get current location
export const getCurrentLocation = async () => {
  try {
    // Check if we have permission first
    const { status } = await Location.getForegroundPermissionsAsync();

    if (status !== 'granted') {
      // Request permission if not granted
      const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
      if (newStatus !== 'granted') {
        throw new Error('Location permission not granted');
      }
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    throw error;
  }
};

// Start continuous location tracking
export const startLocationTracking = async (userId, callback) => {
  try {
    await requestLocationPermission();
    
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Update every 10 meters
      },
      async (location) => {
        const locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: new Date(),
        };

        // Update Firestore
        try {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            currentLocation: locationData,
            lastLocationUpdate: new Date(),
          });
        } catch (error) {
          console.error('Error updating location in Firestore:', error);
        }

        // Call callback if provided
        if (callback) {
          callback(locationData);
        }
      }
    );

    return true;
  } catch (error) {
    console.error('Error starting location tracking:', error);
    throw error;
  }
};

// Stop location tracking
export const stopLocationTracking = () => {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
    return true;
  }
  return false;
};

// Get reverse geocoding (coordinates to address)
export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const address = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });
    return address[0] || null;
  } catch (error) {
    console.error('Error getting address:', error);
    throw error;
  }
};

// Get coordinates from address
export const getCoordinatesFromAddress = async (address) => {
  try {
    const geocoded = await Location.geocodeAsync(address);
    return geocoded[0] || null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
};

// Calculate distance between two coordinates
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
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

// Start background location tracking
export const startBackgroundLocationTracking = async (userId) => {
  try {
    // Request background permission
    const permissions = await requestLocationPermission(true);

    if (!permissions.background) {
      throw new Error('Background location permission required');
    }

    // Save userId to AsyncStorage for background task
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem('userId', userId);

    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);

    if (!isRegistered) {
      // Start background location updates
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced, // Balance between accuracy and battery
        timeInterval: 60000, // Update every 60 seconds (1 minute)
        distanceInterval: 50, // Update every 50 meters
        foregroundService: {
          notificationTitle: 'RakshaDrishti',
          notificationBody: 'Location tracking active for your safety',
          notificationColor: '#9C27B0',
        },
        pausesUpdatesAutomatically: false, // Keep tracking even when stationary
        showsBackgroundLocationIndicator: true,
      });

      isBackgroundTaskRegistered = true;
      console.log('✅ Background location tracking started');
    } else {
      console.log('⚠️ Background location tracking already active');
    }

    return true;
  } catch (error) {
    console.error('Error starting background location tracking:', error);
    throw error;
  }
};

// Stop background location tracking
export const stopBackgroundLocationTracking = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);

    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      isBackgroundTaskRegistered = false;
      console.log('✅ Background location tracking stopped');
    }

    return true;
  } catch (error) {
    console.error('Error stopping background location tracking:', error);
    throw error;
  }
};

// Check if background tracking is active
export const isBackgroundTrackingActive = async () => {
  try {
    return await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  } catch (error) {
    console.error('Error checking background tracking status:', error);
    return false;
  }
};

