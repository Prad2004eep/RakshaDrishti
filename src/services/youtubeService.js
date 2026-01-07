import axios from 'axios';

const YOUTUBE_API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * Search for educational videos on YouTube
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum number of results
 * @returns {Promise<array>} - Array of video objects
 */
export const searchYouTubeVideos = async (query, maxResults = 10) => {
  try {
    if (!YOUTUBE_API_KEY) {
      console.warn('⚠️ YouTube API key not configured');
      console.warn('📝 EXPO_PUBLIC_YOUTUBE_API_KEY:', process.env.EXPO_PUBLIC_YOUTUBE_API_KEY);
      return [];
    }

    console.log(`🔍 Searching YouTube for: "${query}"`);
    console.log(`🔑 Using API Key: ${YOUTUBE_API_KEY.substring(0, 10)}...`);

    const response = await axios.get(`${YOUTUBE_API_URL}/search`, {
      params: {
        q: query,
        part: 'snippet',
        type: 'video',
        maxResults: maxResults,
        key: YOUTUBE_API_KEY,
        relevanceLanguage: 'en',
        order: 'relevance',
        videoDuration: 'medium', // 4-20 minutes
        safeSearch: 'strict',
      },
      timeout: 10000, // 10 second timeout
    });

    console.log(`📊 YouTube API Response Status: ${response.status}`);
    console.log(`📊 Items received: ${response.data.items?.length || 0}`);

    if (response.data.items && response.data.items.length > 0) {
      const videos = response.data.items.map((item) => {
        if (!item.id.videoId) {
          console.warn('⚠️ Skipping item without videoId:', item.id);
          return null;
        }
        return {
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
        };
      }).filter(v => v !== null);

      console.log(`✅ Found ${videos.length} valid videos`);
      return videos;
    }

    console.warn('⚠️ No videos found for query:', query);
    return [];
  } catch (error) {
    console.error('❌ Error searching YouTube:', error.message);
    if (error.response) {
      console.error('📊 Response Status:', error.response.status);
      console.error('📊 Response Data:', error.response.data);
    }
    return [];
  }
};

/**
 * Get video details including duration
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<object>} - Video details
 */
export const getVideoDetails = async (videoId) => {
  try {
    if (!YOUTUBE_API_KEY) {
      console.warn('⚠️ YouTube API key not configured');
      return null;
    }

    const response = await axios.get(`${YOUTUBE_API_URL}/videos`, {
      params: {
        id: videoId,
        part: 'contentDetails,statistics',
        key: YOUTUBE_API_KEY,
      },
    });

    if (response.data.items && response.data.items.length > 0) {
      const item = response.data.items[0];
      return {
        duration: item.contentDetails.duration,
        viewCount: item.statistics.viewCount,
        likeCount: item.statistics.likeCount,
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Error getting video details:', error.message);
    return null;
  }
};

/**
 * Get self-defense educational content
 * @returns {Promise<array>} - Array of self-defense videos
 */
export const getSelfDefenseContent = async () => {
  try {
    console.log('🎥 Fetching self-defense educational content...');
    console.log('🔑 API Key Status:', YOUTUBE_API_KEY ? '✅ Configured' : '❌ Missing');

    const queries = [
      'women self defense techniques',
      'basic self defense moves',
      'personal safety tips',
      'emergency response training',
    ];

    const allVideos = [];
    let successCount = 0;
    let failureCount = 0;

    for (const query of queries) {
      console.log(`📍 Fetching videos for: "${query}"`);
      const videos = await searchYouTubeVideos(query, 3);

      if (videos.length > 0) {
        console.log(`✅ Got ${videos.length} videos for "${query}"`);
        allVideos.push(...videos);
        successCount++;
      } else {
        console.warn(`⚠️ No videos found for "${query}"`);
        failureCount++;
      }
    }

    console.log(`📊 Summary: ${successCount} successful queries, ${failureCount} failed`);
    console.log(`✅ Total fetched: ${allVideos.length} self-defense videos`);

    if (allVideos.length === 0) {
      console.warn('⚠️ No videos fetched from YouTube API, will use sample data');
    }

    return allVideos;
  } catch (error) {
    console.error('❌ Error fetching self-defense content:', error.message);
    console.error('📊 Error details:', error);
    return [];
  }
};

/**
 * Get safety awareness content
 * @returns {Promise<array>} - Array of safety videos
 */
export const getSafetyAwarenessContent = async () => {
  try {
    console.log('🎥 Fetching safety awareness content...');

    const queries = [
      'personal safety awareness',
      'situational awareness training',
      'travel safety tips',
      'home security tips',
    ];

    const allVideos = [];

    for (const query of queries) {
      const videos = await searchYouTubeVideos(query, 3);
      allVideos.push(...videos);
    }

    console.log(`✅ Fetched ${allVideos.length} safety awareness videos`);
    return allVideos;
  } catch (error) {
    console.error('❌ Error fetching safety content:', error.message);
    return [];
  }
};

export default {
  searchYouTubeVideos,
  getVideoDetails,
  getSelfDefenseContent,
  getSafetyAwarenessContent,
};

