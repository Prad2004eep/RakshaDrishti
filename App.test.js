/**
 * Simple Test App to Debug Blue Screen Issue
 * Replace App.js temporarily with this to isolate the problem
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { registerRootComponent } from 'expo';

function TestApp() {
  console.log('✅ Test App Loaded');

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>🎉 App is Working!</Text>
        <Text style={styles.subtitle}>If you see this, the basic app structure is fine.</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ What's Working:</Text>
          <Text style={styles.text}>• React Native is running</Text>
          <Text style={styles.text}>• Expo Go is connected</Text>
          <Text style={styles.text}>• Metro bundler is working</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 Next Steps:</Text>
          <Text style={styles.text}>1. Check terminal for any errors</Text>
          <Text style={styles.text}>2. Restore original App.js</Text>
          <Text style={styles.text}>3. Look for specific error messages</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Environment Check:</Text>
          <Text style={styles.text}>• Firebase API Key: {process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}</Text>
          <Text style={styles.text}>• Google Maps Key: {process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ? '✅ Set' : '❌ Missing'}</Text>
          <Text style={styles.text}>• Backend URL: {process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Common Issues:</Text>
          <Text style={styles.text}>• Firebase initialization error</Text>
          <Text style={styles.text}>• Missing dependencies</Text>
          <Text style={styles.text}>• Navigation setup error</Text>
          <Text style={styles.text}>• Context provider error</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>RakshaDrishti Debug Mode</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  text: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
    lineHeight: 20,
  },
  footer: {
    marginTop: 30,
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
});

export default registerRootComponent(TestApp);

