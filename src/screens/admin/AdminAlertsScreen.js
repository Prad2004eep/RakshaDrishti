import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import { useAuth } from '../../hooks/useAuth';
import { getLinkedUsersSOSAlerts } from '../../services/adminService';
import { generateIncidentReport } from '../../services/geminiService';
import { getShortestRoute, calculateETA } from '../../services/routeService';
import IncidentReportModal from '../../components/IncidentReportModal';
import { getCurrentLocation } from '../../services/locationService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';

const AdminAlertsScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { adminProfile } = useAuth();
  const mapRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, resolved
  const [liveLocation, setLiveLocation] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [adminLocation, setAdminLocation] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Report modal state
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [generatedReport, setGeneratedReport] = useState('');
  const [reportAlertData, setReportAlertData] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (adminProfile) {
      loadAlerts();
    }
  }, [adminProfile]);

  // Subscribe to live location updates for selected alert
  useEffect(() => {
    if (!selectedAlert || !selectedAlert.userId) return;

    const userDocRef = doc(db, 'users', selectedAlert.userId);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.lastKnownLocation) {
          setLiveLocation(userData.lastKnownLocation);
          // Animate map to new location
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: userData.lastKnownLocation.latitude,
              longitude: userData.lastKnownLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 1000);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [selectedAlert]);

  const loadAlerts = async () => {
    try {
      setLoading(true);

      // Check if admin profile exists
      if (!adminProfile || !adminProfile.email) {
        console.warn('⚠️ Admin profile not loaded yet');
        setLoading(false);
        return;
      }

      const allAlerts = await getLinkedUsersSOSAlerts(adminProfile.email);
      setAlerts(allAlerts);

      // If alertId passed from navigation, select it
      if (route.params?.alertId) {
        const alert = allAlerts.find(a => a.id === route.params.alertId);
        if (alert) setSelectedAlert(alert);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
      Alert.alert('Error', 'Failed to load alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const openLocation = (latitude, longitude) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const generateReport = async (alert) => {
    try {
      setGeneratingReport(true);
      setReportAlertData(alert);
      const report = await generateIncidentReport(alert);
      setGeneratedReport(report);
      setReportModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const getRouteToAlert = async (alert) => {
    try {
      setLoadingRoute(true);
      console.log('🗺️ Getting route to alert location...');

      // Get admin's current location
      const currentLocation = await getCurrentLocation();
      setAdminLocation(currentLocation);

      // Get destination (use live location if available, otherwise alert location)
      const destination = liveLocation || alert.location;

      // Get route from Google Maps Directions API
      const route = await getShortestRoute(currentLocation, destination);
      setRouteData(route);

      // Fit map to show both locations
      if (mapRef.current) {
        mapRef.current.fitToCoordinates(
          [
            { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
            { latitude: destination.latitude, longitude: destination.longitude },
          ],
          {
            edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
            animated: true,
          }
        );
      }

      console.log('✅ Route loaded:', route.distance, route.duration);
    } catch (error) {
      console.error('❌ Error getting route:', error);
      Alert.alert(t('error'), 'Failed to get route. Please try again.');
    } finally {
      setLoadingRoute(false);
    }
  };

  const openGoogleMapsNavigation = () => {
    if (!selectedAlert) return;

    const destination = liveLocation || selectedAlert.location;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;

    Linking.openURL(url).catch(err => {
      console.error('Error opening Google Maps:', err);
      Alert.alert('Error', 'Could not open Google Maps');
    });
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.status === filter;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Modern Header */}
      <View style={styles.modernHeader}>
        <View style={styles.headerTop}>
          <Text style={styles.modernHeaderTitle}>SOS Alerts</Text>
          <TouchableOpacity onPress={loadAlerts}>
            <Ionicons name="refresh" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'active' && styles.filterButtonActive]}
            onPress={() => setFilter('active')}
          >
            <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'resolved' && styles.filterButtonActive]}
            onPress={() => setFilter('resolved')}
          >
            <Text style={[styles.filterText, filter === 'resolved' && styles.filterTextActive]}>Resolved</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map View with Live Location */}
      {selectedAlert && selectedAlert.location && (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: liveLocation?.latitude || selectedAlert.location.latitude,
              longitude: liveLocation?.longitude || selectedAlert.location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            {/* Initial SOS Alert Location */}
            <Marker
              coordinate={{
                latitude: selectedAlert.location.latitude,
                longitude: selectedAlert.location.longitude,
              }}
              title="SOS Alert Location"
              description={`Triggered at ${new Date(selectedAlert.createdAt?.toDate()).toLocaleTimeString()}`}
              pinColor={colors.danger}
            />

            {/* Live Location Marker */}
            {liveLocation && (
              <Marker
                coordinate={{
                  latitude: liveLocation.latitude,
                  longitude: liveLocation.longitude,
                }}
                title={`${selectedAlert.userName} (Live)`}
                description="Current Location"
                pinColor={colors.primary}
              >
                <View style={styles.liveMarker}>
                  <View style={styles.liveMarkerPulse} />
                  <View style={styles.liveMarkerDot} />
                </View>
              </Marker>
            )}

            {/* Admin Location Marker */}
            {adminLocation && (
              <Marker
                coordinate={{
                  latitude: adminLocation.latitude,
                  longitude: adminLocation.longitude,
                }}
                title="Your Location"
                description="Admin Location"
              >
                <View style={styles.adminMarker}>
                  <Ionicons name="person-circle" size={32} color={colors.success} />
                </View>
              </Marker>
            )}

            {/* Route Polyline */}
            {routeData && routeData.polylineCoordinates && (
              <Polyline
                coordinates={routeData.polylineCoordinates}
                strokeColor={colors.primary}
                strokeWidth={4}
              />
            )}
          </MapView>

          {/* Live Location Indicator */}
          {liveLocation && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live Location Tracking</Text>
            </View>
          )}

          {/* Route Info Card */}
          {routeData && (
            <View style={styles.routeInfoCard}>
              <View style={styles.routeInfoRow}>
                <Ionicons name="navigate" size={20} color={colors.primary} />
                <Text style={styles.routeDistance}>{routeData.distance}</Text>
                <Text style={styles.routeSeparator}>•</Text>
                <Ionicons name="time" size={20} color={colors.primary} />
                <Text style={styles.routeDuration}>{routeData.duration}</Text>
              </View>
              <Text style={styles.routeETA}>
                {t('eta')}: {calculateETA(routeData.durationValue)}
              </Text>
            </View>
          )}

          {/* Navigation Buttons */}
          <View style={styles.mapButtons}>
            <TouchableOpacity
              style={[styles.mapButton, loadingRoute && styles.mapButtonDisabled]}
              onPress={() => getRouteToAlert(selectedAlert)}
              disabled={loadingRoute}
            >
              {loadingRoute ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="navigate-circle" size={20} color={colors.white} />
                  <Text style={styles.mapButtonText}>{t('get_route')}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mapButton}
              onPress={openGoogleMapsNavigation}
            >
              <Ionicons name="map" size={20} color={colors.white} />
              <Text style={styles.mapButtonText}>{t('open_maps')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Alerts List */}
      <ScrollView
        style={styles.alertsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredAlerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No {filter} alerts</Text>
          </View>
        ) : (
          filteredAlerts.map((alert) => (
            <TouchableOpacity
              key={alert.id}
              style={[
                styles.alertCard,
                selectedAlert?.id === alert.id && styles.alertCardSelected,
              ]}
              onPress={() => setSelectedAlert(alert)}
            >
              <View style={styles.alertHeader}>
                <Text style={styles.alertUser}>{alert.userName}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: alert.status === 'active' ? colors.danger : colors.success }
                ]}>
                  <Text style={styles.statusText}>{alert.status}</Text>
                </View>
              </View>
              <Text style={styles.alertPhone}>📞 {alert.userPhone}</Text>
              <Text style={styles.alertTime}>
                🕐 {new Date(alert.createdAt?.toDate()).toLocaleString()}
              </Text>
              <Text style={styles.alertLocation}>
                📍 {alert.location?.latitude?.toFixed(6)}, {alert.location?.longitude?.toFixed(6)}
              </Text>
              <Text style={styles.alertMethod}>Trigger: {alert.triggerMethod || 'manual'}</Text>

              <View style={styles.alertActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openLocation(alert.location.latitude, alert.location.longitude)}
                >
                  <Text style={styles.actionButtonText}>Open Map</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                  onPress={() => generateReport(alert)}
                  disabled={generatingReport}
                >
                  {generatingReport ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.actionButtonText}>Generate Report</Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Incident Report Modal */}
      <IncidentReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        report={generatedReport}
        alertData={reportAlertData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 15,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modernHeader: {
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterButtonActive: {
    backgroundColor: colors.white,
  },
  filterText: {
    fontSize: 14,
    color: colors.white,
  },
  filterTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  mapContainer: {
    position: 'relative',
  },
  map: {
    height: 250,
  },
  liveIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  liveMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveMarkerPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    opacity: 0.3,
  },
  liveMarkerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
  },
  alertsList: {
    flex: 1,
    padding: 15,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  alertCard: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    elevation: 2,
  },
  alertCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertUser: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  alertPhone: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 5,
  },
  alertTime: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  alertLocation: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 5,
  },
  alertMethod: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  adminMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeInfoCard: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  routeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  routeDistance: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 5,
  },
  routeSeparator: {
    fontSize: 16,
    color: colors.textSecondary,
    marginHorizontal: 8,
  },
  routeDuration: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 5,
  },
  routeETA: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  mapButtons: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    gap: 10,
  },
  mapButton: {
    flex: 1,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  mapButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  mapButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
});

export default AdminAlertsScreen;

