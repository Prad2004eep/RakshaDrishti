import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../utils/colors';
import { useAuth } from '../../hooks/useAuth';
import { getLinkedUsersSOSAlerts } from '../../services/adminService';
import { generateSOSAnalytics } from '../../services/geminiService';
import { db } from '../../config/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { sendLocalNotification } from '../../services/notificationService';

const AdminDashboardScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { adminProfile, linkedUsers } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeAlerts: 0,
    totalAlerts: 0,
    resolvedAlerts: 0,
  });
  const [expandedCard, setExpandedCard] = useState(null);
  const [liveNotification, setLiveNotification] = useState(null);

  // Animation for live notification
  const notificationAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (adminProfile) {
      loadDashboardData();
    }
  }, [adminProfile]);

  // Real-time listener for new SOS alerts
  useEffect(() => {
    if (!adminProfile || !linkedUsers || linkedUsers.length === 0) {
      return;
    }

    console.log('🔔 Setting up real-time SOS alert listener for admin...');

    const unsubscribers = [];

    // Set up a listener for each linked user's SOS alerts
    linkedUsers.forEach((user) => {
      const sosRef = collection(db, 'users', user.userId, 'sos_alerts');
      const q = query(
        sosRef,
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const alert = change.doc.data();
            const alertId = change.doc.id;

            console.log(`🚨 New SOS alert detected from ${user.userName}!`);

            // Show live on-screen notification
            setLiveNotification({
              userName: user.userName,
              alertId: alertId,
              userId: user.userId,
              timestamp: Date.now(),
              location: alert.location,
            });

            // Animate notification in
            Animated.spring(notificationAnim, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 7,
            }).start();

            // Auto-dismiss after 10 seconds
            setTimeout(() => {
              Animated.timing(notificationAnim, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
              }).start(() => {
                setLiveNotification(null);
              });
            }, 10000);

            // Send local notification to admin
            sendLocalNotification(
              `🚨 SOS ALERT from ${user.userName}`,
              `Emergency alert triggered! Tap to view details.`,
              {
                type: 'sos_alert',
                sosId: alertId,
                userId: user.userId,
                userName: user.userName,
                location: alert.location,
              }
            );

            // Refresh dashboard data
            loadDashboardData();
          }
        });
      }, (error) => {
        console.error(`❌ Error listening to SOS alerts for ${user.userName}:`, error);
      });

      unsubscribers.push(unsubscribe);
    });

    return () => {
      console.log('🛑 Unsubscribing from SOS alert listeners');
      unsubscribers.forEach(unsub => unsub());
    };
  }, [adminProfile, linkedUsers]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Check if admin profile exists
      if (!adminProfile || !adminProfile.email) {
        console.warn('⚠️ Admin profile not loaded yet');
        setLoading(false);
        return;
      }

      // Get active SOS alerts
      const alerts = await getLinkedUsersSOSAlerts(adminProfile.email);
      setActiveAlerts(alerts);

      // Calculate stats
      setStats({
        totalUsers: linkedUsers.length,
        activeAlerts: alerts.filter(a => a.status === 'active').length,
        totalAlerts: alerts.length,
        resolvedAlerts: alerts.filter(a => a.status === 'resolved').length,
      });

      // Generate AI analytics
      if (alerts.length > 0) {
        try {
          const aiAnalytics = await generateSOSAnalytics(alerts);
          setAnalytics(aiAnalytics);
        } catch (aiError) {
          console.warn('AI analytics failed:', aiError);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Live SOS Notification Banner */}
      {liveNotification && (
        <Animated.View
          style={[
            styles.liveNotificationBanner,
            { transform: [{ translateY: notificationAnim }] }
          ]}
        >
          <TouchableOpacity
            style={styles.notificationContent}
            onPress={() => {
              navigation.navigate('AdminAlerts', { alertId: liveNotification.alertId });
              Animated.timing(notificationAnim, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
              }).start(() => {
                setLiveNotification(null);
              });
            }}
          >
            <View style={styles.notificationIcon}>
              <Ionicons name="alert-circle" size={28} color={colors.white} />
            </View>
            <View style={styles.notificationTextContainer}>
              <Text style={styles.notificationTitle}>🚨 NEW SOS ALERT</Text>
              <Text style={styles.notificationText}>
                {liveNotification.userName} triggered an emergency alert
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Animated.timing(notificationAnim, {
                  toValue: -100,
                  duration: 300,
                  useNativeDriver: true,
                }).start(() => {
                  setLiveNotification(null);
                });
              }}
            >
              <Ionicons name="close-circle" size={24} color={colors.white} />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🛡️ {adminProfile?.name || 'Admin'}</Text>
          <Text style={styles.headerSubtitle}>Monitoring {stats.totalUsers} user{stats.totalUsers !== 1 ? 's' : ''}</Text>
        </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {/* Total Users Card */}
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: colors.primary }]}
          onPress={() => setExpandedCard(expandedCard === 'users' ? null : 'users')}
          activeOpacity={0.8}
        >
          <Ionicons name="people" size={24} color={colors.white} style={styles.statIcon} />
          <Text style={styles.statNumber}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>{t('linked_users')}</Text>
          {expandedCard === 'users' && (
            <View style={styles.expandedContent}>
              <View style={styles.divider} />
              {linkedUsers && linkedUsers.length > 0 ? (
                linkedUsers.map((user, index) => (
                  <View key={index} style={styles.expandedItem}>
                    <Ionicons name="person-circle" size={16} color={colors.white} />
                    <Text style={styles.expandedText}>{user.userName}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.expandedText}>No linked users</Text>
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Active Alerts Card */}
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: colors.danger }]}
          onPress={() => setExpandedCard(expandedCard === 'active' ? null : 'active')}
          activeOpacity={0.8}
        >
          <Ionicons name="warning" size={24} color={colors.white} style={styles.statIcon} />
          <Text style={styles.statNumber}>{stats.activeAlerts}</Text>
          <Text style={styles.statLabel}>{t('active_alerts')}</Text>
          {expandedCard === 'active' && (
            <View style={styles.expandedContent}>
              <View style={styles.divider} />
              {activeAlerts.filter(a => a.status === 'active').length > 0 ? (
                activeAlerts
                  .filter(a => a.status === 'active')
                  .slice(0, 3)
                  .map((alert, index) => (
                    <View key={index} style={styles.expandedItem}>
                      <Ionicons name="alert-circle" size={16} color={colors.white} />
                      <Text style={styles.expandedText} numberOfLines={1}>
                        {alert.userName} - {new Date(alert.createdAt?.toDate()).toLocaleTimeString()}
                      </Text>
                    </View>
                  ))
              ) : (
                <Text style={styles.expandedText}>No active alerts</Text>
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Resolved Alerts Card */}
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: colors.success }]}
          onPress={() => setExpandedCard(expandedCard === 'resolved' ? null : 'resolved')}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle" size={24} color={colors.white} style={styles.statIcon} />
          <Text style={styles.statNumber}>{stats.resolvedAlerts}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
          {expandedCard === 'resolved' && (
            <View style={styles.expandedContent}>
              <View style={styles.divider} />
              {activeAlerts.filter(a => a.status === 'resolved').length > 0 ? (
                activeAlerts
                  .filter(a => a.status === 'resolved')
                  .slice(0, 3)
                  .map((alert, index) => (
                    <View key={index} style={styles.expandedItem}>
                      <Ionicons name="checkmark" size={16} color={colors.white} />
                      <Text style={styles.expandedText} numberOfLines={1}>
                        {alert.userName} - {new Date(alert.createdAt?.toDate()).toLocaleDateString()}
                      </Text>
                    </View>
                  ))
              ) : (
                <Text style={styles.expandedText}>No resolved alerts</Text>
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Total Alerts Card */}
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: colors.secondary }]}
          onPress={() => setExpandedCard(expandedCard === 'total' ? null : 'total')}
          activeOpacity={0.8}
        >
          <Ionicons name="stats-chart" size={24} color={colors.white} style={styles.statIcon} />
          <Text style={styles.statNumber}>{stats.totalAlerts}</Text>
          <Text style={styles.statLabel}>Total Alerts</Text>
          {expandedCard === 'total' && (
            <View style={styles.expandedContent}>
              <View style={styles.divider} />
              <View style={styles.expandedItem}>
                <Ionicons name="alert-circle" size={16} color={colors.white} />
                <Text style={styles.expandedText}>Active: {stats.activeAlerts}</Text>
              </View>
              <View style={styles.expandedItem}>
                <Ionicons name="checkmark-circle" size={16} color={colors.white} />
                <Text style={styles.expandedText}>Resolved: {stats.resolvedAlerts}</Text>
              </View>
              <View style={styles.expandedItem}>
                <Ionicons name="time" size={16} color={colors.white} />
                <Text style={styles.expandedText}>
                  Last 24h: {activeAlerts.filter(a => {
                    const alertTime = a.createdAt?.toDate();
                    return alertTime && (Date.now() - alertTime.getTime()) < 24 * 60 * 60 * 1000;
                  }).length}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('quick_actions')}</Text>
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('LiveLocation')}
          >
            <Text style={styles.quickActionIcon}>📍</Text>
            <Text style={styles.quickActionText}>Live Location</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('AdminEvidence')}
          >
            <Text style={styles.quickActionIcon}>🎥</Text>
            <Text style={styles.quickActionText}>View Evidence</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Users')}
          >
            <Text style={styles.quickActionIcon}>👥</Text>
            <Text style={styles.quickActionText}>Manage Users</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Alerts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('sos_alerts')}</Text>
        {activeAlerts.filter(a => a.status === 'active').length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('no_active_alerts')}</Text>
          </View>
        ) : (
          activeAlerts
            .filter(a => a.status === 'active')
            .slice(0, 5)
            .map((alert) => (
              <TouchableOpacity
                key={alert.id}
                style={styles.alertCard}
                onPress={() => navigation.navigate('AdminAlerts', { alertId: alert.id })}
              >
                <View style={styles.alertHeader}>
                  <Text style={styles.alertUser}>{alert.userName}</Text>
                  <Text style={styles.alertTime}>
                    {new Date(alert.createdAt?.toDate()).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={styles.alertLocation}>
                  📍 {alert.location?.latitude?.toFixed(4)}, {alert.location?.longitude?.toFixed(4)}
                </Text>
                <Text style={styles.alertMethod}>Trigger: {alert.triggerMethod || 'manual'}</Text>
              </TouchableOpacity>
            ))
        )}
        {activeAlerts.filter(a => a.status === 'active').length > 5 && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('AdminAlerts')}
          >
            <Text style={styles.viewAllText}>{t('view_all_alerts')} →</Text>
          </TouchableOpacity>
        )}
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  liveNotificationBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 10,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger,
    padding: 16,
    paddingTop: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  notificationText: {
    fontSize: 13,
    color: colors.white,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    padding: 20,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statCard: {
    width: '48%',
    margin: '1%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 100,
  },
  statIcon: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
  },
  statLabel: {
    fontSize: 14,
    color: colors.white,
    marginTop: 5,
    textAlign: 'center',
  },
  expandedContent: {
    width: '100%',
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 8,
  },
  expandedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  expandedText: {
    fontSize: 12,
    color: colors.white,
    marginLeft: 8,
    flex: 1,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  alertCard: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  alertUser: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  alertTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  alertLocation: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 5,
  },
  alertMethod: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  viewAllButton: {
    padding: 15,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default AdminDashboardScreen;

