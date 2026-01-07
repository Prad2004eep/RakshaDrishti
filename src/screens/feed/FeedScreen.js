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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
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

const FeedScreen = () => {
  const { t } = useTranslation();
  const { userProfile } = useAuth();

  const [feedPosts, setFeedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [newPostMessage, setNewPostMessage] = useState('');
  const [newPostLocation, setNewPostLocation] = useState('');
  const [newPostSeverity, setNewPostSeverity] = useState('medium');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = subscribeSafetyFeeds((feeds) => {
      setFeedPosts(feeds);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleVote = async (post, voteType) => {
    try {
      const userId = userProfile?.userId || userProfile?.email || 'anonymous';
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
      Alert.alert(t('error'), 'Failed to vote');
    }
  };

  const handleReport = (postId) => {
    Alert.alert(
      t('confirm'),
      t('are_you_sure'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('report'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(t('success'), t('post_reported'));
          },
        },
      ]
    );
  };

  const handlePostAlert = async () => {
    if (!newPostMessage.trim() || !newPostLocation.trim()) {
      Alert.alert(t('error'), t('please_fill_required_fields'));
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
        authorId: userProfile?.userId || userProfile?.email || 'anonymous',
        authorName: userProfile?.name || t('you'),
        authorType: 'user',
        location: newPostLocation,
        message: newPostMessage,
        severity: newPostSeverity,
        coordinates: locationData,
      });

      setNewPostMessage('');
      setNewPostLocation('');
      setNewPostSeverity('medium');
      setPostModalVisible(false);
      Alert.alert(t('success'), t('alert_posted'));
    } catch (error) {
      console.error('Error posting alert:', error);
      Alert.alert(t('error'), 'Failed to post alert');
    } finally {
      setPosting(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return t('just_now');

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('just_now');
    if (diffMins < 60) return `${diffMins} ${t('minutes_ago')}`;
    if (diffHours < 24) return `${diffHours} ${t('hours_ago')}`;
    return `${diffDays} ${t('days_ago')}`;
  };

  const getUserVote = (post) => {
    const userId = userProfile?.userId || userProfile?.email || 'anonymous';
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
            <Text style={styles.severityText}>
              {item.severity?.toUpperCase()}
            </Text>
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
        <Text style={styles.loadingText}>{t('loading')}...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('community_feed')}</Text>
      </View>

      <ScrollView style={styles.content}>

      <TouchableOpacity
        style={styles.postButton}
        onPress={() => setPostModalVisible(true)}
      >
        <Text style={styles.postButtonText}>+ {t('post_alert')}</Text>
      </TouchableOpacity>

      <View style={styles.feedContainer}>
        {feedPosts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={64} color={colors.gray400} />
            <Text style={styles.emptyText}>{t('no_posts_yet')}</Text>
            <Text style={styles.emptySubtext}>{t('be_first_to_post')}</Text>
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

      {/* Post Detail Modal */}
      <Modal
        visible={selectedPost !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPost(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedPost(null)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {selectedPost && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalAuthor}>{selectedPost.author}</Text>
                    <Text style={styles.modalLocation}>
                      📍 {selectedPost.location}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.severityBadge,
                      selectedPost.severity === 'high' && styles.severityHigh,
                      selectedPost.severity === 'low' && styles.severityLow,
                    ]}
                  >
                    <Text style={styles.severityText}>
                      {t(selectedPost.severity).toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalMessage}>{selectedPost.message}</Text>

                <Text style={styles.modalTime}>{selectedPost.timestamp}</Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[
                      styles.modalActionButton,
                      selectedPost.userVote === 'up' && styles.actionButtonActive,
                    ]}
                    onPress={() => handleVote(selectedPost.id, 'up')}
                  >
                    <Text
                      style={[
                        styles.modalActionText,
                        selectedPost.userVote === 'up' && styles.actionTextActive,
                      ]}
                    >
                      👍 {selectedPost.upvotes}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalActionButton,
                      selectedPost.userVote === 'down' && styles.actionButtonActive,
                    ]}
                    onPress={() => handleVote(selectedPost.id, 'down')}
                  >
                    <Text
                      style={[
                        styles.modalActionText,
                        selectedPost.userVote === 'down' && styles.actionTextActive,
                      ]}
                    >
                      👎 {selectedPost.downvotes}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalActionButton}
                    onPress={() => {
                      handleReport(selectedPost.id);
                      setSelectedPost(null);
                    }}
                  >
                    <Text style={styles.modalActionText}>🚩 {t('report')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Create Post Modal */}
      <Modal
        visible={postModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPostModalVisible(false)}
      >
        <View style={styles.createModalContainer}>
          <View style={styles.createModalContent}>
            <View style={styles.createModalHeader}>
              <Text style={styles.createModalTitle}>{t('post_alert')}</Text>
              <TouchableOpacity onPress={() => setPostModalVisible(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('location')} *</Text>
              <TextInput
                style={styles.input}
                placeholder={t('enter_location')}
                value={newPostLocation}
                onChangeText={setNewPostLocation}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('message')} *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('describe_situation')}
                value={newPostMessage}
                onChangeText={setNewPostMessage}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('severity')}</Text>
              <View style={styles.severitySelector}>
                <TouchableOpacity
                  style={[
                    styles.severityOption,
                    styles.severityLow,
                    newPostSeverity === 'low' && styles.severitySelected,
                  ]}
                  onPress={() => setNewPostSeverity('low')}
                >
                  <Text style={styles.severityOptionText}>{t('low')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.severityOption,
                    styles.severityMedium,
                    newPostSeverity === 'medium' && styles.severitySelected,
                  ]}
                  onPress={() => setNewPostSeverity('medium')}
                >
                  <Text style={styles.severityOptionText}>{t('medium')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.severityOption,
                    styles.severityHigh,
                    newPostSeverity === 'high' && styles.severitySelected,
                  ]}
                  onPress={() => setNewPostSeverity('high')}
                >
                  <Text style={styles.severityOptionText}>{t('high')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handlePostAlert}
              disabled={posting}
            >
              {posting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>{t('post_alert')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </ScrollView>
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
    paddingTop: 40,
  },
  content: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  postButton: {
    margin: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  postButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  feedContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
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
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  adminPostCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
    backgroundColor: '#F8F9FF',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
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
    fontWeight: '600',
    color: colors.gray800,
  },
  adminLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#667eea',
    marginTop: 2,
  },
  postLocation: {
    fontSize: 12,
    color: colors.gray600,
    marginTop: 4,
    marginBottom: 8,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.warning,
  },
  severityHigh: {
    backgroundColor: colors.danger,
  },
  severityLow: {
    backgroundColor: colors.success,
  },
  severityText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  postMessage: {
    fontSize: 14,
    color: colors.gray800,
    lineHeight: 20,
    marginBottom: 10,
  },
  postFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: 10,
  },
  postTime: {
    fontSize: 12,
    color: colors.gray600,
    marginBottom: 8,
  },
  postActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.gray100,
    borderRadius: 16,
    gap: 4,
  },
  actionButtonActive: {
    backgroundColor: colors.primaryLight,
  },
  actionText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  actionTextActive: {
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.gray700,
    fontWeight: 'bold',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    marginTop: 10,
  },
  modalAuthor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray800,
  },
  modalLocation: {
    fontSize: 14,
    color: colors.gray600,
    marginTop: 4,
  },
  modalMessage: {
    fontSize: 16,
    color: colors.gray800,
    lineHeight: 24,
    marginBottom: 15,
  },
  modalTime: {
    fontSize: 13,
    color: colors.gray600,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.gray300,
    alignItems: 'center',
  },
  modalActionText: {
    fontSize: 14,
    color: colors.gray700,
    fontWeight: '600',
  },
  createModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  createModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  createModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  createModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray800,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.gray800,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  severitySelector: {
    flexDirection: 'row',
    gap: 10,
  },
  severityOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  severityMedium: {
    backgroundColor: colors.warning,
  },
  severitySelected: {
    borderColor: colors.gray800,
  },
  severityOptionText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FeedScreen;

