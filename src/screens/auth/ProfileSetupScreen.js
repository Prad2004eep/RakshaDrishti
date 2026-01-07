import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

const ProfileSetupScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { userId } = route.params;
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyNotes, setEmergencyNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert(t('error') || 'Error', t('please_enter_name') || 'Please enter your name');
      return;
    }

    if (!age.trim() || isNaN(age) || parseInt(age) < 1 || parseInt(age) > 120) {
      Alert.alert(t('error') || 'Error', t('please_enter_valid_age') || 'Please enter a valid age');
      return;
    }

    if (!gender) {
      Alert.alert(t('error') || 'Error', t('please_select_gender') || 'Please select your gender');
      return;
    }

    if (!bloodGroup.trim()) {
      Alert.alert(t('error') || 'Error', t('please_enter_blood_group') || 'Please enter your blood group');
      return;
    }

    setLoading(true);

    try {
      console.log('💾 Saving profile for user:', userId);

      const profileData = {
        name: name.trim(),
        age: parseInt(age),
        gender,
        bloodGroup: bloodGroup.trim().toUpperCase(),
        phone: phone.trim(),
        emergencyNotes: emergencyNotes.trim(),
        profileCompleted: true,
        updatedAt: new Date(),
      };

      // Save to Firestore
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, profileData, { merge: true });

      console.log('✅ Profile saved successfully');

      // Small delay to ensure Firestore update propagates
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate to main app
      navigation.replace('MainApp');
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      setLoading(false);
      Alert.alert(
        t('error') || 'Error',
        error.message || t('failed_update_profile') || 'Failed to save profile. Please try again.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('setup_profile') || 'Setup Your Profile'}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>

        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('name') || 'Name'} *</Text>
          <TextInput
            style={styles.input}
            placeholder={t('enter_name') || 'Enter your name'}
            placeholderTextColor={colors.gray400}
            value={name}
            onChangeText={setName}
            editable={!loading}
          />
        </View>

        {/* Age */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('age') || 'Age'} *</Text>
          <TextInput
            style={styles.input}
            placeholder={t('enter_age') || 'Enter your age'}
            placeholderTextColor={colors.gray400}
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            editable={!loading}
          />
        </View>

        {/* Gender */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('gender') || 'Gender'} *</Text>
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
                  {t(option.toLowerCase().replace(/ /g, '_')) || option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Blood Group */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('blood_group') || 'Blood Group'} *</Text>
          <TextInput
            style={styles.input}
            placeholder={t('enter_blood_group') || 'e.g., A+, B-, O+, AB+'}
            placeholderTextColor={colors.gray400}
            value={bloodGroup}
            onChangeText={setBloodGroup}
            editable={!loading}
            autoCapitalize="characters"
          />
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('phone') || 'Phone Number'}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('enter_phone') || 'Enter your phone number'}
            placeholderTextColor={colors.gray400}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>

        {/* Emergency Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('emergency_notes') || 'Emergency Medical Notes'}</Text>
          <TextInput
            style={styles.textArea}
            placeholder={t('enter_emergency_notes') || 'Any allergies, medical conditions, or important notes...'}
            placeholderTextColor={colors.gray400}
            value={emergencyNotes}
            onChangeText={setEmergencyNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!loading}
          />
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, loading && styles.continueButtonDisabled]}
          onPress={handleSaveProfile}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.continueButtonText}>{t('continue') || 'Continue'}</Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 30,
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
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.gray800,
  },
  textArea: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.gray800,
    minHeight: 100,
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
  footer: {
    padding: 20,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileSetupScreen;

