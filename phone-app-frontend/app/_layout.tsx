import { Stack, Redirect } from 'expo-router';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';


function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00ff88" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <View style={styles.container}>
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0f0f23' },
      }}>
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
