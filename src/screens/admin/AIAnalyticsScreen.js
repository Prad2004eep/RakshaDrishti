import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { colors } from '../../utils/colors';
import { useAuth } from '../../hooks/useAuth';
import { getLinkedUsersSOSAlerts } from '../../services/adminService';
import { generateSOSAnalytics } from '../../services/geminiService';

const { width } = Dimensions.get('window');

const AIAnalyticsScreen = ({ navigation }) => {
  const { adminProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    loadAnalytics();
  }, []);

  useEffect(() => {
    if (!loading && analytics) {
      // Trigger animations when data loads
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, analytics]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const allAlerts = await getLinkedUsersSOSAlerts(adminProfile.email);
      setAlerts(allAlerts);

      if (allAlerts.length > 0) {
        const aiAnalytics = await generateSOSAnalytics(allAlerts);
        setAnalytics(aiAnalytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
  const getChartData = () => {
    if (!alerts || alerts.length === 0) return null;

    // Time-based analysis (last 7 days)
    const last7Days = [];
    const alertsByDay = {};
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      last7Days.push(dateStr);
      alertsByDay[dateStr] = 0;
    }

    alerts.forEach(alert => {
      const alertDate = alert.createdAt?.toDate();
      if (alertDate) {
        const dateStr = alertDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        if (alertsByDay.hasOwnProperty(dateStr)) {
          alertsByDay[dateStr]++;
        }
      }
    });

    // Status distribution
    const statusCounts = {
      active: alerts.filter(a => a.status === 'active').length,
      resolved: alerts.filter(a => a.status === 'resolved').length,
    };

    // Trigger method distribution
    const triggerMethods = {};
    alerts.forEach(alert => {
      const method = alert.triggerMethod || 'manual';
      triggerMethods[method] = (triggerMethods[method] || 0) + 1;
    });

    return {
      timeData: {
        labels: last7Days,
        datasets: [{
          data: last7Days.map(day => alertsByDay[day] || 0),
        }],
      },
      statusData: [
        {
          name: 'Active',
          count: statusCounts.active,
          color: '#f5576c',
          legendFontColor: '#7F7F7F',
        },
        {
          name: 'Resolved',
          count: statusCounts.resolved,
          color: '#51cf66',
          legendFontColor: '#7F7F7F',
        },
      ],
      triggerData: {
        labels: Object.keys(triggerMethods),
        datasets: [{
          data: Object.values(triggerMethods),
        }],
      },
    };
  };

  const chartData = getChartData();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.loadingGradient}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons name="analytics" size={64} color={colors.white} />
          </Animated.View>
          <ActivityIndicator size="large" color={colors.white} style={{ marginTop: 20 }} />
          <Text style={styles.loadingText}>✨ Generating AI Analytics...</Text>
          <Text style={styles.loadingSubtext}>Analyzing SOS patterns with AI</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Analytics</Text>
        <TouchableOpacity onPress={loadAnalytics}>
          <Ionicons name="refresh" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!analytics || alerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={['#F0F4FF', '#E8F0FE']}
              style={styles.emptyGradient}
            >
              <Ionicons name="analytics-outline" size={80} color={colors.primary} />
              <Text style={styles.emptyText}>No data available for analysis</Text>
              <Text style={styles.emptySubtext}>SOS alerts will appear here once triggered</Text>
            </LinearGradient>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Stats Cards at Top */}
            <View style={styles.statsContainer}>
              <Animated.View style={[styles.statCard, { transform: [{ scale: scaleAnim }] }]}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.statGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="alert-circle" size={32} color={colors.white} />
                  <Text style={styles.statValue}>{alerts.length}</Text>
                  <Text style={styles.statLabel}>Total Alerts</Text>
                </LinearGradient>
              </Animated.View>

              <Animated.View style={[styles.statCard, { transform: [{ scale: scaleAnim }] }]}>
                <LinearGradient
                  colors={['#f093fb', '#f5576c']}
                  style={styles.statGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="warning" size={32} color={colors.white} />
                  <Text style={styles.statValue}>
                    {alerts.filter(a => a.status === 'active').length}
                  </Text>
                  <Text style={styles.statLabel}>Active</Text>
                </LinearGradient>
              </Animated.View>

              <Animated.View style={[styles.statCard, { transform: [{ scale: scaleAnim }] }]}>
                <LinearGradient
                  colors={['#4facfe', '#00f2fe']}
                  style={styles.statGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="checkmark-circle" size={32} color={colors.white} />
                  <Text style={styles.statValue}>
                    {alerts.filter(a => a.status === 'resolved').length}
                  </Text>
                  <Text style={styles.statLabel}>Resolved</Text>
                </LinearGradient>
              </Animated.View>
            </View>

            {/* Charts Section */}
            {chartData && (
              <>
                {/* Alert Trends Chart */}
                <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                      <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.iconGradient}
                      >
                        <Ionicons name="trending-up" size={24} color={colors.white} />
                      </LinearGradient>
                    </View>
                    <Text style={styles.cardTitle}>Alert Trends (Last 7 Days)</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <LineChart
                      data={chartData.timeData}
                      width={Math.max(width - 64, 350)}
                      height={220}
                      chartConfig={{
                        backgroundColor: '#ffffff',
                        backgroundGradientFrom: '#f8f9ff',
                        backgroundGradientTo: '#ffffff',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        style: {
                          borderRadius: 16,
                        },
                        propsForDots: {
                          r: '6',
                          strokeWidth: '2',
                          stroke: '#667eea',
                        },
                      }}
                      bezier
                      style={styles.chart}
                    />
                  </ScrollView>
                </Animated.View>

                {/* Status Distribution Chart */}
                <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                      <LinearGradient
                        colors={['#f093fb', '#f5576c']}
                        style={styles.iconGradient}
                      >
                        <Ionicons name="pie-chart" size={24} color={colors.white} />
                      </LinearGradient>
                    </View>
                    <Text style={styles.cardTitle}>Status Distribution</Text>
                  </View>
                  <PieChart
                    data={chartData.statusData}
                    width={width - 64}
                    height={220}
                    chartConfig={{
                      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    }}
                    accessor="count"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                    style={styles.chart}
                  />
                </Animated.View>

                {/* Trigger Methods Chart */}
                {chartData.triggerData.labels.length > 0 && (
                  <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.iconContainer}>
                        <LinearGradient
                          colors={['#4facfe', '#00f2fe']}
                          style={styles.iconGradient}
                        >
                          <Ionicons name="flash" size={24} color={colors.white} />
                        </LinearGradient>
                      </View>
                      <Text style={styles.cardTitle}>Trigger Methods</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <BarChart
                        data={chartData.triggerData}
                        width={Math.max(width - 64, 350)}
                        height={220}
                        chartConfig={{
                          backgroundColor: '#ffffff',
                          backgroundGradientFrom: '#f8f9ff',
                          backgroundGradientTo: '#ffffff',
                          decimalPlaces: 0,
                          color: (opacity = 1) => `rgba(79, 172, 254, ${opacity})`,
                          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                          style: {
                            borderRadius: 16,
                          },
                        }}
                        style={styles.chart}
                        showValuesOnTopOfBars
                      />
                    </ScrollView>
                  </Animated.View>
                )}
              </>
            )}

            {/* Summary Card */}
            <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.iconGradient}
                  >
                    <Ionicons name="bar-chart" size={24} color={colors.white} />
                  </LinearGradient>
                </View>
                <Text style={styles.cardTitle}>AI Summary</Text>
              </View>
              <Text style={styles.analyticsText}>{analytics.summary || analytics.text}</Text>
            </Animated.View>

            {/* Patterns Card */}
            {analytics.patterns && (
              <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <LinearGradient
                      colors={['#f093fb', '#f5576c']}
                      style={styles.iconGradient}
                    >
                      <Ionicons name="search" size={24} color={colors.white} />
                    </LinearGradient>
                  </View>
                  <Text style={styles.cardTitle}>Patterns Detected</Text>
                </View>
                <Text style={styles.analyticsText}>{analytics.patterns}</Text>
              </Animated.View>
            )}

            {/* Recommendations Card */}
            {analytics.recommendations && (
              <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <LinearGradient
                      colors={['#4facfe', '#00f2fe']}
                      style={styles.iconGradient}
                    >
                      <Ionicons name="bulb" size={24} color={colors.white} />
                    </LinearGradient>
                  </View>
                  <Text style={styles.cardTitle}>Recommendations</Text>
                </View>
                <View style={styles.recommendationsContainer}>
                  <Text style={styles.analyticsText}>{analytics.recommendations}</Text>
                </View>
              </Animated.View>
            )}

            {/* Insights Card */}
            {analytics.insights && (
              <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <LinearGradient
                      colors={['#fa709a', '#fee140']}
                      style={styles.iconGradient}
                    >
                      <Ionicons name="eye" size={24} color={colors.white} />
                    </LinearGradient>
                  </View>
                  <Text style={styles.cardTitle}>Key Insights</Text>
                </View>
                <Text style={styles.analyticsText}>{analytics.insights}</Text>
              </Animated.View>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyGradient: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    width: width - 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  analyticsText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  recommendationsContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default AIAnalyticsScreen;

