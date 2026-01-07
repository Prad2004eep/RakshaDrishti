import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FakeCallSetupScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const [callerName, setCallerName] = useState('Mom');
  const [delaySeconds, setDelaySeconds] = useState('5');
  const [autoAnswer, setAutoAnswer] = useState(false);
  const [vibrate, setVibrate] = useState(true);
  const [customRingtone, setCustomRingtone] = useState(null);

  useEffect(() => {
    loadCustomRingtone();
  }, []);

  const loadCustomRingtone = async () => {
    try {
      const savedRingtone = await AsyncStorage.getItem('customRingtone');
      if (savedRingtone) {
        setCustomRingtone(JSON.parse(savedRingtone));
      }
    } catch (error) {
      console.error('Error loading custom ringtone:', error);
    }
  };

  const handleUploadRingtone = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const ringtoneData = {
          uri: file.uri,
          name: file.name,
          size: file.size,
        };

        await AsyncStorage.setItem('customRingtone', JSON.stringify(ringtoneData));
        setCustomRingtone(ringtoneData);

        Alert.alert(
          t('success') || 'Success',
          t('ringtone_uploaded') || 'Custom ringtone uploaded successfully!'
        );
      }
    } catch (error) {
      console.error('Error uploading ringtone:', error);
      Alert.alert(
        t('error') || 'Error',
        t('upload_failed') || 'Failed to upload ringtone. Please try again.'
      );
    }
  };

  const handleRemoveRingtone = async () => {
    try {
      await AsyncStorage.removeItem('customRingtone');
      setCustomRingtone(null);
      Alert.alert(
        t('success') || 'Success',
        t('ringtone_removed') || 'Custom ringtone removed. Default ringtone will be used.'
      );
    } catch (error) {
      console.error('Error removing ringtone:', error);
    }
  };

  const handleStartFakeCall = () => {
    const delay = parseInt(delaySeconds) || 0;
    
    if (delay < 0 || delay > 60) {
      Alert.alert(
        t('error') || 'Error',
        t('delay_must_be_between') || 'Delay must be between 0 and 60 seconds'
      );
      return;
    }

    // Schedule fake call
    setTimeout(() => {
      navigation.navigate('FakeCall', {
        callerName,
        autoAnswer,
      });
    }, delay * 1000);

    // Show confirmation
    Alert.alert(
      t('fake_call_scheduled') || 'Fake Call Scheduled',
      delay > 0
        ? `${t('call_will_arrive_in') || 'Call will arrive in'} ${delay} ${t('seconds') || 'seconds'}`
        : t('call_starting_now') || 'Call starting now...'
    );

    // Go back to previous screen
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('fake_call') || 'Fake Call'}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          {t('fake_call_description') || 
          'Use this feature to simulate an incoming call to escape uncomfortable or dangerous situations.'}
        </Text>

        {/* Caller Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('caller_name') || 'Caller Name'}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('enter_caller_name') || 'Enter caller name'}
            placeholderTextColor={colors.gray400}
            value={callerName}
            onChangeText={setCallerName}
          />
        </View>

        {/* Delay */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('delay_seconds') || 'Delay (seconds)'}</Text>
          <TextInput
            style={styles.input}
            placeholder="5"
            placeholderTextColor={colors.gray400}
            value={delaySeconds}
            onChangeText={setDelaySeconds}
            keyboardType="number-pad"
          />
          <Text style={styles.hint}>
            {t('delay_hint') || 'Set to 0 for immediate call'}
          </Text>
        </View>

        {/* Auto Answer */}
        <View style={styles.switchGroup}>
          <View style={styles.switchLabel}>
            <Ionicons name="call-outline" size={24} color={colors.gray700} />
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>{t('auto_answer') || 'Auto Answer'}</Text>
              <Text style={styles.switchDescription}>
                {t('auto_answer_description') || 'Automatically answer the call after 3 seconds'}
              </Text>
            </View>
          </View>
          <Switch
            value={autoAnswer}
            onValueChange={setAutoAnswer}
            trackColor={{ false: colors.gray300, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        {/* Vibrate */}
        <View style={styles.switchGroup}>
          <View style={styles.switchLabel}>
            <Ionicons name="phone-portrait-outline" size={24} color={colors.gray700} />
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>{t('vibrate') || 'Vibrate'}</Text>
              <Text style={styles.switchDescription}>
                {t('vibrate_description') || 'Vibrate when call arrives'}
              </Text>
            </View>
          </View>
          <Switch
            value={vibrate}
            onValueChange={setVibrate}
            trackColor={{ false: colors.gray300, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        {/* Custom Ringtone */}
        <View style={styles.ringtoneSection}>
          <Text style={styles.label}>{t('custom_ringtone') || 'Custom Ringtone'}</Text>

          {customRingtone ? (
            <View style={styles.ringtoneCard}>
              <View style={styles.ringtoneInfo}>
                <Ionicons name="musical-notes" size={24} color={colors.primary} />
                <View style={styles.ringtoneDetails}>
                  <Text style={styles.ringtoneName}>{customRingtone.name}</Text>
                  <Text style={styles.ringtoneSize}>
                    {(customRingtone.size / 1024).toFixed(2)} KB
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleRemoveRingtone} style={styles.removeButton}>
                <Ionicons name="trash-outline" size={20} color="#F44336" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={handleUploadRingtone}>
              <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
              <Text style={styles.uploadButtonText}>{t('upload_ringtone') || 'Upload Custom Ringtone'}</Text>
              <Text style={styles.uploadHint}>{t('upload_hint') || 'Tap to select an audio file'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>{t('quick_actions') || 'Quick Actions'}</Text>
          
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              setDelaySeconds('0');
              handleStartFakeCall();
            }}
          >
            <Ionicons name="flash" size={24} color={colors.white} />
            <Text style={styles.quickActionText}>{t('call_now') || 'Call Now'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickActionButton, styles.quickActionButtonSecondary]}
            onPress={() => {
              setDelaySeconds('30');
              handleStartFakeCall();
            }}
          >
            <Ionicons name="time" size={24} color={colors.primary} />
            <Text style={[styles.quickActionText, styles.quickActionTextSecondary]}>
              {t('call_in_30_sec') || 'Call in 30 sec'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartFakeCall}
        >
          <Text style={styles.startButtonText}>{t('schedule_call') || 'Schedule Call'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray900,
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.gray800,
  },
  hint: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 4,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 12,
    color: colors.gray600,
  },
  ringtoneSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: colors.gray50,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 12,
  },
  uploadHint: {
    fontSize: 12,
    color: colors.gray600,
    marginTop: 4,
  },
  ringtoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 12,
    padding: 16,
  },
  ringtoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ringtoneDetails: {
    marginLeft: 12,
    flex: 1,
  },
  ringtoneName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 4,
  },
  ringtoneSize: {
    fontSize: 12,
    color: colors.gray600,
  },
  removeButton: {
    padding: 8,
  },
  quickActions: {
    marginTop: 24,
    marginBottom: 24,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  quickActionButtonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  quickActionText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  quickActionTextSecondary: {
    color: colors.primary,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  startButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FakeCallSetupScreen;

