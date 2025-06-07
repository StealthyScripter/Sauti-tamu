import { View, Text, StyleSheet, FlatList } from 'react-native';
import React from 'react';

const mockRecentCalls = [
  { id: '1', name: 'Ahmed Kofi', type: 'Outgoing', location: 'Lagos, Nigeria', time: '2 min ago', saved: '$2.40' },
  { id: '2', name: 'Maria Nkomo', type: 'Incoming', location: 'Cape Town, SA', time: '1 hour ago' },
  { id: '3', name: 'John Doe', type: 'Outgoing', location: 'Nairobi, Kenya', time: '3 hours ago', saved: '$1.80' },
];

export default function Recent() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Recent Calls</Text>
      <FlatList
        data={mockRecentCalls}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.details}>{item.type} • {item.location}</Text>
            <Text style={styles.time}>{item.time} {item.saved ? `• Saved ${item.saved}` : ''}</Text>
          </View>
        )}
      />
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
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  details: {
    color: '#ccc',
    marginTop: 4,
  },
  time: {
    color: '#00ff88',
    marginTop: 4,
    fontSize: 12,
  },
});