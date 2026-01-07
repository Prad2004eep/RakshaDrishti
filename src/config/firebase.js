import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseLogger } from '../utils/logger';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemoKey123456789",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "rakshadrishti-demo.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "rakshadrishti-demo",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "rakshadrishti-demo.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789:android:abcdef123456",
};

// Initialize Firebase (prevent multiple initializations)
let app;
let auth;
let db;
let storage;

try {
  // Check if Firebase is already initialized
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
  } else {
    app = getApps()[0];
    console.log('✅ Firebase already initialized');
  }

  // Initialize Firebase Auth with AsyncStorage persistence
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    console.log('✅ Firebase Auth initialized');
  } catch (error) {
    // Auth might already be initialized
    if (error.code === 'auth/already-initialized') {
      auth = getAuth(app);
      console.log('✅ Firebase Auth already initialized');
    } else {
      console.error('❌ Firebase Auth error:', error);
      auth = getAuth(app);
    }
  }

  // Initialize Firestore with offline persistence
  try {
    db = initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      experimentalForceLongPolling: true, // Required for Expo Go
      ignoreUndefinedProperties: true, // Ignore undefined properties
    });
    console.log('✅ Firestore initialized');
  } catch (error) {
    // Firestore might already be initialized
    if (error.code === 'failed-precondition') {
      db = getFirestore(app);
      console.log('✅ Firestore already initialized');
    } else {
      console.error('❌ Firestore error:', error);
      db = getFirestore(app);
    }
  }

  // Initialize Firebase Storage
  storage = getStorage(app);
  console.log('✅ Firebase Storage initialized');

} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  // Provide fallback values to prevent app crash
  app = null;
  auth = null;
  db = null;
  storage = null;
}

export { auth, db, storage };
export default app;

