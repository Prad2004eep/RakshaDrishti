import { registerRootComponent } from 'expo';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { StatusBar, LogBox, View, Text, StyleSheet } from 'react-native';
import i18n from './src/config/i18n';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { SOSProvider } from './src/contexts/SOSContext';
import RootNavigator from './src/navigation/RootNavigator';

// Suppress ALL warnings and errors in console
LogBox.ignoreAllLogs(true);

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.log('❌ [ErrorBoundary] Caught error:', error);
    console.log('❌ [ErrorBoundary] Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ Something went wrong</Text>
          <Text style={styles.errorText}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
          <Text style={styles.errorHint}>
            Please restart the app
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

function App() {
  console.log('✅ [App] App component rendered');

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <I18nextProvider i18n={i18n}>
          <AuthProvider>
            <SOSProvider>
              <RootNavigator />
              <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={false} />
            </SOSProvider>
          </AuthProvider>
        </I18nextProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorHint: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default registerRootComponent(App);

