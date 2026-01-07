import { db } from '../config/firebase';
import { 
  doc, 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  query, 
  where,
  setDoc,
  onSnapshot,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

/**
 * Generate a unique chat ID from userId and adminEmail
 */
const getChatId = (userId, adminEmail) => {
  const sanitizedEmail = adminEmail.replace(/[@.]/g, '_');
  return `${userId}_${sanitizedEmail}`;
};

/**
 * Send a message from user to admin
 */
export const sendMessageToAdmin = async (userId, adminEmail, messageText, senderName) => {
  try {
    const chatId = getChatId(userId, adminEmail);
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    const messageData = {
      text: messageText,
      senderId: userId,
      senderType: 'user',
      senderName: senderName || 'User',
      recipientId: adminEmail,
      recipientType: 'admin',
      createdAt: serverTimestamp(),
      read: false,
    };

    const docRef = await addDoc(messagesRef, messageData);

    // Update chat metadata
    const chatDocRef = doc(db, 'chats', chatId);
    await setDoc(chatDocRef, {
      userId,
      adminEmail,
      lastMessage: messageText,
      lastMessageAt: serverTimestamp(),
      lastMessageBy: 'user',
      unreadCountAdmin: 1,
    }, { merge: true });

    console.log('✅ Message sent to admin:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error sending message to admin:', error);
    throw error;
  }
};

/**
 * Send a message from admin to user
 */
export const sendMessageToUser = async (adminEmail, userId, messageText, senderName) => {
  try {
    const chatId = getChatId(userId, adminEmail);
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    const messageData = {
      text: messageText,
      senderId: adminEmail,
      senderType: 'admin',
      senderName: senderName || 'Admin',
      recipientId: userId,
      recipientType: 'user',
      createdAt: serverTimestamp(),
      read: false,
    };

    const docRef = await addDoc(messagesRef, messageData);

    // Update chat metadata
    const chatDocRef = doc(db, 'chats', chatId);
    await setDoc(chatDocRef, {
      userId,
      adminEmail,
      lastMessage: messageText,
      lastMessageAt: serverTimestamp(),
      lastMessageBy: 'admin',
      unreadCountUser: 1,
    }, { merge: true });

    console.log('✅ Message sent to user:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error sending message to user:', error);
    throw error;
  }
};

/**
 * Subscribe to messages in real-time
 */
export const subscribeToMessages = (userId, adminEmail, callback) => {
  try {
    const chatId = getChatId(userId, adminEmail);
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = [];
      snapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      callback(messages);
    });

    return unsubscribe;
  } catch (error) {
    console.error('❌ Error subscribing to messages:', error);
    throw error;
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (userId, adminEmail, userType) => {
  try {
    const chatId = getChatId(userId, adminEmail);
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, where('read', '==', false), where('recipientType', '==', userType));
    const snapshot = await getDocs(q);

    const updatePromises = [];
    snapshot.forEach((doc) => {
      updatePromises.push(updateDoc(doc.ref, { read: true }));
    });

    await Promise.all(updatePromises);

    // Update metadata only if chat document exists
    const chatDocRef = doc(db, 'chats', chatId);
    const chatDoc = await getDoc(chatDocRef);

    if (chatDoc.exists()) {
      const updateField = userType === 'user' ? 'unreadCountUser' : 'unreadCountAdmin';
      await updateDoc(chatDocRef, { [updateField]: 0 });
    }

    console.log('✅ Messages marked as read');
  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
    // Don't throw error if it's just a missing document
    if (!error.message.includes('No document to update')) {
      throw error;
    }
  }
};

/**
 * Get all chats for an admin
 */
export const getAdminChats = async (adminEmail, linkedUserIds) => {
  try {
    const chats = [];

    for (const userId of linkedUserIds) {
      const chatId = getChatId(userId, adminEmail);
      const chatDocRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatDocRef);

      if (chatDoc.exists()) {
        chats.push({
          chatId,
          userId,
          adminEmail,
          ...chatDoc.data(),
        });
      }
    }

    return chats.sort((a, b) => (b.lastMessageAt?.seconds || 0) - (a.lastMessageAt?.seconds || 0));
  } catch (error) {
    console.error('❌ Error getting admin chats:', error);
    throw error;
  }
};

