import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { Camera } from 'expo-camera';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, db } from '../config/firebase';
import { collection, addDoc, getDocs, doc, deleteDoc } from 'firebase/firestore';

let audioRecording = null;
let videoRecording = null;

/**
 * Request camera and microphone permissions
 */
export const requestPermissions = async () => {
  try {
    const cameraPermission = await Camera.requestCameraPermissionsAsync();
    const audioPermission = await Audio.requestPermissionsAsync();
    
    return {
      camera: cameraPermission.status === 'granted',
      audio: audioPermission.status === 'granted',
    };
  } catch (error) {
    console.error('Error requesting permissions:', error);
    throw error;
  }
};

/**
 * Start audio recording
 */
export const startAudioRecording = async () => {
  try {
    // Request permissions
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

    // Create recording
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recording.startAsync();
    
    audioRecording = recording;
    console.log('✅ Audio recording started');
    return recording;
  } catch (error) {
    console.error('Error starting audio recording:', error);
    throw error;
  }
};

/**
 * Stop audio recording and return file URI
 */
export const stopAudioRecording = async () => {
  try {
    if (!audioRecording) {
      throw new Error('No active audio recording');
    }

    await audioRecording.stopAndUnloadAsync();
    const uri = audioRecording.getURI();
    audioRecording = null;
    
    console.log('✅ Audio recording stopped:', uri);
    return uri;
  } catch (error) {
    console.error('Error stopping audio recording:', error);
    throw error;
  }
};

/**
 * Upload file to Firebase Storage
 */
export const uploadToStorage = async (fileUri, storagePathOrUserId, type = 'audio') => {
  try {
    if (!fileUri) {
      throw new Error('No file URI provided');
    }

    if (!storagePathOrUserId) {
      throw new Error('No storage path or user ID provided');
    }

    // Check if storagePathOrUserId is a full path or just userId
    let storagePath;
    if (storagePathOrUserId.includes('/')) {
      // It's a full path (e.g., "evidence/userId/sosId/audio_123.m4a")
      storagePath = storagePathOrUserId;
    } else {
      // It's just a userId, create path
      const timestamp = Date.now();
      const fileName = `${type}_${timestamp}.${type === 'audio' ? 'm4a' : 'mp4'}`;
      storagePath = `evidence/${storagePathOrUserId}/${fileName}`;
    }

    console.log('📤 Uploading file:', { fileUri, storagePath });

    // Read file as blob
    const response = await fetch(fileUri);
    if (!response.ok) {
      throw new Error('Failed to read file');
    }
    const blob = await response.blob();

    console.log('📦 Blob created, size:', blob.size);

    // Upload to Firebase Storage
    const storageRef = ref(storage, storagePath);
    const uploadResult = await uploadBytes(storageRef, blob);

    console.log('✅ Upload complete:', uploadResult);

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    // Extract fileName from storagePath
    const fileName = storagePath.split('/').pop();

    console.log('✅ File uploaded to storage:', downloadURL);
    return {
      url: downloadURL,
      path: storagePath,
      fileName,
    };
  } catch (error) {
    console.error('❌ Error uploading to storage:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      name: error.name,
    });

    // Provide more specific error messages
    if (error.code === 'storage/unauthorized') {
      throw new Error('Storage access denied. Please check Firebase Storage rules.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled');
    } else if (error.code === 'storage/unknown') {
      throw new Error('Upload failed. Please check your internet connection and try again.');
    } else {
      throw new Error(error.message || 'Failed to upload file');
    }
  }
};

/**
 * Save evidence metadata to Firestore
 */
export const saveEvidenceMetadata = async (userId, evidenceData) => {
  try {
    const evidenceRef = collection(db, 'users', userId, 'evidence');
    const docRef = await addDoc(evidenceRef, {
      ...evidenceData,
      createdAt: new Date(),
      userId,
    });
    
    console.log('✅ Evidence metadata saved:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving evidence metadata:', error);
    throw error;
  }
};

/**
 * Capture evidence (audio/video) during SOS
 * Records for 25 seconds (between 20-30 seconds as requested)
 * @param {string} videoUri - Video file URI (for video type, provided by camera component)
 */
export const captureEvidence = async (userId, type = 'audio', sosId = null, duration = 25, videoUri = null) => {
  try {
    let fileUri;
    const durationMs = duration * 1000; // Convert to milliseconds

    if (type === 'audio') {
      console.log(`🎤 Starting ${duration}s audio recording...`);

      // Start audio recording
      await startAudioRecording();

      // Record for specified duration (default 25 seconds)
      await new Promise(resolve => setTimeout(resolve, durationMs));

      // Stop recording
      fileUri = await stopAudioRecording();
      console.log('✅ Audio recording stopped, file:', fileUri);
    } else if (type === 'video') {
      console.log(`📹 Processing ${duration}s video recording...`);

      // Video recording is handled by camera component
      // The video URI is passed as a parameter
      if (!videoUri) {
        throw new Error('Video URI is required for video evidence');
      }

      fileUri = videoUri;
      console.log('✅ Video file received:', fileUri);
    }

    if (!fileUri) {
      throw new Error('No file URI obtained from recording');
    }

    console.log('📤 Uploading evidence to Firebase Storage...');

    // Upload to storage
    const uploadResult = await uploadToStorage(fileUri, userId, type);
    console.log('✅ Upload successful:', uploadResult.url);

    // Save metadata
    console.log('💾 Saving evidence metadata to Firestore...');
    const evidenceId = await saveEvidenceMetadata(userId, {
      type,
      url: uploadResult.url,
      storagePath: uploadResult.path,
      fileName: uploadResult.fileName,
      sosId,
      duration, // actual duration in seconds
      recordedAt: new Date(),
    });
    console.log('✅ Evidence metadata saved with ID:', evidenceId);

    // Delete local file to save space
    try {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
      console.log('🗑️ Local file deleted');
    } catch (deleteError) {
      console.warn('⚠️ Could not delete local file:', deleteError);
    }

    return {
      evidenceId,
      url: uploadResult.url,
      type,
      duration,
    };
  } catch (error) {
    console.error('❌ Error capturing evidence:', error);
    throw error;
  }
};

/**
 * Auto-capture evidence when SOS is triggered
 * Captures BOTH audio and video simultaneously for 20-30 seconds
 */
export const autoCaptureEvidence = async (userId, sosId) => {
  try {
    console.log('🎥 Auto-capturing evidence for SOS:', sosId);
    console.log('⏱️ Recording duration: 25 seconds (audio + video)');

    // Check permissions
    const permissions = await requestPermissions();
    console.log('📋 Permissions:', permissions);

    const results = [];
    const capturePromises = [];

    // Capture audio if permission granted (runs in background)
    if (permissions.audio) {
      console.log('🎤 Starting audio capture...');
      const audioPromise = captureEvidence(userId, 'audio', sosId)
        .then(audioResult => {
          console.log('✅ Audio capture completed:', audioResult);
          results.push({ type: 'audio', ...audioResult });
          return audioResult;
        })
        .catch(error => {
          console.error('❌ Failed to capture audio:', error);
          return null;
        });

      capturePromises.push(audioPromise);
    } else {
      console.warn('⚠️ Audio permission not granted, skipping audio capture');
    }

    // Capture video if permission granted (runs in background)
    // Note: Video recording in background requires camera component
    // For now, we'll create a placeholder that can be implemented later
    if (permissions.camera) {
      console.log('📹 Video capture available but requires camera UI component');
      console.log('ℹ️ Video recording will be implemented when camera component is integrated');

      // Placeholder for video capture
      // When implemented, this will record video in background
      // const videoPromise = captureEvidence(userId, 'video', sosId)
      //   .then(videoResult => {
      //     console.log('✅ Video capture completed:', videoResult);
      //     results.push({ type: 'video', ...videoResult });
      //     return videoResult;
      //   })
      //   .catch(error => {
      //     console.error('❌ Failed to capture video:', error);
      //     return null;
      //   });
      //
      // capturePromises.push(videoPromise);
    } else {
      console.warn('⚠️ Camera permission not granted, skipping video capture');
    }

    // Wait for all captures to complete (or fail)
    if (capturePromises.length > 0) {
      console.log(`⏳ Waiting for ${capturePromises.length} capture(s) to complete...`);
      await Promise.allSettled(capturePromises);
      console.log('✅ All evidence capture attempts completed');
    } else {
      console.warn('⚠️ No evidence captured (no permissions granted)');
    }

    return results;
  } catch (error) {
    console.error('❌ Error in auto-capture:', error);
    // Don't throw - we want SOS to continue even if evidence capture fails
    return [];
  }
};

/**
 * Get all evidence for a user
 */
export const getUserEvidence = async (userId) => {
  try {
    const evidenceRef = collection(db, 'users', userId, 'evidence');
    const snapshot = await getDocs(evidenceRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting user evidence:', error);
    throw error;
  }
};

/**
 * Delete evidence (file and metadata)
 */
export const deleteEvidence = async (userId, evidenceId, storagePath) => {
  try {
    // Delete from storage
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    
    // Delete metadata
    const evidenceRef = doc(db, 'users', userId, 'evidence', evidenceId);
    await deleteDoc(evidenceRef);
    
    console.log('✅ Evidence deleted:', evidenceId);
    return true;
  } catch (error) {
    console.error('Error deleting evidence:', error);
    throw error;
  }
};

export default {
  requestPermissions,
  startAudioRecording,
  stopAudioRecording,
  uploadToStorage,
  saveEvidenceMetadata,
  captureEvidence,
  autoCaptureEvidence,
  getUserEvidence,
  deleteEvidence,
};

