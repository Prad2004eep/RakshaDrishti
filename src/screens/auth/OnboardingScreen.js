import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Picker,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import { BLOOD_GROUPS, GENDER_OPTIONS } from '../../utils/constants';
import { createUserProfile } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

const OnboardingScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  const { user, updateUserProfile } = useAuth();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [emergencyNotes, setEmergencyNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!name || !age || !gender || !bloodGroup) {
      Alert.alert(t('error'), 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const profileData = {
        name,
        age: parseInt(age),
        gender,
        bloodGroup,
        emergencyNotes,
        phone: user?.phoneNumber || '',
        email: user?.email || '',
      };

      await createUserProfile(user.uid, profileData);
      updateUserProfile(profileData);

      // Navigate to home
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      Alert.alert(t('error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('welcome')}</Text>
          <Text style={styles.subtitle}>Complete your profile</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('name')} *</Text>
            <TextInput
              style={styles.input}
              placeholder={t('name')}
              value={name}
              onChangeText={setName}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('age')} *</Text>
            <TextInput
              style={styles.input}
              placeholder={t('age')}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('gender')} *</Text>
            <View style={styles.picker}>
              <Picker
                selectedValue={gender}
                onValueChange={setGender}
                enabled={!loading}
              >
                <Picker.Item label="Select Gender" value="" />
                {GENDER_OPTIONS.map((option) => (
                  <Picker.Item key={option} label={option} value={option} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('blood_group')} *</Text>
            <View style={styles.picker}>
              <Picker
                selectedValue={bloodGroup}
                onValueChange={setBloodGroup}
                enabled={!loading}
              >
                <Picker.Item label="Select Blood Group" value="" />
                {BLOOD_GROUPS.map((group) => (
                  <Picker.Item key={group} label={group} value={group} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('emergency_notes')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('emergency_notes')}
              value={emergencyNotes}
              onChangeText={setEmergencyNotes}
              multiline
              numberOfLines={4}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleComplete}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>{t('continue')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray600,
  },
  form: {
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
  picker: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    overflow: 'hidden',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;

