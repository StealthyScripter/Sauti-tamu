import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarStyle: styles.nav,
      tabBarActiveTintColor: '#00ff88',
      tabBarInactiveTintColor: '#888',
      headerShown: false,
    }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Dialer',
          tabBarIcon: () => '📞'
        }} 
      />
      <Tabs.Screen 
        name="recent" 
        options={{ 
          title: 'Recent',
          tabBarIcon: () => '🕐'
        }} 
      />
      <Tabs.Screen 
        name="contacts" 
        options={{ 
          title: 'Contacts',
          tabBarIcon: () => '👥'
        }} 
      />
      <Tabs.Screen 
        name="settings" 
        options={{ 
          title: 'Settings',
          tabBarIcon: () => '⚙️'
        }} 
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  nav: {
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    maxWidth: 410,
    alignSelf: 'center',
    width: '100%',
  },
});