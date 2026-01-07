import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const PrivacyAcceptanceScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { userId } = route.params;
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    try {
      setLoading(true);

      // Update user profile to mark privacy accepted
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        privacyAccepted: true,
        privacyAcceptedAt: new Date(),
      }, { merge: true });

      // Navigate to Profile Setup
      navigation.replace('ProfileSetup', { userId });
    } catch (error) {
      console.error('Error accepting privacy:', error);
      setLoading(false);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('privacy_policy') || 'Privacy Policy'}</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('welcome_to_raksha') || 'Welcome to RakshaDrishti'}</Text>
            <Text style={styles.text}>
              {t('privacy_intro') || 'Your safety and privacy are our top priorities. Please read and accept our privacy policy to continue.'}
            </Text>
          </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('data_collection') || 'Data Collection'}</Text>
          <Text style={styles.text}>
            {t('privacy_data_collection_text') || 
            'RakshaDrishti collects and processes your personal information including name, age, gender, blood group, phone number, and location data to provide emergency safety services.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('data_usage') || 'How We Use Your Data'}</Text>
          <Text style={styles.text}>
            {t('privacy_data_usage_text') || 
            'Your data is used exclusively for:\n• Emergency SOS alerts\n• Sharing location with trusted contacts\n• Providing safety recommendations\n• Improving app functionality'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('data_security') || 'Data Security'}</Text>
          <Text style={styles.text}>
            {t('privacy_data_security_text') || 
            'All your data is encrypted and stored securely. We use industry-standard security measures to protect your information. Your location and personal details are only shared with your trusted contacts during emergencies.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('data_sharing') || 'Data Sharing'}</Text>
          <Text style={styles.text}>
            {t('privacy_data_sharing_text') || 
            'We do not sell or share your personal information with third parties. Your data is only shared with:\n• Your trusted emergency contacts (during SOS)\n• Emergency services (when you trigger SOS)\n• No one else'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('your_rights') || 'Your Rights'}</Text>
          <Text style={styles.text}>
            {t('privacy_your_rights_text') || 
            'You have the right to:\n• Access your data\n• Delete your data\n• Update your information\n• Withdraw consent at any time\n• Use the Panic Delete feature to erase all data instantly'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('location_tracking') || 'Location Tracking'}</Text>
          <Text style={styles.text}>
            {t('privacy_location_text') || 
            'Location tracking is essential for emergency services. You can enable/disable tracking at any time. Background location is only used during active SOS alerts or when you enable continuous tracking.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('contact_us') || 'Contact Us'}</Text>
          <Text style={styles.text}>
            {t('privacy_contact_text') || 
            'For privacy concerns or questions, contact us at:\nEmail: privacy@rakshadrishti.com\nPhone: 1800-XXX-XXXX'}
          </Text>
        </View>

        <View style={styles.acceptanceBox}>
          <Text style={styles.acceptanceText}>
            {t('privacy_acceptance_text') || 
            'By clicking "Accept", you agree to our Privacy Policy and Terms of Service. You consent to the collection and use of your data as described above.'}
          </Text>
        </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.acceptButton, loading && styles.acceptButtonDisabled]}
            onPress={handleAccept}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.acceptButtonText}>{t('accept') || 'Accept'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    backgroundColor: colors.primary,
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray800,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: colors.gray700,
    lineHeight: 22,
  },
  acceptanceBox: {
    backgroundColor: colors.gray50,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginTop: 10,
  },
  acceptanceText: {
    fontSize: 13,
    color: colors.gray700,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    minWidth: 120,
  },
  acceptButtonDisabled: {
    opacity: 0.6,
  },
  acceptButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PrivacyAcceptanceScreen;

