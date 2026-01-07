import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import MapView, { Marker, Circle, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentLocation } from '../../services/locationService';
import { fetchAllSafeLocations, getDirections } from '../../services/googlePlacesService';

const RoutesScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [nearbyLocations, setNearbyLocations] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [routePolyline, setRoutePolyline] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({
    police: true,
    hospital: true,
    fire_station: true,
    pharmacy: true,
    cafe: true,
    shopping_mall: true,
  });

  useEffect(() => {
    loadUserLocation();
  }, []);

  const loadUserLocation = async () => {
    try {
      console.log('📍 Loading user location...');
      setLoading(true);

      const location = await getCurrentLocation();
      console.log('✅ User location:', location);
      setUserLocation(location);

      // Set map region
      setMapRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });

      // Fetch real nearby safe locations from Google Places API
      await fetchSafeLocations(location);

      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading location:', error);
      Alert.alert(
        t('error') || 'Error',
        t('location_error') || 'Unable to get your location. Please enable location services.'
      );
      setLoading(false);
    }
  };

  const fetchSafeLocations = async (location) => {
    try {
      console.log('🔍 Fetching nearby safe locations from Google Places API...');

      const locations = await fetchAllSafeLocations(
        location.latitude,
        location.longitude,
        2000 // 2km radius
      );

      console.log(`✅ Found ${locations.length} safe locations nearby`);
      setNearbyLocations(locations);
    } catch (error) {
      console.error('❌ Error fetching safe locations:', error);
      Alert.alert(
        t('error') || 'Error',
        'Unable to fetch nearby safe locations. Please check your internet connection.'
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (userLocation) {
      await fetchSafeLocations(userLocation);
    } else {
      await loadUserLocation();
    }
    setRefreshing(false);
  };

  /**
   * Organize locations by category type
   */
  const getLocationsByCategory = () => {
    const categorized = {
      police: { label: 'Police Station', icon: '🚔', locations: [] },
      hospital: { label: 'Hospital', icon: '🏥', locations: [] },
      fire_station: { label: 'Fire Station', icon: '🚒', locations: [] },
      pharmacy: { label: 'Medical Shop', icon: '💊', locations: [] },
      cafe: { label: 'Public Place', icon: '☕', locations: [] },
      shopping_mall: { label: 'Shopping Mall', icon: '🏬', locations: [] },
    };

    nearbyLocations.forEach((location) => {
      if (categorized[location.type]) {
        categorized[location.type].locations.push(location);
      }
    });

    // Sort locations within each category by distance
    Object.keys(categorized).forEach((key) => {
      categorized[key].locations.sort((a, b) => a.distance - b.distance);
    });

    return categorized;
  };

  /**
   * Toggle category expansion
   */
  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const openInMaps = (location) => {
    console.log('🗺️ Opening in Google Maps:', location.name);

    // Use Google Maps URL scheme for better compatibility
    const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}&query_place_id=${location.id}`;

    Linking.openURL(url).catch((error) => {
      console.error('❌ Error opening maps:', error);
      Alert.alert(
        t('error') || 'Error',
        t('maps_error') || 'Unable to open maps'
      );
    });
  };

  const navigateToLocation = (location) => {
    if (!userLocation) {
      Alert.alert(t('error') || 'Error', t('location_required') || 'Location required');
      return;
    }

    console.log('🧭 Navigating to:', location.name);
    console.log(`📍 From: (${userLocation.latitude}, ${userLocation.longitude})`);
    console.log(`📍 To: (${location.latitude}, ${location.longitude})`);

    // Open Google Maps with navigation
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${location.latitude},${location.longitude}&travelmode=driving`;

    Linking.openURL(url).then(() => {
      console.log('✅ Google Maps opened successfully');
    }).catch((error) => {
      console.error('❌ Error opening navigation:', error);
      Alert.alert(
        t('error') || 'Error',
        t('maps_error') || 'Unable to open directions'
      );
    });
  };

  const showLocationDetails = (location) => {
    console.log('📋 Showing details for:', location.name);

    Alert.alert(
      `${location.icon} ${location.name}`,
      `${location.address}\n\nDistance: ${location.distance.toFixed(2)} km${location.rating ? `\nRating: ${location.rating} ⭐` : ''}${location.isOpen !== undefined ? `\nStatus: ${location.isOpen ? '🟢 Open' : '🔴 Closed'}` : ''}`,
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        {
          text: '🗺️ Open in Maps',
          onPress: () => openInMaps(location),
        },
        {
          text: '🧭 Navigate',
          onPress: () => navigateToLocation(location),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('loading_location') || 'Loading location...'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{t('safe_routes') || 'Safe Routes'}</Text>
          <Text style={styles.headerSubtitle}>
            {t('find_safe_locations') || 'Find safe locations nearby'}
          </Text>
        </View>
      </View>

      {/* Map View */}
      {userLocation && mapRegion && (
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
          >
            {/* User location circle */}
            <Circle
              center={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              radius={100}
              fillColor="rgba(156, 39, 176, 0.2)"
              strokeColor="rgba(156, 39, 176, 0.5)"
              strokeWidth={2}
            />

            {/* Safe location markers */}
            {nearbyLocations.map((location) => (
              <Marker
                key={location.id}
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title={location.name}
                description={`${location.distance.toFixed(2)} km away`}
                onPress={() => {
                  setSelectedLocation(location);
                  showLocationDetails(location);
                }}
              >
                <View style={styles.markerContainer}>
                  <Text style={styles.markerIcon}>{location.icon}</Text>
                </View>
              </Marker>
            ))}
          </MapView>
        </View>
      )}

      {/* Locations List */}
      <ScrollView
        style={styles.locationsContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.filterContainer}>
          <Text style={styles.sectionTitle}>
            {t('nearby_safe_locations') || 'Nearby Safe Locations'} ({nearbyLocations.length})
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {nearbyLocations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? 'Loading...' : 'No safe locations found within 2km. Pull to refresh.'}
            </Text>
          </View>
        ) : (
          Object.entries(getLocationsByCategory()).map(([categoryKey, categoryData]) => {
            const hasLocations = categoryData.locations.length > 0;
            const isExpanded = expandedCategories[categoryKey];

            return (
              <View key={categoryKey} style={styles.categorySection}>
                {/* Category Header */}
                <TouchableOpacity
                  style={[styles.categoryHeader, !hasLocations && styles.categoryHeaderDisabled]}
                  onPress={() => hasLocations && toggleCategory(categoryKey)}
                  disabled={!hasLocations}
                >
                  <View style={styles.categoryTitleContainer}>
                    <Text style={styles.categoryIcon}>{categoryData.icon}</Text>
                    <View style={styles.categoryTitleContent}>
                      <Text style={styles.categoryTitle}>{categoryData.label}</Text>
                      <Text style={styles.categoryCount}>
                        {categoryData.locations.length} location{categoryData.locations.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  {hasLocations && (
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={24}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>

                {/* Category Locations */}
                {isExpanded && hasLocations && (
                  <View style={styles.categoryLocations}>
                    {categoryData.locations.map((location, index) => (
                      <TouchableOpacity
                        key={location.id}
                        style={[
                          styles.locationCard,
                          index === categoryData.locations.length - 1 && styles.locationCardLast,
                        ]}
                        onPress={() => showLocationDetails(location)}
                      >
                        <View style={styles.locationCardContent}>
                          <View style={styles.locationRankBadge}>
                            <Text style={styles.locationRankText}>{index + 1}</Text>
                          </View>
                          <View style={styles.locationInfo}>
                            <Text style={styles.locationName}>{location.name}</Text>
                            <Text style={styles.locationAddress} numberOfLines={1}>
                              {location.address}
                            </Text>
                            <View style={styles.locationMeta}>
                              <Text style={styles.locationDistance}>
                                📍 {location.distance.toFixed(2)} km away
                              </Text>
                              {location.rating > 0 && (
                                <Text style={styles.locationRating}>
                                  ⭐ {location.rating}
                                </Text>
                              )}
                              {location.isOpen !== undefined && (
                                <Text
                                  style={[
                                    styles.locationStatus,
                                    { color: location.isOpen ? colors.success : colors.danger },
                                  ]}
                                >
                                  {location.isOpen ? '🟢 Open' : '🔴 Closed'}
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.navigateButton}
                          onPress={() => openInMaps(location)}
                        >
                          <Ionicons name="navigate" size={20} color={colors.white} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{t('safe_route_features') || 'Safe Route Features'}</Text>
            <Text style={styles.infoText}>
              • {t('real_time_navigation') || 'Real-time navigation to safe locations'}{'\n'}
              • {t('offline_maps') || 'Offline maps available'}{'\n'}
              • {t('danger_warnings') || 'Danger zone warnings'}{'\n'}
              • {t('share_route') || 'Share route with trusted contacts'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
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
  mapContainer: {
    height: 300,
    backgroundColor: '#E0E0E0',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  markerIcon: {
    fontSize: 24,
  },
  locationsContainer: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  locationCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  locationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationDistance: {
    fontSize: 13,
    color: '#666',
  },
  locationRating: {
    fontSize: 13,
    color: '#666',
  },
  locationStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 2,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    marginBottom: 20,
    gap: 10,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 20,
  },
  // Category Styles
  categorySection: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F9F9F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryHeaderDisabled: {
    opacity: 0.6,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  categoryTitleContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 12,
    color: '#999',
  },
  categoryLocations: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  locationCardLast: {
    marginBottom: 0,
  },
  locationRankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationRankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  navigateButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RoutesScreen;

