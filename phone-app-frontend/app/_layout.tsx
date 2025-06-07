import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <Tabs screenOptions={{
        tabBarStyle: { backgroundColor: '#1a1a2e' },
        tabBarActiveTintColor: '#00ff88',
        headerShown: false,
      }}>
        <Tabs.Screen name="index" options={{ title: 'Dialer' }} />
        <Tabs.Screen name="recent" options={{ title: 'Recent' }} />
        <Tabs.Screen name="contacts" options={{ title: 'Contacts' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 410,
    width: '100%',
    alignSelf: 'center',
    flex: 1,
  },
});