import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { AppProvider } from '../context/AppContext';

export default function RootLayout() {
  return (
    <AppProvider>
      <View style={styles.container}>
        <Stack screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0f0f23' },
        }} />
      </View>
    </AppProvider>
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