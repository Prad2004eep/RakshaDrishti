// App Constants
export const APP_NAME = 'RakshaDrishti';
export const APP_VERSION = '1.0.0';

// Supported Languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
];

// Blood Groups
export const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

// Gender Options
export const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

// SOS Status
export const SOS_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  RESOLVED: 'resolved',
};

// Tracking Status
export const TRACKING_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

// Timer Presets (in minutes)
export const TIMER_PRESETS = [15, 30, 45, 60, 120];

// Safe Locations
export const SAFE_LOCATION_TYPES = [
  'police_station',
  'hospital',
  'cafe',
  'fire_station',
  'women_helpline',
];

// Permission Types
export const PERMISSIONS = {
  CAMERA: 'camera',
  MICROPHONE: 'microphone',
  LOCATION: 'location',
  CONTACTS: 'contacts',
  STORAGE: 'storage',
};

// App Lock Methods
export const APP_LOCK_METHODS = {
  FINGERPRINT: 'fingerprint',
  FACE: 'face',
  PIN: 'pin',
  NONE: 'none',
};

// Video Recording Quality
export const VIDEO_QUALITY = {
  LOW: '480p',
  MEDIUM: '720p',
  HIGH: '1080p',
};

// Maximum Trusted Contacts
export const MAX_TRUSTED_CONTACTS = 5;

// Maximum SOS History Records
export const MAX_SOS_HISTORY = 50;

// Location Update Interval (milliseconds)
export const LOCATION_UPDATE_INTERVAL = 5000;

// Location Distance Interval (meters)
export const LOCATION_DISTANCE_INTERVAL = 10;

// API Endpoints
export const API_ENDPOINTS = {
  SOS_SEND_ALERTS: '/api/sos/send-alerts',
  SOS_GET_HISTORY: '/api/sos/history',
  SAFE_LOCATIONS: '/api/locations/safe',
  COMMUNITY_FEED: '/api/feed',
  TUTORIALS: '/api/tutorials',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  PERMISSION_DENIED: 'Permission denied. Please enable it in settings.',
  LOCATION_ERROR: 'Unable to get your location.',
  AUTH_ERROR: 'Authentication failed. Please try again.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  SOS_TRIGGERED: 'SOS alert sent to your trusted contacts.',
  CONTACT_ADDED: 'Trusted contact added successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  TRACKING_STARTED: 'Location tracking started.',
  TRACKING_STOPPED: 'Location tracking stopped.',
};

