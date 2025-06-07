import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import React from 'react';

export default function BottomNav() {
  return (
    <Tabs screenOptions={{
      tabBarStyle: styles.nav,
      tabBarActiveTintColor: '#00ff88',
      headerShown: false,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Dialer' }} />
      <Tabs.Screen name="recent" options={{ title: 'Recent' }} />
      <Tabs.Screen name="contacts" options={{ title: 'Contacts' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  nav: {
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
});
