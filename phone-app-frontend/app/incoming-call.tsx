import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';

export default function IncomingCall() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Incoming Call</Text>
      <View style={styles.avatar}><Text style={styles.avatarText}>AK</Text></View>
      <Text style={styles.name}>Ahmed Kofi</Text>
      <Text style={styles.details}>+234 803 123 4567</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.decline} onPress={() => router.push('/recent')}><Text>✕</Text></TouchableOpacity>
        <TouchableOpacity style={styles.accept} onPress={() => router.push('/active-call')}><Text>✓</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { maxWidth: 410, flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f23' },
  subtitle: { color: '#00ff88', fontSize: 16, marginBottom: 8 },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#00ff88', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#000' },
  name: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  details: { color: '#ccc', fontSize: 16, marginBottom: 40 },
  buttonRow: { flexDirection: 'row', gap: 40 },
  decline: { width: 64, height: 64, backgroundColor: '#ff4757', borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  accept: { width: 64, height: 64, backgroundColor: '#00ff88', borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
});