import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors } from '../../utils/colors';
import { useAuth } from '../../hooks/useAuth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

const AdminProfileScreen = ({ navigation }) => {
  const { user, adminProfile } = useAuth();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyNotes, setEmergencyNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  useEffect(() => {
    if (adminProfile) {
      setName(adminProfile.name || '');
      setAge(adminProfile.age ? adminProfile.age.toString() : '');
      setGender(adminProfile.gender || '');
      setBloodGroup(adminProfile.bloodGroup || '');
      setPhone(adminProfile.phone || '');
      setEmergencyNotes(adminProfile.emergencyNotes || '');
    }
  }, [adminProfile]);

  const handleSaveProfile = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!age.trim() || isNaN(age) || parseInt(age) < 1 || parseInt(age) > 120) {
      Alert.alert('Error', 'Please enter a valid age');
      return;
    }

    if (!gender) {
      Alert.alert('Error', 'Please select your gender');
      return;
    }

    if (!bloodGroup.trim()) {
      Alert.alert('Error', 'Please enter your blood group');
      return;
    }

    setLoading(true);
    try {
      const updatedProfile = {
        name: name.trim(),
        age: parseInt(age),
        gender,
        bloodGroup: bloodGroup.trim().toUpperCase(),
        phone: phone.trim(),
        emergencyNotes: emergencyNotes.trim(),
        updatedAt: new Date(),
      };

      // Update in Firestore
      await updateDoc(doc(db, 'admins', user.email), updatedProfile);

      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error updating admin profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
      </View>

      <View style={styles.form}>
        {/* Email (Read-only) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={user?.email || ''}
            editable={false}
          />
        </View>

        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor={colors.gray400}
            value={name}
            onChangeText={setName}
            editable={!loading}
          />
        </View>

        {/* Age */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your age"
            placeholderTextColor={colors.gray400}
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            editable={!loading}
          />
        </View>

        {/* Gender */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender *</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowGenderPicker(!showGenderPicker)}
            disabled={loading}
          >
            <Text style={gender ? styles.inputText : styles.placeholderText}>
              {gender || 'Select your gender'}
            </Text>
          </TouchableOpacity>
          {showGenderPicker && (
            <View style={styles.pickerContainer}>
              {GENDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.pickerOption}
                  onPress={() => {
                    setGender(option);
                    setShowGenderPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Blood Group */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Blood Group *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., A+, B-, O+, AB+"
            placeholderTextColor={colors.gray400}
            value={bloodGroup}
            onChangeText={setBloodGroup}
            autoCapitalize="characters"
            editable={!loading}
          />
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            placeholderTextColor={colors.gray400}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>

        {/* Emergency Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Emergency Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any medical conditions, allergies, or important information"
            placeholderTextColor={colors.gray400}
            value={emergencyNotes}
            onChangeText={setEmergencyNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!loading}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSaveProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
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
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
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
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  inputDisabled: {
    backgroundColor: colors.gray100,
    color: colors.gray600,
  },
  inputText: {
    fontSize: 16,
    color: colors.text,
  },
  placeholderText: {
    fontSize: 16,
    color: colors.gray400,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  pickerContainer: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  pickerOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminProfileScreen;

