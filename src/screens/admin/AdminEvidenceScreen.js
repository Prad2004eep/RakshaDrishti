import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import { useAuth } from '../../hooks/useAuth';
import { getLinkedUsersEvidence, getUserEvidence } from '../../services/adminService';
import { Video } from 'expo-av';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

const AdminEvidenceScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const userId = route?.params?.userId; // If viewing specific user's evidence

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);
  
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadEvidence();
    
    return () => {
      // Cleanup audio on unmount
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [userId]);

  const loadEvidence = async () => {
    try {
      setLoading(true);
      let evidenceData;
      
      if (userId) {
        // Load evidence for specific user
        evidenceData = await getUserEvidence(userId);
      } else {
        // Load evidence for all linked users
        evidenceData = await getLinkedUsersEvidence(user.email);
      }
      
      setEvidence(evidenceData);
    } catch (error) {
      console.error('Error loading evidence:', error);
      Alert.alert('Error', 'Failed to load evidence');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAudio = async (audioUrl) => {
    try {
      // Stop any currently playing audio
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      }

      // Load and play new audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);

      // Set up playback status update
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const handleStopAudio = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const openEvidenceModal = (item) => {
    setSelectedEvidence(item);
    setModalVisible(true);
  };

  const closeEvidenceModal = async () => {
    // Stop audio if playing
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
    }
    
    setModalVisible(false);
    setSelectedEvidence(null);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderEvidenceItem = ({ item }) => (
    <TouchableOpacity
      style={styles.evidenceCard}
      onPress={() => openEvidenceModal(item)}
    >
      <View style={styles.evidenceHeader}>
        <Ionicons
          name={item.type === 'audio' ? 'mic' : 'videocam'}
          size={24}
          color={item.type === 'audio' ? '#FF6B6B' : '#4ECDC4'}
        />
        <View style={styles.evidenceInfo}>
          <Text style={styles.evidenceType}>
            {item.type === 'audio' ? 'Audio Recording' : 'Video Recording'}
          </Text>
          {item.userName && (
            <Text style={styles.userName}>{item.userName}</Text>
          )}
        </View>
      </View>

      <View style={styles.evidenceDetails}>
        <Text style={styles.detailText}>
          📅 {formatDate(item.createdAt || item.recordedAt)}
        </Text>
        {item.duration && (
          <Text style={styles.detailText}>
            ⏱️ {formatDuration(item.duration)}
          </Text>
        )}
        {item.sosId && (
          <Text style={styles.detailText}>
            🚨 SOS: {item.sosId.substring(0, 8)}...
          </Text>
        )}
      </View>

      <View style={styles.playButton}>
        <Ionicons name="play-circle" size={32} color="#007AFF" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading evidence...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Modern Header */}
      <View style={styles.modernHeader}>
        <View style={styles.headerTop}>
          <Text style={styles.modernHeaderTitle}>Evidence Records</Text>
          <TouchableOpacity onPress={loadEvidence}>
            <Ionicons name="refresh" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>
          {evidence.length} {evidence.length === 1 ? 'record' : 'records'} found
        </Text>
      </View>

      {evidence.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No evidence records found</Text>
        </View>
      ) : (
        <FlatList
          data={evidence}
          renderItem={renderEvidenceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={loadEvidence}
        />
      )}

      {/* Evidence Player Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeEvidenceModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeEvidenceModal}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedEvidence?.type === 'audio' ? 'Audio Player' : 'Video Player'}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          {selectedEvidence && (
            <View style={styles.playerContainer}>
              {selectedEvidence.type === 'video' ? (
                <Video
                  source={{ uri: selectedEvidence.url }}
                  style={styles.videoPlayer}
                  useNativeControls
                  resizeMode="contain"
                  shouldPlay
                />
              ) : (
                <View style={styles.audioPlayerContainer}>
                  <Ionicons name="musical-notes" size={100} color="#007AFF" />
                  <Text style={styles.audioTitle}>Audio Recording</Text>

                  <View style={styles.audioControls}>
                    {!isPlaying ? (
                      <TouchableOpacity
                        style={styles.audioButton}
                        onPress={() => handlePlayAudio(selectedEvidence.url)}
                      >
                        <Ionicons name="play-circle" size={80} color="#007AFF" />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.audioButton}
                        onPress={handleStopAudio}
                      >
                        <Ionicons name="stop-circle" size={80} color="#FF6B6B" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.evidenceMetadata}>
                <Text style={styles.metadataTitle}>Evidence Details</Text>
                {selectedEvidence.userName && (
                  <Text style={styles.metadataText}>
                    👤 User: {selectedEvidence.userName}
                  </Text>
                )}
                <Text style={styles.metadataText}>
                  📅 Recorded: {formatDate(selectedEvidence.createdAt || selectedEvidence.recordedAt)}
                </Text>
                {selectedEvidence.duration && (
                  <Text style={styles.metadataText}>
                    ⏱️ Duration: {formatDuration(selectedEvidence.duration)}
                  </Text>
                )}
                {selectedEvidence.sosId && (
                  <Text style={styles.metadataText}>
                    🚨 SOS ID: {selectedEvidence.sosId}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  modernHeader: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modernHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  listContainer: {
    padding: 15,
  },
  evidenceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  evidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  evidenceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  evidenceType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  userName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  evidenceDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
  },
  playButton: {
    position: 'absolute',
    right: 15,
    top: '50%',
    marginTop: -16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  playerContainer: {
    flex: 1,
  },
  videoPlayer: {
    width: width,
    height: height * 0.4,
    backgroundColor: '#000',
  },
  audioPlayerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  audioTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 20,
  },
  audioControls: {
    marginTop: 40,
  },
  audioButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  evidenceMetadata: {
    padding: 20,
    backgroundColor: '#F9F9F9',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  metadataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
  },
  metadataText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});

export default AdminEvidenceScreen;

