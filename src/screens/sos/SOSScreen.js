import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import { useAuth } from '../../hooks/useAuth';
import { getSOSHistory } from '../../services/sosService';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';

const SOSScreen = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [sosHistory, setSOSHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSOS, setSelectedSOS] = useState(null);
  const [sosEvents, setSOSEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);

  useEffect(() => {
    fetchSOSHistory();
  }, []);

  const fetchSOSHistory = async () => {
    try {
      setLoading(true);
      const history = await getSOSHistory(user.uid);
      setSOSHistory(history);
    } catch (error) {
      Alert.alert(t('error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSOSEvents = async (sosId) => {
    try {
      const eventsRef = collection(db, 'users', user.uid, 'sos_alerts', sosId, 'events');
      const q = query(eventsRef, orderBy('timestamp', 'desc'));
      const eventsSnap = await getDocs(q);

      const events = [];
      eventsSnap.forEach((doc) => {
        events.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setSOSEvents(events);
    } catch (error) {
      console.error('Error fetching SOS events:', error);
      setSOSEvents([]);
    }
  };

  const handleViewEvents = (sos) => {
    setSelectedSOS(sos);
    fetchSOSEvents(sos.id);
    setShowEventModal(true);
  };

  const renderSOSItem = ({ item }) => (
    <TouchableOpacity
      style={styles.sosItem}
      onPress={() => handleViewEvents(item)}
    >
      <View style={styles.sosItemHeader}>
        <View style={styles.statusBadge}>
          <Text style={[
            styles.sosItemStatus,
            item.status === 'active' && styles.statusActive,
            item.status === 'inactive' && styles.statusInactive,
          ]}>
            {item.status === 'active' ? '🔴 ACTIVE' : '✅ STOPPED'}
          </Text>
        </View>
        <Text style={styles.sosItemTime}>
          {new Date(item.createdAt?.toDate?.() || item.createdAt).toLocaleString()}
        </Text>
      </View>
      <View style={styles.sosItemDetails}>
        <Text style={styles.sosItemDetail}>
          📍 {item.location?.latitude?.toFixed(4)}, {item.location?.longitude?.toFixed(4)}
        </Text>
        <Text style={styles.sosItemDetail}>
          👤 {item.userProfile?.name}
        </Text>
        {item.duration && (
          <Text style={styles.sosItemDetail}>
            ⏱️ Duration: {Math.floor(item.duration / 60)}m {item.duration % 60}s
          </Text>
        )}
      </View>
      <View style={styles.viewEventsButton}>
        <Text style={styles.viewEventsText}>View Events →</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEventItem = ({ item }) => (
    <View style={styles.eventItem}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventType}>
          {item.type === 'sos_stopped' ? '🛑 SOS Stopped' : '📝 Event'}
        </Text>
        <Text style={styles.eventTime}>
          {new Date(item.timestamp?.toDate?.() || item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      <Text style={styles.eventDetail}>{item.reason || item.type}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('emergency')}</Text>
      </View>

      {sosHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {t('no_sos_alerts')}
          </Text>
        </View>
      ) : (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>{t('recent_alerts')}</Text>
          <FlatList
            data={sosHistory}
            renderItem={renderSOSItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>{t('emergency_sos_info')}</Text>
        <Text style={styles.infoText}>
          • {t('sos_info_1')}{'\n'}
          • {t('sos_info_2')}{'\n'}
          • {t('sos_info_3')}{'\n'}
          • {t('sos_info_4')}
        </Text>
      </View>

      {/* SOS Events Modal */}
      <Modal
        visible={showEventModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEventModal(false)}>
              <Ionicons name="close" size={28} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>SOS Events</Text>
            <View style={{ width: 28 }} />
          </View>

          {sosEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No events recorded</Text>
            </View>
          ) : (
            <FlatList
              data={sosEvents}
              renderItem={renderEventItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.eventsList}
            />
          )}
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
  historyContainer: {
    padding: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray800,
    marginBottom: 15,
  },
  sosItem: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  sosItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sosItemStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.danger,
  },
  sosItemTime: {
    fontSize: 12,
    color: colors.gray600,
  },
  sosItemDetails: {
    gap: 5,
  },
  sosItemDetail: {
    fontSize: 13,
    color: colors.gray700,
  },
  infoBox: {
    margin: 20,
    padding: 15,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray800,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: colors.gray600,
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.gray200,
  },
  statusActive: {
    color: '#FF3B30',
  },
  statusInactive: {
    color: '#34C759',
  },
  viewEventsButton: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray300,
  },
  viewEventsText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  eventItem: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eventType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.gray800,
  },
  eventTime: {
    fontSize: 12,
    color: colors.gray600,
  },
  eventDetail: {
    fontSize: 12,
    color: colors.gray700,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingTop: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray800,
  },
  eventsList: {
    padding: 20,
  },
});

export default SOSScreen;

