import { View, Text, StyleSheet } from 'react-native';
import React from 'react';

export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#00ff88',
    marginTop: 4,
  },
});