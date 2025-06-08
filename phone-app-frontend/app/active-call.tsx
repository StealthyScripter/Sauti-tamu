import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import { mobileStyles } from '../styles/mobileStyles';

export default function ActiveCall() {
  const router = useRouter();

  return (
    <View style={mobileStyles.callContainer}>
      <Text style={mobileStyles.subtitle}>Active Call</Text>
      
      <View style={mobileStyles.avatarLarge}>
        <Text style={mobileStyles.avatarTextLarge}>AK</Text>
      </View>
      
      <Text style={mobileStyles.title}>Ahmed Kofi</Text>
      <Text style={mobileStyles.greenText}>02:34</Text>
      <Text style={mobileStyles.smallText}>Saving $0.18/min • Total saved: $0.46</Text>
      
      <View style={mobileStyles.callControlGrid}>
        {['🔇', '⏸', '📞', '🔢', '📢', '⏺'].map((icon, i) => (
          <TouchableOpacity key={i} style={mobileStyles.callControlButton}>
            <Text style={{ fontSize: 24 }}>{icon}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity 
        style={mobileStyles.endCallButton} 
        onPress={() => router.push('/tabs/recent')}
      >
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}