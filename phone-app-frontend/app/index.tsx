import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { mobileStyles } from '../styles/mobileStyles';
import { useAuth } from '../context/AuthContext';
import { AppIcons, Icon } from '../components/Icons';

export default function AuthScreen() {
  const router = useRouter();
  const { login, user, isLoading, isInitialized } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [loading, setLoading] = useState(false);

  // FIX #1: Add router to dependency array
  useEffect(() => {
    if (isInitialized && user) {
      console.log('✅ User authenticated, redirecting to tabs');
      router.replace('/tabs');
    }
  }, [user, isInitialized, router]); // Added router

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      // Simulate sending verification code
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert('Code Sent', 'Verification code sent to your phone');
      setStep('verify');
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const success = await login(phoneNumber, verificationCode);
      if (success) {
        router.replace('/tabs');
      } else {
        Alert.alert('Error', 'Invalid verification code');
      }
    } catch (error) {
      Alert.alert('Error', 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized || isLoading) {
    return (
      <View style={[mobileStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00ff88" />
        <Text style={[mobileStyles.bodyText, { marginTop: 16 }]}>Initializing...</Text>
      </View>
    );
  }

  return (
    <View style={mobileStyles.containerWithSafeArea}>
      {/* App Logo/Icon */}
      <View style={[mobileStyles.avatarLarge, { marginBottom: 20 }]}>
        <Icon library="ionicons" name="call" size={40} color="#00ff88" />
      </View>

      <Text style={mobileStyles.title}>SmartConnect</Text>
      <Text style={mobileStyles.subtitle}>
        {step === 'phone' 
          ? 'Enter your phone number to get started' 
          : 'Enter the verification code sent to your phone'
        }
      </Text>

      {/* Feature highlights */}
      <View style={mobileStyles.infoCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <AppIcons.aiRouting size={20} />
          <Text style={mobileStyles.bodyTextBold}>Smart Call Routing</Text>
        </View>
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <AppIcons.savings size={16} />
            <Text style={mobileStyles.smallText}>Save up to 75% on international calls</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <AppIcons.quality size={16} />
            <Text style={mobileStyles.smallText}>Crystal clear HD voice quality</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon library="ionicons" name="flash" size={16} color="#00ff88" />
            <Text style={mobileStyles.smallText}>AI-powered carrier optimization</Text>
          </View>
        </View>
      </View>

      {step === 'phone' ? (
        <>
          <View style={mobileStyles.formGroup}>
            <Text style={mobileStyles.label}>Phone Number</Text>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              style={mobileStyles.input}
              placeholder="+1 234 567 8901"
              placeholderTextColor="#888"
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity 
            style={[mobileStyles.primaryButton, loading && { backgroundColor: '#666' }]}
            onPress={handleSendCode}
            disabled={loading}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color="#000" size="small" />
                <Text style={{ color: '#000', fontWeight: 'bold' }}>Sending...</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon library="ionicons" name="send" size={18} color="#000" />
                <Text style={{ color: '#000', fontWeight: 'bold' }}>Send Code</Text>
              </View>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={mobileStyles.formGroup}>
            <Text style={mobileStyles.label}>Verification Code</Text>
            <TextInput
              value={verificationCode}
              onChangeText={setVerificationCode}
              style={mobileStyles.input}
              placeholder="123456"
              placeholderTextColor="#888"
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          <TouchableOpacity 
            style={[mobileStyles.primaryButton, loading && { backgroundColor: '#666' }]}
            onPress={handleVerifyCode}
            disabled={loading}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color="#000" size="small" />
                <Text style={{ color: '#000', fontWeight: 'bold' }}>Verifying...</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon library="ionicons" name="checkmark-circle" size={18} color="#000" />
                <Text style={{ color: '#000', fontWeight: 'bold' }}>Verify & Login</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={mobileStyles.secondaryButton}
            onPress={() => setStep('phone')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AppIcons.back size={18} color="#fff" />
              <Text style={mobileStyles.whiteText}>Back to Phone Number</Text>
            </View>
          </TouchableOpacity>

          {/* FIX #2: Replace textButton with secondaryButton and linkText with greenText */}
          <TouchableOpacity 
            style={[mobileStyles.secondaryButton, { marginTop: 16, backgroundColor: 'transparent' }]}
            onPress={handleSendCode}
          >
            <Text style={mobileStyles.greenText}>Didn`&#39;`t receive code? Resend</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Terms and Privacy */}
      <View style={{ marginTop: 30, paddingHorizontal: 20 }}>
        <Text style={[mobileStyles.smallText, { textAlign: 'center', lineHeight: 18 }]}>
          By continuing, you agree to our{' '}
          {/* FIX #3: Replace linkText with greenText */}
          <Text style={mobileStyles.greenText}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={mobileStyles.greenText}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}