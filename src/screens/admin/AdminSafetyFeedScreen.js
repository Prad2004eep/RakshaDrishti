import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import { useAuth } from '../../hooks/useAuth';
import {
  postSafetyFeed,
  subscribeSafetyFeeds,
  upvoteSafetyFeed,
  downvoteSafetyFeed,
  removeVoteFromSafetyFeed,
} from '../../services/safetyFeedService';
import { getCurrentLocation } from '../../services/locationService';

const AdminSafetyFeedScreen = ({ navigation }) => {
  const { adminProfile } = useAuth();
  const [feedPosts, setFeedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [newPostMessage, setNewPostMessage] = useState('');
  const [newPostLocation, setNewPostLocation] = useState('');
  const [newPostSeverity, setNewPostSeverity] = useState('medium');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = subscribeSafetyFeeds((feeds) => {
      setFeedPosts(feeds);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePostAlert = async () => {
    if (!newPostMessage.trim() || !newPostLocation.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setPosting(true);

      // Get current location
      let locationData = { latitude: 0, longitude: 0 };
      try {
        locationData = await getCurrentLocation();
      } catch (error) {
        console.log('Could not get location:', error);
      }

      await postSafetyFeed({
        authorId: adminProfile.email,
        authorName: adminProfile.name || 'Admin',
        authorType: 'admin',
        location: newPostLocation,
        message: newPostMessage,
        severity: newPostSeverity,
        coordinates: locationData,
      });

      setNewPostMessage('');
      setNewPostLocation('');
      setNewPostSeverity('medium');
      setPostModalVisible(false);
      Alert.alert('Success', 'Safety alert posted successfully!');
    } catch (error) {
      console.error('Error posting alert:', error);
      Alert.alert('Error', 'Failed to post alert');
    } finally {
      setPosting(false);
    }
  };

  const handleVote = async (post, voteType) => {
    try {
      const userId = adminProfile.email;
      const upvotedBy = post.upvotedBy || [];
      const downvotedBy = post.downvotedBy || [];
      const hasUpvoted = upvotedBy.includes(userId);
      const hasDownvoted = downvotedBy.includes(userId);

      if (voteType === 'up') {
        if (hasUpvoted) {
          // Remove upvote
          await removeVoteFromSafetyFeed(post.id, userId, 'up');
        } else {
          // Add upvote (and remove downvote if exists)
          await upvoteSafetyFeed(post.id, userId);
        }
      } else if (voteType === 'down') {
        if (hasDownvoted) {
          // Remove downvote
          await removeVoteFromSafetyFeed(post.id, userId, 'down');
        } else {
          // Add downvote (and remove upvote if exists)
          await downvoteSafetyFeed(post.id, userId);
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert('Error', 'Failed to vote');
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getUserVote = (post) => {
    const userId = adminProfile.email;
    const upvotedBy = post.upvotedBy || [];
    const downvotedBy = post.downvotedBy || [];
    if (upvotedBy.includes(userId)) return 'up';
    if (downvotedBy.includes(userId)) return 'down';
    return null;
  };

  const renderFeedPost = ({ item }) => {
    const userVote = getUserVote(item);
    const isAdminPost = item.authorType === 'admin';

    return (
      <TouchableOpacity
        style={[styles.postCard, isAdminPost && styles.adminPostCard]}
        onPress={() => setSelectedPost(item)}
        activeOpacity={0.7}
      >
        <View style={styles.postHeader}>
          <View style={styles.authorContainer}>
            <View style={[styles.authorBadge, isAdminPost && styles.adminBadge]}>
              <Ionicons
                name={isAdminPost ? 'shield-checkmark' : 'person'}
                size={16}
                color={colors.white}
              />
            </View>
            <View>
              <Text style={styles.postAuthor}>{item.authorName}</Text>
              {isAdminPost && <Text style={styles.adminLabel}>Admin</Text>}
            </View>
          </View>
          <View
            style={[
              styles.severityBadge,
              item.severity === 'high' && styles.severityHigh,
              item.severity === 'low' && styles.severityLow,
            ]}
          >
            <Text style={styles.severityText}>{item.severity?.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.postLocation}>📍 {item.location}</Text>
        <Text style={styles.postMessage} numberOfLines={3}>
          {item.message}
        </Text>

        <View style={styles.postFooter}>
          <Text style={styles.postTime}>{formatTimestamp(item.createdAt)}</Text>
          <View style={styles.postActions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                userVote === 'up' && styles.actionButtonActive,
              ]}
              onPress={() => handleVote(item, 'up')}
            >
              <Ionicons
                name={userVote === 'up' ? 'thumbs-up' : 'thumbs-up-outline'}
                size={16}
                color={userVote === 'up' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.actionText,
                  userVote === 'up' && styles.actionTextActive,
                ]}
              >
                {item.upvotes || 0}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                userVote === 'down' && styles.actionButtonActive,
              ]}
              onPress={() => handleVote(item, 'down')}
            >
              <Ionicons
                name={userVote === 'down' ? 'thumbs-down' : 'thumbs-down-outline'}
                size={16}
                color={userVote === 'down' ? colors.danger : colors.textSecondary}
              />
              <Text
                style={[
                  styles.actionText,
                  userVote === 'down' && styles.actionTextActive,
                ]}
              >
                {item.downvotes || 0}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading safety feeds...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Feed</Text>
        <View style={styles.headerRight} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Post Button */}
        <TouchableOpacity
          style={styles.postButton}
          onPress={() => setPostModalVisible(true)}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.postButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="add-circle" size={24} color={colors.white} />
            <Text style={styles.postButtonText}>Post Safety Alert</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Feed List */}
        <View style={styles.feedContainer}>
          {feedPosts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="newspaper-outline" size={64} color={colors.gray400} />
              <Text style={styles.emptyText}>No safety feeds yet</Text>
              <Text style={styles.emptySubtext}>Be the first to post a safety alert!</Text>
            </View>
          ) : (
            <FlatList
              data={feedPosts}
              renderItem={renderFeedPost}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Post Modal */}
      <Modal
        visible={postModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPostModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Post Safety Alert</Text>
              <TouchableOpacity onPress={() => setPostModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Downtown Area, Main Street"
                value={newPostLocation}
                onChangeText={setNewPostLocation}
                placeholderTextColor={colors.gray400}
              />

              <Text style={styles.inputLabel}>Message *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the safety concern or information..."
                value={newPostMessage}
                onChangeText={setNewPostMessage}
                multiline
                numberOfLines={4}
                placeholderTextColor={colors.gray400}
              />

              <Text style={styles.inputLabel}>Severity Level</Text>
              <View style={styles.severitySelector}>
                {['low', 'medium', 'high'].map((severity) => (
                  <TouchableOpacity
                    key={severity}
                    style={[
                      styles.severityOption,
                      newPostSeverity === severity && styles.severityOptionActive,
                      severity === 'high' && newPostSeverity === severity && styles.severityHighActive,
                      severity === 'low' && newPostSeverity === severity && styles.severityLowActive,
                    ]}
                    onPress={() => setNewPostSeverity(severity)}
                  >
                    <Text
                      style={[
                        styles.severityOptionText,
                        newPostSeverity === severity && styles.severityOptionTextActive,
                      ]}
                    >
                      {severity.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handlePostAlert}
              disabled={posting}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.submitButtonGradient}
              >
                {posting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Post Alert</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal
        visible={selectedPost !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedPost(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPost && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.authorContainer}>
                    <View
                      style={[
                        styles.authorBadge,
                        selectedPost.authorType === 'admin' && styles.adminBadge,
                      ]}
                    >
                      <Ionicons
                        name={selectedPost.authorType === 'admin' ? 'shield-checkmark' : 'person'}
                        size={20}
                        color={colors.white}
                      />
                    </View>
                    <View>
                      <Text style={styles.modalAuthor}>{selectedPost.authorName}</Text>
                      {selectedPost.authorType === 'admin' && (
                        <Text style={styles.adminLabel}>Admin</Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedPost(null)}>
                    <Ionicons name="close" size={28} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.severityBadge,
                    styles.severityBadgeLarge,
                    selectedPost.severity === 'high' && styles.severityHigh,
                    selectedPost.severity === 'low' && styles.severityLow,
                  ]}
                >
                  <Text style={styles.severityText}>
                    {selectedPost.severity?.toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.modalLocation}>📍 {selectedPost.location}</Text>
                <Text style={styles.modalMessage}>{selectedPost.message}</Text>
                <Text style={styles.modalTime}>{formatTimestamp(selectedPost.createdAt)}</Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[
                      styles.modalActionButton,
                      getUserVote(selectedPost) === 'up' && styles.modalActionButtonActive,
                    ]}
                    onPress={() => {
                      handleVote(selectedPost, 'up');
                      setSelectedPost(null);
                    }}
                  >
                    <Ionicons
                      name="thumbs-up"
                      size={24}
                      color={
                        getUserVote(selectedPost) === 'up' ? colors.primary : colors.textSecondary
                      }
                    />
                    <Text style={styles.modalActionText}>{selectedPost.upvotes || 0} Upvotes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalActionButton,
                      getUserVote(selectedPost) === 'down' && styles.modalActionButtonActive,
                    ]}
                    onPress={() => {
                      handleVote(selectedPost, 'down');
                      setSelectedPost(null);
                    }}
                  >
                    <Ionicons
                      name="thumbs-down"
                      size={24}
                      color={
                        getUserVote(selectedPost) === 'down' ? colors.danger : colors.textSecondary
                      }
                    />
                    <Text style={styles.modalActionText}>{selectedPost.downvotes || 0} Downvotes</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  postButton: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  postButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    marginLeft: 8,
  },
  feedContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  postCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  adminPostCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  adminBadge: {
    backgroundColor: '#667eea',
  },
  postAuthor: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  adminLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#667eea',
    marginTop: 2,
  },
  postLocation: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  postMessage: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  postTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  postActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    gap: 4,
  },
  actionButtonActive: {
    backgroundColor: colors.primaryLight,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  actionTextActive: {
    color: colors.primary,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.warning,
  },
  severityBadgeLarge: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  severityHigh: {
    backgroundColor: colors.danger,
  },
  severityLow: {
    backgroundColor: colors.success,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
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
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalAuthor: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalLocation: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  modalTime: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    gap: 8,
  },
  modalActionButtonActive: {
    backgroundColor: colors.primaryLight,
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.white,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  severitySelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  severityOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray300,
    alignItems: 'center',
  },
  severityOptionActive: {
    borderColor: colors.warning,
    backgroundColor: colors.warning,
  },
  severityHighActive: {
    borderColor: colors.danger,
    backgroundColor: colors.danger,
  },
  severityLowActive: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  severityOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  severityOptionTextActive: {
    color: colors.white,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});

export default AdminSafetyFeedScreen;

