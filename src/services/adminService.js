import { db } from '../config/firebase';
import { 
  doc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where,
  setDoc,
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';

/**
 * Check if an email exists in any user's trusted contacts
 * This determines if someone can log in as an admin
 */
export const checkAdminRole = async (email) => {
  try {
    if (!email) return { isAdmin: false, linkedUsers: [] };

    console.log('🔍 Checking admin role for email:', email);

    // Get all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    const linkedUsers = [];

    // Check each user's trusted contacts
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const contactsRef = collection(db, 'users', userId, 'trusted_contacts');
      const contactsSnapshot = await getDocs(contactsRef);

      contactsSnapshot.forEach((contactDoc) => {
        const contact = contactDoc.data();
        if (contact.email && contact.email.toLowerCase() === email.toLowerCase()) {
          linkedUsers.push({
            userId,
            userName: userDoc.data().name || 'Unknown User',
            userPhone: userDoc.data().phone || '',
            contactId: contactDoc.id,
            contactName: contact.name,
            addedAt: contact.createdAt || contact.addedAt,
          });
        }
      });
    }

    const isAdmin = linkedUsers.length > 0;

    console.log(`✅ Admin check complete: ${isAdmin ? 'IS ADMIN' : 'NOT ADMIN'}, Linked users: ${linkedUsers.length}`);

    return { isAdmin, linkedUsers };
  } catch (error) {
    console.error('❌ Error checking admin role:', error);
    throw error;
  }
};

/**
 * Get or create admin profile
 */
export const getOrCreateAdminProfile = async (email, linkedUsers) => {
  try {
    const adminDocRef = doc(db, 'admins', email);
    const adminDoc = await getDoc(adminDocRef);

    if (!adminDoc.exists()) {
      // Create new admin profile
      const adminData = {
        email,
        createdAt: new Date(),
        updatedAt: new Date(),
        linkedUsersCount: linkedUsers.length,
      };

      await setDoc(adminDocRef, adminData);

      // Create linked_users subcollection
      for (const user of linkedUsers) {
        const linkedUserRef = doc(db, 'admins', email, 'linked_users', user.userId);
        await setDoc(linkedUserRef, {
          userId: user.userId,
          userName: user.userName,
          userPhone: user.userPhone,
          linkedAt: new Date(),
        });
      }

      return adminData;
    } else {
      // Update existing admin profile
      await updateDoc(adminDocRef, {
        updatedAt: new Date(),
        linkedUsersCount: linkedUsers.length,
      });

      return adminDoc.data();
    }
  } catch (error) {
    console.error('❌ Error getting/creating admin profile:', error);
    throw error;
  }
};

/**
 * Get all linked users for an admin
 */
export const getLinkedUsers = async (adminEmail) => {
  try {
    const linkedUsersRef = collection(db, 'admins', adminEmail, 'linked_users');
    const snapshot = await getDocs(linkedUsersRef);

    const users = [];
    snapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return users;
  } catch (error) {
    console.error('❌ Error getting linked users:', error);
    throw error;
  }
};

/**
 * Get all SOS alerts for linked users (both active and inactive)
 */
export const getLinkedUsersSOSAlerts = async (adminEmail) => {
  try {
    const linkedUsers = await getLinkedUsers(adminEmail);

    if (linkedUsers.length === 0) {
      console.log('ℹ️ No linked users found for admin:', adminEmail);
      return [];
    }

    console.log(`📋 Fetching SOS alerts for ${linkedUsers.length} linked users...`);
    const allAlerts = [];

    for (const user of linkedUsers) {
      try {
        const alertsRef = collection(db, 'users', user.userId, 'sos_alerts');
        // Get ALL alerts, not just active ones
        const alertsQuery = query(alertsRef, orderBy('createdAt', 'desc'));
        const alertsSnapshot = await getDocs(alertsQuery);

        console.log(`  ✅ Found ${alertsSnapshot.size} alerts for ${user.userName}`);

        alertsSnapshot.forEach((doc) => {
          allAlerts.push({
            id: doc.id,
            userId: user.userId,
            userName: user.userName,
            userPhone: user.userPhone,
            ...doc.data(),
          });
        });
      } catch (userError) {
        console.error(`❌ Error getting alerts for user ${user.userName}:`, userError);
        // Continue with other users even if one fails
      }
    }

    console.log(`✅ Total alerts found: ${allAlerts.length}`);
    return allAlerts.sort((a, b) => {
      const timeA = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
      const timeB = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
      return timeA - timeB;
    });
  } catch (error) {
    console.error('❌ Error getting SOS alerts:', error);
    throw error;
  }
};

/**
 * Get all evidence for a specific user
 */
export const getUserEvidence = async (userId) => {
  try {
    const evidenceRef = collection(db, 'users', userId, 'evidence');
    const evidenceSnapshot = await getDocs(evidenceRef);

    const evidence = [];
    evidenceSnapshot.forEach((doc) => {
      evidence.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Sort by creation date (newest first)
    return evidence.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
      const dateB = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('❌ Error getting user evidence:', error);
    throw error;
  }
};

/**
 * Get all evidence for all linked users
 */
export const getLinkedUsersEvidence = async (adminEmail) => {
  try {
    const linkedUsers = await getLinkedUsers(adminEmail);
    const allEvidence = [];

    for (const user of linkedUsers) {
      const userEvidence = await getUserEvidence(user.userId);

      // Add user info to each evidence item
      userEvidence.forEach((evidence) => {
        allEvidence.push({
          ...evidence,
          userId: user.userId,
          userName: user.userName,
          userPhone: user.userPhone,
        });
      });
    }

    // Sort by creation date (newest first)
    return allEvidence.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
      const dateB = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('❌ Error getting linked users evidence:', error);
    throw error;
  }
};

/**
 * Get evidence for a specific SOS alert
 */
export const getSOSEvidence = async (userId, sosId) => {
  try {
    const evidenceRef = collection(db, 'users', userId, 'evidence');
    const evidenceQuery = query(evidenceRef, where('sosId', '==', sosId));
    const evidenceSnapshot = await getDocs(evidenceQuery);

    const evidence = [];
    evidenceSnapshot.forEach((doc) => {
      evidence.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return evidence;
  } catch (error) {
    console.error('❌ Error getting SOS evidence:', error);
    throw error;
  }
};

