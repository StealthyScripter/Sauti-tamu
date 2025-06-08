import { View, Text, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { mobileStyles } from '../../styles/mobileStyles';

export default function Settings() {
  const router = useRouter();
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

  return (
    <View style={mobileStyles.scrollContainer}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={mobileStyles.header}>Settings</Text>
        
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
          
          <TouchableOpacity style={mobileStyles.menuItem}>
            <Text style={mobileStyles.bodyText}>📞 Call Quality</Text>
            <Text style={[mobileStyles.smallText, { fontSize: 18 }]}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={mobileStyles.section}>
          <Text style={mobileStyles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={mobileStyles.menuItem}>
            <Text style={mobileStyles.bodyText}>❓ Help Center</Text>
            <Text style={[mobileStyles.smallText, { fontSize: 18 }]}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={mobileStyles.menuItem}>
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