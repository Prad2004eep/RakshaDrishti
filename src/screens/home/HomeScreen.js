import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../utils/colors';
import { startLocationTracking, stopLocationTracking } from '../../services/locationService';
import { getActiveSOSAlerts, triggerSOS, triggerDeviceEmergencyCall } from '../../services/sosService';
import { startShakeDetection, stopShakeDetection } from '../../services/shakeDetectionService';
import { startPowerButtonDetection, stopPowerButtonDetection } from '../../services/powerButtonService';
import { useBackgroundSOSRecorder } from '../../components/BackgroundSOSRecorder';
import { useSOSContext } from '../../contexts/SOSContext';

const HomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, userProfile } = useAuth();

  // Use global SOS context instead of local state
  const { sosActive, activeSOSId, activateSOS, checkActiveSOSAlerts, setVideoCallback, setVideoStopCallback } = useSOSContext();

  const [trackingActive, setTrackingActive] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Background recorder - runs without blocking UI
  const { onVideoRecordingComplete, onVideoStopRecording } = useBackgroundSOSRecorder({
    userId: user?.uid,
    sosId: activeSOSId,
    duration: 25,
    enabled: sosActive && activeSOSId !== null
  });

  // Store video callbacks in context for FloatingSOSControl to use
  useEffect(() => {
    if (onVideoRecordingComplete) {
      setVideoCallback(onVideoRecordingComplete);
    }
  }, [onVideoRecordingComplete, setVideoCallback]);

  useEffect(() => {
    if (onVideoStopRecording) {
      setVideoStopCallback(onVideoStopRecording);
    }
  }, [onVideoStopRecording, setVideoStopCallback]);

  useEffect(() => {
    if (user?.uid) {
      checkActiveSOSAlerts(user.uid);
    }

    // Start silent SOS triggers
    console.log('🔧 Starting silent SOS triggers...');

    // Shake detection
    startShakeDetection(() => {
      console.log('🚨 Shake detected! Triggering SOS...');
      handleSilentSOSTrigger('shake');
    });

    // Power button detection (5x press)
    startPowerButtonDetection(() => {
      console.log('🚨 Power button x5 detected! Triggering SOS...');
      handleSilentSOSTrigger('power_button');
    });

    return () => {
      console.log('🛑 Stopping silent SOS triggers...');
      stopShakeDetection();
      stopPowerButtonDetection();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (sosActive) {
      startPulseAnimation();
    }
  }, [sosActive]);

  // checkActiveSOSAlerts is now provided by SOSContext

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleSilentSOSTrigger = async (triggerMethod) => {
    if (sosActive) {
      console.log('⚠️ SOS already active, ignoring silent trigger');
      return;
    }

    try {
      console.log(`🚨 Silent SOS triggered via ${triggerMethod}`);

      // Trigger SOS in background
      const sos = await triggerSOS(user.uid, userProfile, {
        triggerMethod,
        callEmergency: false, // Don't auto-call for silent triggers
        skipEvidenceCapture: true // We'll handle evidence with BackgroundSOSRecorder
      });

      console.log('✅ SOS fully activated:', sos.id);

      // Activate SOS in global context (this will start background recording)
      activateSOS(sos.id);

      // Show alert that SOS was triggered
      Alert.alert(
        t('sos_activated') || 'SOS Activated',
        t('sos_triggered_by') + ' ' + triggerMethod,
        [{ text: t('ok'), onPress: () => {} }]
      );
    } catch (error) {
      console.error('Error in silent SOS trigger:', error);
      Alert.alert(t('error'), error?.message || 'Failed to trigger SOS');
    }
  };

  const handleSOSPress = async () => {
    if (sosActive) {
      // SOS is already active - user should use the floating button to deactivate
      Alert.alert(
        t('sos_active') || 'SOS Active',
        'SOS is currently active. Use the floating "Stop SOS" button to deactivate.',
        [{ text: t('ok'), onPress: () => {} }]
      );
      return;
    } else {
      // Activate SOS with options
      Alert.alert(
        t('emergency_sos') || 'Emergency SOS',
        t('choose_sos_action') || 'Choose SOS action',
        [
          {
            text: t('cancel'),
            style: 'cancel',
            onPress: () => {}
          },
          {
            text: t('alert_contacts') || 'Alert Contacts Only',
            onPress: async () => {
              try {
                // Trigger SOS
                const sos = await triggerSOS(user.uid, userProfile, {
                  triggerMethod: 'manual',
                  callEmergency: false,
                  skipEvidenceCapture: true // We'll handle evidence with BackgroundSOSRecorder
                });

                console.log('✅ SOS fully activated:', sos.id);

                // Activate SOS in global context (this will start background recording)
                activateSOS(sos.id);

                // Show success alert
                Alert.alert(t('success'), t('sos_activated'));
              } catch (error) {
                console.error('❌ Error triggering SOS:', error);
                Alert.alert(t('error'), error?.message || 'Failed to trigger SOS');
              }
            },
          },
          {
            text: t('call_emergency') || 'Call 112 + Alert',
            style: 'destructive',
            onPress: async () => {
              try {
                // Trigger SOS with emergency call
                const sos = await triggerSOS(user.uid, userProfile, {
                  triggerMethod: 'manual',
                  callEmergency: true,
                  emergencyType: 'national_emergency',
                  skipEvidenceCapture: true // We'll handle evidence with BackgroundSOSRecorder
                });

                console.log('✅ SOS fully activated:', sos.id);

                // Activate SOS in global context (this will start background recording)
                activateSOS(sos.id);

                // Trigger emergency call
                await triggerDeviceEmergencyCall('112');
              } catch (error) {
                console.error('❌ Error triggering SOS:', error);
                Alert.alert(t('error'), error?.message || 'Failed to trigger SOS');
              }
            },
          },
        ]
      );
    }
  };

  const handleTrackingToggle = async () => {
    try {
      if (trackingActive) {
        stopLocationTracking();
        setTrackingActive(false);
        Alert.alert(t('success'), t('tracking_stopped'));
      } else {
        await startLocationTracking(user.uid);
        setTrackingActive(true);
        Alert.alert(t('success'), t('tracking_started'));
      }
    } catch (error) {
      Alert.alert(t('error'), error?.message || 'Failed to toggle tracking');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t('welcome')}, {userProfile?.name || t('user')}!
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* SOS Button */}
      <View style={styles.sosContainer}>
        <Animated.View
          style={[
            styles.sosButtonWrapper,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.sosButton,
              sosActive && styles.sosButtonActive,
            ]}
            onPress={handleSOSPress}
          >
            <Text style={styles.sosButtonText}>
              {sosActive ? t('sos_active') : t('tap_for_sos')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.sosLabel}>
          {sosActive ? t('sos_activated') : t('emergency_sos')}
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>{t('quick_actions')}</Text>
        
        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleTrackingToggle}
        >
          <View style={styles.actionCardContent}>
            <Text style={styles.actionCardTitle}>{t('tracking')}</Text>
            <Text style={styles.actionCardStatus}>
              {trackingActive ? t('tracking_active') : t('tracking_inactive')}
            </Text>
          </View>
          <View
            style={[
              styles.statusIndicator,
              trackingActive && styles.statusIndicatorActive,
            ]}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Contacts')}
        >
          <View style={styles.actionCardContent}>
            <Text style={styles.actionCardTitle}>{t('trusted_contacts')}</Text>
            <Text style={styles.actionCardStatus}>{t('manage_contacts')}</Text>
          </View>
          <Text style={styles.actionCardArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Location')}
        >
          <View style={styles.actionCardContent}>
            <Text style={styles.actionCardTitle}>{t('location')}</Text>
            <Text style={styles.actionCardStatus}>{t('view_safe_routes')}</Text>
          </View>
          <Text style={styles.actionCardArrow}>›</Text>
        </TouchableOpacity>
      </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>{t('safety_tips')}</Text>
          <Text style={styles.infoText}>
            • {t('keep_contacts_updated')}{'\n'}
            • {t('enable_location_traveling')}{'\n'}
            • {t('review_safety_feed')}{'\n'}
            • {t('check_emergency_permissions')}
          </Text>
        </View>
      </ScrollView>

      {/* FloatingSOSControl is now global in RootNavigator - no need here */}
      {/* BackgroundSOSRecorder hook is called at the top - recording happens in background */}
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
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: colors.secondary,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  sosContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  sosButtonWrapper: {
    marginBottom: 15,
  },
  sosButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    boxShadow: '0 4px 8px rgba(230, 57, 70, 0.3)',
  },
  sosButtonActive: {
    backgroundColor: colors.primaryDark,
  },
  sosButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sosLabel: {
    fontSize: 14,
    color: colors.gray600,
    fontWeight: '600',
  },
  quickActionsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray800,
    marginBottom: 15,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  actionCardContent: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 4,
  },
  actionCardStatus: {
    fontSize: 12,
    color: colors.gray600,
  },
  actionCardArrow: {
    fontSize: 24,
    color: colors.primary,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gray400,
    marginLeft: 10,
  },
  statusIndicatorActive: {
    backgroundColor: colors.success,
  },
  infoSection: {
    padding: 20,
    backgroundColor: colors.gray50,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray800,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: colors.gray600,
    lineHeight: 20,
  },
});

export default HomeScreen;

