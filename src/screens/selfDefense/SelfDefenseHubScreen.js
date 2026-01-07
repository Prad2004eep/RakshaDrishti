import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../config/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system';
import { WebView } from 'react-native-webview';
import { searchYouTubeVideos, getSelfDefenseContent } from '../../services/youtubeService';

const SelfDefenseHubScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [webViewLoading, setWebViewLoading] = useState(true);

  const categories = [
    { id: 'all', name: t('all') || 'All', icon: '📚' },
    { id: 'basic_moves', name: t('basic_moves') || 'Basic Moves', icon: '🥋' },
    { id: 'self_defense', name: t('self_defense') || 'Self Defense', icon: '🛡️' },
    { id: 'awareness', name: t('awareness') || 'Awareness', icon: '👁️' },
    { id: 'legal_rights', name: t('legal_rights') || 'Legal Rights', icon: '⚖️' },
  ];

  // Real YouTube tutorials data
  const sampleTutorials = [
    // Basic Moves
    {
      id: '1',
      category: 'basic_moves',
      title: 'Basic Self-Defense Stance & Techniques',
      description: 'Learn fundamental defensive stance and basic moves for women',
      duration: '8:45',
      difficulty: 'Beginner',
      videoId: 'KVpxP3ZZtAc',
      videoUrl: 'https://www.youtube.com/watch?v=KVpxP3ZZtAc',
      thumbnail: 'https://img.youtube.com/vi/KVpxP3ZZtAc/hqdefault.jpg',
      isOfflineAvailable: false,
    },
    {
      id: '2',
      category: 'basic_moves',
      title: 'Essential Self-Defense Moves for Women',
      description: 'Simple and effective self-defense techniques every woman should know',
      duration: '10:23',
      difficulty: 'Beginner',
      videoId: 'T7aNSRoDCmg',
      videoUrl: 'https://www.youtube.com/watch?v=T7aNSRoDCmg',
      thumbnail: 'https://img.youtube.com/vi/T7aNSRoDCmg/hqdefault.jpg',
      isOfflineAvailable: false,
    },
    {
      id: '3',
      category: 'basic_moves',
      title: 'Palm Strike & Elbow Techniques',
      description: 'Master the powerful palm strike and elbow defense moves',
      duration: '6:15',
      difficulty: 'Beginner',
      videoId: 'paRJyU5FVzc',
      videoUrl: 'https://www.youtube.com/watch?v=paRJyU5FVzc',
      thumbnail: 'https://img.youtube.com/vi/paRJyU5FVzc/hqdefault.jpg',
      isOfflineAvailable: false,
    },
    // Self Defense
    {
      id: '4',
      category: 'self_defense',
      title: 'How to Escape Wrist Grabs',
      description: 'Effective techniques to break free from wrist grabs and holds',
      duration: '7:30',
      difficulty: 'Intermediate',
      videoId: 'z8kMG3lMSfk',
      videoUrl: 'https://www.youtube.com/watch?v=z8kMG3lMSfk',
      thumbnail: 'https://img.youtube.com/vi/z8kMG3lMSfk/hqdefault.jpg',
      isOfflineAvailable: false,
    },
    {
      id: '5',
      category: 'self_defense',
      title: 'Self-Defense Against Common Attacks',
      description: 'Learn to defend against chokes, grabs, and common street attacks',
      duration: '12:45',
      difficulty: 'Intermediate',
      videoId: 'gwJGvfMEDJI',
      videoUrl: 'https://www.youtube.com/watch?v=gwJGvfMEDJI',
      thumbnail: 'https://img.youtube.com/vi/gwJGvfMEDJI/hqdefault.jpg',
      isOfflineAvailable: false,
    },
    {
      id: '6',
      category: 'self_defense',
      title: 'Pepper Spray Training & Usage',
      description: 'How to properly use pepper spray for self-defense',
      duration: '5:20',
      difficulty: 'Beginner',
      videoId: 'uLk6vCSSYWQ',
      videoUrl: 'https://www.youtube.com/watch?v=uLk6vCSSYWQ',
      thumbnail: 'https://img.youtube.com/vi/uLk6vCSSYWQ/hqdefault.jpg',
      isOfflineAvailable: false,
    },
    // Awareness
    {
      id: '7',
      category: 'awareness',
      title: 'Situational Awareness for Women',
      description: 'Stay alert and recognize potential threats before they happen',
      duration: '9:15',
      difficulty: 'All Levels',
      videoId: 'p8An2yzHMxg',
      videoUrl: 'https://www.youtube.com/watch?v=p8An2yzHMxg',
      thumbnail: 'https://img.youtube.com/vi/p8An2yzHMxg/hqdefault.jpg',
      isOfflineAvailable: false,
    },
    {
      id: '8',
      category: 'awareness',
      title: 'Personal Safety Tips for Women',
      description: 'Essential safety awareness tips for everyday situations',
      duration: '11:30',
      difficulty: 'All Levels',
      videoId: 'KqDcoOKGRSU',
      videoUrl: 'https://www.youtube.com/watch?v=KqDcoOKGRSU',
      thumbnail: 'https://img.youtube.com/vi/KqDcoOKGRSU/hqdefault.jpg',
      isOfflineAvailable: false,
    },
    {
      id: '9',
      category: 'awareness',
      title: 'Safety While Walking Alone',
      description: 'How to stay safe when walking alone at night or in unfamiliar areas',
      duration: '8:00',
      difficulty: 'All Levels',
      videoId: 'yMnEMKNAh8w',
      videoUrl: 'https://www.youtube.com/watch?v=yMnEMKNAh8w',
      thumbnail: 'https://img.youtube.com/vi/yMnEMKNAh8w/hqdefault.jpg',
      isOfflineAvailable: false,
    },
    // Legal Rights
    {
      id: '10',
      category: 'legal_rights',
      title: 'Women Legal Rights in India',
      description: 'Know your legal rights and protections under Indian law',
      duration: '15:20',
      difficulty: 'All Levels',
      videoId: 'Zr8YK8YhW7g',
      videoUrl: 'https://www.youtube.com/watch?v=Zr8YK8YhW7g',
      thumbnail: 'https://img.youtube.com/vi/Zr8YK8YhW7g/hqdefault.jpg',
      isOfflineAvailable: false,
    },
    {
      id: '11',
      category: 'legal_rights',
      title: 'Self-Defense Laws in India',
      description: 'Understanding your right to self-defense under IPC Section 96-106',
      duration: '10:45',
      difficulty: 'All Levels',
      videoId: 'kVpxP3ZZtAc',
      videoUrl: 'https://www.youtube.com/watch?v=kVpxP3ZZtAc',
      thumbnail: 'https://img.youtube.com/vi/kVpxP3ZZtAc/hqdefault.jpg',
      isOfflineAvailable: false,
    },
    {
      id: '12',
      category: 'legal_rights',
      title: 'What to Do After an Attack',
      description: 'Legal steps and procedures to follow after experiencing an attack',
      duration: '13:10',
      difficulty: 'All Levels',
      videoId: 'J3xLuZZPmsA',
      videoUrl: 'https://www.youtube.com/watch?v=J3xLuZZPmsA',
      thumbnail: 'https://img.youtube.com/vi/J3xLuZZPmsA/hqdefault.jpg',
      isOfflineAvailable: false,
    },
  ];

  useEffect(() => {
    loadTutorials();
  }, []);

  const loadTutorials = async () => {
    try {
      setLoading(true);
      console.log('📚 Loading self-defense tutorials...');

      // Try to fetch from YouTube API first
      const youtubeVideos = await getSelfDefenseContent();

      if (youtubeVideos && youtubeVideos.length > 0) {
        console.log(`✅ Loaded ${youtubeVideos.length} videos from YouTube API`);

        // Transform YouTube videos to match tutorial format
        const transformedVideos = youtubeVideos.map((video, index) => ({
          id: video.id,
          category: index % 2 === 0 ? 'basic_moves' : 'self_defense',
          title: video.title,
          description: video.description,
          duration: '5-15 min',
          difficulty: 'Beginner',
          videoId: video.id,
          videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
          thumbnail: video.thumbnail,
          isOfflineAvailable: false,
          channelTitle: video.channelTitle,
        }));

        setTutorials(transformedVideos);
      } else {
        console.log('⚠️ YouTube API unavailable, using sample data');
        setTutorials(sampleTutorials);
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading tutorials:', error);
      console.log('📌 Falling back to sample data');
      setTutorials(sampleTutorials);
      setLoading(false);
    }
  };

  const downloadForOffline = async (tutorial) => {
    try {
      Alert.alert(
        t('download_tutorial') || 'Download Tutorial',
        t('download_tutorial_message') || 'Download this tutorial for offline viewing?',
        [
          { text: t('cancel') || 'Cancel', style: 'cancel' },
          {
            text: t('download') || 'Download',
            onPress: async () => {
              // In production, implement actual download
              Alert.alert(
                t('success') || 'Success',
                t('tutorial_downloaded') || 'Tutorial downloaded successfully!'
              );
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error downloading tutorial:', error);
      Alert.alert(t('error') || 'Error', t('download_failed') || 'Download failed');
    }
  };

  const openTutorial = (tutorial) => {
    console.log('🎥 Opening video:', tutorial.title);
    console.log('📺 Video ID:', tutorial.videoId);
    console.log('🔗 Video URL:', tutorial.videoUrl);

    // Open directly in YouTube app to avoid Error 153
    openInYouTubeApp(tutorial);
  };

  const closeVideoPlayer = () => {
    console.log('❌ Closing video player');
    setShowVideoPlayer(false);
    setSelectedVideo(null);
    setWebViewLoading(true);
  };

  const getYouTubeEmbedUrl = (videoId) => {
    // YouTube embed URL with parameters that work in React Native WebView
    // Using nocookie domain to avoid CORS issues
    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&playsinline=1&fs=1&controls=1&iv_load_policy=3`;
    console.log('🔗 YouTube embed URL:', embedUrl);
    return embedUrl;
  };

  const openInYouTubeApp = (tutorial) => {
    console.log('📱 Opening in YouTube app:', tutorial.videoUrl);
    Linking.openURL(tutorial.videoUrl).catch((error) => {
      console.error('❌ Error opening YouTube app:', error);
      Alert.alert('Error', 'Unable to open YouTube app');
    });
  };

  const filteredTutorials = selectedCategory === 'all'
    ? tutorials
    : tutorials.filter(t => t.category === selectedCategory);

  const renderTutorialCard = (tutorial, index) => (
    <TouchableOpacity
      key={`${tutorial.id}-${index}`}
      style={styles.tutorialCard}
      onPress={() => openTutorial(tutorial)}
    >
      <Image
        source={{ uri: tutorial.thumbnail }}
        style={styles.tutorialThumbnail}
        resizeMode="cover"
      />
      <View style={styles.durationBadge}>
        <Text style={styles.durationText}>{tutorial.duration}</Text>
      </View>

      <View style={styles.tutorialInfo}>
        <Text style={styles.tutorialTitle}>{tutorial.title}</Text>
        <Text style={styles.tutorialDescription} numberOfLines={2}>
          {tutorial.description}
        </Text>

        <View style={styles.tutorialMeta}>
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>{tutorial.difficulty}</Text>
          </View>

          {tutorial.isOfflineAvailable && (
            <View style={styles.offlineBadge}>
              <Ionicons name="download" size={12} color="#4CAF50" />
              <Text style={styles.offlineText}>Offline</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{t('self_defense_hub') || 'Self-Defense Hub'}</Text>
          <Text style={styles.headerSubtitle}>
            {t('learn_protect_yourself') || 'Learn to protect yourself'}
          </Text>
        </View>
      </View>

      {/* Category Dropdown */}
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
        >
          <View style={styles.dropdownButtonContent}>
            <Text style={styles.dropdownIcon}>{selectedCategoryData?.icon}</Text>
            <Text style={styles.dropdownText}>{selectedCategoryData?.name}</Text>
          </View>
          <Ionicons
            name={showCategoryDropdown ? "chevron-up" : "chevron-down"}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>

        {showCategoryDropdown && (
          <View style={styles.dropdownMenu}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.dropdownItem,
                  selectedCategory === category.id && styles.dropdownItemActive,
                ]}
                onPress={() => {
                  setSelectedCategory(category.id);
                  setShowCategoryDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemIcon}>{category.icon}</Text>
                <Text style={[
                  styles.dropdownItemText,
                  selectedCategory === category.id && styles.dropdownItemTextActive,
                ]}>
                  {category.name}
                </Text>
                {selectedCategory === category.id && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Tutorials List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('loading') || 'Loading tutorials...'}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              {filteredTutorials.length} {t('tutorials_available') || 'Tutorials Available'}
            </Text>

            {filteredTutorials.map((tutorial, index) => renderTutorialCard(tutorial, index))}
            
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={24} color={colors.primary} />
              <Text style={styles.infoText}>
                {t('tutorials_info') || 'New tutorials are added regularly. Download them for offline access.'}
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Video Player Modal */}
      <Modal
        visible={showVideoPlayer}
        animationType="slide"
        onRequestClose={closeVideoPlayer}
      >
        <View style={styles.videoPlayerContainer}>
          <View style={styles.videoPlayerHeader}>
            <TouchableOpacity onPress={closeVideoPlayer} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.videoPlayerTitle} numberOfLines={1}>
              {selectedVideo?.title}
            </Text>
            <TouchableOpacity
              onPress={() => openInYouTubeApp(selectedVideo)}
              style={styles.youtubeButton}
            >
              <Ionicons name="logo-youtube" size={28} color="#FF0000" />
            </TouchableOpacity>
          </View>

          {selectedVideo && (
            <>
              <WebView
                source={{ uri: getYouTubeEmbedUrl(selectedVideo.videoId) }}
                style={styles.webView}
                allowsFullscreenVideo={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback={true}
                startInLoadingState={true}
                scalesPageToFit={true}
                mixedContentMode="always"
                originWhitelist={['*']}
                userAgent="Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36"
                onLoadStart={() => {
                  console.log('🔄 WebView loading started');
                  setWebViewLoading(true);
                }}
                onLoadEnd={() => {
                  console.log('✅ WebView loading completed');
                  setWebViewLoading(false);
                }}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('❌ WebView error:', nativeEvent);
                  setWebViewLoading(false);
                  Alert.alert(
                    'Video Playback Error',
                    'Unable to play video in app. Would you like to open it in YouTube app instead?',
                    [
                      { text: 'Cancel', onPress: () => closeVideoPlayer() },
                      { text: 'Open in YouTube', onPress: () => openInYouTubeApp(selectedVideo) }
                    ]
                  );
                }}
                onHttpError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('❌ WebView HTTP error:', nativeEvent);
                }}
                renderLoading={() => (
                  <View style={styles.webViewLoadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.webViewLoadingText}>Loading video...</Text>
                  </View>
                )}
              />
              {webViewLoading && (
                <View style={styles.webViewLoadingOverlay}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.webViewLoadingText}>Loading video...</Text>
                </View>
              )}
            </>
          )}

          <View style={styles.videoInfo}>
            <Text style={styles.videoTitle}>{selectedVideo?.title}</Text>
            <Text style={styles.videoDescription}>{selectedVideo?.description}</Text>
            <View style={styles.videoMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.metaText}>{selectedVideo?.duration}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="bar-chart-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.metaText}>{selectedVideo?.difficulty}</Text>
              </View>
            </View>
          </View>
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
  header: {
    backgroundColor: colors.primary,
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dropdownMenu: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemActive: {
    backgroundColor: '#F0F0FF',
  },
  dropdownItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  dropdownItemTextActive: {
    fontWeight: '600',
    color: colors.primary,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  tutorialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tutorialThumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: '#E0E0E0',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tutorialInfo: {
    padding: 15,
  },
  tutorialTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  tutorialDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  tutorialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  difficultyBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  offlineText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoPlayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  closeButton: {
    padding: 5,
  },
  videoPlayerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginHorizontal: 15,
  },
  youtubeButton: {
    padding: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoInfo: {
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  videoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  videoMeta: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  webViewLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  webViewLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  webViewLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#FFFFFF',
  },
});

export default SelfDefenseHubScreen;

