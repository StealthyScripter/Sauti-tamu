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