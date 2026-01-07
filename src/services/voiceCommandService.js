import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

let isListening = false;
let voiceCallback = null;

// Voice commands that trigger SOS
const SOS_COMMANDS = [
  'raksha help',
  'raksha sos',
  'emergency',
  'help me',
  'danger',
];

/**
 * Request microphone permission
 */
export const requestMicrophonePermission = async () => {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting microphone permission:', error);
    return false;
  }
};

/**
 * Start listening for voice commands
 * Note: This is a placeholder. Real voice recognition requires:
 * - expo-speech-recognition (not available yet)
 * - OR Google Cloud Speech-to-Text API
 * - OR Azure Speech Services
 * @param {Function} callback - Function to call when command detected
 */
export const startVoiceCommandListening = async (callback) => {
  if (isListening) {
    console.warn('Voice command listening already active');
    return false;
  }

  // Request permission
  const hasPermission = await requestMicrophonePermission();
  if (!hasPermission) {
    throw new Error('Microphone permission not granted');
  }

  voiceCallback = callback;
  isListening = true;
  
  console.log('✅ Voice command listening started');
  console.log('🎤 Say "Raksha Help" to trigger SOS');
  
  // Note: Actual implementation would use speech recognition API
  // This is a placeholder that would need to be replaced with:
  // 1. expo-speech-recognition (when available)
  // 2. Google Cloud Speech-to-Text
  // 3. Azure Speech Services
  // 4. AWS Transcribe
  
  return true;
};

/**
 * Stop listening for voice commands
 */
export const stopVoiceCommandListening = () => {
  if (isListening) {
    isListening = false;
    voiceCallback = null;
    console.log('🛑 Voice command listening stopped');
  }
};

/**
 * Check if voice command listening is active
 */
export const isVoiceListeningActive = () => {
  return isListening;
};

/**
 * Process voice command (placeholder)
 * This would be called by the speech recognition service
 */
export const processVoiceCommand = (command) => {
  if (!isListening) return;
  
  const normalizedCommand = command.toLowerCase().trim();
  console.log('🎤 Voice command received:', normalizedCommand);
  
  // Check if command matches SOS triggers
  const isSOSCommand = SOS_COMMANDS.some(sosCmd => 
    normalizedCommand.includes(sosCmd)
  );
  
  if (isSOSCommand) {
    console.log('🚨 SOS voice command detected!');
    if (voiceCallback) {
      voiceCallback(normalizedCommand);
    }
  }
};

/**
 * Speak text (for voice feedback)
 */
export const speak = async (text, language = 'en') => {
  try {
    await Speech.speak(text, {
      language,
      pitch: 1.0,
      rate: 1.0,
    });
  } catch (error) {
    console.error('Error speaking:', error);
  }
};

/**
 * Stop speaking
 */
export const stopSpeaking = async () => {
  try {
    await Speech.stop();
  } catch (error) {
    console.error('Error stopping speech:', error);
  }
};

/**
 * Get available voices
 */
export const getAvailableVoices = async () => {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices;
  } catch (error) {
    console.error('Error getting voices:', error);
    return [];
  }
};

export default {
  requestMicrophonePermission,
  startVoiceCommandListening,
  stopVoiceCommandListening,
  isVoiceListeningActive,
  processVoiceCommand,
  speak,
  stopSpeaking,
  getAvailableVoices,
};

