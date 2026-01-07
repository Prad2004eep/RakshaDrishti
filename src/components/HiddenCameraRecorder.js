import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

/**
 * Hidden Camera Recorder Component
 * Provides a hidden camera view for background video recording during SOS
 * This component must be mounted in the UI for video recording to work
 */
const HiddenCameraRecorder = ({ enabled, onCameraReady, onRecordingComplete, onStopRecording, duration = 25 }) => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const recordingTimeoutRef = useRef(null);
  const isRecordingRef = useRef(false);
  const stopPromiseRef = useRef(null);

  useEffect(() => {
    if (!cameraPermission) {
      requestCameraPermission();
    }
  }, []);

  useEffect(() => {
    if (enabled && cameraPermission?.granted && cameraRef.current) {
      // Notify parent that camera is ready and provide stop function
      if (onCameraReady) {
        onCameraReady(cameraRef.current);
      }

      // Provide stop function to parent
      if (onStopRecording) {
        onStopRecording(stopVideoRecording);
      }

      // Start recording after a short delay
      setTimeout(() => {
        startVideoRecording();
      }, 300);
    }

    return () => {
      // Cleanup on unmount
      stopVideoRecording();
    };
  }, [enabled, cameraPermission?.granted]);

  const startVideoRecording = async () => {
    if (!cameraRef.current || isRecordingRef.current) {
      return;
    }

    try {
      console.log('📹 [HiddenCamera] Starting video recording...');
      isRecordingRef.current = true;

      // Start recording
      const videoPromise = cameraRef.current.recordAsync({
        maxDuration: duration,
      });

      // Set timeout to auto-stop
      recordingTimeoutRef.current = setTimeout(async () => {
        await stopVideoRecording();
      }, duration * 1000);

      // Wait for recording to complete
      const video = await videoPromise;

      console.log('✅ [HiddenCamera] Video recording completed:', video?.uri);

      // Resolve the stop promise if it exists
      if (stopPromiseRef.current) {
        stopPromiseRef.current(video?.uri);
        stopPromiseRef.current = null;
      }

      if (onRecordingComplete && video?.uri) {
        onRecordingComplete(video.uri);
      }

      isRecordingRef.current = false;
    } catch (error) {
      console.error('❌ [HiddenCamera] Video recording error:', error);
      isRecordingRef.current = false;
    }
  };

  const stopVideoRecording = async () => {
    if (!cameraRef.current || !isRecordingRef.current) {
      return null;
    }

    try {
      console.log('🛑 [HiddenCamera] Stopping video recording...');

      // Clear timeout
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }

      // Create a promise that will be resolved when recording stops
      const stopPromise = new Promise((resolve) => {
        stopPromiseRef.current = resolve;
      });

      // Stop recording (this will trigger the videoPromise to resolve)
      await cameraRef.current.stopRecording();

      // Wait for the video to be processed and callback to be called
      const videoUri = await stopPromise;

      isRecordingRef.current = false;
      return videoUri;
    } catch (error) {
      console.error('❌ [HiddenCamera] Error stopping video:', error);
      isRecordingRef.current = false;
      return null;
    }
  };

  // Don't render if not enabled or no permission
  if (!enabled || !cameraPermission?.granted) {
    return null;
  }

  return (
    <View style={styles.hiddenContainer} pointerEvents="none">
      <CameraView
        ref={cameraRef}
        style={styles.hiddenCamera}
        facing="back"
        mode="video"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    top: -1000, // Move off-screen
    left: -1000,
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
    zIndex: -1,
  },
  hiddenCamera: {
    width: 1,
    height: 1,
  },
});

export default HiddenCameraRecorder;

