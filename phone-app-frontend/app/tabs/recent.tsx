import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import { mobileStyles } from '../../styles/mobileStyles';

interface RecentCall {
  id: string;
  name: string;
  type: 'Incoming' | 'Outgoing' | 'Missed';
  location: string;
  time: string;
  saved?: string;
  number: string;
  initials: string;
}

const mockRecentCalls: RecentCall[] = [
  { id: '1', name: 'Ahmed Kofi', type: 'Outgoing', location: 'Lagos, Nigeria', time: '2 min ago', saved: '$2.40', number: '+234 803 123 4567', initials: 'AK' },
  { id: '2', name: 'Maria Nkomo', type: 'Incoming', location: 'Cape Town, SA', time: '1 hour ago', number: '+27 82 456 7890', initials: 'MN' },
  { id: '3', name: 'John Doe', type: 'Outgoing', location: 'Nairobi, Kenya', time: '3 hours ago', saved: '$1.80', number: '+254 701 234 567', initials: 'JD' },
  { id: '4', name: 'Sarah Wilson', type: 'Missed', location: 'London, UK', time: '5 hours ago', number: '+44 20 7946 0958', initials: 'SW' },
  { id: '5', name: 'Carlos Rodriguez', type: 'Outgoing', location: 'Mexico City, MX', time: 'Yesterday', saved: '$3.20', number: '+52 55 1234 5678', initials: 'CR' },
];

export default function Recent() {
  const router = useRouter();

  const getCallTypeColor = (type: 'Incoming' | 'Outgoing' | 'Missed'): string => {
    switch (type) {
      case 'Incoming': return '#00ff88';
      case 'Outgoing': return '#fff';
      case 'Missed': return '#ff4757';
      default: return '#ccc';
    }
  };

  const navigateToContact = (contact: RecentCall) => {
    // Pass contact data as URL params (simplified for demo)
    router.push({
      pathname: '/contact-detail',
      params: {
        name: contact.name,
        number: contact.number,
        location: contact.location,
        initials: contact.initials,
      }
    });
  };

  return (
    <View style={mobileStyles.container}>
      <Text style={mobileStyles.header}>Recent Calls</Text>
      <FlatList
        data={mockRecentCalls}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={mobileStyles.card}
            onPress={() => navigateToContact(item)}
          >
            <Text style={mobileStyles.bodyTextBold}>{item.name}</Text>
            <Text style={[mobileStyles.smallText, { color: getCallTypeColor(item.type) }]}>
              {item.type} • {item.location}
            </Text>
            <Text style={mobileStyles.greenText}>
              {item.time} {item.saved ? `• Saved ${item.saved}` : ''}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}