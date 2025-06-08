import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs 
      screenOptions={{
        tabBarStyle: styles.nav,
        tabBarActiveTintColor: '#00ff88',
        tabBarInactiveTintColor: '#888',
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIconStyle: styles.tabIcon,
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Dialer',
          tabBarIcon: ({ focused, color }) => (
            <Text style={{ fontSize: 20 }}>📞</Text>
          )
        }} 
      />
      <Tabs.Screen 
        name="recent" 
        options={{ 
          title: 'Recent',
          tabBarIcon: ({ focused, color }) => (
            <Text style={{ fontSize: 20 }}>🕐</Text>
          )
        }} 
      />
      <Tabs.Screen 
        name="contacts" 
        options={{ 
          title: 'Contacts',
          tabBarIcon: ({ focused, color }) => (
            <Text style={{ fontSize: 20 }}>👥</Text>
          )
        }} 
      />
      <Tabs.Screen 
        name="settings" 
        options={{ 
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          )
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
    height: 85,
    paddingBottom: 8,
    paddingTop: 8,
    maxWidth: 430, // Match mobile phone width
    alignSelf: 'center',
    width: '100%',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabIcon: {
    marginBottom: 2,
  },
});