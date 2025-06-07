import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Header from '../components/Header';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';

export default function AddContact() {
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Header title="Add Contact" />
      <View style={styles.formGroup}><Text style={styles.label}>Name</Text><TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter full name" placeholderTextColor="#888" /></View>
      <View style={styles.formGroup}><Text style={styles.label}>Phone Number</Text><TextInput style={styles.input} value={number} onChangeText={setNumber} keyboardType="phone-pad" placeholder="+1 (555) 000-0000" placeholderTextColor="#888" /></View>
      <View style={styles.formGroup}><Text style={styles.label}>Country</Text><TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="Country" placeholderTextColor="#888" /></View>
      <View style={styles.formGroup}><Text style={styles.label}>Email (Optional)</Text><TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="contact@example.com" placeholderTextColor="#888" /></View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.primaryButton}><Text>Save</Text></TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}><Text>Cancel</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { maxWidth: 410, width: '100%', alignSelf: 'center', flex: 1, backgroundColor: '#0f0f23', padding: 20 },
  formGroup: { marginBottom: 12 },
  label: { color: '#00ff88', marginBottom: 4 },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', padding: 12, borderRadius: 8, fontSize: 16 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 30 },
  primaryButton: { flex: 1, backgroundColor: '#00ff88', padding: 12, borderRadius: 8, alignItems: 'center' },
  secondaryButton: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 8, alignItems: 'center', borderColor: '#444', borderWidth: 1 },
});