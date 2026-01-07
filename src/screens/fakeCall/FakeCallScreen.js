import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const FakeCallScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { callerName = 'Mom', autoAnswer = false } = route.params || {};

  const [callDuration, setCallDuration] = useState(0);
  const [isCallActive, setIsCallActive] = useState(autoAnswer);
  const [sound, setSound] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);

  // Animations
  const pulseAnim = useState(new Animated.Value(1))[0];
  const slideAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Start pulse animation for incoming call
    if (!isCallActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Play ringtone if not auto-answered
    if (!autoAnswer) {
      playRingtone();
    }

    // Auto-answer after 3 seconds if autoAnswer is true
    if (autoAnswer) {
      setTimeout(() => {
        answerCall();
      }, 3000);
    }

    return () => {
      // Cleanup
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    let interval;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const playRingtone = async () => {
    try {
      // Check for custom ringtone first
      const customRingtoneData = await AsyncStorage.getItem('customRingtone');

      if (customRingtoneData) {
        const customRingtone = JSON.parse(customRingtoneData);
        try {
          const { sound: ringtone } = await Audio.Sound.createAsync(
            { uri: customRingtone.uri },
            { shouldPlay: true, isLooping: true }
          );
          setSound(ringtone);
          return;
        } catch (customError) {
          console.log('Custom ringtone failed, trying default');
        }
      }

      // Try default ringtone
      try {
        const { sound: ringtone } = await Audio.Sound.createAsync(
          require('../../assets/sounds/ringtone.mp3'),
          { shouldPlay: true, isLooping: true }
        );
        setSound(ringtone);
      } catch (fileError) {
        console.log('Default ringtone not found');
      }
    } catch (error) {
      console.log('Could not load ringtone:', error);
    }
  };

  const answerCall = async () => {
    // Stop ringtone
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }
    
    setIsCallActive(true);
  };

  const endCall = () => {
    if (sound) {
      sound.unloadAsync();
    }
    navigation.goBack();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Status Bar */}
      <View style={styles.topStatusBar}>
        <Text style={styles.statusText}>
          {isCallActive ? t('calling') || 'Calling...' : t('incoming_call') || 'Incoming Call'}
        </Text>
      </View>

      {/* Caller Info */}
      <View style={styles.callerInfo}>
        <Text style={styles.callerName}>{callerName}</Text>
        <Text style={styles.phoneNumber}>
          {isCallActive ? formatDuration(callDuration) : `Mobile +91 81970 96843`}
        </Text>

        {/* Avatar */}
        <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{callerName.charAt(0).toUpperCase()}</Text>
          </View>
        </Animated.View>
      </View>

      {/* Call Controls */}
      {!isCallActive ? (
        // Incoming call controls
        <View style={styles.incomingControls}>
          <TouchableOpacity style={styles.declineButton} onPress={endCall}>
            <Ionicons name="close" size={32} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.answerButton} onPress={answerCall}>
            <Ionicons name="call" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        // Active call controls
        <View style={styles.activeControls}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setIsMuted(!isMuted)}
            >
              <View style={[styles.actionCircle, isMuted && styles.actionCircleActive]}>
                <Ionicons
                  name={isMuted ? "mic-off" : "mic"}
                  size={24}
                  color="#666"
                />
              </View>
              <Text style={styles.actionText}>{t('mute') || 'Mute'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionCircle}>
                <Ionicons name="keypad" size={24} color="#666" />
              </View>
              <Text style={styles.actionText}>{t('keypad') || 'Keypad'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setIsSpeaker(!isSpeaker)}
            >
              <View style={[styles.actionCircle, isSpeaker && styles.actionCircleActive]}>
                <Ionicons
                  name={isSpeaker ? "volume-high" : "volume-medium"}
                  size={24}
                  color="#666"
                />
              </View>
              <Text style={styles.actionText}>{t('speaker') || 'Speaker'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionCircle}>
                <Ionicons name="ellipsis-horizontal" size={24} color="#666" />
              </View>
              <Text style={styles.actionText}>{t('more') || 'More'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.endCallButton}
            onPress={endCall}
          >
            <Ionicons name="call" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  topStatusBar: {
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  callerInfo: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingTop: 20,
  },
  phoneNumber: {
    fontSize: 16,
    color: '#666',
    marginBottom: 60,
  },
  avatarContainer: {
    marginTop: 20,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFA726',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callerName: {
    fontSize: 32,
    fontWeight: '400',
    color: '#000',
    marginBottom: 8,
  },
  callStatus: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  incomingControls: {
    paddingBottom: 80,
    paddingHorizontal: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  declineButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  answerButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  activeControls: {
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 50,
    paddingHorizontal: 10,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionCircleActive: {
    backgroundColor: '#BDBDBD',
  },
  actionText: {
    fontSize: 12,
    color: '#666',
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default FakeCallScreen;

