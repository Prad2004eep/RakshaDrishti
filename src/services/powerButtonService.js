import { AppState } from 'react-native';

let appStateSubscription = null;
let powerButtonCallback = null;
let pressCount = 0;
let pressTimer = null;
const PRESS_TIMEOUT = 3000; // 3 seconds window to press 5 times
const REQUIRED_PRESSES = 5;

/**
 * Start listening for power button presses
 * Note: This is a workaround using AppState changes
 * Real power button detection requires native modules
 * @param {Function} callback - Function to call when 5 presses detected
 */
export const startPowerButtonDetection = (callback) => {
  if (appStateSubscription) {
    console.warn('Power button detection already running');
    return;
  }

  powerButtonCallback = callback;
  
  appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
    // Detect when app goes to background (power button pressed)
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      handlePowerButtonPress();
    }
  });
  
  console.log('✅ Power button detection started (using AppState)');
  console.log(`⚡ Press power button ${REQUIRED_PRESSES} times within ${PRESS_TIMEOUT/1000} seconds to trigger SOS`);
};

/**
 * Handle power button press
 */
const handlePowerButtonPress = () => {
  pressCount++;
  console.log(`⚡ Power button press ${pressCount}/${REQUIRED_PRESSES}`);
  
  // Clear existing timer
  if (pressTimer) {
    clearTimeout(pressTimer);
  }
  
  // Check if required presses reached
  if (pressCount >= REQUIRED_PRESSES) {
    console.log('🚨 Power button SOS triggered!');
    pressCount = 0;
    
    if (powerButtonCallback) {
      powerButtonCallback();
    }
    return;
  }
  
  // Set timer to reset count
  pressTimer = setTimeout(() => {
    console.log('⏱️ Power button press timeout - resetting count');
    pressCount = 0;
  }, PRESS_TIMEOUT);
};

/**
 * Stop listening for power button presses
 */
export const stopPowerButtonDetection = () => {
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
    powerButtonCallback = null;
    pressCount = 0;
    
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    
    console.log('🛑 Power button detection stopped');
  }
};

/**
 * Check if power button detection is currently active
 */
export const isPowerButtonDetectionActive = () => {
  return appStateSubscription !== null;
};

/**
 * Reset press count
 */
export const resetPressCount = () => {
  pressCount = 0;
  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
  }
};

export default {
  startPowerButtonDetection,
  stopPowerButtonDetection,
  isPowerButtonDetectionActive,
  resetPressCount,
};

