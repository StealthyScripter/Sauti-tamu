import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import { mobileStyles } from '../styles/mobileStyles';

export default function IncomingCall() {
  const router = useRouter();

  return (
    <View style={mobileStyles.callContainer}>
      <Text style={mobileStyles.subtitle}>Incoming Call</Text>
      
      <View style={mobileStyles.avatarLarge}>
        <Text style={mobileStyles.avatarTextLarge}>AK</Text>
      </View>
      
      <Text style={mobileStyles.title}>Ahmed Kofi</Text>
      <Text style={mobileStyles.smallText}>+234 803 123 4567</Text>
      
      <View style={[mobileStyles.buttonRow, { marginTop: 40, justifyContent: 'center', gap: 40 }]}>
        <TouchableOpacity 
          style={[mobileStyles.callControlButton, { backgroundColor: '#ff4757' }]} 
          onPress={() => router.push('/tabs/recent')}
        >
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>✕</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[mobileStyles.callControlButton, { backgroundColor: '#00ff88' }]} 
          onPress={() => router.push('/active-call')}
        >
          <Text style={{ color: '#000', fontSize: 24, fontWeight: 'bold' }}>✓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}