import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const CheckInTimerScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  const [activeTimer, setActiveTimer] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [notificationId, setNotificationId] = useState(null);

  useEffect(() => {
    requestNotificationPermissions();
    
    return () => {
      if (notificationId) {
        Notifications.cancelScheduledNotificationAsync(notificationId);
      }
    };
  }, []);

  useEffect(() => {
    let interval;
    if (activeTimer && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            handleTimerExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer, remainingTime]);

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('permission_required') || 'Permission Required',
        t('notification_permission_required') || 'Notification permission is required for check-in timers'
      );
    }
  };

  const startTimer = async (minutes) => {
    const seconds = minutes * 60;
    setActiveTimer({ minutes, startTime: Date.now() });
    setRemainingTime(seconds);

    // Schedule notification
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: t('check_in_reminder') || 'Check-In Reminder',
        body: t('time_to_check_in') || 'Time to check in! Are you safe?',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        seconds: seconds,
      },
    });
    
    setNotificationId(id);

    Alert.alert(
      t('timer_started') || 'Timer Started',
      `${t('check_in_timer_set_for') || 'Check-in timer set for'} ${minutes} ${t('minutes') || 'minutes'}`
    );
  };

  const cancelTimer = async () => {
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
    setActiveTimer(null);
    setRemainingTime(0);
    setNotificationId(null);
    
    Alert.alert(
      t('timer_cancelled') || 'Timer Cancelled',
      t('check_in_timer_cancelled') || 'Check-in timer has been cancelled'
    );
  };

  const handleCheckIn = () => {
    Alert.alert(
      t('checked_in') || 'Checked In',
      t('glad_youre_safe') || "Glad you're safe!",
      [
        {
          text: t('ok') || 'OK',
          onPress: () => cancelTimer(),
        },
      ]
    );
  };

  const handleTimerExpired = () => {
    Alert.alert(
      t('check_in_expired') || 'Check-In Expired',
      t('check_in_expired_message') || 'You did not check in on time. Do you want to trigger SOS?',
      [
        {
          text: t('im_safe') || "I'm Safe",
          onPress: () => {
            setActiveTimer(null);
            setRemainingTime(0);
          },
        },
        {
          text: t('trigger_sos') || 'Trigger SOS',
          onPress: () => {
            // Navigate to SOS screen or trigger SOS
            navigation.navigate('SOS');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const TIMER_PRESETS = [
    { minutes: 15, label: '15 min', icon: 'time-outline' },
    { minutes: 30, label: '30 min', icon: 'time-outline' },
    { minutes: 60, label: '1 hour', icon: 'time-outline' },
    { minutes: 120, label: '2 hours', icon: 'time-outline' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('check_in_timer') || 'Check-In Timer'}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          {t('check_in_timer_description') || 
          'Set a timer to check in periodically. If you don\'t check in on time, you\'ll be prompted to trigger SOS.'}
        </Text>

        {activeTimer ? (
          // Active Timer Display
          <View style={styles.activeTimerContainer}>
            <View style={styles.timerCircle}>
              <Text style={styles.timerText}>{formatTime(remainingTime)}</Text>
              <Text style={styles.timerLabel}>{t('remaining') || 'Remaining'}</Text>
            </View>

            <TouchableOpacity
              style={styles.checkInButton}
              onPress={handleCheckIn}
            >
              <Ionicons name="checkmark-circle" size={24} color={colors.white} />
              <Text style={styles.checkInButtonText}>{t('check_in_now') || 'Check In Now'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={cancelTimer}
            >
              <Text style={styles.cancelButtonText}>{t('cancel_timer') || 'Cancel Timer'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Timer Presets
          <View style={styles.presetsContainer}>
            <Text style={styles.presetsTitle}>{t('select_duration') || 'Select Duration'}</Text>
            
            <View style={styles.presetsGrid}>
              {TIMER_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.minutes}
                  style={styles.presetButton}
                  onPress={() => startTimer(preset.minutes)}
                >
                  <Ionicons name={preset.icon} size={28} color={colors.primary} />
                  <Text style={styles.presetLabel}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText} numberOfLines={2} ellipsizeMode="tail">
              {t('check_in_info_1') || 'You will receive a notification when the timer expires'}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText} numberOfLines={2} ellipsizeMode="tail">
              {t('check_in_info_2') || 'Check in before the timer expires to confirm you\'re safe'}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
            <Text style={styles.infoText} numberOfLines={2} ellipsizeMode="tail">
              {t('check_in_info_3') || 'If you don\'t check in, you\'ll be prompted to trigger SOS'}
            </Text>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
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
  activeTimerContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.white,
  },
  timerLabel: {
    fontSize: 16,
    color: colors.white,
    marginTop: 8,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    justifyContent: 'center',
  },
  checkInButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    padding: 12,
  },
  cancelButtonText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
  presetsContainer: {
    marginBottom: 32,
  },
  presetsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 16,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  presetButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.gray50,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray800,
    marginTop: 6,
  },
  infoSection: {
    marginTop: 24,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.gray700,
    marginLeft: 12,
    lineHeight: 18,
    flexWrap: 'wrap',
  },
});

export default CheckInTimerScreen;

