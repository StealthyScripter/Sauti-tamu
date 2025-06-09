import { useAuth } from '../context/AuthContext';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { mobileStyles } from '../styles/mobileStyles';

export default function RootIndex() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={[mobileStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00ff88" />
        <Text style={[mobileStyles.bodyText, { marginTop: 16 }]}>Loading...</Text>
      </View>
    );
  }

  // Once loaded, redirect based on auth state
  if (isAuthenticated) {
    return <Redirect href="/tabs" />;
  }

  return <Redirect href="/auth/login" />;
}