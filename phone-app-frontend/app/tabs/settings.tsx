import { View, Text, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { mobileStyles } from '../../styles/mobileStyles';
import { useAuth } from '../../context/AuthContext';
import { AppIcons, Icon } from '../../components/Icons';

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <AppIcons.profile size={20} color="#00ff88" />
            <Text style={mobileStyles.bodyTextBold}>Logged in as</Text>
          </View>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <AppIcons.profile size={20} color="#fff" />
              <Text style={mobileStyles.bodyText}>Profile</Text>
            </View>
            <AppIcons.chevronRight size={18} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={mobileStyles.menuItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon library="ionicons" name="card" size={20} color="#fff" />
              <Text style={mobileStyles.bodyText}>Billing & Usage</Text>
            </View>
            <AppIcons.chevronRight size={18} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={mobileStyles.menuItem}
            onPress={() => router.push('../call-quality')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <AppIcons.quality size={20} />
              <Text style={mobileStyles.bodyText}>Call Quality</Text>
            </View>
            <AppIcons.chevronRight size={18} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={mobileStyles.menuItem}
            onPress={handleSignOut}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <AppIcons.logout size={20} />
              <Text style={[mobileStyles.bodyText, { color: '#ff4757' }]}>Sign Out</Text>
            </View>
            <AppIcons.chevronRight size={18} color="#888" />
          </TouchableOpacity>
        </View>

        <View style={mobileStyles.section}>
          <Text style={mobileStyles.sectionTitle}>Support</Text>
          
          <TouchableOpacity 
            style={mobileStyles.menuItem}
            onPress={() => router.push('../help-center')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <AppIcons.help size={20} color="#fff" />
              <Text style={mobileStyles.bodyText}>Help Center</Text>
            </View>
            <AppIcons.chevronRight size={18} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={mobileStyles.menuItem}
            onPress={() => router.push('../contact-support')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <AppIcons.support size={20} color="#fff" />
              <Text style={mobileStyles.bodyText}>Contact Support</Text>
            </View>
            <AppIcons.chevronRight size={18} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={mobileStyles.menuItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon library="ionicons" name="star" size={20} color="#fff" />
              <Text style={mobileStyles.bodyText}>Rate App</Text>
            </View>
            <AppIcons.chevronRight size={18} color="#888" />
          </TouchableOpacity>
        </View>

        <Text style={mobileStyles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}