import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import { sendOTPViaBackend, verifyOTPViaBackend } from '../../services/backendOtpService';
import { auth, db } from '../../config/firebase';
import { signInAnonymously, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PhoneAuthScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState(null);
  const [showOtpInput, setShowOtpInput] = useState(false);
  
  const otpInputs = useRef([]);

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert(t('error') || 'Error', t('please_enter_valid_phone') || 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      // Format phone number with country code
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

      // Use backend OTP service instead of Firebase
      const result = await sendOTPViaBackend(formattedPhone);

      // Store phone number for verification
      setVerificationId(formattedPhone);
      setShowOtpInput(true);

      Alert.alert(
        t('otp_sent') || 'OTP Sent',
        `${t('otp_sent_message') || 'OTP has been sent to your phone number'}\n\nExpires in ${result.expiresIn} seconds`
      );
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert(t('error') || 'Error', error.message || t('failed_send_otp') || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      Alert.alert(t('error') || 'Error', t('please_enter_complete_otp') || 'Please enter complete OTP');
      return;
    }

    setLoading(true);
    try {
      // Verify OTP via backend
      const result = await verifyOTPViaBackend(verificationId, otpCode);

      if (result.verified) {
        console.log('✅ OTP verified, logging in user...');

        // SOLUTION: Use Firebase's signInWithCustomToken or enable Anonymous Auth
        // For now, we'll try anonymous auth with better error handling
        try {
          console.log('🔐 Signing in to Firebase Auth...');

          // Try to sign in anonymously
          // If this fails with admin-restricted-operation, it means Anonymous Auth is disabled
          let firebaseUser;
          try {
            const userCredential = await signInAnonymously(auth);
            firebaseUser = userCredential.user;
            console.log('✅ Firebase Auth successful, UID:', firebaseUser.uid);
          } catch (anonError) {
            console.error('❌ Anonymous sign-in failed:', anonError.code, anonError.message);

            // Show helpful error message
            if (anonError.code === 'auth/admin-restricted-operation') {
              Alert.alert(
                t('error') || 'Error',
                'Anonymous authentication is disabled in Firebase. Please enable it in Firebase Console:\n\n' +
                '1. Go to Firebase Console\n' +
                '2. Authentication → Sign-in method\n' +
                '3. Enable "Anonymous" provider\n' +
                '4. Try logging in again',
                [{ text: 'OK' }]
              );
              setLoading(false);
              return;
            }
            throw anonError;
          }

          // Update profile with phone number
          await updateProfile(firebaseUser, {
            phoneNumber: verificationId
          });

          // Create/update user profile in Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            // New user - create profile
            console.log('📝 Creating new user profile...');
            await setDoc(userDocRef, {
              userId: firebaseUser.uid,
              phone: verificationId,
              createdAt: new Date(),
              updatedAt: new Date(),
              name: '', // Will be filled in profile setup
              email: '',
              age: null,
              gender: '',
              bloodGroup: '',
              emergencyNotes: '',
              isPhoneVerified: true,
            });
            console.log('✅ User profile created');
          } else {
            // Existing user - update phone
            console.log('✅ Existing user found, updating phone...');
            await setDoc(userDocRef, {
              phone: verificationId,
              updatedAt: new Date(),
              lastLogin: new Date(),
              isPhoneVerified: true,
            }, { merge: true });
          }

          // Store phone in AsyncStorage for reference
          await AsyncStorage.setItem('userPhone', verificationId);
          await AsyncStorage.setItem('userId', firebaseUser.uid);

          Alert.alert(
            t('success') || 'Success',
            t('otp_verified') || 'OTP verified successfully!',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Navigation will be handled by AuthContext detecting the auth state change
                  console.log('✅ Login complete, waiting for auth state change...');
                }
              }
            ]
          );
        } catch (authError) {
          console.error('❌ Firebase Auth error:', authError);
          Alert.alert(
            t('error') || 'Error',
            `Failed to complete login: ${authError.message || 'Please try again.'}`
          );
        }
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      Alert.alert(t('error') || 'Error', error.message || t('invalid_otp') || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('phone_login') || 'Phone Login'}</Text>
          <Text style={styles.subtitle}>
            {showOtpInput 
              ? t('enter_otp_sent') || 'Enter the OTP sent to your phone'
              : t('enter_phone_number') || 'Enter your phone number to continue'
            }
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {!showOtpInput ? (
            // Phone Number Input
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('phone_number') || 'Phone Number'}</Text>
                <View style={styles.phoneInputContainer}>
                  <Text style={styles.countryCode}>+91</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="9876543210"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={10}
                    editable={!loading}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.buttonText}>{t('send_otp') || 'Send OTP'}</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            // OTP Input
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('enter_otp') || 'Enter OTP'}</Text>
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (otpInputs.current[index] = ref)}
                      style={styles.otpInput}
                      value={digit}
                      onChangeText={(value) => handleOtpChange(value, index)}
                      onKeyPress={(e) => handleOtpKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      editable={!loading}
                    />
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.buttonText}>{t('verify_otp') || 'Verify OTP'}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleSendOtp}
                disabled={loading}
              >
                <Text style={styles.resendText}>{t('resend_otp') || 'Resend OTP'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('or') || 'OR'}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email Login Link */}
        <TouchableOpacity
          style={styles.emailButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.emailButtonText}>{t('login_with_email') || 'Login with Email'}</Text>
        </TouchableOpacity>

        {/* Signup Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('dont_have_account') || "Don't have an account?"}{' '}
            <Text
              style={styles.link}
              onPress={() => navigation.navigate('Signup')}
            >
              {t('signup') || 'Sign Up'}
            </Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
  },
  form: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    overflow: 'hidden',
  },
  countryCode: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.gray100,
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray800,
  },
  phoneInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: colors.gray800,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.gray800,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  resendText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray300,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
    color: colors.gray500,
    fontWeight: '600',
  },
  emailButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  emailButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.gray600,
  },
  link: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});

export default PhoneAuthScreen;

