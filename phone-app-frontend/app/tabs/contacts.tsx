import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';

const mockContacts = [
  { id: '1', initials: 'AK', name: 'Ahmed Kofi', number: '+234 803 123 4567', location: 'Lagos, Nigeria' },
  { id: '2', initials: 'MN', name: 'Maria Nkomo', number: '+27 82 456 7890', location: 'Cape Town, SA' },
  { id: '3', initials: 'JD', name: 'John Doe', number: '+254 701 234 567', location: 'Nairobi, Kenya' },
];

export default function Contacts() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Contacts</Text>
      <FlatList
        data={mockContacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/contact-detail')}
          >
            <View style={styles.avatar}><Text style={styles.avatarText}>{item.initials}</Text></View>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.details}>{item.number} • {item.location}</Text>
            </View>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00ff88',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#000',
    fontWeight: 'bold',
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
});