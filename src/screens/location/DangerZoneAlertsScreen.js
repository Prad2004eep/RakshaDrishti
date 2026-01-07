import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import { useAuth } from '../../hooks/useAuth';
import {
  getDangerZones,
  addDangerZone,
  deleteDangerZone,
} from '../../services/dangerZoneService';
import {
  startDangerZoneMonitoring,
  stopDangerZoneMonitoring,
  isDangerZoneMonitoringActive,
} from '../../services/dangerZoneMonitorService';
import { getCurrentLocation } from '../../services/locationService';
import { getAddressFromCoordinates } from '../../services/googlePlacesService';

const DangerZoneAlertsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [dangerZones, setDangerZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [fromCoordinates, setFromCoordinates] = useState(null);
  const [toCoordinates, setToCoordinates] = useState(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  useEffect(() => {
    fetchDangerZones();
    checkMonitoringStatus();
  }, []);

  const fetchDangerZones = async () => {
    try {
      console.log('📍 Fetching danger zones...');
      setLoading(true);
      const zones = await getDangerZones(user.uid);
      console.log(`✅ Loaded ${zones.length} danger zones`);
      setDangerZones(zones);
    } catch (error) {
      console.error('❌ Error fetching danger zones:', error);
      Alert.alert(t('error') || 'Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkMonitoringStatus = () => {
    const isActive = isDangerZoneMonitoringActive();
    setMonitoringEnabled(isActive);
    console.log(`🔍 Danger zone monitoring status: ${isActive ? 'Active' : 'Inactive'}`);
  };

  const toggleMonitoring = async () => {
    try {
      if (monitoringEnabled) {
        console.log('🛑 Stopping danger zone monitoring...');
        stopDangerZoneMonitoring();
        setMonitoringEnabled(false);
        Alert.alert(
          t('success') || 'Success',
          'Danger zone monitoring stopped'
        );
      } else {
        console.log('🔍 Starting danger zone monitoring...');
        await startDangerZoneMonitoring(user.uid);
        setMonitoringEnabled(true);
        Alert.alert(
          t('success') || 'Success',
          'Danger zone monitoring started. You will be alerted when near marked danger zones.'
        );
      }
    } catch (error) {
      console.error('❌ Error toggling monitoring:', error);
      Alert.alert(t('error') || 'Error', error.message);
    }
  };

  const useCurrentLocation = async (isFrom = true) => {
    try {
      console.log(`📍 Getting current location for ${isFrom ? 'FROM' : 'TO'} field...`);
      setFetchingLocation(true);

      const location = await getCurrentLocation();
      console.log('✅ Current location:', location);

      const address = await getAddressFromCoordinates(location.latitude, location.longitude);
      console.log('✅ Address:', address);

      if (isFrom) {
        setFromLocation(address);
        setFromCoordinates({ latitude: location.latitude, longitude: location.longitude });
      } else {
        setToLocation(address);
        setToCoordinates({ latitude: location.latitude, longitude: location.longitude });
      }

      setFetchingLocation(false);
    } catch (error) {
      console.error('❌ Error getting current location:', error);
      setFetchingLocation(false);
      Alert.alert(t('error') || 'Error', 'Unable to get current location');
    }
  };

  const handleAddZone = async () => {
    if (!zoneName.trim()) {
      Alert.alert(t('error') || 'Error', t('zone_name_required') || 'Zone name is required');
      return;
    }

    if (!fromLocation.trim() || !toLocation.trim()) {
      Alert.alert(
        t('error') || 'Error',
        t('locations_required') || 'Both from and to locations are required'
      );
      return;
    }

    try {
      console.log('💾 Adding danger zone:', zoneName);
      setSaving(true);

      await addDangerZone(user.uid, {
        name: zoneName.trim(),
        fromLocation: fromLocation.trim(),
        toLocation: toLocation.trim(),
        fromCoordinates: fromCoordinates,
        toCoordinates: toCoordinates,
        notes: notes.trim(),
      });

      console.log('✅ Danger zone added successfully');
      Alert.alert(
        t('success') || 'Success',
        t('danger_zone_added') || 'Danger zone added successfully. Enable monitoring to get alerts.'
      );

      // Reset form
      setZoneName('');
      setFromLocation('');
      setToLocation('');
      setFromCoordinates(null);
      setToCoordinates(null);
      setNotes('');
      setShowAddModal(false);

      // Refresh list
      fetchDangerZones();
    } catch (error) {
      console.error('❌ Error adding danger zone:', error);
      Alert.alert(t('error') || 'Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZone = (zoneId, zoneName) => {
    Alert.alert(
      t('confirm') || 'Confirm',
      t('delete_zone_confirm') || `Are you sure you want to delete "${zoneName}"?`,
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDangerZone(user.uid, zoneId);
              Alert.alert(
                t('success') || 'Success',
                t('zone_deleted') || 'Danger zone deleted successfully'
              );
              fetchDangerZones();
            } catch (error) {
              console.error('Error deleting danger zone:', error);
              Alert.alert(t('error') || 'Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderZoneItem = ({ item }) => (
    <View style={styles.zoneCard}>
      <View style={styles.zoneHeader}>
        <View style={styles.zoneIcon}>
          <Ionicons name="warning" size={24} color={colors.danger} />
        </View>
        <View style={styles.zoneInfo}>
          <Text style={styles.zoneName}>{item.name}</Text>
          <Text style={styles.zoneDate}>
            {t('added') || 'Added'}: {new Date(item.createdAt?.toDate?.() || item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteZone(item.id, item.name)}
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.zoneDetails}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={styles.locationLabel}>{t('from') || 'From'}:</Text>
          <Text style={styles.locationText}>{item.fromLocation}</Text>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color={colors.danger} />
          <Text style={styles.locationLabel}>{t('to') || 'To'}:</Text>
          <Text style={styles.locationText}>{item.toLocation}</Text>
        </View>
        {item.notes && (
          <View style={styles.notesRow}>
            <Ionicons name="document-text-outline" size={16} color={colors.gray600} />
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('danger_zone_alerts') || 'Danger Zone Alerts'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <Text style={styles.infoText}>
            {t('danger_zone_info') ||
              'Mark areas you want to avoid. You will be alerted when traveling through these zones.'}
          </Text>
        </View>

        {/* Monitoring Toggle */}
        <View style={styles.monitoringCard}>
          <View style={styles.monitoringInfo}>
            <Ionicons
              name={monitoringEnabled ? "shield-checkmark" : "shield-outline"}
              size={24}
              color={monitoringEnabled ? colors.success : colors.gray400}
            />
            <View style={styles.monitoringText}>
              <Text style={styles.monitoringTitle}>
                {monitoringEnabled ? '🟢 Monitoring Active' : '⚪ Monitoring Inactive'}
              </Text>
              <Text style={styles.monitoringSubtitle}>
                {monitoringEnabled
                  ? 'You will be alerted when near danger zones'
                  : 'Enable to get real-time alerts'}
              </Text>
            </View>
          </View>
          <Switch
            value={monitoringEnabled}
            onValueChange={toggleMonitoring}
            trackColor={{ false: colors.gray300, true: colors.primary }}
            thumbColor={monitoringEnabled ? colors.white : colors.gray400}
          />
        </View>

        {/* Add Button */}
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add-circle" size={24} color={colors.white} />
          <Text style={styles.addButtonText}>{t('add_danger_zone') || 'Add Danger Zone'}</Text>
        </TouchableOpacity>

        {/* Danger Zones List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : dangerZones.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={64} color={colors.gray400} />
            <Text style={styles.emptyStateText}>
              {t('no_danger_zones') || 'No danger zones marked yet'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {t('add_first_zone') || 'Tap the button above to add your first danger zone'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={dangerZones}
            renderItem={renderZoneItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </ScrollView>

      {/* Add Zone Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('add_danger_zone') || 'Add Danger Zone'}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.gray600} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>{t('zone_name') || 'Zone Name'} *</Text>
              <TextInput
                style={styles.input}
                placeholder={t('enter_zone_name') || 'e.g., Dark Alley on Main Street'}
                value={zoneName}
                onChangeText={setZoneName}
                placeholderTextColor={colors.gray400}
              />

              <Text style={styles.inputLabel}>{t('from_location') || 'From Location'} *</Text>
              <View style={styles.locationInputContainer}>
                <TextInput
                  style={[styles.input, styles.locationInput]}
                  placeholder={t('enter_from_location') || 'e.g., Home, Office, etc.'}
                  value={fromLocation}
                  onChangeText={setFromLocation}
                  placeholderTextColor={colors.gray400}
                />
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={() => useCurrentLocation(true)}
                  disabled={fetchingLocation}
                >
                  <Ionicons
                    name="location"
                    size={20}
                    color={fetchingLocation ? colors.gray400 : colors.primary}
                  />
                </TouchableOpacity>
              </View>
              {fromCoordinates && (
                <Text style={styles.coordinatesText}>
                  📍 {fromCoordinates.latitude.toFixed(6)}, {fromCoordinates.longitude.toFixed(6)}
                </Text>
              )}

              <Text style={styles.inputLabel}>{t('to_location') || 'To Location'} *</Text>
              <View style={styles.locationInputContainer}>
                <TextInput
                  style={[styles.input, styles.locationInput]}
                  placeholder={t('enter_to_location') || 'e.g., Market, School, etc.'}
                  value={toLocation}
                  onChangeText={setToLocation}
                  placeholderTextColor={colors.gray400}
                />
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={() => useCurrentLocation(false)}
                  disabled={fetchingLocation}
                >
                  <Ionicons
                    name="location"
                    size={20}
                    color={fetchingLocation ? colors.gray400 : colors.primary}
                  />
                </TouchableOpacity>
              </View>
              {toCoordinates && (
                <Text style={styles.coordinatesText}>
                  📍 {toCoordinates.latitude.toFixed(6)}, {toCoordinates.longitude.toFixed(6)}
                </Text>
              )}

              <Text style={styles.inputLabel}>{t('notes') || 'Notes'} ({t('optional') || 'Optional'})</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('enter_notes') || 'Additional information about this zone...'}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                placeholderTextColor={colors.gray400}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('cancel') || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddZone}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>{t('save') || 'Save'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
  },
  monitoringCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  monitoringInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  monitoringText: {
    flex: 1,
  },
  monitoringTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  monitoringSubtitle: {
    fontSize: 12,
    color: colors.gray600,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray600,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.gray500,
    marginTop: 8,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  zoneCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  zoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 4,
  },
  zoneDate: {
    fontSize: 12,
    color: colors.gray500,
  },
  deleteButton: {
    padding: 8,
  },
  zoneDetails: {
    gap: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: colors.gray600,
  },
  notesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: colors.gray600,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray800,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.gray800,
    marginBottom: 16,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationInput: {
    flex: 1,
    marginBottom: 0,
  },
  locationButton: {
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  coordinatesText: {
    fontSize: 12,
    color: colors.gray600,
    marginTop: -12,
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray100,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray700,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default DangerZoneAlertsScreen;

