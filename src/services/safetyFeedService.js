import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';

/**
 * Post a new safety feed (from User or Admin)
 */
export const postSafetyFeed = async (feedData) => {
  try {
    const feedRef = collection(db, 'safety_feeds');
    
    const newFeed = {
      authorId: feedData.authorId,
      authorName: feedData.authorName,
      authorType: feedData.authorType, // 'user' or 'admin'
      location: feedData.location,
      message: feedData.message,
      severity: feedData.severity, // 'high', 'medium', 'low'
      upvotes: 0,
      downvotes: 0,
      upvotedBy: [],
      downvotedBy: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(feedRef, newFeed);
    console.log(`✅ Safety feed posted with ID: ${docRef.id}`);
    
    return docRef.id;
  } catch (error) {
    console.error('Error posting safety feed:', error);
    throw error;
  }
};

/**
 * Get all safety feeds (real-time listener)
 */
export const subscribeSafetyFeeds = (callback) => {
  try {
    const feedRef = collection(db, 'safety_feeds');
    const q = query(feedRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const feeds = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        feeds.push({
          id: doc.id,
          ...data,
          // Ensure arrays exist for voting
          upvotedBy: data.upvotedBy || [],
          downvotedBy: data.downvotedBy || [],
        });
      });

      console.log(`✅ Fetched ${feeds.length} safety feeds`);
      callback(feeds);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to safety feeds:', error);
    throw error;
  }
};

/**
 * Get all safety feeds (one-time fetch)
 */
export const getSafetyFeeds = async () => {
  try {
    const feedRef = collection(db, 'safety_feeds');
    const q = query(feedRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const feeds = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      feeds.push({
        id: doc.id,
        ...data,
        // Ensure arrays exist for voting
        upvotedBy: data.upvotedBy || [],
        downvotedBy: data.downvotedBy || [],
      });
    });

    console.log(`✅ Fetched ${feeds.length} safety feeds`);
    return feeds;
  } catch (error) {
    console.error('Error fetching safety feeds:', error);
    throw error;
  }
};

/**
 * Upvote a safety feed
 */
export const upvoteSafetyFeed = async (feedId, userId) => {
  try {
    const feedRef = doc(db, 'safety_feeds', feedId);
    
    await updateDoc(feedRef, {
      upvotes: increment(1),
      upvotedBy: arrayUnion(userId),
      downvotedBy: arrayRemove(userId), // Remove from downvotes if exists
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Upvoted feed ${feedId}`);
  } catch (error) {
    console.error('Error upvoting feed:', error);
    throw error;
  }
};

/**
 * Downvote a safety feed
 */
export const downvoteSafetyFeed = async (feedId, userId) => {
  try {
    const feedRef = doc(db, 'safety_feeds', feedId);
    
    await updateDoc(feedRef, {
      downvotes: increment(1),
      downvotedBy: arrayUnion(userId),
      upvotedBy: arrayRemove(userId), // Remove from upvotes if exists
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Downvoted feed ${feedId}`);
  } catch (error) {
    console.error('Error downvoting feed:', error);
    throw error;
  }
};

/**
 * Remove vote from a safety feed
 */
export const removeVoteFromSafetyFeed = async (feedId, userId, voteType) => {
  try {
    const feedRef = doc(db, 'safety_feeds', feedId);
    
    const updates = {
      updatedAt: serverTimestamp(),
    };

    if (voteType === 'up') {
      updates.upvotes = increment(-1);
      updates.upvotedBy = arrayRemove(userId);
    } else if (voteType === 'down') {
      updates.downvotes = increment(-1);
      updates.downvotedBy = arrayRemove(userId);
    }

    await updateDoc(feedRef, updates);
    console.log(`✅ Removed ${voteType}vote from feed ${feedId}`);
  } catch (error) {
    console.error('Error removing vote:', error);
    throw error;
  }
};

