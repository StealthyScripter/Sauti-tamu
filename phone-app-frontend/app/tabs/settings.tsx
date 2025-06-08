import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';

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
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>
      
      {settingsOptions.map((option, index) => (
        <View key={index} style={styles.settingItem}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>{option.title}</Text>
            <Text style={styles.settingDescription}>{option.description}</Text>
          </View>
          <Switch
            value={option.value}
            onValueChange={option.onToggle}
            trackColor={{ false: '#444', true: '#00ff88' }}
            thumbColor={option.value ? '#fff' : '#ccc'}
          />
        </View>
      ))}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/profile')}
        >
          <Text style={styles.menuText}>👤 Profile</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>💳 Billing & Usage</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>📞 Call Quality</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>❓ Help Center</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>📧 Contact Support</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>⭐ Rate App</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Version 1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 410,
    width: '100%',
    alignSelf: 'center',
    flex: 1,
    backgroundColor: '#0f0f23',
    padding: 20,
  },
  header: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    color: '#00ff88',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
  },
  arrow: {
    color: '#ccc',
    fontSize: 18,
  },
  version: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
});