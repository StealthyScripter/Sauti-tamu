import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { AuthProvider } from '../context/AuthContext';

function RootLayoutNav() {
  // Remove auth check from here - handle it in index.tsx only
  return (
    <View style={styles.container}>
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0f0f23' },
      }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="tabs" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="contact-detail" options={{ headerShown: false }} />
        <Stack.Screen name="add-contacts" options={{ headerShown: false }} />
        <Stack.Screen name="active-call" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    maxWidth: 430,
    alignSelf: 'center',
    width: '100%',
  },
});