import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import { useAuth } from '../../hooks/useAuth';
import {
  getTrustedContacts,
  addTrustedContact,
  deleteTrustedContact,
  isMaxContactsReached,
} from '../../services/contactsService';

const ContactsScreen = () => {
  const { t } = useTranslation();
  
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [maxReached, setMaxReached] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const contactsList = await getTrustedContacts(user.uid);
      setContacts(contactsList);
      const isMax = await isMaxContactsReached(user.uid);
      setMaxReached(isMax);
    } catch (error) {
      Alert.alert(t('error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!name || !phone) {
      Alert.alert(t('error') || 'Error', t('please_fill_required_fields') || 'Please fill in all required fields');
      return;
    }

    try {
      console.log('📞 Adding contact:', { name, phone, email });
      const result = await addTrustedContact(user.uid, { name, phone, email });
      console.log('✅ Contact added successfully:', result);

      setName('');
      setPhone('');
      setEmail('');
      setModalVisible(false);

      await fetchContacts();

      Alert.alert(t('success') || 'Success', t('contact_added') || 'Contact added successfully');
    } catch (error) {
      console.error('❌ Error adding contact:', error);
      Alert.alert(
        t('error') || 'Error',
        error.message || 'Failed to add contact. Please try again.'
      );
    }
  };

  const handleDeleteContact = async (contactId) => {
    Alert.alert(t('confirm'), t('delete_this_contact'), [
      { text: t('cancel'), onPress: () => {} },
      {
        text: t('delete'),
        onPress: async () => {
          try {
            await deleteTrustedContact(user.uid, contactId);
            fetchContacts();
            Alert.alert(t('success'), t('contact_deleted'));
          } catch (error) {
            Alert.alert(t('error'), error.message);
          }
        },
      },
    ]);
  };

  const renderContactItem = ({ item }) => (
    <View style={styles.contactCard}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>📱 {item.phone}</Text>
        {item.email && <Text style={styles.contactEmail}>✉️ {item.email}</Text>}
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteContact(item.id)}
      >
        <Text style={styles.deleteButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('trusted_contacts')}</Text>
      </View>

      {contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{t('no_contacts')}</Text>
        </View>
      ) : (
        <View style={styles.contactsContainer}>
          <FlatList
            data={contacts}
            renderItem={renderContactItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      )}

      {!maxReached && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ {t('add_trusted_contact')}</Text>
        </TouchableOpacity>
      )}

      {maxReached && (
        <View style={styles.maxReachedBox}>
          <Text style={styles.maxReachedText}>
            {t('max_contacts_reached')}
          </Text>
        </View>
      )}

      {/* Add Contact Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('add_trusted_contact')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('contact_name')} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('contact_name')}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('contact_phone')} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('contact_phone')}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('contact_email')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('contact_email')}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddContact}
              >
                <Text style={styles.submitButtonText}>{t('add')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.gray600,
  },
  contactsContainer: {
    padding: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 13,
    color: colors.gray600,
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 13,
    color: colors.gray600,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    margin: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  maxReachedBox: {
    margin: 20,
    padding: 15,
    backgroundColor: colors.warning,
    borderRadius: 8,
    alignItems: 'center',
  },
  maxReachedText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray800,
  },
  closeButton: {
    fontSize: 24,
    color: colors.gray600,
  },
  modalForm: {
    gap: 15,
  },
  inputGroup: {
    marginBottom: 10,
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
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ContactsScreen;

