import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { uploadToStorage, saveEvidenceMetadata } from '../services/evidenceCaptureService';
import { useSOSContext } from '../contexts/SOSContext';

/**
 * Background SOS Recorder Hook
 * Runs recording and upload in background without blocking UI
 * Can be safely cancelled at any time
 * Records BOTH audio and video simultaneously
 */
export const useBackgroundSOSRecorder = ({ userId, sosId, duration = 25, enabled = false }) => {
  const { setRecordingRef, setUploadRef } = useSOSContext();
  const audioRecordingRef = useRef(null);
  const videoRecordingRef = useRef(null);
  const videoUriRef = useRef(null);
  const videoStopFunctionRef = useRef(null); // Store the HiddenCamera stop function
  const isRecordingRef = useRef(false);
  const uploadPromiseRef = useRef(null);
  const userIdRef = useRef(userId); // Store userId for late video upload
  const sosIdRef = useRef(sosId); // Store sosId for late video upload

  // Update refs when props change
  useEffect(() => {
    userIdRef.current = userId;
    sosIdRef.current = sosId;
  }, [userId, sosId]);

  useEffect(() => {
    if (enabled && userId && sosId) {
      startBackgroundRecording();
    }

    return () => {
      // Cleanup on unmount
      stopRecordingSafely();
    };
  }, [enabled, userId, sosId]);

  const startBackgroundRecording = async () => {
    if (isRecordingRef.current) {
      console.log('⚠️ Recording already in progress');
      return;
    }

    try {
      console.log('🎥🎤 [BackgroundRecorder] Starting SIMULTANEOUS audio + video recording...');
      isRecordingRef.current = true;

      // Set recording reference in context
      setRecordingRef({
        stopRecording: stopRecordingSafely,
      });

      // Start BOTH audio and video recording simultaneously
      const audioPromise = startAudioRecording(duration).catch(err => {
        console.error('⚠️ [BackgroundRecorder] Audio recording error:', err);
        return null; // Return null if audio fails
      });

      const videoPromise = startVideoRecording(duration).catch(err => {
        console.error('⚠️ [BackgroundRecorder] Video recording error:', err);
        return null; // Return null if video fails
      });

      // Wait for BOTH to complete or be stopped
      const [audioUri, videoUri] = await Promise.all([audioPromise, videoPromise]);

      console.log('✅ [BackgroundRecorder] Recording completed:', { audioUri, videoUri });

      // Upload BOTH in background
      if (audioUri || videoUri) {
        await uploadInBackground(audioUri, videoUri);
      }

      isRecordingRef.current = false;
      setRecordingRef(null);
    } catch (error) {
      console.error('❌ [BackgroundRecorder] Recording error:', error);
      isRecordingRef.current = false;
      setRecordingRef(null);
    }
  };

  const startAudioRecording = async (recordDuration) => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio permission not granted');
      }

      // Configure audio mode for background recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      // Create recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      });

      await recording.startAsync();
      audioRecordingRef.current = recording;
      console.log('🎤 [BackgroundRecorder] Audio recording started');

      // Return promise that resolves when recording completes or is stopped
      return new Promise((resolve, reject) => {
        // Auto-stop after duration
        const timeoutId = setTimeout(async () => {
          try {
            if (audioRecordingRef.current) {
              await audioRecordingRef.current.stopAndUnloadAsync();
              const uri = audioRecordingRef.current.getURI();
              console.log('✅ [BackgroundRecorder] Audio completed (full duration):', uri);
              audioRecordingRef.current = null;
              resolve(uri);
            } else {
              resolve(null);
            }
          } catch (error) {
            console.error('❌ [BackgroundRecorder] Error stopping audio:', error);
            reject(error);
          }
        }, recordDuration * 1000);

        // Store timeout for early cancellation
        recording._stopTimeout = timeoutId;
        recording._resolvePromise = resolve;
        recording._rejectPromise = reject;
      });
    } catch (error) {
      console.error('❌ [BackgroundRecorder] Audio setup error:', error);
      throw error;
    }
  };

  const startVideoRecording = async (recordDuration) => {
    try {
      // Request camera permissions
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        console.warn('⚠️ [BackgroundRecorder] Camera permission not granted');
        return null; // Return null instead of throwing to allow audio-only recording
      }

      console.log('📹 [BackgroundRecorder] Video recording will be handled by HiddenCameraRecorder component');

      // Return a promise that will be resolved when video recording completes
      // The actual recording is handled by the HiddenCameraRecorder component
      return new Promise((resolve) => {
        // Set timeout to match audio recording duration
        const timeoutId = setTimeout(() => {
          console.log('✅ [BackgroundRecorder] Video recording timeout reached');
          resolve(videoUriRef.current);
        }, recordDuration * 1000);

        // Store timeout for early cancellation
        videoRecordingRef.current = {
          timeoutId,
          resolve,
        };
      });

    } catch (error) {
      console.error('❌ [BackgroundRecorder] Video setup error:', error);
      return null; // Return null instead of throwing
    }
  };

  // Callback for when HiddenCameraRecorder completes video recording
  const onVideoRecordingComplete = async (videoUri) => {
    console.log('✅ [BackgroundRecorder] Video recording completed from HiddenCamera:', videoUri);
    videoUriRef.current = videoUri;

    // Resolve the video promise if it exists
    if (videoRecordingRef.current?.resolve) {
      videoRecordingRef.current.resolve(videoUri);
    }

    // If video completes AFTER upload has started, upload it separately
    if (uploadPromiseRef.current && videoUri && sosIdRef.current && userIdRef.current) {
      console.log('📤 [BackgroundRecorder] Uploading late video...');
      try {
        const videoFileName = `video_${Date.now()}.mp4`;
        const videoPath = `evidence/${userIdRef.current}/${sosIdRef.current}/${videoFileName}`;

        const videoUrl = await uploadToStorage(videoUri, videoPath);

        // Save video metadata to Firestore
        await saveEvidenceMetadata(userIdRef.current, {
          type: 'video',
          url: videoUrl.url || videoUrl,
          storagePath: videoPath,
          fileName: videoFileName,
          sosId: sosIdRef.current,
          duration: 25, // Default duration
          recordedAt: new Date(),
        });

        console.log('✅ [BackgroundRecorder] Late video uploaded successfully:', videoUrl);
      } catch (error) {
        console.error('❌ [BackgroundRecorder] Late video upload failed:', error);
      }
    }
  };

  // Callback to receive the HiddenCamera stop function
  const onVideoStopRecording = (stopFunction) => {
    console.log('📹 [BackgroundRecorder] Received video stop function from HiddenCamera');
    videoStopFunctionRef.current = stopFunction;
  };

  const stopRecordingSafely = async () => {
    console.log('🛑 [BackgroundRecorder] Stopping recording safely...');

    try {
      // Stop audio recording
      if (audioRecordingRef.current) {
        const recording = audioRecordingRef.current;

        // Clear timeout
        if (recording._stopTimeout) {
          clearTimeout(recording._stopTimeout);
        }

        // Stop and get URI
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        console.log('✅ [BackgroundRecorder] Audio stopped early:', uri);

        // Resolve the promise
        if (recording._resolvePromise) {
          recording._resolvePromise(uri);
        }

        audioRecordingRef.current = null;
      }

      // Stop video recording
      if (videoRecordingRef.current) {
        const videoRec = videoRecordingRef.current;

        // Clear timeout
        if (videoRec.timeoutId) {
          clearTimeout(videoRec.timeoutId);
        }

        // Call the HiddenCamera stop function and wait for it
        if (videoStopFunctionRef.current) {
          console.log('🛑 [BackgroundRecorder] Calling HiddenCamera stop function...');
          const videoUri = await videoStopFunctionRef.current();
          console.log('✅ [BackgroundRecorder] Video stopped early:', videoUri);

          // Resolve the promise with the actual video URI
          if (videoRec.resolve) {
            videoRec.resolve(videoUri);
          }
        } else {
          // Fallback: resolve with current video URI if stop function not available
          console.log('⚠️ [BackgroundRecorder] No video stop function, using current URI:', videoUriRef.current);
          if (videoRec.resolve) {
            videoRec.resolve(videoUriRef.current);
          }
        }

        videoRecordingRef.current = null;
      }

      isRecordingRef.current = false;
      setRecordingRef(null);
    } catch (error) {
      console.error('❌ [BackgroundRecorder] Error stopping recording:', error);
    }
  };

  const uploadInBackground = async (audioUri, videoUri) => {
    try {
      console.log('📤 [BackgroundRecorder] Starting background upload...');

      // Create upload promise
      const uploadPromise = (async () => {
        const uploadedFiles = [];

        // Upload audio
        if (audioUri) {
          try {
            const audioFileName = `audio_${Date.now()}.m4a`;
            const audioPath = `evidence/${userId}/${sosId}/${audioFileName}`;

            // Get audio duration
            let audioDuration = 0;
            try {
              const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
              const status = await sound.getStatusAsync();
              if (status.isLoaded && status.durationMillis) {
                audioDuration = Math.floor(status.durationMillis / 1000); // Convert to seconds
              }
              await sound.unloadAsync();
              console.log('🎵 [BackgroundRecorder] Audio duration:', audioDuration, 'seconds');
            } catch (durationError) {
              console.error('⚠️ [BackgroundRecorder] Could not get audio duration:', durationError);
            }

            const audioUrl = await uploadToStorage(audioUri, audioPath);

            // Save audio metadata to Firestore
            await saveEvidenceMetadata(userId, {
              type: 'audio',
              url: audioUrl.url || audioUrl,
              storagePath: audioPath,
              fileName: audioFileName,
              sosId,
              duration: audioDuration,
              recordedAt: new Date(),
            });

            uploadedFiles.push({
              type: 'audio',
              url: audioUrl.url || audioUrl,
              fileName: audioFileName,
              path: audioPath,
              duration: audioDuration,
            });
            console.log('✅ [BackgroundRecorder] Audio uploaded and saved:', audioUrl);
          } catch (error) {
            console.error('❌ [BackgroundRecorder] Audio upload failed:', error);
          }
        }

        // Upload video (if exists)
        if (videoUri) {
          try {
            const videoFileName = `video_${Date.now()}.mp4`;
            const videoPath = `evidence/${userId}/${sosId}/${videoFileName}`;

            // Get video duration
            let videoDuration = 0;
            try {
              const { sound, status } = await Audio.Sound.createAsync({ uri: videoUri });
              if (status.isLoaded && status.durationMillis) {
                videoDuration = Math.floor(status.durationMillis / 1000); // Convert to seconds
              }
              await sound.unloadAsync();
              console.log('🎬 [BackgroundRecorder] Video duration:', videoDuration, 'seconds');
            } catch (durationError) {
              console.error('⚠️ [BackgroundRecorder] Could not get video duration:', durationError);
              // Default to 25 seconds if can't determine
              videoDuration = 25;
            }

            const videoUrl = await uploadToStorage(videoUri, videoPath);

            // Save video metadata to Firestore
            await saveEvidenceMetadata(userId, {
              type: 'video',
              url: videoUrl.url || videoUrl,
              storagePath: videoPath,
              fileName: videoFileName,
              sosId,
              duration: videoDuration,
              recordedAt: new Date(),
            });

            uploadedFiles.push({
              type: 'video',
              url: videoUrl.url || videoUrl,
              fileName: videoFileName,
              path: videoPath,
              duration: videoDuration,
            });
            console.log('✅ [BackgroundRecorder] Video uploaded and saved:', videoUrl);
          } catch (error) {
            console.error('❌ [BackgroundRecorder] Video upload failed:', error);
          }
        }

        return uploadedFiles;
      })();

      // Store upload promise in context
      uploadPromiseRef.current = uploadPromise;
      setUploadRef(uploadPromise);

      // Wait for upload to complete
      const result = await uploadPromise;

      // Clear upload reference
      uploadPromiseRef.current = null;
      setUploadRef(null);

      console.log('✅ [BackgroundRecorder] Upload completed:', result);
      return result;
    } catch (error) {
      console.error('❌ [BackgroundRecorder] Upload error:', error);
      uploadPromiseRef.current = null;
      setUploadRef(null);
      throw error;
    }
  };

  return {
    isRecording: isRecordingRef.current,
    stopRecording: stopRecordingSafely,
    onVideoRecordingComplete, // Callback for HiddenCameraRecorder
    onVideoStopRecording, // Callback to receive HiddenCamera stop function
  };
};

export default useBackgroundSOSRecorder;

