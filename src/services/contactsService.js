import { db } from '../config/firebase';
import { doc, collection, addDoc, updateDoc, deleteDoc, getDocs, getDoc } from 'firebase/firestore';

// Add trusted contact
export const addTrustedContact = async (userId, contactData) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!contactData.name || !contactData.phone) {
      throw new Error('Contact name and phone are required');
    }

    console.log('📞 Adding contact to Firestore:', { userId, contactData });

    const contactsRef = collection(db, 'users', userId, 'trusted_contacts');
    const docRef = await addDoc(contactsRef, {
      ...contactData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('✅ Contact added with ID:', docRef.id);

    return {
      id: docRef.id,
      ...contactData,
    };
  } catch (error) {
    console.error('❌ Error adding trusted contact:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      name: error.name,
    });
    throw new Error(error.message || 'Failed to add contact');
  }
};

// Get all trusted contacts
export const getTrustedContacts = async (userId) => {
  try {
    const contactsRef = collection(db, 'users', userId, 'trusted_contacts');
    const contactsSnap = await getDocs(contactsRef);

    const contacts = [];
    contactsSnap.forEach((doc) => {
      contacts.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return contacts;
  } catch (error) {
    console.error('Error getting trusted contacts:', error);
    throw error;
  }
};

// Get single trusted contact
export const getTrustedContact = async (userId, contactId) => {
  try {
    const contactRef = doc(db, 'users', userId, 'trusted_contacts', contactId);
    const contactSnap = await getDoc(contactRef);

    if (contactSnap.exists()) {
      return {
        id: contactSnap.id,
        ...contactSnap.data(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting trusted contact:', error);
    throw error;
  }
};

// Update trusted contact
export const updateTrustedContact = async (userId, contactId, contactData) => {
  try {
    const contactRef = doc(db, 'users', userId, 'trusted_contacts', contactId);
    await updateDoc(contactRef, {
      ...contactData,
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error updating trusted contact:', error);
    throw error;
  }
};

// Delete trusted contact
export const deleteTrustedContact = async (userId, contactId) => {
  try {
    const contactRef = doc(db, 'users', userId, 'trusted_contacts', contactId);
    await deleteDoc(contactRef);
    return true;
  } catch (error) {
    console.error('Error deleting trusted contact:', error);
    throw error;
  }
};

// Check if max contacts reached (limit: 5)
export const isMaxContactsReached = async (userId) => {
  try {
    const contacts = await getTrustedContacts(userId);
    return contacts.length >= 5;
  } catch (error) {
    console.error('Error checking max contacts:', error);
    throw error;
  }
};

