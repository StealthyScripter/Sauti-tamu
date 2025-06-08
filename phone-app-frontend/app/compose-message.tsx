import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import React, { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { mobileStyles } from '../styles/mobileStyles';

// Helper function to ensure string type from params
const getStringParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) {
    return param[0] || '';
  }
  return param || '';
};

export default function ComposeMessage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [message, setMessage] = useState('');
  const contactName = getStringParam(params.contactName) || 'Contact';
  const contactNumber = getStringParam(params.contactNumber) || '';

  const handleSend = () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    Alert.alert('Message Sent', `Message sent to ${contactName}`);
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={mobileStyles.scrollContainer}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={mobileStyles.header}>Send Message</Text>
        
        <View style={mobileStyles.card}>
          <Text style={mobileStyles.bodyTextBold}>To: {contactName}</Text>
          <Text style={mobileStyles.smallText}>{contactNumber}</Text>
        </View>

        <View style={mobileStyles.formGroup}>
          <Text style={mobileStyles.label}>Message</Text>
          <TextInput 
            style={[mobileStyles.input, { 
              height: 120, 
              textAlignVertical: 'top',
              paddingTop: 16 
            }]} 
            value={message} 
            onChangeText={setMessage} 
            placeholder="Type your message here..." 
            placeholderTextColor="#888" 
            multiline={true}
            numberOfLines={4}
          />
        </View>

        <View style={mobileStyles.infoCard}>
          <Text style={mobileStyles.bodyTextBold}>💡 Smart Messaging</Text>
          <Text style={mobileStyles.smallText}>Messages are sent via optimal route for best delivery rates</Text>
        </View>

        <View style={mobileStyles.buttonRow}>
          <TouchableOpacity style={mobileStyles.primaryButton} onPress={handleSend}>
            <Text style={mobileStyles.whiteText}>Send Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={mobileStyles.secondaryButton} onPress={handleCancel}>
            <Text style={mobileStyles.whiteText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}