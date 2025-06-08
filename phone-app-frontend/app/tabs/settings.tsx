import { View, Text, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { mobileStyles } from '../../styles/mobileStyles';
import { useAuth } from '../../context/AuthContext';

export default function Settings() {
  const router = useRouter();
  const { user, logout } = useAuth();
  
  // Boolean variables to track settings status
  const [aiRouting, setAiRouting] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [autoRecord, setAutoRecord] = useState(false);

  const settingsOptions = [
    {
      title: 'AI Call Routing',
      description: 'Automatically find the best rates',
      value: aiRouting,
      onToggle: setAiRouting,
    },
    {
      title: 'Push Notifications',
      description: 'Get alerts for missed calls and updates',
      value: notifications,
      onToggle: setNotifications,
    },
    {
      title: 'Auto Record Calls',
      description: 'Automatically record outgoing calls',
      value: autoRecord,
      onToggle: setAutoRecord,
    },
  ];

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation will happen automatically via auth state change
            } catch (error) {
              console.error('❌ Logout error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }

          }
        }
      ]
    );
  };

  return (
    <View style={mobileStyles.scrollContainer}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={mobileStyles.header}>Settings</Text>
        {/* User Info */}
        <View style={mobileStyles.infoCard}>
          <Text style={mobileStyles.bodyTextBold}>👤 Logged in as</Text>
          <Text style={mobileStyles.greenText}>{user?.displayName || 'User'}</Text>
          <Text style={mobileStyles.smallText}>{user?.phoneNumber}</Text>
        </View>
        
        {settingsOptions.map((option, index) => (
          <View key={index} style={mobileStyles.settingItem}>
            <View style={{ flex: 1 }}>
              <Text style={mobileStyles.bodyTextBold}>{option.title}</Text>
              <Text style={mobileStyles.smallText}>{option.description}</Text>
            </View>
            <Switch
              value={option.value}
              onValueChange={option.onToggle}
              trackColor={{ false: '#444', true: '#00ff88' }}
              thumbColor={option.value ? '#fff' : '#ccc'}
            />
          </View>
        ))}

        <View style={mobileStyles.section}>
          <Text style={mobileStyles.sectionTitle}>Account</Text>
          
          <TouchableOpacity 
            style={mobileStyles.menuItem}
            onPress={() => router.push('/profile')}
          >
            <Text style={mobileStyles.bodyText}>👤 Profile</Text>

            <Text style={[mobileStyles.smallText, { fontSize: 18 }]}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={mobileStyles.menuItem}>

            <Text style={mobileStyles.bodyText}>💳 Billing & Usage</Text>
            <Text style={[mobileStyles.smallText, { fontSize: 18 }]}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={mobileStyles.menuItem}
            onPress={() => router.push('/call-quality')}
          >
            <Text style={mobileStyles.bodyText}>📞 Call Quality</Text>
            <Text style={[mobileStyles.smallText, { fontSize: 18 }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={mobileStyles.menuItem}
            onPress={handleSignOut}
          >
            <Text style={[mobileStyles.bodyText, { color: '#ff4757' }]}>🚪 Sign Out</Text>
            <Text style={[mobileStyles.smallText, { fontSize: 18 }]}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={mobileStyles.section}>
          <Text style={mobileStyles.sectionTitle}>Support</Text>
          
          <TouchableOpacity 
            style={mobileStyles.menuItem}
            onPress={() => router.push('/help-center')}
          >
            <Text style={mobileStyles.bodyText}>❓ Help Center</Text>
            <Text style={[mobileStyles.smallText, { fontSize: 18 }]}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={mobileStyles.menuItem}
            onPress={() => router.push('/contact-support')}
          >
            <Text style={mobileStyles.bodyText}>📧 Contact Support</Text>
            <Text style={[mobileStyles.smallText, { fontSize: 18 }]}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={mobileStyles.menuItem}>
            <Text style={mobileStyles.bodyText}>⭐ Rate App</Text>
            <Text style={[mobileStyles.smallText, { fontSize: 18 }]}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={mobileStyles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}