import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import { mobileStyles } from '../../styles/mobileStyles';

const mockContacts = [
  { id: '1', initials: 'AK', name: 'Ahmed Kofi', number: '+234 803 123 4567', location: 'Lagos, Nigeria' },
  { id: '2', initials: 'MN', name: 'Maria Nkomo', number: '+27 82 456 7890', location: 'Cape Town, SA' },
  { id: '3', initials: 'JD', name: 'John Doe', number: '+254 701 234 567', location: 'Nairobi, Kenya' },
];

export default function Contacts() {
  const router = useRouter();

  return (
    <View style={mobileStyles.container}>
      <Text style={mobileStyles.header}>Contacts</Text>
      <FlatList
        data={mockContacts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={mobileStyles.contactCard}
            onPress={() => router.push('/contact-detail')}
          >
            <View style={mobileStyles.avatarSmall}>
              <Text style={mobileStyles.avatarText}>{item.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={mobileStyles.bodyTextBold}>{item.name}</Text>
              <Text style={mobileStyles.smallText}>{item.number} • {item.location}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}