import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';

export default function ActiveCall() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Active Call</Text>
      <View style={styles.avatar}><Text style={styles.avatarText}>AK</Text></View>
      <Text style={styles.name}>Ahmed Kofi</Text>
      <Text style={styles.duration}>02:34</Text>
      <Text style={styles.savings}>Saving $0.18/min • Total saved: $0.46</Text>
      <View style={styles.grid}>
        {['🔇', '⏸', '📞', '🔢', '📢', '⏺'].map((icon, i) => (
          <TouchableOpacity key={i} style={styles.gridBtn}><Text>{icon}</Text></TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.endCall} onPress={() => router.push('/tabs/recent')}><Text>✕</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { maxWidth: 410, flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f23' },
  subtitle: { color: '#00ff88', fontSize: 16, marginBottom: 8 },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#00ff88', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#000' },
  name: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  duration: { color: '#00ff88', fontSize: 18, marginVertical: 10 },
  savings: { color: '#ccc', fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginVertical: 20, gap: 20 },
  gridBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  endCall: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ff4757', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
});