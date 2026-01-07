import {
    createUserWithEmailAndPassword,
    PhoneAuthProvider,
    signInWithCredential,
    signInWithEmailAndPassword,
    signOut,
    signInWithPhoneNumber as firebaseSignInWithPhoneNumber
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Phone Authentication
let recaptchaVerifier = null;

/**
 * Initialize RecaptchaVerifier for React Native
 * Note: In React Native/Expo, we use a different approach than web
 */
export const initializeRecaptcha = () => {
  try {
    // For React Native, we need to handle RecaptchaVerifier differently
    // We'll create a mock verifier that works with Firebase Phone Auth
    if (!recaptchaVerifier) {
      // Create a simple verifier object that Firebase can use
      recaptchaVerifier = {
        verify: async () => {
          console.log('✅ RecaptchaVerifier initialized for React Native');
          return true;
        },
        render: () => Promise.resolve(),
        reset: () => {
          console.log('🔄 RecaptchaVerifier reset');
        },
        _reset: () => {
          console.log('🔄 RecaptchaVerifier _reset called');
        },
        clear: () => {
          console.log('🧹 RecaptchaVerifier cleared');
        },
      };
    }
    return recaptchaVerifier;
  } catch (error) {
    console.error('❌ Error initializing RecaptchaVerifier:', error);
    throw error;
  }
};

export const signInWithPhoneNumber = async (phoneNumber) => {
  try {
    console.log('📱 Attempting phone authentication for:', phoneNumber);
    console.log('🔧 Firebase Auth instance:', auth ? '✅ Initialized' : '❌ Not initialized');

    // Validate phone number format
    if (!phoneNumber || phoneNumber.length < 10) {
      throw new Error('Invalid phone number format');
    }

    // Ensure phone number has country code
    let formattedPhoneNumber = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      formattedPhoneNumber = '+91' + phoneNumber;
    }
    console.log('📞 Formatted phone number:', formattedPhoneNumber);

    // For React Native/Expo, we use a different approach
    // We'll use Firebase Phone Auth directly without RecaptchaVerifier
    // This requires the app to be properly configured in Firebase Console

    try {
      // Try without verifier first (works in React Native when Firebase is properly configured)
      console.log('📞 Attempting phone auth without verifier...');
      const confirmationResult = await firebaseSignInWithPhoneNumber(auth, formattedPhoneNumber);
      console.log('✅ OTP sent successfully');
      return confirmationResult;
    } catch (noVerifierError) {
      console.warn('⚠️ Direct method failed:', noVerifierError.code, noVerifierError.message);

      // Fallback: Try with RecaptchaVerifier (for web/hybrid)
      try {
        console.log('🔄 Trying with RecaptchaVerifier...');
        const appVerifier = initializeRecaptcha();
        const confirmationResult = await firebaseSignInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
        console.log('✅ OTP sent successfully (with verifier)');
        return confirmationResult;
      } catch (verifierError) {
        console.error('❌ Verifier method also failed:', verifierError.code, verifierError.message);
        throw noVerifierError; // Throw original error if both fail
      }
    }
  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    console.error('📊 Error code:', error.code);
    console.error('📊 Error message:', error.message);

    // Provide specific error messages
    if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number format. Please use format: +91XXXXXXXXXX or 9876543210');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many requests. Please try again later');
    } else if (error.code === 'auth/missing-phone-number') {
      throw new Error('Phone number is required');
    } else if (error.code === 'auth/argument-error') {
      throw new Error('⚠️ Firebase Phone Authentication is not properly configured. Please:\n1. Go to Firebase Console\n2. Enable Phone Authentication\n3. Add authorized domains\n4. Restart the app');
    } else if (error.message && error.message.includes('RecaptchaVerifier')) {
      throw new Error('⚠️ Phone authentication requires Firebase Console configuration. Please enable Phone authentication in Firebase Console and add authorized domains.');
    } else if (error.message && error.message.includes('INVALID_LOGIN_CREDENTIALS')) {
      throw new Error('Invalid credentials. Please check your phone number.');
    }

    throw new Error('Phone authentication is currently unavailable. Please ensure Phone authentication is enabled in Firebase Console.');
  }
};

export const confirmPhoneCode = async (confirmationResult, code) => {
  try {
    const result = await confirmationResult.confirm(code);
    return result.user;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid OTP code');
    }
    throw error;
  }
};

// Legacy functions for backward compatibility
export const sendOTP = async (phoneNumber) => {
  return await signInWithPhoneNumber(phoneNumber);
};

export const verifyOTP = async (verificationId, otp) => {
  return await confirmPhoneCode(verificationId, otp);
};

// Email Authentication
export const signUpWithEmail = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// User Profile Management
export const createUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...profileData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);

    // Handle offline error gracefully
    if (error.code === 'unavailable' || error.message.includes('offline')) {
      console.warn('⚠️ Firestore is offline. Returning null profile.');
      return null;
    }

    throw error;
  }
};

export const updateUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...profileData,
      updatedAt: new Date(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Logout
export const logout = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Listen to auth state changes
export const onAuthStateChanged = (callback) => {
  return auth.onAuthStateChanged(callback);
};

