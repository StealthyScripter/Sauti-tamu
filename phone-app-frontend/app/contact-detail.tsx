import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { mobileStyles } from '../styles/mobileStyles';

// Helper function to ensure string type from params
const getStringParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) {
    return param[0] || '';
  }
  return param || '';
};

export default function ContactDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Use params from navigation or fallback to default
  const contact = {
    name: getStringParam(params.name) || 'Ahmed Kofi',
    initials: getStringParam(params.initials) || 'AK',
    number: getStringParam(params.number) || '+234 803 123 4567',
    location: getStringParam(params.location) || 'Lagos, Nigeria',
    savings: '$0.08/min (70% savings)',
    carrier: 'Carrier A',
    quality: 'HD Quality',
    uptime: '99.2% uptime',
  };

  const handleCall = () => {
    router.push('/active-call');
  };

  const handleMessage = () => {
    router.push({
      pathname: '/compose-message',
      params: {
        contactName: contact.name,
        contactNumber: contact.number,
      }
    });
  };

  const handleEdit = () => {
    router.push({
      pathname: '/add-contacts',
      params: {
        edit: 'true',
        name: contact.name,
        number: contact.number,
        location: contact.location,
      }
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Deleted', `${contact.name} has been deleted.`);
            router.back();
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
        <Text style={mobileStyles.header}>{contact.name}</Text>

        <View style={mobileStyles.avatarMedium}>
          <Text style={mobileStyles.avatarTextLarge}>{contact.initials}</Text>
        </View>

        <View style={mobileStyles.buttonRow}>
          <TouchableOpacity style={mobileStyles.primaryButton} onPress={handleCall}>
            <Text style={mobileStyles.whiteText}>📞 Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={mobileStyles.secondaryButton} onPress={handleMessage}>
            <Text style={mobileStyles.whiteText}>💬 Message</Text>
          </TouchableOpacity>
        </View>

        <View style={mobileStyles.formGroup}>
          <Text style={mobileStyles.label}>Phone Number</Text>
          <TextInput value={contact.number} editable={false} style={mobileStyles.input} />
        </View>

        <View style={mobileStyles.formGroup}>
          <Text style={mobileStyles.label}>Location</Text>
          <TextInput value={contact.location} editable={false} style={mobileStyles.input} />
        </View>

        <View style={mobileStyles.infoCard}>
          <Text style={mobileStyles.bodyTextBold}>AI Route Optimization</Text>
          <Text style={mobileStyles.greenText}>Current best rate: {contact.savings}</Text>
          <Text style={mobileStyles.smallText}>{contact.carrier} • {contact.quality} • {contact.uptime}</Text>
        </View>

        <View style={mobileStyles.buttonRow}>
          <TouchableOpacity style={mobileStyles.primaryButton} onPress={handleEdit}>
            <Text style={mobileStyles.whiteText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={mobileStyles.secondaryButton} onPress={handleDelete}>
            <Text style={mobileStyles.whiteText}>🗑 Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}