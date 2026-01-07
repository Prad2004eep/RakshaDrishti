import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import { Ionicons } from '@expo/vector-icons';
import { Audio, Video } from 'expo-av';
import { Camera } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../hooks/useAuth';
import VideoRecorder from '../../components/VideoRecorder';
import {
  startAudioRecording,
  stopAudioRecording,
  uploadToStorage,
  saveEvidenceMetadata,
  getUserEvidence,
  deleteEvidence,
} from '../../services/evidenceCaptureService';

const EvidenceRecordingScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState(null); // 'audio' or 'video'
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRecording, setCurrentRecording] = useState(null);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);

  // Playback states
  const [playingEvidence, setPlayingEvidence] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const soundRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadEvidence();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const checkAuthentication = async () => {
    try {
      const appLockPin = await AsyncStorage.getItem('appLockPin');
      if (!appLockPin) {
        // No password set, allow access
        setIsAuthenticated(true);
      } else {
        // Password required
        setShowPasswordModal(true);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(true);
    }
  };

  const handlePasswordSubmit = async () => {
    try {
      const appLockPin = await AsyncStorage.getItem('appLockPin');
      if (password === appLockPin) {
        setIsAuthenticated(true);
        setShowPasswordModal(false);
        setPassword('');
      } else {
        Alert.alert(t('error') || 'Error', t('incorrect_password') || 'Incorrect password');
      }
    } catch (error) {
      Alert.alert(t('error') || 'Error', t('authentication_failed') || 'Authentication failed');
    }
  };

  const loadEvidence = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const evidence = await getUserEvidence(user.uid);
      setEvidenceList(evidence);
    } catch (error) {
      console.error('Error loading evidence:', error);
      Alert.alert(t('error') || 'Error', t('failed_load_evidence') || 'Failed to load evidence');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async (type) => {
    try {
      if (type === 'audio') {
        const recording = await startAudioRecording();
        setCurrentRecording(recording);
        setRecordingType('audio');
        setIsRecording(true);
      } else if (type === 'video') {
        // Open video recorder modal
        console.log('🎥 Opening video recorder...');
        setShowVideoRecorder(true);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert(t('error') || 'Error', t('failed_start_recording') || 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);

      if (recordingType === 'audio') {
        let uri;
        try {
          uri = await stopAudioRecording();
          console.log('✅ Audio recording stopped, URI:', uri);
        } catch (stopError) {
          console.error('Error stopping audio recording:', stopError);
          throw new Error('Failed to stop recording');
        }

        // Upload to Firebase
        setLoading(true);
        try {
          const uploadResult = await uploadToStorage(uri, user.uid, 'audio');
          console.log('✅ Upload successful:', uploadResult);

          // Save metadata
          await saveEvidenceMetadata(user.uid, {
            type: 'audio',
            url: uploadResult.url,
            storagePath: uploadResult.path,
            fileName: uploadResult.fileName,
            duration: recordingDuration,
          });

          Alert.alert(
            t('success') || 'Success',
            t('evidence_saved') || 'Evidence saved successfully'
          );

          // Reload evidence list
          await loadEvidence();
        } catch (uploadError) {
          console.error('Error uploading to Firebase:', uploadError);
          // Save locally even if upload fails
          Alert.alert(
            t('warning') || 'Warning',
            t('upload_failed_saved_locally') || 'Upload failed but recording saved locally. Will retry when online.'
          );
        }
      }

      setCurrentRecording(null);
      setRecordingType(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert(
        t('error') || 'Error',
        error.message || t('failed_save_recording') || 'Failed to save recording'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvidence = (evidence) => {
    setSelectedEvidence(evidence);
    setShowPasswordModal(true);
  };

  const confirmDelete = async () => {
    try {
      const appLockPin = await AsyncStorage.getItem('appLockPin');
      if (password !== appLockPin) {
        Alert.alert(t('error') || 'Error', t('incorrect_password') || 'Incorrect password');
        return;
      }

      setLoading(true);
      await deleteEvidence(user.uid, selectedEvidence.id, selectedEvidence.storagePath);
      
      Alert.alert(t('success') || 'Success', t('evidence_deleted') || 'Evidence deleted successfully');
      
      setShowPasswordModal(false);
      setPassword('');
      setSelectedEvidence(null);
      await loadEvidence();
    } catch (error) {
      console.error('Error deleting evidence:', error);
      Alert.alert(t('error') || 'Error', t('failed_delete_evidence') || 'Failed to delete evidence');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleVideoRecordingComplete = async (videoUri) => {
    try {
      console.log('🎥 Video recording completed:', videoUri);
      setShowVideoRecorder(false);
      setLoading(true);

      // Upload to Firebase
      const uploadResult = await uploadToStorage(videoUri, user.uid, 'video');
      console.log('✅ Video upload successful:', uploadResult);

      // Save metadata
      await saveEvidenceMetadata(user.uid, {
        type: 'video',
        url: uploadResult.url,
        storagePath: uploadResult.path,
        fileName: uploadResult.fileName,
        duration: 25, // Default duration from VideoRecorder
      });

      Alert.alert(
        t('success') || 'Success',
        t('video_evidence_saved') || 'Video evidence saved successfully'
      );

      // Reload evidence list
      await loadEvidence();
    } catch (error) {
      console.error('Error saving video evidence:', error);
      Alert.alert(
        t('error') || 'Error',
        t('failed_save_video') || 'Failed to save video evidence'
      );
    } finally {
      setLoading(false);
    }
  };

  // Playback control functions
  const playEvidence = async (evidence) => {
    try {
      // Stop any currently playing media
      await stopPlayback();

      setPlayingEvidence(evidence);

      if (evidence.type === 'audio') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: evidence.url },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );

        soundRef.current = sound;
        setIsPlaying(true);
      } else if (evidence.type === 'video') {
        // Video playback will be handled by Video component
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing evidence:', error);
      Alert.alert(t('error') || 'Error', t('failed_play_evidence') || 'Failed to play evidence');
    }
  };

  const pausePlayback = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else if (videoRef.current) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error pausing playback:', error);
    }
  };

  const resumePlayback = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      } else if (videoRef.current) {
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error resuming playback:', error);
    }
  };

  const stopPlayback = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      if (videoRef.current) {
        await videoRef.current.stopAsync();
      }
      setIsPlaying(false);
      setPlayingEvidence(null);
      setPlaybackPosition(0);
      setPlaybackDuration(0);
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  };

  const seekPlayback = async (position) => {
    try {
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(position);
      } else if (videoRef.current) {
        await videoRef.current.setPositionAsync(position);
      }
    } catch (error) {
      console.error('Error seeking playback:', error);
    }
  };

  const skipForward = async () => {
    const newPosition = Math.min(playbackPosition + 10000, playbackDuration); // Skip 10 seconds
    await seekPlayback(newPosition);
  };

  const skipBackward = async () => {
    const newPosition = Math.max(playbackPosition - 10000, 0); // Go back 10 seconds
    await seekPlayback(newPosition);
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis);
      setPlaybackDuration(status.durationMillis);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        stopPlayback();
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  if (!isAuthenticated && showPasswordModal) {
    return (
      <View style={styles.container}>
        <View style={styles.passwordContainer}>
          <Ionicons name="lock-closed" size={64} color={colors.primary} />
          <Text style={styles.passwordTitle}>{t('enter_password') || 'Enter Password'}</Text>
          <Text style={styles.passwordSubtitle}>
            {t('password_required_evidence') || 'Password required to access evidence'}
          </Text>
          <TextInput
            style={styles.passwordInput}
            placeholder={t('enter_pin') || 'Enter PIN'}
            placeholderTextColor={colors.gray400}
            value={password}
            onChangeText={setPassword}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
          />
          <TouchableOpacity style={styles.submitButton} onPress={handlePasswordSubmit}>
            <Text style={styles.submitButtonText}>{t('submit') || 'Submit'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>{t('go_back') || 'Go Back'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('evidence_recording') || 'Evidence Recording'}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Recording Controls */}
        <View style={styles.recordingSection}>
          <Text style={styles.sectionTitle}>{t('record_evidence') || 'Record Evidence'}</Text>
          
          {isRecording ? (
            <View style={styles.recordingActive}>
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>
                  {recordingType === 'audio' ? '🎤 Recording Audio...' : '🎥 Recording Video...'}
                </Text>
              </View>
              <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>
              <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
                <Ionicons name="stop" size={32} color={colors.white} />
                <Text style={styles.stopButtonText}>{t('stop_recording') || 'Stop Recording'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.recordingButtons}>
              <TouchableOpacity
                style={styles.recordButton}
                onPress={() => startRecording('audio')}
              >
                <Ionicons name="mic" size={32} color={colors.white} />
                <Text style={styles.recordButtonText}>{t('record_audio') || 'Record Audio'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.recordButton}
                onPress={() => startRecording('video')}
              >
                <Ionicons name="videocam" size={32} color={colors.white} />
                <Text style={styles.recordButtonText}>{t('record_video') || 'Record Video'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Evidence List */}
        <View style={styles.evidenceSection}>
          <Text style={styles.sectionTitle}>{t('recorded_evidence') || 'Recorded Evidence'}</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : evidenceList.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={64} color={colors.gray400} />
              <Text style={styles.emptyText}>{t('no_evidence') || 'No evidence recorded yet'}</Text>
            </View>
          ) : (
            <FlatList
              data={evidenceList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.evidenceCard}>
                  <View style={styles.evidenceHeader}>
                    <View style={styles.evidenceIcon}>
                      <Ionicons
                        name={item.type === 'audio' ? 'musical-notes' : 'videocam'}
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.evidenceInfo}>
                      <Text style={styles.evidenceName}>{item.fileName}</Text>
                      <Text style={styles.evidenceDate}>{formatDate(item.createdAt)}</Text>
                      <Text style={styles.evidenceDuration}>
                        {t('duration') || 'Duration'}: {formatDuration(item.duration || 0)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteEvidence(item)}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </TouchableOpacity>
                  </View>

                  {/* Playback Controls */}
                  {playingEvidence?.id === item.id ? (
                    <View style={styles.playbackControls}>
                      {/* Video Player for video evidence */}
                      {item.type === 'video' && (
                        <Video
                          ref={videoRef}
                          source={{ uri: item.url }}
                          style={styles.videoPlayer}
                          useNativeControls={false}
                          resizeMode="contain"
                          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                        />
                      )}

                      {/* Progress Bar */}
                      <View style={styles.progressContainer}>
                        <Text style={styles.timeText}>
                          {formatDuration(Math.floor(playbackPosition / 1000))}
                        </Text>
                        <Slider
                          style={styles.progressSlider}
                          minimumValue={0}
                          maximumValue={playbackDuration}
                          value={playbackPosition}
                          onSlidingComplete={seekPlayback}
                          minimumTrackTintColor={colors.primary}
                          maximumTrackTintColor={colors.gray300}
                          thumbTintColor={colors.primary}
                        />
                        <Text style={styles.timeText}>
                          {formatDuration(Math.floor(playbackDuration / 1000))}
                        </Text>
                      </View>

                      {/* Control Buttons */}
                      <View style={styles.controlButtons}>
                        <TouchableOpacity
                          style={styles.controlButton}
                          onPress={skipBackward}
                        >
                          <Ionicons name="play-back" size={28} color={colors.primary} />
                          <Text style={styles.controlButtonLabel}>-10s</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.controlButton, styles.playPauseButton]}
                          onPress={isPlaying ? pausePlayback : resumePlayback}
                        >
                          <Ionicons
                            name={isPlaying ? 'pause' : 'play'}
                            size={36}
                            color={colors.white}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.controlButton}
                          onPress={skipForward}
                        >
                          <Ionicons name="play-forward" size={28} color={colors.primary} />
                          <Text style={styles.controlButtonLabel}>+10s</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.controlButton}
                          onPress={stopPlayback}
                        >
                          <Ionicons name="stop" size={28} color={colors.danger} />
                          <Text style={styles.controlButtonLabel}>Stop</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.playButton}
                      onPress={() => playEvidence(item)}
                    >
                      <Ionicons name="play-circle" size={24} color={colors.primary} />
                      <Text style={styles.playButtonText}>
                        {t('play') || 'Play'} {item.type === 'audio' ? 'Audio' : 'Video'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showPasswordModal && selectedEvidence !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowPasswordModal(false);
          setSelectedEvidence(null);
          setPassword('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('delete_evidence') || 'Delete Evidence'}</Text>
            <Text style={styles.modalText}>
              {t('enter_password_to_delete') || 'Enter your app lock password to delete this evidence'}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t('enter_pin') || 'Enter PIN'}
              placeholderTextColor={colors.gray400}
              value={password}
              onChangeText={setPassword}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowPasswordModal(false);
                  setSelectedEvidence(null);
                  setPassword('');
                }}
              >
                <Text style={styles.modalCancelText}>{t('cancel') || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDeleteButton}
                onPress={confirmDelete}
              >
                <Text style={styles.modalDeleteText}>{t('delete') || 'Delete'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Video Recorder Modal */}
      <VideoRecorder
        visible={showVideoRecorder}
        onClose={() => setShowVideoRecorder(false)}
        onRecordingComplete={handleVideoRecordingComplete}
        duration={25}
      />
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
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  recordingSection: {
    padding: 20,
    backgroundColor: colors.gray50,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 16,
  },
  recordingButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  recordButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  recordButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  recordingActive: {
    alignItems: 'center',
    padding: 20,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.danger,
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
  },
  durationText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
  },
  stopButton: {
    backgroundColor: colors.danger,
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stopButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  evidenceSection: {
    padding: 20,
  },
  loader: {
    marginTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray600,
    marginTop: 12,
  },
  evidenceCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  evidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  evidenceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  evidenceInfo: {
    flex: 1,
  },
  evidenceName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 4,
  },
  evidenceDate: {
    fontSize: 12,
    color: colors.gray600,
    marginBottom: 2,
  },
  evidenceDuration: {
    fontSize: 12,
    color: colors.gray600,
  },
  deleteButton: {
    padding: 8,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  playButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  playbackControls: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  videoPlayer: {
    width: '100%',
    height: 200,
    backgroundColor: colors.black,
    borderRadius: 8,
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  progressSlider: {
    flex: 1,
    height: 40,
  },
  timeText: {
    fontSize: 12,
    color: colors.gray600,
    fontWeight: '600',
    minWidth: 45,
    textAlign: 'center',
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  playPauseButton: {
    backgroundColor: colors.primary,
    borderRadius: 32,
    width: 64,
    height: 64,
  },
  controlButtonLabel: {
    fontSize: 10,
    color: colors.gray600,
    marginTop: 4,
    fontWeight: '600',
  },
  passwordContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  passwordTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray800,
    marginTop: 20,
    marginBottom: 8,
  },
  passwordSubtitle: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 32,
    textAlign: 'center',
  },
  passwordInput: {
    width: '100%',
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  submitButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 12,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray800,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.gray700,
    fontSize: 16,
    fontWeight: '600',
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: colors.danger,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalDeleteText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EvidenceRecordingScreen;

