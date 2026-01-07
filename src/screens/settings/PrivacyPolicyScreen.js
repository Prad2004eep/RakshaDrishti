import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';

const PrivacyPolicyScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  
  const { onAccept } = route.params || {};

  const handleAccept = () => {
    if (onAccept) {
      onAccept();
    }
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <Text style={styles.headerSubtitle}>Last updated: January 2025</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Introduction</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Welcome to RakshaDrishti. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Information We Collect</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            We collect the following types of information:{'\n\n'}
            • <Text style={{ fontWeight: 'bold' }}>Personal Information:</Text> Name, email, phone number, and emergency contact details{'\n'}
            • <Text style={{ fontWeight: 'bold' }}>Location Data:</Text> Real-time location for SOS alerts and safety features{'\n'}
            • <Text style={{ fontWeight: 'bold' }}>Evidence Data:</Text> Photos, videos, and audio recordings you capture{'\n'}
            • <Text style={{ fontWeight: 'bold' }}>Usage Data:</Text> App interactions and feature usage statistics
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>3. How We Use Your Information</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Your information is used to:{'\n\n'}
            • Provide emergency SOS alerts to your trusted contacts{'\n'}
            • Track and share your location during emergencies{'\n'}
            • Store evidence securely for your safety{'\n'}
            • Improve app functionality and user experience{'\n'}
            • Send important safety notifications{'\n'}
            • Provide customer support
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>4. Data Security</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            We implement industry-standard security measures:{'\n\n'}
            • End-to-end encryption for sensitive data{'\n'}
            • Secure Firebase cloud storage{'\n'}
            • Regular security audits{'\n'}
            • Access controls and authentication{'\n'}
            • Secure data transmission (HTTPS/SSL)
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>5. Data Sharing</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            We do NOT sell your personal information. Your data is only shared:{'\n\n'}
            • With your trusted contacts during SOS alerts{'\n'}
            • With emergency services when you trigger an SOS{'\n'}
            • With law enforcement if legally required{'\n'}
            • With service providers who help us operate the app (under strict confidentiality agreements)
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>6. Your Rights</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            You have the right to:{'\n\n'}
            • Access your personal data{'\n'}
            • Update or correct your information{'\n'}
            • Delete your account and data (Panic Delete){'\n'}
            • Opt-out of non-essential data collection{'\n'}
            • Export your data{'\n'}
            • Withdraw consent at any time
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>7. Location Data</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Location tracking is essential for safety features:{'\n\n'}
            • Location is only tracked when you enable the feature{'\n'}
            • Location data is shared only during SOS alerts{'\n'}
            • You can disable location tracking anytime{'\n'}
            • Location history is stored securely and can be deleted
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>8. Evidence Storage</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Photos, videos, and audio recordings:{'\n\n'}
            • Are stored securely in encrypted cloud storage{'\n'}
            • Are accessible only to you{'\n'}
            • Can be deleted by you at any time{'\n'}
            • Are automatically backed up for your safety
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>9. Children's Privacy</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            RakshaDrishti is intended for users 13 years and older. We do not knowingly collect information from children under 13. If you believe a child has provided us with personal information, please contact us immediately.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>10. Changes to Privacy Policy</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            We may update this Privacy Policy periodically. We will notify you of significant changes through the app or via email. Continued use of the app after changes constitutes acceptance of the updated policy.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>11. Contact Us</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            If you have questions about this Privacy Policy:{'\n\n'}
            📧 Email: privrakshadrishti@gmail.com{'\n'}
            📞 Phone: +91 8016298847{'\n'}
            ☎️ Telephone: 8016298847{'\n'}
            💬 WhatsApp: +91 8016298847{'\n'}
            🌐 Website: www.rakshadrishti.com
          </Text>
        </View>

        <View style={[styles.highlightBox, { backgroundColor: '#E8F4F8', borderLeftColor: colors.primary }]}>
          <Text style={styles.highlightTitle}>🔒 Your Privacy Matters</Text>
          <Text style={styles.highlightText}>
            We are committed to protecting your privacy and using your data solely for your safety and security. Your trust is our priority.
          </Text>
        </View>

        {onAccept && (
          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: colors.primary }]}
            onPress={handleAccept}
          >
            <Text style={styles.acceptButtonText}>I Accept the Privacy Policy</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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
    flex: 1,
    padding: 20,
  },
  section: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 13,
    lineHeight: 20,
  },
  highlightBox: {
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 20,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  highlightText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  acceptButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PrivacyPolicyScreen;

