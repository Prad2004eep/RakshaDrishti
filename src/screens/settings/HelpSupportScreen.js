import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';

const HelpSupportScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const contactInfo = [
    {
      icon: '📧',
      title: 'Email Support',
      value: 'supprakshadrishti@gmail.com',
      action: () => Linking.openURL('mailto:supprakshadrishti@gmail.com'),
    },
    {
      icon: '📞',
      title: 'Phone Support',
      value: '+91 8016298847',
      action: () => Linking.openURL('tel:+918016298847'),
    },
    {
      icon: '☎️',
      title: 'Telephone',
      value: '8016298847',
      action: () => Linking.openURL('tel:8016298847'),
    },
    {
      icon: '💬',
      title: 'WhatsApp Support',
      value: '+91 8016298847',
      action: () => Linking.openURL('https://wa.me/918016298847'),
    },
  ];

  const faqs = [
    {
      question: 'How do I trigger an SOS alert?',
      answer: 'Press and hold the red SOS button on the Home screen for 3 seconds. Your location and alert will be sent to all your trusted contacts immediately.',
    },
    {
      question: 'How many trusted contacts can I add?',
      answer: 'You can add up to 5 trusted contacts. These contacts will receive your SOS alerts and location updates during emergencies.',
    },
    {
      question: 'Does the app work offline?',
      answer: 'Some features like evidence capture work offline. However, SOS alerts and location sharing require an internet connection to send notifications to your trusted contacts.',
    },
    {
      question: 'How do I change the app language?',
      answer: 'Go to Settings > Language and select your preferred language from the dropdown. The app supports 10+ Indian languages.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes! All your data is encrypted and stored securely in Firebase. We follow industry-standard security practices to protect your information.',
    },
    {
      question: 'How do I enable App Lock?',
      answer: 'Go to Settings > Privacy & Security > App Lock. You can enable biometric authentication (fingerprint/face) or set a PIN code.',
    },
    {
      question: 'What is the Fake Call feature?',
      answer: 'The Fake Call feature allows you to simulate an incoming call to help you exit uncomfortable situations discreetly.',
    },
    {
      question: 'How does location tracking work?',
      answer: 'When you enable location tracking, the app periodically updates your location. This data is only shared with your trusted contacts during an SOS alert.',
    },
  ];

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const ContactCard = ({ icon, title, value, action }) => (
    <TouchableOpacity
      style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={action}
    >
      <Text style={styles.contactIcon}>{icon}</Text>
      <View style={styles.contactInfo}>
        <Text style={[styles.contactTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.contactValue, { color: colors.primary }]}>{value}</Text>
      </View>
      <Text style={[styles.contactArrow, { color: colors.primary }]}>›</Text>
    </TouchableOpacity>
  );

  const FAQItem = ({ question, answer, index }) => {
    const isExpanded = expandedFAQ === index;
    return (
      <TouchableOpacity
        style={[styles.faqCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => toggleFAQ(index)}
      >
        <View style={styles.faqHeader}>
          <Text style={[styles.faqQuestion, { color: colors.text }]}>{question}</Text>
          <Text style={[styles.faqToggle, { color: colors.primary }]}>
            {isExpanded ? '−' : '+'}
          </Text>
        </View>
        {isExpanded && (
          <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{answer}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <Text style={styles.headerSubtitle}>We're here to help you</Text>
      </View>

      <View style={styles.content}>
        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📞 Contact Us</Text>
          {contactInfo.map((contact, index) => (
            <ContactCard key={index} {...contact} />
          ))}
        </View>

        {/* Emergency Resources */}
        <View style={[styles.emergencyBox, { backgroundColor: '#FEE', borderLeftColor: colors.danger }]}>
          <Text style={styles.emergencyIcon}>🚨</Text>
          <Text style={styles.emergencyTitle}>Emergency Numbers</Text>
          <View style={styles.emergencyList}>
            <TouchableOpacity
              style={styles.emergencyItem}
              onPress={() => Linking.openURL('tel:100')}
            >
              <Text style={styles.emergencyText}>Police: <Text style={styles.emergencyNumber}>100</Text></Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.emergencyItem}
              onPress={() => Linking.openURL('tel:1091')}
            >
              <Text style={styles.emergencyText}>Women Helpline: <Text style={styles.emergencyNumber}>1091</Text></Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.emergencyItem}
              onPress={() => Linking.openURL('tel:112')}
            >
              <Text style={styles.emergencyText}>National Emergency: <Text style={styles.emergencyNumber}>112</Text></Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>❓ Frequently Asked Questions</Text>
          {faqs.map((faq, index) => (
            <FAQItem key={index} {...faq} index={index} />
          ))}
        </View>

        {/* Additional Help */}
        <View style={[styles.infoBox, { backgroundColor: colors.card, borderLeftColor: colors.info }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>💡 Need More Help?</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            If you can't find the answer you're looking for, please contact our support team. We typically respond within 24 hours.
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
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  contactIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 13,
  },
  contactArrow: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  emergencyBox: {
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 25,
  },
  emergencyIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E63946',
    marginBottom: 15,
  },
  emergencyList: {
    gap: 10,
  },
  emergencyItem: {
    paddingVertical: 8,
  },
  emergencyText: {
    fontSize: 15,
    color: '#333',
  },
  emergencyNumber: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#E63946',
  },
  faqCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  faqToggle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
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
    lineHeight: 18,
  },
});

export default HelpSupportScreen;

