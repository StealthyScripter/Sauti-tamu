import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import { mobileStyles } from '../styles/mobileStyles';

export default function ContactDetail() {
  const router = useRouter();
  const contact = {
    name: 'Ahmed Kofi',
    initials: 'AK',
    number: '+234 803 123 4567',
    country: 'Nigeria',
    savings: '$0.08/min (70% savings)',
    carrier: 'Carrier A',
    quality: 'HD Quality',
    uptime: '99.2% uptime',
  };

  return (
    <View style={mobileStyles.scrollContainer}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={mobileStyles.header}>{contact.name}</Text>
        <Text style={mobileStyles.subtitle}>{contact.country}</Text>

        <View style={mobileStyles.avatarMedium}>
          <Text style={mobileStyles.avatarTextLarge}>{contact.initials}</Text>
        </View>

        <View style={mobileStyles.buttonRow}>
          <TouchableOpacity style={mobileStyles.primaryButton}>
            <Text style={mobileStyles.whiteText}>📞 Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={mobileStyles.secondaryButton}>
            <Text style={mobileStyles.whiteText}>💬 Message</Text>
          </TouchableOpacity>
        </View>

        <View style={mobileStyles.formGroup}>
          <Text style={mobileStyles.label}>Phone Number</Text>
          <TextInput value={contact.number} editable={false} style={mobileStyles.input} />
        </View>

        <View style={mobileStyles.formGroup}>
          <Text style={mobileStyles.label}>Country</Text>
          <TextInput value={contact.country} editable={false} style={mobileStyles.input} />
        </View>

        <View style={mobileStyles.infoCard}>
          <Text style={mobileStyles.bodyTextBold}>AI Route Optimization</Text>
          <Text style={mobileStyles.greenText}>Current best rate: {contact.savings}</Text>
          <Text style={mobileStyles.smallText}>{contact.carrier} • {contact.quality} • {contact.uptime}</Text>
        </View>

        <View style={mobileStyles.buttonRow}>
          <TouchableOpacity style={mobileStyles.primaryButton}>
            <Text style={mobileStyles.whiteText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={mobileStyles.secondaryButton}>
            <Text style={mobileStyles.whiteText}>🗑 Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}