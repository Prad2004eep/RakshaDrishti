import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';

const VideoRecorder = ({ visible, onClose, onRecordingComplete, duration = 25 }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraType, setCameraType] = useState('back');
  const cameraRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!permission) {
      console.log('📷 Requesting camera permission...');
      requestPermission();
    } else {
      console.log('📷 Camera permission status:', permission.granted ? 'granted' : 'denied');
    }
  }, []);

  useEffect(() => {
    if (visible && permission?.granted) {
      console.log('🎥 VideoRecorder modal opened, auto-starting recording in 500ms...');
      // Auto-start recording when modal opens
      setTimeout(() => {
        startRecording();
      }, 500);
    } else if (visible && !permission?.granted) {
      console.warn('⚠️ VideoRecorder opened but camera permission not granted');
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [visible, permission]);

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        console.log('🎥 Starting video recording...');
        setIsRecording(true);
        setRecordingTime(0);

        // Start timer
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => {
            const newTime = prev + 1;
            if (newTime >= duration) {
              stopRecording();
            }
            return newTime;
          });
        }, 1000);

        console.log('📹 Recording video with max duration:', duration);
        const video = await cameraRef.current.recordAsync({
          maxDuration: duration,
        });

        console.log('✅ Video recorded successfully:', video.uri);
        onRecordingComplete(video.uri);
        onClose();
      } catch (error) {
        console.error('❌ Error recording video:', error);
        console.error('Error details:', error.message, error.stack);
        Alert.alert('Error', `Failed to record video: ${error.message}`);
        setIsRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
    } else {
      console.warn('⚠️ Cannot start recording:', {
        hasCameraRef: !!cameraRef.current,
        isRecording,
      });
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      try {
        cameraRef.current.stopRecording();
        setIsRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
  };

  const toggleCameraType = () => {
    setCameraType((current) =>
      current === 'back' ? 'front' : 'back'
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-off" size={64} color={colors.gray400} />
          <Text style={styles.permissionText}>Camera permission not granted</Text>
          <TouchableOpacity style={styles.closeButton} onPress={requestPermission}>
            <Text style={styles.closeButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.closeButton, { marginTop: 10, backgroundColor: colors.gray400 }]} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent={false} animationType="slide">
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraType}
          mode="video"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={onClose}>
              <Ionicons name="close" size={32} color={colors.white} />
            </TouchableOpacity>
            <View style={styles.recordingIndicator}>
              {isRecording && <View style={styles.recordingDot} />}
              <Text style={styles.timerText}>
                {formatTime(recordingTime)} / {formatTime(duration)}
              </Text>
            </View>
            <TouchableOpacity style={styles.headerButton} onPress={toggleCameraType}>
              <Ionicons name="camera-reverse" size={32} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View style={styles.controls}>
            <View style={styles.controlsInner}>
              {!isRecording ? (
                <TouchableOpacity
                  style={styles.recordButton}
                  onPress={startRecording}
                >
                  <View style={styles.recordButtonInner} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.stopButton}
                  onPress={stopRecording}
                >
                  <View style={styles.stopButtonInner} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.instructionText}>
              {isRecording
                ? 'Recording... Tap to stop'
                : 'Tap to start recording'}
            </Text>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    color: colors.gray600,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.danger,
  },
  timerText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    alignItems: 'center',
  },
  controlsInner: {
    marginBottom: 16,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.white,
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.danger,
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.white,
  },
  stopButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  instructionText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
});

export default VideoRecorder;

