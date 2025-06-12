import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import { mobileStyles } from '../styles/mobileStyles';
import { AppIcons, Icon } from '../components/Icons';

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
        <TouchableOpacity style={mobileStyles.callControlButton}>
          <AppIcons.mute size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={mobileStyles.callControlButton}>
          <Icon library="ionicons" name="pause" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={mobileStyles.callControlButton}>
          <AppIcons.speaker size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={mobileStyles.callControlButton}>
          <AppIcons.keypad size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={mobileStyles.callControlButton}>
          <Icon library="ionicons" name="volume-high" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={mobileStyles.callControlButton}>
          <AppIcons.record size={24} />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={mobileStyles.endCallButton} 
        onPress={() => router.push('/tabs/recent')}
      >
        <Icon library="ionicons" name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
      </TouchableOpacity>
    </View>
  );
}