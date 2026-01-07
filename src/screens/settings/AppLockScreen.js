import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import { Ionicons } from '@expo/vector-icons';

const AppLockScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  useEffect(() => {
    checkBiometricAvailability();
    loadSettings();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      setIsBiometricAvailable(compatible && enrolled);
      
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Fingerprint');
      } else {
        setBiometricType('Biometric');
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const biometric = await AsyncStorage.getItem('biometricEnabled');
      const pinLock = await AsyncStorage.getItem('pinEnabled');
      
      if (biometric === 'true') setBiometricEnabled(true);
      if (pinLock === 'true') setPinEnabled(true);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleBiometricToggle = async (value) => {
    if (value) {
      if (!isBiometricAvailable) {
        Alert.alert('Not Available', 'Biometric authentication is not available on this device.');
        return;
      }

      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: `Enable ${biometricType}`,
          fallbackLabel: 'Use PIN',
        });

        if (result.success) {
          setBiometricEnabled(true);
          await AsyncStorage.setItem('biometricEnabled', 'true');
          Alert.alert('Success', `${biometricType} enabled successfully`);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to enable biometric authentication');
      }
    } else {
      setBiometricEnabled(false);
      await AsyncStorage.setItem('biometricEnabled', 'false');
    }
  };

  const handlePinSetup = async () => {
    if (pin.length < 4) {
      Alert.alert('Error', 'PIN must be at least 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }

    try {
      await AsyncStorage.setItem('appLockPin', pin);
      await AsyncStorage.setItem('pinEnabled', 'true');
      setPinEnabled(true);
      setShowPinSetup(false);
      setPin('');
      setConfirmPin('');
      Alert.alert('Success', 'PIN set successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to set PIN');
    }
  };

  const handlePinToggle = async (value) => {
    if (value) {
      setShowPinSetup(true);
    } else {
      setPinEnabled(false);
      await AsyncStorage.setItem('pinEnabled', 'false');
      await AsyncStorage.removeItem('appLockPin');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔒 App Lock</Text>
      </View>

      <ScrollView style={styles.scrollContent}>

      <View style={styles.content}>
        <Text style={styles.description}>
          {t('app_lock_description') || 'Add an extra layer of security to protect your personal information and evidence.'}
        </Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="finger-print" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Biometric Authentication</Text>
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>
                {biometricType || 'Biometric Lock'}
              </Text>
              <Text style={styles.settingDescription}>
                {isBiometricAvailable
                  ? `Use ${biometricType} to unlock the app`
                  : 'Not available on this device'}
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              disabled={!isBiometricAvailable}
              trackColor={{ false: colors.gray300, true: colors.primary }}
              thumbColor={biometricEnabled ? colors.white : colors.gray400}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="keypad" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>PIN Lock</Text>
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable PIN</Text>
              <Text style={styles.settingDescription}>
                Use a 4-digit PIN to unlock the app
              </Text>
            </View>
            <Switch
              value={pinEnabled}
              onValueChange={handlePinToggle}
              trackColor={{ false: colors.gray300, true: colors.primary }}
              thumbColor={pinEnabled ? colors.white : colors.gray400}
            />
          </View>

          {showPinSetup && (
            <View style={styles.pinSetup}>
              <Text style={styles.pinSetupTitle}>Set up PIN</Text>
              <TextInput
                style={styles.pinInput}
                placeholder="Enter 4-digit PIN"
                placeholderTextColor={colors.gray400}
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
              />
              <TextInput
                style={styles.pinInput}
                placeholder="Confirm PIN"
                placeholderTextColor={colors.gray400}
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
              />
              <TouchableOpacity style={styles.setPinButton} onPress={handlePinSetup}>
                <Text style={styles.setPinButtonText}>Set PIN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowPinSetup(false);
                  setPin('');
                  setConfirmPin('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>About App Lock</Text>
            <Text style={styles.infoText}>
              • App Lock adds an extra layer of security{'\n'}
              • You'll need to authenticate when opening the app{'\n'}
              • Biometric authentication is more secure than PIN{'\n'}
              • You can enable both methods for backup
            </Text>
          </View>
        </View>
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.primary,
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 24,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
    marginLeft: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: colors.gray600,
  },
  pinSetup: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  pinSetupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 12,
  },
  pinInput: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.gray800,
    marginBottom: 12,
  },
  setPinButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  setPinButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.gray700,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.gray50,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.gray600,
    lineHeight: 20,
  },
});

export default AppLockScreen;

