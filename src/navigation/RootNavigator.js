import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../utils/colors';
import FloatingSOSControl from '../components/FloatingSOSControl';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import PhoneAuthScreen from '../screens/auth/PhoneAuthScreen';

// App Screens
import ContactsScreen from '../screens/contacts/ContactsScreen';
import FeedScreen from '../screens/feed/FeedScreen';
import HomeScreen from '../screens/home/HomeScreen';
import LocationScreen from '../screens/location/LocationScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import SOSScreen from '../screens/sos/SOSScreen';

// Settings Screens
import ProfileScreen from '../screens/settings/ProfileScreen';
import AppLockScreen from '../screens/settings/AppLockScreen';
import PermissionsScreen from '../screens/settings/PermissionsScreen';
import PanicDeleteScreen from '../screens/settings/PanicDeleteScreen';
import HelpSupportScreen from '../screens/settings/HelpSupportScreen';
import PrivacyPolicyScreen from '../screens/settings/PrivacyPolicyScreen';

// Feature Screens
import FakeCallSetupScreen from '../screens/fakeCall/FakeCallSetupScreen';
import FakeCallScreen from '../screens/fakeCall/FakeCallScreen';
import CheckInTimerScreen from '../screens/checkIn/CheckInTimerScreen';
import SelfDefenseHubScreen from '../screens/selfDefense/SelfDefenseHubScreen';
import RoutesScreen from '../screens/routes/RoutesScreen';
import EvidenceRecordingScreen from '../screens/evidence/EvidenceRecordingScreen';
import DangerZoneAlertsScreen from '../screens/location/DangerZoneAlertsScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminAlertsScreen from '../screens/admin/AdminAlertsScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import AdminChatScreen from '../screens/admin/AdminChatScreen';
import AdminEvidenceScreen from '../screens/admin/AdminEvidenceScreen';
import AdminProfileSetupScreen from '../screens/admin/AdminProfileSetupScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import AIAnalyticsScreen from '../screens/admin/AIAnalyticsScreen';
import AIReportsScreen from '../screens/admin/AIReportsScreen';
import AIHistoryScreen from '../screens/admin/AIHistoryScreen';
import LiveLocationScreen from '../screens/admin/LiveLocationScreen';
import AdminSafetyFeedScreen from '../screens/admin/AdminSafetyFeedScreen';

// Chat Screen
import ChatScreen from '../screens/chat/ChatScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack - Login, Signup, Onboarding
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
};

// Home Stack - Home and related screens
const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Routes" component={RoutesScreen} />
    </Stack.Navigator>
  );
};

// Location Stack - Location and related screens
const LocationStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="LocationMain" component={LocationScreen} />
      <Stack.Screen name="Routes" component={RoutesScreen} />
      <Stack.Screen name="DangerZoneAlerts" component={DangerZoneAlertsScreen} />
    </Stack.Navigator>
  );
};

// Settings Stack - Settings and related screens
const SettingsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="AppLock" component={AppLockScreen} />
      <Stack.Screen name="Permissions" component={PermissionsScreen} />
      <Stack.Screen name="PanicDelete" component={PanicDeleteScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="FakeCallSetup" component={FakeCallSetupScreen} />
      <Stack.Screen name="FakeCall" component={FakeCallScreen} />
      <Stack.Screen name="CheckInTimer" component={CheckInTimerScreen} />
      <Stack.Screen name="SelfDefenseHub" component={SelfDefenseHubScreen} />
      <Stack.Screen name="Routes" component={RoutesScreen} />
      <Stack.Screen name="EvidenceRecording" component={EvidenceRecordingScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
};

// Admin Settings Stack - Admin settings and related screens
const AdminSettingsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AdminSettingsMain" component={AdminSettingsScreen} />
      <Stack.Screen name="AdminProfile" component={AdminProfileScreen} />
      <Stack.Screen name="AIAnalytics" component={AIAnalyticsScreen} />
      <Stack.Screen name="AIReports" component={AIReportsScreen} />
      <Stack.Screen name="AIHistory" component={AIHistoryScreen} />
      <Stack.Screen name="AppLock" component={AppLockScreen} />
      <Stack.Screen name="Permissions" component={PermissionsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </Stack.Navigator>
  );
};

// App Stack - Main app with bottom tabs (User Mode)
const AppStack = () => {
  const { t } = useTranslation();

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false, // Hide tab navigator headers to avoid double headers
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'SOS') {
              iconName = focused ? 'alert-circle' : 'alert-circle-outline';
            } else if (route.name === 'Contacts') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'Location') {
              iconName = focused ? 'location' : 'location-outline';
            } else if (route.name === 'Feed') {
              iconName = focused ? 'newspaper' : 'newspaper-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{ title: t('home') || 'Home' }}
        />
        <Tab.Screen
          name="SOS"
          component={SOSScreen}
          options={{ title: t('sos') || 'SOS' }}
        />
        <Tab.Screen
          name="Contacts"
          component={ContactsScreen}
          options={{ title: t('contacts') || 'Contacts' }}
        />
        <Tab.Screen
          name="Location"
          component={LocationStack}
          options={{ title: t('location') || 'Location' }}
        />
        <Tab.Screen
          name="Feed"
          component={FeedScreen}
          options={{ title: t('feed') || 'Feed' }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsStack}
          options={{ title: t('settings') || 'Settings' }}
        />
      </Tab.Navigator>

      {/* Global Floating SOS Control - Always visible when SOS is active */}
      <FloatingSOSControl />
    </>
  );
};

// Admin Stack - Admin app with bottom tabs (Admin Mode)
const AdminStack = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />
      <Stack.Screen name="AdminChat" component={AdminChatScreen} />
      <Stack.Screen
        name="AdminEvidence"
        component={AdminEvidenceScreen}
        options={{ headerShown: true, title: 'Evidence Records' }}
      />
      <Stack.Screen name="LiveLocation" component={LiveLocationScreen} />
    </Stack.Navigator>
  );
};

// Admin Tab Navigator
const AdminTabNavigator = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Alerts') {
            iconName = focused ? 'alert-circle' : 'alert-circle-outline';
          } else if (route.name === 'Users') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'SafetyFeed') {
            iconName = focused ? 'newspaper' : 'newspaper-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Alerts"
        component={AdminAlertsScreen}
        options={{ title: 'Alerts' }}
      />
      <Tab.Screen
        name="Users"
        component={AdminUsersScreen}
        options={{ title: 'Users' }}
      />
      <Tab.Screen
        name="SafetyFeed"
        component={AdminSafetyFeedScreen}
        options={{ title: 'Safety Feed' }}
      />
      <Tab.Screen
        name="Settings"
        component={AdminSettingsStack}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

// Root Navigator - Switches between Auth, User App, and Admin App
const RootNavigator = () => {
  const { isAuthenticated, loading, isAdmin, adminProfile } = useAuth();

  console.log('🔍 [RootNavigator] isAuthenticated:', isAuthenticated, 'loading:', loading, 'isAdmin:', isAdmin);

  // Show loading screen while checking auth state
  if (loading) {
    console.log('⏳ [RootNavigator] Showing loading screen');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  console.log('✅ [RootNavigator] Rendering navigation');

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : isAdmin ? (
          // Check if admin has profile, if not show profile setup
          !adminProfile || !adminProfile.name ? (
            <Stack.Screen name="AdminProfileSetup" component={AdminProfileSetupScreen} />
          ) : (
            <Stack.Screen name="AdminApp" component={AdminStack} />
          )
        ) : (
          <Stack.Screen name="MainApp" component={AppStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
