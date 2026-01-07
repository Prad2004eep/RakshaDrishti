import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import { useAuth } from '../../hooks/useAuth';
import { getCurrentLocation } from '../../services/locationService';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const LocationScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = async () => {
    try {
      setLoading(true);
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);

      // Set map region
      setMapRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      Alert.alert(t('error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('location')}</Text>
        <Text style={styles.headerSubtitle}>
          {t('track_location_safe_routes')}
        </Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Google Maps View */}
        {location && mapRegion && (
          <View style={styles.mapSection}>
            <Text style={styles.sectionTitle}>{t('current_location')} 📍</Text>
            <View style={styles.mapContainer}>
              {loading ? (
                <View style={styles.mapLoadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  region={mapRegion}
                  showsUserLocation={true}
                  showsMyLocationButton={true}
                  showsCompass={true}
                  zoomEnabled={true}
                  scrollEnabled={true}
                >
                  {/* User location marker with circle */}
                  <Circle
                    center={{
                      latitude: location.latitude,
                      longitude: location.longitude,
                    }}
                    radius={location.accuracy || 50}
                    fillColor="rgba(156, 39, 176, 0.15)"
                    strokeColor="rgba(156, 39, 176, 0.5)"
                    strokeWidth={2}
                  />

                  {/* User location marker */}
                  <Marker
                    coordinate={{
                      latitude: location.latitude,
                      longitude: location.longitude,
                    }}
                    title={t('your_location') || 'Your Location'}
                    description={`Accuracy: ±${location.accuracy.toFixed(2)}m`}
                  >
                    <View style={styles.userMarkerContainer}>
                      <View style={styles.userMarkerInner}>
                        <Ionicons name="location" size={20} color={colors.white} />
                      </View>
                    </View>
                  </Marker>
                </MapView>
              )}
            </View>
          </View>
        )}

        {/* Current Location Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('location_details')}</Text>
          {location ? (
            <View style={styles.locationCard}>
              <View style={styles.locationDetailRow}>
                <Text style={styles.locationLabel}>📍 {t('latitude')}</Text>
                <Text style={styles.locationValue}>
                  {location.latitude.toFixed(6)}
                </Text>
              </View>
              <View style={styles.locationDetailRow}>
                <Text style={styles.locationLabel}>📍 {t('longitude')}</Text>
                <Text style={styles.locationValue}>
                  {location.longitude.toFixed(6)}
                </Text>
              </View>
              <View style={styles.locationDetailRow}>
                <Text style={styles.locationLabel}>📏 {t('accuracy')}</Text>
                <Text style={styles.locationValue}>
                  ±{location.accuracy.toFixed(2)}m
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noDataText}>{t('loading_location')}</Text>
          )}
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchCurrentLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.refreshButtonText}>🔄 {t('refresh_location')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Safe Routes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('safe_routes')}</Text>
          <TouchableOpacity
            style={styles.routeCard}
            onPress={() => navigation.navigate('Routes')}
          >
            <Text style={styles.routeCardTitle}>{t('find_nearby_safe_locations')}</Text>
            <Text style={styles.routeCardSubtitle}>
              {t('police_hospitals_cafes')}
            </Text>
            <Text style={styles.routeCardArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('location_features')}</Text>
          <View style={styles.featureList}>
            <TouchableOpacity
              style={styles.featureItem}
              onPress={() => fetchCurrentLocation()}
            >
              <Text style={styles.featureIcon}>📍</Text>
              <Text style={styles.featureText}>{t('realtime_gps_tracking')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.featureItem}
              onPress={() => navigation.navigate('Routes')}
            >
              <Text style={styles.featureIcon}>🗺️</Text>
              <Text style={styles.featureText}>{t('safe_route_navigation')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.featureItem}
              onPress={() => navigation.navigate('DangerZoneAlerts')}
            >
              <Text style={styles.featureIcon}>🚨</Text>
              <Text style={styles.featureText}>{t('danger_zone_alerts')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.featureItem}
              onPress={() => navigation.navigate('Contacts')}
            >
              <Text style={styles.featureIcon}>📤</Text>
              <Text style={styles.featureText}>{t('share_location_contacts')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.primary,
    padding: 20,
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
  mapSection: {
    padding: 20,
    paddingBottom: 10,
  },
  mapContainer: {
    height: 350,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
    backgroundColor: colors.gray100,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  map: {
    flex: 1,
  },
  mapLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray100,
  },
  userMarkerContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    borderWidth: 3,
    borderColor: colors.white,
  },
  userMarkerInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray800,
    marginBottom: 15,
  },
  locationCard: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  locationDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  locationLabel: {
    fontSize: 13,
    color: colors.gray600,
    fontWeight: '600',
    flex: 1,
  },
  locationValue: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  noDataText: {
    fontSize: 14,
    color: colors.gray600,
    textAlign: 'center',
    paddingVertical: 20,
  },
  refreshButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  refreshButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  routeCard: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
    flex: 1,
  },
  routeCardSubtitle: {
    fontSize: 12,
    color: colors.gray600,
    marginTop: 4,
  },
  routeCardArrow: {
    fontSize: 24,
    color: colors.secondary,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 12,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: colors.gray800,
    fontWeight: '500',
  },
});

export default LocationScreen;

