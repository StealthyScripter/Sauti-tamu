import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { AuthProvider } from '../context/AuthContext';
import { CallProvider } from '../context/CallContext'; 

function RootLayoutNav() {
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
        <Stack.Screen name="incoming-call" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CallProvider>
        <RootLayoutNav />
      </CallProvider>
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