import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { useSOSContext } from '../contexts/SOSContext';
import { useAuth } from '../hooks/useAuth';
import HiddenCameraRecorder from './HiddenCameraRecorder';

/**
 * Global Floating SOS Control Button
 * Always visible when SOS is active, accessible from any screen
 * Allows safe cancellation of SOS at any time
 * Includes hidden camera for video recording
 */
const FloatingSOSControl = ({ onViewSOS }) => {
  const { sosActive, activeSOSId, isRecording, isUploading, deactivateSOSSafely, getVideoCallback, getVideoStopCallback } = useSOSContext();
  const { user } = useAuth();
  const [scaleAnim] = useState(new Animated.Value(1));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [isStopping, setIsStopping] = useState(false);

  // Get video recording callbacks from context
  const onVideoRecordingComplete = getVideoCallback();
  const onVideoStopRecording = getVideoStopCallback();

  useEffect(() => {
    if (sosActive) {
      // Pulse animation for active SOS
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
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
  }, [sosActive, pulseAnim]);

  if (!sosActive) {
    return null; // Don't show if SOS is not active
  }

  const handleStopPress = () => {
    const statusMessage = [];
    if (isRecording) statusMessage.push('Recording is active');
    if (isUploading) statusMessage.push('Upload in progress');

    const message = statusMessage.length > 0
      ? `${statusMessage.join(', ')}. Are you sure you want to stop SOS? All recordings will be saved.`
      : 'Are you sure you want to stop the SOS alert? Evidence will be saved.';

    Alert.alert(
      '🛑 Stop SOS?',
      message,
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Stop SOS',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsStopping(true);
              await deactivateSOSSafely(user?.uid);
              Alert.alert('✅ Success', 'SOS deactivated. Evidence has been saved.');
            } catch (error) {
              console.error('Error stopping SOS:', error);
              Alert.alert('⚠️ Error', 'Failed to stop SOS. Please try again.');
            } finally {
              setIsStopping(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Stop SOS Button */}
      <Animated.View
        style={[
          styles.buttonWrapper,
          { transform: [{ scale: pulseAnim }] },
        ]}
        pointerEvents="auto"
      >
        <TouchableOpacity
          style={styles.stopButton}
          onPress={handleStopPress}
          activeOpacity={0.7}
          disabled={isStopping}
        >
          {isStopping ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="stop-circle" size={24} color="#FFF" />
              <Text style={styles.buttonText}>Stop SOS</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Status Indicator */}
      {(isRecording || isUploading) && (
        <View style={styles.statusContainer} pointerEvents="auto">
          <Text style={styles.statusText}>
            {isRecording && '🎥 Recording'}
            {isRecording && isUploading && ' • '}
            {isUploading && '📤 Uploading'}
          </Text>
        </View>
      )}

      {/* View SOS Details Button */}
      {onViewSOS && (
        <TouchableOpacity
          style={styles.viewButton}
          onPress={onViewSOS}
          activeOpacity={0.7}
          pointerEvents="auto"
        >
          <Ionicons name="information-circle" size={20} color={colors.primary} />
        </TouchableOpacity>
      )}

      {/* Hidden Camera Recorder for video recording */}
      {onVideoRecordingComplete && (
        <HiddenCameraRecorder
          enabled={sosActive}
          onRecordingComplete={onVideoRecordingComplete}
          onStopRecording={onVideoStopRecording}
          duration={25}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    zIndex: 9999,
    alignItems: 'flex-end',
  },
  buttonWrapper: {
    marginBottom: 10,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    minWidth: 140,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  statusContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 8,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: colors.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default FloatingSOSControl;

