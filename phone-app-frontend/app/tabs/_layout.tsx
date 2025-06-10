import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import React from 'react';
import { AppIcons } from '../../components/Icons';

const TabIcon = ({ 
  IconComponent, 
  focused, 
  size = 20 
}: { 
  IconComponent: React.ComponentType<any>; 
  focused: boolean;
  size?: number;
}) => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <IconComponent 
      size={size} 
      color={focused ? '#00ff88' : '#888'} 
    />
  </View>
);

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
          tabBarIcon: ({ focused }) => (
            <TabIcon IconComponent={AppIcons.phone} focused={focused} />
          )
        }} 
      />
      <Tabs.Screen 
        name="recent" 
        options={{ 
          title: 'Recent',
          tabBarIcon: ({ focused }) => (
            <TabIcon IconComponent={AppIcons.recent} focused={focused} />
          )
        }} 
      />
      <Tabs.Screen 
        name="contacts" 
        options={{ 
          title: 'Contacts',
          tabBarIcon: ({ focused }) => (
            <TabIcon IconComponent={AppIcons.contacts} focused={focused} />
          )
        }} 
      />
      <Tabs.Screen 
        name="settings" 
        options={{ 
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabIcon IconComponent={AppIcons.settings} focused={focused} />
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
    maxWidth: 430,
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