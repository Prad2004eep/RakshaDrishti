import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { deactivateSOS, getActiveSOSAlerts } from '../services/sosService';

const SOSContext = createContext();

export const useSOSContext = () => {
  const context = useContext(SOSContext);
  if (!context) {
    throw new Error('useSOSContext must be used within SOSProvider');
  }
  return context;
};

export const SOSProvider = ({ children }) => {
  const [sosActive, setSosActive] = useState(false);
  const [activeSOSId, setActiveSOSId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const recordingRef = useRef(null);
  const uploadRef = useRef(null);
  const videoCallbackRef = useRef(null); // Store video recording callback
  const videoStopCallbackRef = useRef(null); // Store video stop callback

  // Activate SOS
  const activateSOS = useCallback((sosId) => {
    console.log('🚨 [SOSContext] Activating SOS:', sosId);
    setSosActive(true);
    setActiveSOSId(sosId);
  }, []);

  // Deactivate SOS safely
  const deactivateSOSSafely = useCallback(async (userId) => {
    try {
      console.log('🛑 [SOSContext] Deactivating SOS safely...');
      
      // Stop recording if active
      if (isRecording && recordingRef.current) {
        console.log('🛑 Stopping active recording...');
        try {
          await recordingRef.current.stopRecording();
        } catch (error) {
          console.warn('⚠️ Error stopping recording:', error);
        }
      }

      // Wait for uploads to complete (with timeout)
      if (isUploading && uploadRef.current) {
        console.log('⏳ Waiting for uploads to complete...');
        try {
          await Promise.race([
            uploadRef.current,
            new Promise((resolve) => setTimeout(resolve, 5000)) // 5 second timeout
          ]);
        } catch (error) {
          console.warn('⚠️ Upload timeout or error:', error);
        }
      }

      // Deactivate in Firebase
      if (activeSOSId && userId) {
        console.log('📝 Updating SOS status in Firebase...');
        await deactivateSOS(userId, activeSOSId);
      }

      // Reset state
      setSosActive(false);
      setActiveSOSId(null);
      setIsRecording(false);
      setIsUploading(false);
      recordingRef.current = null;
      uploadRef.current = null;

      console.log('✅ [SOSContext] SOS deactivated successfully');
      return true;
    } catch (error) {
      console.error('❌ [SOSContext] Error deactivating SOS:', error);
      // Force reset state even if error
      setSosActive(false);
      setActiveSOSId(null);
      setIsRecording(false);
      setIsUploading(false);
      throw error;
    }
  }, [activeSOSId, isRecording, isUploading]);

  // Set recording reference
  const setRecordingRef = useCallback((ref) => {
    recordingRef.current = ref;
    setIsRecording(!!ref);
  }, []);

  // Set upload reference
  const setUploadRef = useCallback((ref) => {
    uploadRef.current = ref;
    setIsUploading(!!ref);
  }, []);

  // Check for active SOS on mount
  const checkActiveSOSAlerts = useCallback(async (userId) => {
    try {
      const alerts = await getActiveSOSAlerts(userId);
      if (alerts.length > 0) {
        console.log('🔍 [SOSContext] Found active SOS:', alerts[0].id);
        setSosActive(true);
        setActiveSOSId(alerts[0].id);
        return alerts[0];
      }
      return null;
    } catch (error) {
      console.error('❌ [SOSContext] Error checking active SOS:', error);
      return null;
    }
  }, []);

  // Set video recording callback
  const setVideoCallback = useCallback((callback) => {
    videoCallbackRef.current = callback;
  }, []);

  // Get video recording callback
  const getVideoCallback = useCallback(() => {
    return videoCallbackRef.current;
  }, []);

  // Set video stop callback
  const setVideoStopCallback = useCallback((callback) => {
    videoStopCallbackRef.current = callback;
  }, []);

  // Get video stop callback
  const getVideoStopCallback = useCallback(() => {
    return videoStopCallbackRef.current;
  }, []);

  const value = {
    sosActive,
    activeSOSId,
    isRecording,
    isUploading,
    activateSOS,
    deactivateSOSSafely,
    setRecordingRef,
    setUploadRef,
    checkActiveSOSAlerts,
    setVideoCallback,
    getVideoCallback,
    setVideoStopCallback,
    getVideoStopCallback,
  };

  return <SOSContext.Provider value={value}>{children}</SOSContext.Provider>;
};

