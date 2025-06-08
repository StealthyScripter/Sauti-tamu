import { View, Text, FlatList } from 'react-native';
import React from 'react';
import { mobileStyles } from '../../styles/mobileStyles';

const mockRecentCalls = [
  { id: '1', name: 'Ahmed Kofi', type: 'Outgoing', location: 'Lagos, Nigeria', time: '2 min ago', saved: '$2.40' },
  { id: '2', name: 'Maria Nkomo', type: 'Incoming', location: 'Cape Town, SA', time: '1 hour ago' },
  { id: '3', name: 'John Doe', type: 'Outgoing', location: 'Nairobi, Kenya', time: '3 hours ago', saved: '$1.80' },
  { id: '4', name: 'Sarah Wilson', type: 'Missed', location: 'London, UK', time: '5 hours ago' },
  { id: '5', name: 'Carlos Rodriguez', type: 'Outgoing', location: 'Mexico City, MX', time: 'Yesterday', saved: '$3.20' },
];

export default function Recent() {
  const getCallTypeColor = (type: unknown) => {
    switch (type) {
      case 'Incoming': return '#00ff88';
      case 'Outgoing': return '#fff';
      case 'Missed': return '#ff4757';
      default: return '#ccc';
    }
  };

  return (
    <View style={mobileStyles.container}>
      <Text style={mobileStyles.header}>Recent Calls</Text>
      <FlatList
        data={mockRecentCalls}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={mobileStyles.card}>
            <Text style={mobileStyles.bodyTextBold}>{item.name}</Text>
            <Text style={[mobileStyles.smallText, { color: getCallTypeColor(item.type) }]}>
              {item.type} • {item.location}
            </Text>
            <Text style={mobileStyles.greenText}>
              {item.time} {item.saved ? `• Saved ${item.saved}` : ''}
            </Text>
          </View>
        )}
      />
    </View>
  );
}