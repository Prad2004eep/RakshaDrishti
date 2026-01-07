/**
 * Centralized Logger Utility for RakshaDrishti
 * Provides consistent, colorful, and categorized logging across the app
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const CURRENT_LOG_LEVEL = __DEV__ ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;

const CATEGORIES = {
  FIREBASE: '🔥',
  LOCATION: '📍',
  SOS: '🚨',
  AUTH: '🔐',
  NAVIGATION: '🧭',
  API: '🌐',
  TWILIO: '📧',
  OPENAI: '🤖',
  YOUTUBE: '📺',
  MAPS: '🗺️',
  NOTIFICATION: '🔔',
  STORAGE: '💾',
  CAMERA: '📷',
  AUDIO: '🎤',
  VIDEO: '🎥',
  DANGER_ZONE: '⚠️',
  GENERAL: '📝',
};

class Logger {
  constructor(category = CATEGORIES.GENERAL) {
    this.category = category;
  }

  _log(level, levelIcon, message, ...args) {
    if (level < CURRENT_LOG_LEVEL) return;

    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}] ${this.category} ${levelIcon}`;

    console.log(prefix, message, ...args);
  }

  debug(message, ...args) {
    this._log(LOG_LEVELS.DEBUG, '🔍', message, ...args);
  }

  info(message, ...args) {
    this._log(LOG_LEVELS.INFO, 'ℹ️', message, ...args);
  }

  success(message, ...args) {
    this._log(LOG_LEVELS.INFO, '✅', message, ...args);
  }

  warn(message, ...args) {
    this._log(LOG_LEVELS.WARN, '⚠️', message, ...args);
  }

  error(message, ...args) {
    this._log(LOG_LEVELS.ERROR, '❌', message, ...args);
  }

  // Specialized logging methods
  apiRequest(method, url, data) {
    this.debug(`${method} ${url}`, data);
  }

  apiResponse(status, data) {
    if (status >= 200 && status < 300) {
      this.success(`Response ${status}`, data);
    } else {
      this.error(`Response ${status}`, data);
    }
  }

  firebaseOperation(operation, collection, data) {
    this.debug(`Firebase ${operation} on ${collection}`, data);
  }

  locationUpdate(latitude, longitude, accuracy) {
    this.debug(`Location: (${latitude.toFixed(6)}, ${longitude.toFixed(6)}) ±${accuracy}m`);
  }

  sosEvent(event, details) {
    this.info(`SOS ${event}`, details);
  }
}

// Create category-specific loggers
export const firebaseLogger = new Logger(CATEGORIES.FIREBASE);
export const locationLogger = new Logger(CATEGORIES.LOCATION);
export const sosLogger = new Logger(CATEGORIES.SOS);
export const authLogger = new Logger(CATEGORIES.AUTH);
export const navigationLogger = new Logger(CATEGORIES.NAVIGATION);
export const apiLogger = new Logger(CATEGORIES.API);
export const twilioLogger = new Logger(CATEGORIES.TWILIO);
export const openaiLogger = new Logger(CATEGORIES.OPENAI);
export const youtubeLogger = new Logger(CATEGORIES.YOUTUBE);
export const mapsLogger = new Logger(CATEGORIES.MAPS);
export const notificationLogger = new Logger(CATEGORIES.NOTIFICATION);
export const storageLogger = new Logger(CATEGORIES.STORAGE);
export const cameraLogger = new Logger(CATEGORIES.CAMERA);
export const audioLogger = new Logger(CATEGORIES.AUDIO);
export const videoLogger = new Logger(CATEGORIES.VIDEO);
export const dangerZoneLogger = new Logger(CATEGORIES.DANGER_ZONE);
export const generalLogger = new Logger(CATEGORIES.GENERAL);

// Default export
export default Logger;

// Helper function to create custom logger
export const createLogger = (category) => new Logger(category);

// Log app startup
console.log('\n' + '='.repeat(60));
console.log('🚀 RakshaDrishti App Started');
console.log('📅 ' + new Date().toLocaleString());
console.log('🔧 Environment:', __DEV__ ? 'Development' : 'Production');
console.log('='.repeat(60) + '\n');

