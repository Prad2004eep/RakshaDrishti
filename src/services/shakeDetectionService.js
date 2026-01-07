import { Accelerometer } from 'expo-sensors';

let subscription = null;
let shakeCallback = null;
let lastShakeTime = 0;
const SHAKE_THRESHOLD = 2.5; // Acceleration threshold for shake detection
const SHAKE_TIMEOUT = 1000; // Minimum time between shakes (ms)

/**
 * Start listening for shake gestures
 * @param {Function} callback - Function to call when shake is detected
 */
export const startShakeDetection = (callback) => {
  if (subscription) {
    console.warn('Shake detection already running');
    return;
  }

  shakeCallback = callback;
  
  // Set update interval (100ms = 10 updates per second)
  Accelerometer.setUpdateInterval(100);
  
  subscription = Accelerometer.addListener(accelerometerData => {
    const { x, y, z } = accelerometerData;
    
    // Calculate total acceleration
    const acceleration = Math.sqrt(x * x + y * y + z * z);
    
    // Check if acceleration exceeds threshold
    if (acceleration > SHAKE_THRESHOLD) {
      const currentTime = Date.now();
      
      // Prevent multiple triggers in quick succession
      if (currentTime - lastShakeTime > SHAKE_TIMEOUT) {
        lastShakeTime = currentTime;
        console.log('📳 Shake detected! Acceleration:', acceleration.toFixed(2));
        
        if (shakeCallback) {
          shakeCallback();
        }
      }
    }
  });
  
  console.log('✅ Shake detection started');
};

/**
 * Stop listening for shake gestures
 */
export const stopShakeDetection = () => {
  if (subscription) {
    subscription.remove();
    subscription = null;
    shakeCallback = null;
    console.log('🛑 Shake detection stopped');
  }
};

/**
 * Check if shake detection is currently active
 */
export const isShakeDetectionActive = () => {
  return subscription !== null;
};

export default {
  startShakeDetection,
  stopShakeDetection,
  isShakeDetectionActive,
};

