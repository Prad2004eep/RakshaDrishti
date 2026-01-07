import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../services/authService';
import { auth, db } from '../../config/firebase';
import { deleteUser } from 'firebase/auth';
import { doc, deleteDoc, collection, getDocs } from 'firebase/firestore';

const PanicDeleteScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  const { user } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAllUserData = async (userId) => {
    try {
      // Delete all subcollections
      const subcollections = [
        'sos_alerts',
        'trusted_contacts',
        'location_history',
        'evidence',
        'check_ins',
      ];

      for (const subcollection of subcollections) {
        const subcollectionRef = collection(db, 'users', userId, subcollection);
        const snapshot = await getDocs(subcollectionRef);
        
        for (const document of snapshot.docs) {
          await deleteDoc(doc(db, 'users', userId, subcollection, document.id));
        }
      }

      // Delete user document
      await deleteDoc(doc(db, 'users', userId));
      
      console.log('All user data deleted from Firestore');
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
  };

  const handlePanicDelete = async () => {
    if (confirmText !== 'DELETE') {
      Alert.alert('Error', 'Please type DELETE to confirm');
      return;
    }

    Alert.alert(
      '⚠️ FINAL WARNING',
      'This action is IRREVERSIBLE. All your data will be permanently deleted:\n\n• Profile information\n• SOS alerts history\n• Trusted contacts\n• Location history\n• Evidence files\n• All app settings\n\nAre you absolutely sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'DELETE EVERYTHING',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const currentUser = auth.currentUser;
              
              if (!currentUser) {
                throw new Error('No user logged in');
              }

              // Delete all Firestore data
              await deleteAllUserData(currentUser.uid);

              // Delete Firebase Auth account
              await deleteUser(currentUser);

              Alert.alert(
                'Account Deleted',
                'Your account and all data have been permanently deleted.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // User will be automatically logged out
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert(
                'Error',
                error.message || 'Failed to delete account. Please try again or contact support.'
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚠️ Panic Delete</Text>
      </View>

      <ScrollView style={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.description}>
            {t('panic_delete_description') || 'Permanently delete your account and all associated data. This action cannot be undone.'}
          </Text>

          <View style={styles.warningBox}>
            <Ionicons name="warning" size={24} color={colors.danger} />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>DANGER ZONE</Text>
              <Text style={styles.warningText}>
                This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
              </Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>What will be deleted:</Text>
            <View style={styles.deleteList}>
              <Text style={styles.deleteItem}>✗ Your profile information</Text>
              <Text style={styles.deleteItem}>✗ All SOS alerts and history</Text>
              <Text style={styles.deleteItem}>✗ Trusted contacts list</Text>
              <Text style={styles.deleteItem}>✗ Location tracking history</Text>
              <Text style={styles.deleteItem}>✗ Evidence files and recordings</Text>
              <Text style={styles.deleteItem}>✗ Check-in history</Text>
              <Text style={styles.deleteItem}>✗ All app settings and preferences</Text>
            </View>
          </View>

          <View style={styles.confirmSection}>
            <Text style={styles.confirmTitle}>
              Type <Text style={{ fontWeight: 'bold', color: colors.danger }}>DELETE</Text> to confirm:
            </Text>
            <TextInput
              style={styles.confirmInput}
              placeholder="Type DELETE here"
              placeholderTextColor={colors.gray400}
              value={confirmText}
              onChangeText={setConfirmText}
              autoCapitalize="characters"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.deleteButton,
              (confirmText !== 'DELETE' || isDeleting) && styles.deleteButtonDisabled,
            ]}
            onPress={handlePanicDelete}
            disabled={confirmText !== 'DELETE' || isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.deleteButtonText}>🗑️ DELETE MY ACCOUNT PERMANENTLY</Text>
            )}
          </TouchableOpacity>

          <View style={styles.helpBox}>
            <Ionicons name="help-circle" size={20} color={colors.primary} />
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>Need Help?</Text>
              <Text style={styles.helpText}>
                If you're facing issues or have concerns, please contact our support team before deleting your account. We're here to help!
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 24,
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FEE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.danger,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: colors.gray700,
    lineHeight: 20,
  },
  infoSection: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 12,
  },
  deleteList: {
    gap: 8,
  },
  deleteItem: {
    fontSize: 14,
    color: colors.gray700,
    lineHeight: 20,
  },
  confirmSection: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  confirmTitle: {
    fontSize: 14,
    color: colors.gray800,
    marginBottom: 10,
  },
  confirmInput: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.gray800,
  },
  deleteButton: {
    backgroundColor: colors.danger,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpBox: {
    flexDirection: 'row',
    backgroundColor: colors.gray50,
    padding: 16,
    borderRadius: 12,
  },
  helpContent: {
    flex: 1,
    marginLeft: 12,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: colors.gray600,
    lineHeight: 18,
  },
});

export default PanicDeleteScreen;

