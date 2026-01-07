import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { Audio } from 'expo-av';
import { uploadToStorage, saveEvidenceMetadata } from '../services/evidenceCaptureService';

/**
 * SOS Evidence Recorder Component
 * Records BOTH audio and video simultaneously when SOS is triggered
 * Auto-starts recording and auto-stops after duration
 */
const SOSEvidenceRecorder = ({ 
  visible, 
  onClose, 
  onComplete, 
  userId, 
  sosId,
  duration = 25 
}) => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [cameraType] = useState('back'); // Use back camera for stealth recording

  const cameraRef = useRef(null);
  const audioRecordingRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!cameraPermission) {
      requestCameraPermission();
    }
  }, []);

  useEffect(() => {
    if (visible && cameraPermission?.granted) {
      console.log('🎥 SOS Evidence Recorder started (HIDDEN MODE - no UI visible)');

      // Auto-start recording when modal opens
      setTimeout(() => {
        startRecording();
      }, 500);
    }

    // Handle modal closing (user deactivated SOS)
    if (!visible && isRecording) {
      console.log('🛑 Modal closing - stopping recording early and saving...');
      stopRecordingEarly();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Clean up audio recording if modal closes
      if (audioRecordingRef.current) {
        audioRecordingRef.current.stopAndUnloadAsync().catch(console.error);
      }
    };
  }, [visible, cameraPermission, isRecording]);

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) {
      console.warn('⚠️ Cannot start recording');
      return;
    }

    let audioUri = null;
    let videoUri = null;

    try {
      console.log('🎥📹 Starting SIMULTANEOUS audio + video recording (HIDDEN MODE)...');
      setIsRecording(true);

      // Start timer for tracking
      let recordingSeconds = 0;
      timerRef.current = setInterval(() => {
        recordingSeconds++;
        // Silent timer - no UI updates
      }, 1000);

      // Start AUDIO recording
      const audioPromise = startAudioRecording().catch(err => {
        console.error('⚠️ Audio recording error:', err);
        return null; // Return null if audio fails
      });

      // Start VIDEO recording
      const videoPromise = cameraRef.current.recordAsync({
        maxDuration: duration,
      }).catch(err => {
        console.error('⚠️ Video recording error:', err);
        return null; // Return null if video fails
      });

      console.log('✅ Both audio and video recording started (recording silently in background)');

      // Wait for both to complete (or be stopped early)
      const [audioResult, videoResult] = await Promise.all([audioPromise, videoPromise]);

      audioUri = audioResult;
      videoUri = videoResult?.uri || null;

      console.log('✅ Recording completed:', {
        audio: audioUri,
        video: videoUri,
        duration: recordingSeconds
      });

      // Upload whatever we have (even if partial)
      if (audioUri || videoUri) {
        await uploadEvidence(audioUri, videoUri);
      } else {
        console.log('⚠️ No evidence to upload');
        onClose();
      }

    } catch (error) {
      console.error('❌ Error during recording:', error);

      // Try to upload whatever we captured before the error
      if (audioUri || videoUri) {
        console.log('📤 Attempting to upload partial evidence...');
        try {
          await uploadEvidence(audioUri, videoUri);
        } catch (uploadError) {
          console.error('❌ Failed to upload partial evidence:', uploadError);
        }
      }

      // Don't show alert to user - keep it silent
      console.error('Recording failed silently - attacker won\'t know');
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Close modal silently
      onClose();
    }
  };

  const startAudioRecording = async () => {
    try {
      // Request audio permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio permission not granted');
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      // Create and start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      audioRecordingRef.current = recording;
      console.log('🎤 Audio recording started');

      // Wait for duration OR until recording is stopped early
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(async () => {
          // Auto-stop after duration
          try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            console.log('✅ Audio recording completed (full duration):', uri);
            audioRecordingRef.current = null;
            resolve(uri);
          } catch (error) {
            console.error('❌ Error stopping audio:', error);
            reject(error);
          }
        }, duration * 1000);

        // Store timeout ID so we can clear it if stopped early
        recording._timeoutId = timeoutId;
      });
    } catch (error) {
      console.error('❌ Audio recording error:', error);
      throw error;
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      try {
        console.log('🛑 Stopping recording (silent)...');
        cameraRef.current.stopRecording();

        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      } catch (error) {
        console.error('❌ Error stopping recording:', error);
      }
    }
  };

  const stopRecordingEarly = async () => {
    if (!isRecording) {
      console.log('ℹ️ No recording in progress to stop');
      return;
    }

    try {
      console.log('🛑 User deactivated SOS - stopping recording early...');
      setIsRecording(false);

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Stop video recording (this will cause the recordAsync promise to resolve)
      if (cameraRef.current) {
        console.log('📹 Stopping video recording early...');
        cameraRef.current.stopRecording();
      }

      // Stop audio recording early
      if (audioRecordingRef.current) {
        console.log('🎤 Stopping audio recording early...');
        try {
          // Clear the timeout if it exists
          if (audioRecordingRef.current._timeoutId) {
            clearTimeout(audioRecordingRef.current._timeoutId);
          }

          // Stop and get the partial recording
          await audioRecordingRef.current.stopAndUnloadAsync();
          const audioUri = audioRecordingRef.current.getURI();
          console.log('✅ Audio stopped early - partial recording saved:', audioUri);
          audioRecordingRef.current = null;
        } catch (audioError) {
          console.error('⚠️ Error stopping audio:', audioError);
        }
      }

      console.log('✅ Recording stopped early - partial evidence will be saved automatically');
    } catch (error) {
      console.error('❌ Error stopping recording early:', error);
    }
  };

  const uploadEvidence = async (audioUri, videoUri) => {
    try {
      const isPartialRecording = !isRecording; // If not recording anymore, it was stopped early
      console.log(`📤 Uploading ${isPartialRecording ? 'PARTIAL' : 'FULL'} evidence to Firebase (silently)...`);

      const uploadPromises = [];

      // Upload audio
      if (audioUri) {
        const audioUpload = uploadToStorage(audioUri, userId, 'audio')
          .then(async (audioResult) => {
            console.log(`✅ Audio uploaded (${isPartialRecording ? 'partial' : 'full'}):`, audioResult.url);
            // Save audio metadata
            await saveEvidenceMetadata(userId, {
              type: 'audio',
              url: audioResult.url,
              storagePath: audioResult.path,
              fileName: audioResult.fileName,
              duration: duration,
              sosId: sosId,
              recordedAt: new Date(),
              isPartial: isPartialRecording,
              stoppedEarly: isPartialRecording,
            });
            return audioResult;
          });
        uploadPromises.push(audioUpload);
      }

      // Upload video
      if (videoUri) {
        const videoUpload = uploadToStorage(videoUri, userId, 'video')
          .then(async (videoResult) => {
            console.log(`✅ Video uploaded (${isPartialRecording ? 'partial' : 'full'}):`, videoResult.url);
            // Save video metadata
            await saveEvidenceMetadata(userId, {
              type: 'video',
              url: videoResult.url,
              storagePath: videoResult.path,
              fileName: videoResult.fileName,
              duration: duration,
              sosId: sosId,
              recordedAt: new Date(),
              isPartial: isPartialRecording,
              stoppedEarly: isPartialRecording,
            });
            return videoResult;
          });
        uploadPromises.push(videoUpload);
      }

      // Wait for all uploads
      const results = await Promise.all(uploadPromises);
      console.log(`✅ All evidence uploaded successfully (${isPartialRecording ? 'PARTIAL - user deactivated SOS' : 'FULL'})`);

      // Notify completion
      if (onComplete) {
        onComplete(results);
      }

      // Close modal immediately (no delay - stay silent)
      onClose();

    } catch (error) {
      console.error('❌ Error uploading evidence:', error);
      // Don't show alert - keep it silent
      console.error('Upload failed silently - attacker won\'t know');
      onClose();
    }
  };

  if (!cameraPermission) {
    return null;
  }

  if (!cameraPermission.granted) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-off" size={64} color={colors.white} />
          <Text style={styles.permissionText}>Camera permission required for evidence recording</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      hardwareAccelerated={true}
    >
      {/* Hidden camera view - records in background without showing UI */}
      {/* pointerEvents="none" allows touch events to pass through */}
      <View style={styles.hiddenContainer} pointerEvents="none">
        <CameraView
          ref={cameraRef}
          style={styles.hiddenCamera}
          facing={cameraType}
          mode="video"
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    top: -9999,
    left: -9999,
    width: 1,
    height: 1,
    opacity: 0,
    pointerEvents: 'none', // Allow touch events to pass through
  },
  hiddenCamera: {
    width: 1,
    height: 1,
    pointerEvents: 'none', // Allow touch events to pass through
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: colors.white,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SOSEvidenceRecorder;

