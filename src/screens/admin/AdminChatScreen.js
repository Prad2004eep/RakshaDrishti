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
  Keyboard,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import { useAuth } from '../../hooks/useAuth';
import { subscribeToMessages, sendMessageToUser, markMessagesAsRead } from '../../services/chatService';

const AdminChatScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { userId, userName } = route.params;
  const { adminProfile } = useAuth();

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
    navigation.setOptions({ headerShown: false });

    // Subscribe to messages
    const unsubscribe = subscribeToMessages(userId, adminProfile.email, (msgs) => {
      setMessages(msgs);
      // Mark messages as read
      markMessagesAsRead(userId, adminProfile.email, 'admin');
    });

    return () => unsubscribe();
  }, [userId, adminProfile.email]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    try {
      await sendMessageToUser(adminProfile.email, userId, inputText.trim(), 'Admin');
      setInputText('');
      flatListRef.current?.scrollToEnd();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item }) => {
    const isAdmin = item.senderType === 'admin';

    return (
      <View style={[styles.messageContainer, isAdmin ? styles.adminMessage : styles.userMessage]}>
        <Text style={[styles.messageSender, !isAdmin && { color: '#075E54' }]}>
          {item.senderName}
        </Text>
        <Text style={[styles.messageText, !isAdmin && { color: '#303030' }]}>
          {item.text}
        </Text>
        <Text style={[styles.messageTime, !isAdmin && { color: '#667781' }]}>
          {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleTimeString() : ''}
        </Text>
      </View>
    );
  };

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
          <Text style={styles.headerTitle}>{userName || 'User'}</Text>
          <Text style={styles.headerSubtitle}>Tap to view profile</Text>
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
  adminMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primaryLight, // App primary color
    borderBottomRightRadius: 2,
  },
  userMessage: {
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

export default AdminChatScreen;

