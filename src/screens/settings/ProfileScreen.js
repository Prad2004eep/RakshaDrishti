import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import { useAuth } from '../../hooks/useAuth';
import { updateUserProfile } from '../../services/authService';
import { GENDER_OPTIONS } from '../../utils/constants';

const ProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  const { user, userProfile, updateUserProfile: updateContext } = useAuth();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyNotes, setEmergencyNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setAge(userProfile.age?.toString() || '');
      setGender(userProfile.gender || '');
      setBloodGroup(userProfile.bloodGroup || '');
      setPhone(userProfile.phone || '');
      setEmergencyNotes(userProfile.emergencyNotes || '');
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    if (!name || !age || !gender || !bloodGroup) {
      Alert.alert(t('error'), t('please_fill_required_fields'));
      return;
    }

    if (parseInt(age) < 1 || parseInt(age) > 120) {
      Alert.alert(t('error'), t('please_enter_valid_age'));
      return;
    }

    setLoading(true);
    console.log('💾 Saving profile for user:', user?.uid);

    try {
      const updatedProfile = {
        name: name.trim(),
        age: parseInt(age),
        gender,
        bloodGroup: bloodGroup.trim().toUpperCase(),
        phone: phone.trim(),
        emergencyNotes: emergencyNotes.trim(),
        email: user?.email || '',
        updatedAt: new Date(),
      };

      console.log('📝 Profile data:', updatedProfile);

      await updateUserProfile(user.uid, updatedProfile);
      console.log('✅ Profile updated in Firestore');

      // Update context
      if (updateContext) {
        updateContext(updatedProfile);
        console.log('✅ Context updated');
      }

      setLoading(false);
      Alert.alert(t('success'), t('profile_updated'));
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      setLoading(false);
      Alert.alert(t('error'), error.message || t('failed_update_profile'));
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← {t('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('my_profile')}</Text>
        <Text style={styles.headerSubtitle}>{t('update_personal_info')}</Text>
      </View>

      <View style={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {name ? name.charAt(0).toUpperCase() : '👤'}
            </Text>
          </View>
          <Text style={[styles.emailText, { color: colors.textSecondary }]}>{user?.email}</Text>
        </View>

        {/* Form Section */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('name')} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder={t('enter_name')}
              placeholderTextColor={colors.gray400}
              value={name}
              onChangeText={setName}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('age')} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder={t('enter_age')}
              placeholderTextColor={colors.gray400}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              maxLength={3}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('gender')} *</Text>
            <View style={styles.genderContainer}>
              {GENDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.genderButton,
                    gender === option && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender(option)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === option && styles.genderButtonTextActive,
                    ]}
                  >
                    {t(option.toLowerCase().replace(/ /g, '_'))}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('blood_group')} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder={t('enter_blood_group')}
              placeholderTextColor={colors.gray400}
              value={bloodGroup}
              onChangeText={setBloodGroup}
              editable={!loading}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('phone')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder={t('enter_phone')}
              placeholderTextColor={colors.gray400}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('emergency_notes')}</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder={t('enter_emergency_notes')}
              placeholderTextColor={colors.gray400}
              value={emergencyNotes}
              onChangeText={setEmergencyNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }, loading && styles.saveButtonDisabled]}
            onPress={handleSaveProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>💾 {t('save')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: colors.card, borderLeftColor: colors.info }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>ℹ️ {t('profile_information')}</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • {t('keep_profile_updated')}{'\n'}
            • {t('info_used_emergency')}{'\n'}
            • {t('data_encrypted_secure')}{'\n'}
            • {t('shared_emergency_contacts')}
          </Text>
        </View>
      </View>


    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.primary,
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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
  content: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emailText: {
    fontSize: 14,
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  saveButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
  genderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  genderButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
  },
  genderButtonTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;

