import { createContext, useCallback, useEffect, useState } from 'react';
import { getUserProfile, onAuthStateChanged } from '../services/authService';
import { initializeNotifications, configureNotificationChannels } from '../services/notificationService';
import { checkAdminRole, getOrCreateAdminProfile } from '../services/adminService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);
  const [linkedUsers, setLinkedUsers] = useState([]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const setupAuth = async () => {
      try {
        const unsubscribe = onAuthStateChanged(async (authUser) => {
          if (!isMounted) return;

          try {
            if (authUser) {
              setUser(authUser);

              // Check if user is an admin (email exists in trusted contacts)
              let adminStatus = false;
              if (authUser.email) {
                try {
                  console.log('🔍 Checking admin role for:', authUser.email);
                  const { isAdmin: isAdminResult, linkedUsers: users } = await checkAdminRole(authUser.email);
                  adminStatus = isAdminResult;

                  if (isMounted) {
                    setIsAdmin(adminStatus);
                    setLinkedUsers(users);

                    if (adminStatus) {
                      console.log('✅ User is an admin with', users.length, 'linked users');
                      // Create/update admin profile
                      const adminProf = await getOrCreateAdminProfile(authUser.email, users);
                      if (isMounted) setAdminProfile(adminProf);
                    } else {
                      console.log('ℹ️ User is not an admin');
                      setAdminProfile(null);
                    }
                  }
                } catch (adminErr) {
                  console.warn('⚠️ Could not check admin role:', adminErr);
                  adminStatus = false;
                  if (isMounted) {
                    setIsAdmin(false);
                    setAdminProfile(null);
                    setLinkedUsers([]);
                  }
                }
              }

              // Fetch user profile from Firestore (for regular users only)
              if (!adminStatus) {
                try {
                  const profile = await getUserProfile(authUser.uid);
                  if (isMounted) setUserProfile(profile);
                } catch (profileErr) {
                  console.warn('Could not fetch profile:', profileErr);
                  // Continue anyway
                }
              }

              // Initialize notifications for the user
              try {
                console.log('🔔 Initializing notifications for user...');
                await configureNotificationChannels();
                await initializeNotifications(authUser.uid);
                console.log('✅ Notifications initialized');
              } catch (notifErr) {
                console.warn('⚠️ Could not initialize notifications:', notifErr);
                // Continue anyway - notifications are not critical for app function
              }
            } else {
              setUser(null);
              setUserProfile(null);
              setIsAdmin(false);
              setAdminProfile(null);
              setLinkedUsers([]);
            }
          } catch (err) {
            console.error('Error in auth state change:', err);
            setError(err.message);
          } finally {
            if (isMounted) setLoading(false);
          }
        });

        return unsubscribe;
      } catch (err) {
        console.error('Error setting up auth:', err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    // Set a timeout to ensure loading state doesn't persist forever
    timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Auth initialization timeout, proceeding anyway');
        setLoading(false);
      }
    }, 5000);

    setupAuth();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const updateUserProfile = useCallback((newProfile) => {
    setUserProfile((prev) => ({
      ...prev,
      ...newProfile,
    }));
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    error,
    updateUserProfile,
    isAuthenticated: !!user,
    isAdmin,
    adminProfile,
    linkedUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

