import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import { GENDER_OPTIONS } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import { updateUserProfile } from '../../services/authService';

const ProfileScreen = () => {
  const { t } = useTranslation();
  
  const { user, userProfile, updateUserProfile: updateContext } = useAuth();
  const [name, setName] = useState(userProfile?.name || '');
  const [age, setAge] = useState(userProfile?.age?.toString() || '');
  const [gender, setGender] = useState(userProfile?.gender || '');
  const [bloodGroup, setBloodGroup] = useState(userProfile?.blood_group || '');
  const [emergencyNotes, setEmergencyNotes] = useState(userProfile?.emergencyNotes || '');
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async () => {
    if (!name || !age || !gender || !bloodGroup) {
      Alert.alert(t('error'), t('please_fill_required_fields'));
      return;
    }

    setLoading(true);
    try {
      const updatedProfile = {
        name,
        age: parseInt(age),
        gender,
        blood_group: bloodGroup,
        emergencyNotes,
      };

      await updateUserProfile(user.uid, updatedProfile);
      updateContext(updatedProfile);
      Alert.alert(t('success'), t('profile_updated'));
    } catch (error) {
      Alert.alert(t('error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>👤</Text>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('name')} *</Text>
          <TextInput
            style={styles.input}
            placeholder={t('enter_name')}
            value={name}
            onChangeText={setName}
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('age')} *</Text>
          <TextInput
            style={styles.input}
            placeholder={t('enter_age')}
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('gender')} *</Text>
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
          <Text style={styles.label}>{t('blood_group')} *</Text>
          <TextInput
            style={styles.input}
            placeholder={t('enter_blood_group')}
            value={bloodGroup}
            onChangeText={setBloodGroup}
            editable={!loading}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('emergency_notes')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t('enter_emergency_notes')}
            value={emergencyNotes}
            onChangeText={setEmergencyNotes}
            multiline
            numberOfLines={4}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSaveProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>{t('save')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>{t('profile_information')}</Text>
        <Text style={styles.infoText}>
          • {t('keep_profile_updated')}{'\n'}
          • {t('info_used_emergency')}{'\n'}
          • {t('data_encrypted_secure')}{'\n'}
          • {t('shared_emergency_contacts')}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.secondary,
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    fontSize: 40,
  },
  email: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.gray800,
  },
  textArea: {
    textAlignVertical: 'top',
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
    backgroundColor: colors.white, // Solid white background (not transparent)
    alignItems: 'center',
  },
  genderButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.white, // Keep white background when active
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
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    margin: 20,
    padding: 15,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray800,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: colors.gray600,
    lineHeight: 20,
  },
});

export default ProfileScreen;

