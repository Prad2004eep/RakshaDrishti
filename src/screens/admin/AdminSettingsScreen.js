import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../services/authService';

const AdminSettingsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { adminProfile, linkedUsers } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('logout_confirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert(t('error'), error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Profile Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile')}</Text>

        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => navigation.navigate('AdminProfile')}
        >
          <View style={styles.profileHeader}>
            <Text style={styles.profileIcon}>👤</Text>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{adminProfile?.name || t('user')}</Text>
              <Text style={styles.profileEmail}>{adminProfile?.phone || t('no') + ' ' + t('phone')}</Text>
            </View>
          </View>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>{t('monitoring')}</Text>
          <Text style={styles.infoValue}>{linkedUsers?.length || 0} {linkedUsers?.length !== 1 ? t('users') : t('user')}</Text>
        </View>
      </View>

      {/* AI Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🤖 {t('ai_features')}</Text>

        <TouchableOpacity
          style={styles.aiFeatureCard}
          onPress={() => navigation.navigate('AIAnalytics')}
        >
          <View style={styles.aiFeatureIcon}>
            <Text style={styles.aiIconText}>📊</Text>
          </View>
          <View style={styles.aiFeatureInfo}>
            <Text style={styles.aiFeatureTitle}>{t('ai_analytics')}</Text>
            <Text style={styles.aiFeatureDesc}>View SOS patterns and insights</Text>
          </View>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.aiFeatureCard}
          onPress={() => navigation.navigate('AIReports')}
        >
          <View style={styles.aiFeatureIcon}>
            <Text style={styles.aiIconText}>📝</Text>
          </View>
          <View style={styles.aiFeatureInfo}>
            <Text style={styles.aiFeatureTitle}>{t('incident_reports')}</Text>
            <Text style={styles.aiFeatureDesc}>AI-generated incident summaries</Text>
          </View>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.aiFeatureCard}
          onPress={() => navigation.navigate('AIHistory')}
        >
          <View style={styles.aiFeatureIcon}>
            <Text style={styles.aiIconText}>🕒</Text>
          </View>
          <View style={styles.aiFeatureInfo}>
            <Text style={styles.aiFeatureTitle}>{t('previous_records')}</Text>
            <Text style={styles.aiFeatureDesc}>Access historical AI analysis</Text>
          </View>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Monitoring */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 {t('monitoring')}</Text>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('LiveLocation')}
        >
          <View style={styles.settingItemLeft}>
            <View style={styles.settingIconContainer}>
              <Text style={styles.settingIcon}>📍</Text>
            </View>
            <Text style={styles.settingLabel}>{t('live_location_tracking')}</Text>
          </View>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('app_settings')}</Text>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('AppLock')}
        >
          <Text style={styles.settingLabel}>{t('app_lock')}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('Permissions')}
        >
          <Text style={styles.settingLabel}>{t('permissions')}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('PrivacyPolicy')}
        >
          <Text style={styles.settingLabel}>{t('privacy_policy')}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile')}</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>{t('logout')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  section: {
    padding: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  profileCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoCard: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  aiFeatureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  aiFeatureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  aiIconText: {
    fontSize: 24,
  },
  aiFeatureInfo: {
    flex: 1,
  },
  aiFeatureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  aiFeatureDesc: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconContainer: {
    width: 35,
    height: 35,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingIcon: {
    fontSize: 18,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
  },
  settingArrow: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  logoutButton: {
    backgroundColor: colors.danger,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default AdminSettingsScreen;

