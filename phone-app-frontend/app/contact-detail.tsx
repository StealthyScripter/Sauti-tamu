import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import Header from '../components/Header';

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
    <View style={styles.container}>
      <Header title={contact.name} subtitle={contact.country} />

      <View style={styles.avatar}><Text style={styles.avatarText}>{contact.initials}</Text></View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.callButton}><Text>📞 Call</Text></TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton}><Text>💬 Message</Text></TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput value={contact.number} editable={false} style={styles.input} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Country</Text>
        <TextInput value={contact.country} editable={false} style={styles.input} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI Route Optimization</Text>
        <Text style={styles.greenText}>Current best rate: {contact.savings}</Text>
        <Text style={styles.grayText}>{contact.carrier} • {contact.quality} • {contact.uptime}</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.primaryButton}><Text>✏️ Edit</Text></TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton}><Text>🗑 Delete</Text></TouchableOpacity>
      </View>
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
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#00ff88',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  callButton: {
    flex: 1,
    backgroundColor: '#00ff88',
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#00ff88',
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    marginLeft: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    color: '#00ff88',
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  card: {
    backgroundColor: 'rgba(0,255,136,0.1)',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#fff',
  },
  greenText: {
    color: '#00ff88',
    fontSize: 14,
  },
  grayText: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
  },
});
