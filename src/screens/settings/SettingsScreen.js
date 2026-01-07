import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import { SUPPORTED_LANGUAGES } from '../../utils/constants';
import { logout } from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState(true);
  const [backgroundTracking, setBackgroundTracking] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const handleLanguageChange = async (languageCode) => {
    try {
      await i18n.changeLanguage(languageCode);
      await AsyncStorage.setItem('appLanguage', languageCode);
      setShowLanguageModal(false);
    } catch (error) {
      Alert.alert(t('error'), t('failed_change_language'));
    }
  };

  const getCurrentLanguageName = () => {
    const currentLang = SUPPORTED_LANGUAGES.find(lang => lang.code === i18n.language);
    return currentLang ? currentLang.nativeName : 'English';
  };

  const handleLogout = () => {
    Alert.alert(t('confirm'), t('are_you_sure_logout'), [
      { text: t('cancel'), onPress: () => {} },
      {
        text: t('logout'),
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            Alert.alert(t('error'), error.message);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
      </View>

      {/* Profile Section */}
      <View style={[styles.section, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile')}</Text>
        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: colors.border }]}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>{t('my_profile')}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Language Section */}
      <View style={[styles.section, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('language')}</Text>
        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: colors.border }]}
          onPress={() => setShowLanguageModal(true)}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>{t('select_language')}</Text>
          <View style={styles.languageSelector}>
            <Text style={[styles.currentLanguage, { color: colors.textSecondary }]}>{getCurrentLanguageName()}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('notifications')}</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>{t('push_notifications')}</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: colors.gray300, true: colors.primary }}
            thumbColor={notifications ? colors.white : colors.gray400}
          />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>{t('background_tracking')}</Text>
          <Switch
            value={backgroundTracking}
            onValueChange={setBackgroundTracking}
            trackColor={{ false: colors.gray300, true: colors.primary }}
            thumbColor={backgroundTracking ? colors.white : colors.gray400}
          />
        </View>
      </View>

      {/* Safety Features Section */}
      <View style={[styles.section, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('safety_features') || 'Safety Features'}</Text>
        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: colors.border }]}
          onPress={() => navigation.navigate('EvidenceRecording')}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>🎥 {t('evidence_recording') || 'Evidence Recording'}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: colors.border }]}
          onPress={() => navigation.navigate('SelfDefenseHub')}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>🥋 {t('self_defense_hub') || 'Self-Defense Hub'}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: colors.border }]}
          onPress={() => navigation.navigate('Routes')}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>🗺️ {t('safe_routes') || 'Safe Routes'}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: colors.border }]}
          onPress={() => navigation.navigate('FakeCallSetup')}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>📞 {t('fake_call') || 'Fake Call'}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: colors.border }]}
          onPress={() => navigation.navigate('CheckInTimer')}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>⏰ {t('check_in_timer') || 'Check-In Timer'}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Communication Section */}
      <View style={[styles.section, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('communication') || 'Communication'}</Text>
        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: colors.border }]}
          onPress={() => navigation.navigate('Chat')}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>💬 {t('chat_with_admin') || 'Chat with Admin'}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Privacy & Security Section */}
      <View style={[styles.section, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('privacy_security')}</Text>
        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: colors.border }]}
          onPress={() => navigation.navigate('AppLock')}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>{t('app_lock')}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: colors.border }]}
          onPress={() => navigation.navigate('Permissions')}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>{t('permissions')}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: colors.border }]}
          onPress={() => navigation.navigate('PanicDelete')}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>{t('panic_delete')}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={[styles.section, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('about')}</Text>
        <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>{t('app_version')}</Text>
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>1.0.0</Text>
        </View>
        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: colors.border }]}
          onPress={() => navigation.navigate('HelpSupport')}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>{t('help_support')}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: colors.border }]}
          onPress={() => navigation.navigate('PrivacyPolicy')}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>{t('privacy_policy')}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>{t('logout')}</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('select_language')}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={SUPPORTED_LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.languageOption}
                  onPress={() => handleLanguageChange(item.code)}
                >
                  <View>
                    <Text style={styles.languageName}>{item.name}</Text>
                    <Text style={styles.languageNative}>{item.nativeName}</Text>
                  </View>
                  {i18n.language === item.code && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
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
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray800,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  settingLabel: {
    fontSize: 14,
    color: colors.gray800,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    color: colors.gray600,
  },
  settingArrow: {
    fontSize: 20,
    color: colors.primary,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentLanguage: {
    fontSize: 14,
    color: colors.gray600,
  },
  logoutButton: {
    margin: 20,
    backgroundColor: colors.danger,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  spacer: {
    height: 20,
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
    maxHeight: '70%',
    paddingBottom: 20,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray800,
  },
  modalClose: {
    fontSize: 24,
    color: colors.gray600,
    fontWeight: 'bold',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  languageName: {
    fontSize: 16,
    color: colors.gray800,
    fontWeight: '500',
  },
  languageNative: {
    fontSize: 14,
    color: colors.gray600,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;

