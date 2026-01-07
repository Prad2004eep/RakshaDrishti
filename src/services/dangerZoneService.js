import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * Get all danger zones for a user
 */
export const getDangerZones = async (userId) => {
  try {
    const zonesRef = collection(db, 'users', userId, 'danger_zones');
    const q = query(zonesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const zones = [];
    snapshot.forEach((doc) => {
      zones.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`✅ Fetched ${zones.length} danger zones for user ${userId}`);
    return zones;
  } catch (error) {
    console.error('Error fetching danger zones:', error);
    throw error;
  }
};

/**
 * Add a new danger zone
 */
export const addDangerZone = async (userId, zoneData) => {
  try {
    const zonesRef = collection(db, 'users', userId, 'danger_zones');
    
    const newZone = {
      name: zoneData.name,
      fromLocation: zoneData.fromLocation,
      toLocation: zoneData.toLocation,
      notes: zoneData.notes || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(zonesRef, newZone);
    console.log(`✅ Danger zone added with ID: ${docRef.id}`);
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding danger zone:', error);
    throw error;
  }
};

/**
 * Delete a danger zone
 */
export const deleteDangerZone = async (userId, zoneId) => {
  try {
    const zoneRef = doc(db, 'users', userId, 'danger_zones', zoneId);
    await deleteDoc(zoneRef);
    console.log(`✅ Danger zone deleted: ${zoneId}`);
  } catch (error) {
    console.error('Error deleting danger zone:', error);
    throw error;
  }
};

/**
 * Check if user is near a danger zone
 * This can be used for real-time alerts
 */
export const checkNearDangerZone = async (userId, currentLocation) => {
  try {
    const zones = await getDangerZones(userId);
    
    // This is a simple implementation
    // In a real app, you would use geofencing or distance calculations
    // to check if the user is near any danger zone
    
    // For now, we just return the zones
    // You can enhance this with actual location-based logic
    return zones;
  } catch (error) {
    console.error('Error checking danger zones:', error);
    throw error;
  }
};

