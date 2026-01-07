import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const LiveLocationScreen = ({ navigation }) => {
  const { adminProfile, linkedUsers } = useAuth();
  const [userLocations, setUserLocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  useEffect(() => {
    if (!linkedUsers || linkedUsers.length === 0) {
      setLoading(false);
      return;
    }

    // Subscribe to live location updates for all linked users
    const unsubscribers = linkedUsers.map((user) => {
      const userRef = collection(db, 'users', user.userId, 'liveLocation');
      
      return onSnapshot(userRef, (snapshot) => {
        if (!snapshot.empty) {
          const locationDoc = snapshot.docs[0];
          const locationData = locationDoc.data();
          
          setUserLocations((prev) => ({
            ...prev,
            [user.userId]: {
              ...locationData,
              userName: user.name || 'User',
              userPhone: user.phone || '',
            },
          }));
        }
        setLoading(false);
      }, (error) => {
        console.error(`Error subscribing to location for ${user.userId}:`, error);
        setLoading(false);
      });
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [linkedUsers]);

  // Auto-fit map to show all markers
  useEffect(() => {
    if (Object.keys(userLocations).length > 0 && mapRef.current) {
      const coordinates = Object.values(userLocations)
        .filter(loc => loc.latitude && loc.longitude)
        .map(loc => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
        }));

      if (coordinates.length > 0) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(coordinates, {
            edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
            animated: true,
          });
        }, 500);
      }
    }
  }, [userLocations]);

  const focusOnUser = (userId) => {
    const location = userLocations[userId];
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
      setSelectedUser(userId);
    }
  };

  const getTimeSinceUpdate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const updateTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = now - updateTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading live locations...</Text>
      </View>
    );
  }

  if (!linkedUsers || linkedUsers.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Live Location Tracking</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={64} color={colors.gray400} />
          <Text style={styles.emptyText}>No users to track</Text>
          <Text style={styles.emptySubtext}>Add linked users to see their live location</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Location Tracking</Text>
        <TouchableOpacity
          onPress={() => {
            if (Object.keys(userLocations).length > 0) {
              const coordinates = Object.values(userLocations)
                .filter(loc => loc.latitude && loc.longitude)
                .map(loc => ({ latitude: loc.latitude, longitude: loc.longitude }));

              if (coordinates.length > 0) {
                mapRef.current?.fitToCoordinates(coordinates, {
                  edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
                  animated: true,
                });
              }
            }
          }}
        >
          <Ionicons name="locate" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: 20.5937,
          longitude: 78.9629,
          latitudeDelta: 10,
          longitudeDelta: 10,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {Object.entries(userLocations).map(([userId, location]) => {
          if (!location.latitude || !location.longitude) return null;

          return (
            <React.Fragment key={userId}>
              {/* Pulsing Circle */}
              <Circle
                center={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                radius={100}
                fillColor="rgba(124, 58, 237, 0.2)"
                strokeColor="rgba(124, 58, 237, 0.5)"
                strokeWidth={2}
              />

              {/* User Marker */}
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title={location.userName}
                description={`Last updated: ${getTimeSinceUpdate(location.timestamp)}`}
                onPress={() => setSelectedUser(userId)}
              >
                <View style={styles.markerContainer}>
                  <View style={[
                    styles.marker,
                    selectedUser === userId && styles.markerSelected
                  ]}>
                    <Ionicons name="person" size={20} color={colors.white} />
                  </View>
                  <View style={styles.markerLabel}>
                    <Text style={styles.markerText}>{location.userName}</Text>
                  </View>
                </View>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapView>

      {/* User List */}
      <View style={styles.userListContainer}>
        <Text style={styles.userListTitle}>
          Tracking {Object.keys(userLocations).length} user{Object.keys(userLocations).length !== 1 ? 's' : ''}
        </Text>
        {linkedUsers.map((user) => {
          const location = userLocations[user.userId];
          const hasLocation = location && location.latitude && location.longitude;

          return (
            <TouchableOpacity
              key={user.userId}
              style={[
                styles.userCard,
                selectedUser === user.userId && styles.userCardSelected,
              ]}
              onPress={() => hasLocation && focusOnUser(user.userId)}
            >
              <View style={styles.userCardLeft}>
                <View style={[
                  styles.userAvatar,
                  hasLocation ? styles.userAvatarActive : styles.userAvatarInactive,
                ]}>
                  <Ionicons
                    name="person"
                    size={20}
                    color={hasLocation ? colors.white : colors.gray400}
                  />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name || 'User'}</Text>
                  <Text style={styles.userStatus}>
                    {hasLocation
                      ? `Updated ${getTimeSinceUpdate(location.timestamp)}`
                      : 'Location unavailable'
                    }
                  </Text>
                </View>
              </View>
              {hasLocation && (
                <Ionicons name="navigate" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  markerSelected: {
    backgroundColor: colors.success,
    transform: [{ scale: 1.2 }],
  },
  markerLabel: {
    marginTop: 5,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  markerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  userListContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 15,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    maxHeight: '40%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  userListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gray50,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  userCardSelected: {
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  userCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarActive: {
    backgroundColor: colors.primary,
  },
  userAvatarInactive: {
    backgroundColor: colors.gray300,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default LiveLocationScreen;

