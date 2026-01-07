import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import { useAuth } from '../../hooks/useAuth';
import { getTrustedContacts } from '../../services/contactsService';
import { subscribeToMessages, sendMessageToAdmin, markMessagesAsRead } from '../../services/chatService';

const ChatScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, userProfile } = useAuth();

  const [adminContacts, setAdminContacts] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        // Scroll to bottom when keyboard opens
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    loadAdminContacts();
  }, []);

  useEffect(() => {
    if (selectedAdmin) {
      // Subscribe to messages
      const unsubscribe = subscribeToMessages(user.uid, selectedAdmin.email, (msgs) => {
        setMessages(msgs);
        // Mark messages as read
        markMessagesAsRead(user.uid, selectedAdmin.email, 'user');
      });

      return () => unsubscribe();
    }
  }, [selectedAdmin]);

  const loadAdminContacts = async () => {
    try {
      const contacts = await getTrustedContacts(user.uid);
      const adminsWithEmail = contacts.filter(c => c.email);
      setAdminContacts(adminsWithEmail);
      
      if (adminsWithEmail.length > 0) {
        setSelectedAdmin(adminsWithEmail[0]);
      }
    } catch (error) {
      console.error('Error loading admin contacts:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !selectedAdmin) return;

    try {
      await sendMessageToAdmin(
        user.uid,
        selectedAdmin.email,
        inputText.trim(),
        userProfile?.name || 'User'
      );
      setInputText('');
      flatListRef.current?.scrollToEnd();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.senderType === 'user';
    
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.adminMessage]}>
        <Text style={styles.messageSender}>{item.senderName}</Text>
        <Text style={[styles.messageText, isUser && { color: colors.text }]}>{item.text}</Text>
        <Text style={[styles.messageTime, isUser && { color: colors.textSecondary }]}>
          {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleTimeString() : ''}
        </Text>
      </View>
    );
  };

  if (adminContacts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('no_admin_contacts')}</Text>
        <Text style={styles.emptySubtext}>{t('add_trusted_contact_with_email')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Modern Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {selectedAdmin ? selectedAdmin.name : 'Chat with Admin'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {selectedAdmin ? selectedAdmin.email : 'Select an admin'}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="ellipsis-vertical" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Admin Selector */}
        {adminContacts.length > 1 && (
          <View style={styles.adminSelector}>
            <Text style={styles.selectorLabel}>Switch to:</Text>
            {adminContacts.map((admin) => (
              <TouchableOpacity
                key={admin.id}
                style={[
                  styles.adminButton,
                  selectedAdmin?.id === admin.id && styles.adminButtonActive,
                ]}
                onPress={() => setSelectedAdmin(admin)}
              >
              <Text style={[
                styles.adminButtonText,
                selectedAdmin?.id === admin.id && styles.adminButtonTextActive,
              ]}>
                {admin.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
        />

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={t('type_message')}
              placeholderTextColor={colors.gray400}
              multiline
              maxLength={500}
              onFocus={() => {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 150);
              }}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim()}
            >
              <Ionicons name="send" size={22} color={inputText.trim() ? colors.white : colors.gray400} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  flex1: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  // Modern Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 0 : 10,
    paddingBottom: 12,
    paddingHorizontal: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.9,
  },
  headerAction: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  adminSelector: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFF9E6',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginRight: 10,
  },
  adminButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.gray200,
    marginRight: 10,
  },
  adminButtonActive: {
    backgroundColor: colors.primary,
  },
  adminButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  adminButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    elevation: 1,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primaryLight, // App primary color
    borderBottomRightRadius: 2,
  },
  adminMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderBottomLeftRadius: 2,
  },
  messageSender: {
    fontSize: 11,
    fontWeight: '700',
    color: '#075E54', // Dark green
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  messageText: {
    fontSize: 15,
    color: '#303030',
    marginBottom: 4,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    color: '#667781',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  inputContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#F0F0F0',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.white,
    borderRadius: 25,
    paddingLeft: 4,
    paddingRight: 4,
    paddingVertical: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  input: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    marginRight: 4,
    maxHeight: 100,
    fontSize: 16,
    color: colors.text,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
});

export default ChatScreen;

