import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import { Ionicons } from '@expo/vector-icons';

const PermissionsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  const [permissions, setPermissions] = useState({
    camera: 'undetermined',
    location: 'undetermined',
    microphone: 'undetermined',
  });

  useEffect(() => {
    checkAllPermissions();
  }, []);

  const checkAllPermissions = async () => {
    try {
      const cameraStatus = await Camera.getCameraPermissionsAsync();
      const locationStatus = await Location.getForegroundPermissionsAsync();
      const audioStatus = await Audio.getPermissionsAsync();

      setPermissions({
        camera: cameraStatus.status,
        location: locationStatus.status,
        microphone: audioStatus.status,
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setPermissions(prev => ({ ...prev, camera: status }));
      
      if (status === 'granted') {
        Alert.alert('Success', 'Camera permission granted');
      } else if (status === 'denied') {
        Alert.alert(
          'Permission Denied',
          'Camera permission is required for evidence capture. Please enable it in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request camera permission');
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissions(prev => ({ ...prev, location: status }));
      
      if (status === 'granted') {
        Alert.alert('Success', 'Location permission granted');
      } else if (status === 'denied') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required for SOS and tracking features. Please enable it in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request location permission');
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setPermissions(prev => ({ ...prev, microphone: status }));

      if (status === 'granted') {
        Alert.alert('Success', 'Microphone permission granted');
      } else if (status === 'denied') {
        Alert.alert(
          'Permission Denied',
          'Microphone permission is required to record audio evidence. Please enable it in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request microphone permission');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'granted':
        return colors.success;
      case 'denied':
        return colors.danger;
      default:
        return colors.warning;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      default:
        return 'Not Requested';
    }
  };

  const PermissionItem = ({ title, description, status, onRequest, iconName }) => (
    <View style={styles.permissionCard}>
      <View style={styles.permissionHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={24} color={colors.primary} />
        </View>
        <View style={styles.permissionInfo}>
          <Text style={styles.permissionTitle}>{title}</Text>
          <Text style={styles.permissionDescription}>
            {description}
          </Text>
        </View>
      </View>
      <View style={styles.permissionFooter}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
          <Text style={styles.statusText}>{getStatusText(status)}</Text>
        </View>
        {status !== 'granted' && (
          <TouchableOpacity
            style={styles.requestButton}
            onPress={onRequest}
          >
            <Text style={styles.requestButtonText}>
              {status === 'denied' ? 'Open Settings' : 'Request'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔐 Permissions</Text>
      </View>

      <ScrollView style={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.description}>
            {t('permissions_description') || 'Grant necessary permissions for RakshaDrishti to protect you effectively.'}
          </Text>
          <PermissionItem
            iconName="camera"
            title="Camera"
            description="Required for capturing evidence photos and videos"
            status={permissions.camera}
            onRequest={requestCameraPermission}
          />

          <PermissionItem
            iconName="location"
            title="Location"
            description="Required for SOS alerts, location tracking, and safe routes"
            status={permissions.location}
            onRequest={requestLocationPermission}
          />

          <PermissionItem
            iconName="mic"
            title="Microphone"
            description="Required to record audio evidence during emergencies"
            status={permissions.microphone}
            onRequest={requestMicrophonePermission}
          />

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Why We Need Permissions</Text>
              <Text style={styles.infoText}>
                • Camera: Capture video evidence during emergencies{'\n'}
                • Location: Send accurate location in SOS alerts{'\n'}
                • Microphone: Record audio evidence during emergencies{'\n\n'}
                All permissions are used solely for your safety and security.
              </Text>
            </View>
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
  header: {
    backgroundColor: colors.primary,
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 13,
    color: colors.gray600,
    lineHeight: 18,
  },
  permissionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  requestButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.gray50,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.gray600,
    lineHeight: 20,
  },
});

export default PermissionsScreen;

