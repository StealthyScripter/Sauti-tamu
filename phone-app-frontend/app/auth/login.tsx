import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { mobileStyles } from "../../styles/mobileStyles";
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { sendVerificationCode, login, isLoading } = useAuth();
  
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const formatPhoneNumber = (text: string) => {
    // Simple US phone number formatting: 555-123-4567
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      return [match[1], match[2], match[3]].filter(Boolean).join('-');
    }
    return text;
  };

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    // Add +1 if no country code
    const formattedPhone = phoneNumber.startsWith('+') 
      ? phoneNumber 
      : `+1${phoneNumber.replace(/\D/g, '')}`;

    setLoading(true);
    try {
      console.log('📱 Sending verification code to:', formattedPhone);
      const response = await sendVerificationCode(formattedPhone);
      
      if (response.success) {
        setStep('verify');
        Alert.alert('Code Sent', 'Please check your phone for the verification code');
        
        // For development - show the test code if available
        if (__DEV__ && response.data?._testCode) {
          Alert.alert('Development Mode', `Test code: ${response.data._testCode}`);
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to send verification code');
      }
    } catch (error: any) {
      console.error('❌ Send code error:', error);
      Alert.alert('Error', error.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    const formattedPhone = phoneNumber.startsWith('+') 
      ? phoneNumber 
      : `+1${phoneNumber.replace(/\D/g, '')}`;

    setLoading(true);
    try {
      console.log('🔐 Verifying code for:', formattedPhone);
      const response = await login(formattedPhone, verificationCode, displayName);
      
      if (response.success) {
        console.log('✅ Login successful, redirecting...');
        // Navigation will happen automatically via auth state change
        router.replace('/tabs');
      } else {
        Alert.alert('Error', response.message || 'Invalid verification code');
      }
    } catch (error: any) {
      console.error('❌ Verify code error:', error);
      Alert.alert('Error', error.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'verify') {
      setStep('phone');
      setVerificationCode('');
    } else {
      router.back();
    }
  };

  // Quick test buttons for development
  const handleQuickTest = () => {
    setPhoneNumber('+15551234567');
    setDisplayName('Test User');
  };

  if (isLoading) {
    return (
      <View style={[mobileStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00ff88" />
        <Text style={[mobileStyles.bodyText, { marginTop: 16 }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={mobileStyles.container}>
      <Text style={mobileStyles.header}>
        {step === 'phone' ? 'Welcome to SmartConnect' : 'Enter Verification Code'}
      </Text>
      
      <Text style={mobileStyles.subtitle}>
        {step === 'phone' 
          ? 'Enter your phone number to get started' 
          : `We sent a code to ${phoneNumber}`}
      </Text>

      {step === 'phone' ? (
        <>
          <View style={mobileStyles.formGroup}>
            <Text style={mobileStyles.label}>Phone Number</Text>
            <TextInput
              style={mobileStyles.input}
              value={phoneNumber}
              onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
              placeholder="+1 555-123-4567"
              placeholderTextColor="#888"
              keyboardType="phone-pad"
              autoFocus
            />
          </View>

          <View style={mobileStyles.formGroup}>
            <Text style={mobileStyles.label}>Display Name (Optional)</Text>
            <TextInput
              style={mobileStyles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor="#888"
            />
          </View>

          {/* Development helper */}
          {__DEV__ && (
            <TouchableOpacity 
              style={[mobileStyles.secondaryButton, { marginBottom: 10 }]}
              onPress={handleQuickTest}
            >
              <Text style={mobileStyles.whiteText}>🧪 Quick Test</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[mobileStyles.primaryButton, { marginTop: 20 }]}
            onPress={handleSendCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={{ color: '#000', fontWeight: 'bold' }}>Send Verification Code</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={mobileStyles.formGroup}>
            <Text style={mobileStyles.label}>Verification Code</Text>
            <TextInput
              style={mobileStyles.input}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="123456"
              placeholderTextColor="#888"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
          </View>

          <View style={mobileStyles.buttonRow}>
            <TouchableOpacity 
              style={mobileStyles.primaryButton}
              onPress={handleVerifyCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={{ color: '#000', fontWeight: 'bold' }}>Verify & Login</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={mobileStyles.secondaryButton}
              onPress={handleBack}
              disabled={loading}
            >
              <Text style={mobileStyles.whiteText}>Back</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={{ marginTop: 20, alignItems: 'center' }}
            onPress={handleSendCode}
            disabled={loading}
          >
            <Text style={mobileStyles.greenText}>Resend Code</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={mobileStyles.infoCard}>
        <Text style={mobileStyles.bodyTextBold}>🔒 Secure Authentication</Text>
        <Text style={mobileStyles.smallText}>
          We use phone-based authentication for security. No passwords needed!
        </Text>
      </View>

      {/* Connection Status for Development */}
      {__DEV__ && (
        <View style={[mobileStyles.card, { marginTop: 20 }]}>
          <Text style={mobileStyles.bodyTextBold}>🔧 Dev Mode</Text>
          <Text style={mobileStyles.smallText}>
            Backend: {process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}
          </Text>
        </View>
      )}
    </View>
  );
}