import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Header from '../components/Header';
import React, { useState } from 'react';

export default function Profile() {
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john.doe@example.com');
  const [phone, setPhone] = useState('+1 (555) 123-4567');

  return (
    <View style={styles.container}>
      <Header title="Profile" />
      <View style={styles.avatar}><Text style={styles.avatarText}>JD</Text></View>
      <View style={styles.formGroup}><Text style={styles.label}>Name</Text><TextInput style={styles.input} value={name} onChangeText={setName} /></View>
      <View style={styles.formGroup}><Text style={styles.label}>Email</Text><TextInput style={styles.input} value={email} onChangeText={setEmail} /></View>
      <View style={styles.formGroup}><Text style={styles.label}>Phone</Text><TextInput style={styles.input} value={phone} onChangeText={setPhone} /></View>
      <View style={styles.card}><Text style={styles.cardTitle}>Total Savings This Month</Text><Text style={styles.greenText}>$47.80</Text><Text style={styles.grayText}>152 calls • AI routing saved 68%</Text></View>
      <View style={styles.buttonRow}><TouchableOpacity style={styles.primaryButton}><Text>Update</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton}><Text>Sign Out</Text></TouchableOpacity></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { maxWidth: 410, width: '100%', alignSelf: 'center', flex: 1, backgroundColor: '#0f0f23', padding: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#00ff88', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20 },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#000' },
  formGroup: { marginBottom: 12 },
  label: { color: '#00ff88', marginBottom: 4 },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', padding: 12, borderRadius: 8 },
  card: { backgroundColor: 'rgba(0,255,136,0.1)', padding: 16, borderRadius: 12, marginVertical: 16, borderWidth: 1, borderColor: '#00ff88' },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4, color: '#fff' },
  greenText: { color: '#00ff88', fontSize: 24, fontWeight: '700' },
  grayText: { color: '#ccc', fontSize: 12, marginTop: 4 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  primaryButton: { flex: 1, backgroundColor: '#00ff88', padding: 12, borderRadius: 8, alignItems: 'center' },
  secondaryButton: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 8, alignItems: 'center', borderColor: '#444', borderWidth: 1 },
});