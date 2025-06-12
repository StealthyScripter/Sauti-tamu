import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { mobileStyles } from "../../styles/mobileStyles";
import { useAuth } from "../../context/AuthContext";
import { useCall } from "../../context/CallContext";
import apiService from "../../services/apiService";

export default function DialerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { socket, isConnected, incomingCall } = useCall();
  const [number, setNumber] = useState("");
  const [calling, setCalling] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Check connection status on component mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  // Monitor WebSocket connection
  useEffect(() => {
    if (isConnected) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isConnected]);

  const checkConnectionStatus = async () => {
    try {
      setConnectionStatus('checking');
      const connectivity = await apiService.checkConnectivity();
      setConnectionStatus(connectivity.connected ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('❌ Connection check failed:', error);
      setConnectionStatus('disconnected');
    }
  };

  const addDigit = (digit: unknown) => {
    setNumber((prev) => prev + digit);
  };

  const deleteDigit = () => {
    setNumber((prev) => prev.slice(0, -1));
  };

  const makeCall = async () => {
    if (!number.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    if (connectionStatus === 'disconnected') {
      Alert.alert(
        'Connection Error', 
        'No internet connection. Please check your network and try again.',
        [
          { text: 'Retry', onPress: checkConnectionStatus },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    // Check for active incoming call
    if (incomingCall) {
      Alert.alert(
        'Active Call', 
        'You have an incoming call. Please handle it before making a new call.'
      );
      return;
    }

    // Format the number
    let formattedNumber = number;
    if (!formattedNumber.startsWith('+')) {
      formattedNumber = `+1${number.replace(/\D/g, '')}`;
    }

    setCalling(true);
    try {
      console.log('📞 Initiating call to:', formattedNumber);
      const response = await apiService.initiateCall(formattedNumber, 'voice', {
        fromDisplayName: user?.displayName || 'Unknown',
        connectionType: isConnected ? 'websocket' : 'api_only'
      });
      
      if (response.success) {
        console.log('✅ Call initiated successfully:', response.data);
        
        // Navigate to active call screen with call data
        router.push({
          pathname: '/active-call',
          params: {
            callId: response.data.callId,
            phoneNumber: formattedNumber,
            agoraToken: response.data.agoraToken,
            agoraAppId: response.data.agoraAppId,
            channelName: response.data.channelName,
          }
        });
        
        // Clear the number after successful call initiation
        setTimeout(() => {
          setNumber("");
        }, 1000);
      } else {
        console.error('❌ Call failed:', response.message);
        Alert.alert('Call Failed', response.message || 'Unable to initiate call');
      }
    } catch (error: any) {
      console.error('❌ Call initiation error:', error);
      
      // Enhanced error handling
      let errorMessage = 'Network error. Please check your connection and try again.';
      
      if (error.message.includes('already has an active call')) {
        errorMessage = 'You already have an active call. Please end it before making a new call.';
      } else if (error.message.includes('busy')) {
        errorMessage = 'The person you are calling is currently busy. Please try again later.';
      } else if (error.message.includes('429')) {
        errorMessage = 'Too many call attempts. Please wait a moment and try again.';
      } else if (error.message.includes('503')) {
        errorMessage = 'Service temporarily unavailable. Please try again in a few minutes.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setCalling(false);
    }
  };

  const handleLongPressZero = () => {
    setNumber((prev) => prev + "+");
  };

  const testConnection = async () => {
    try {
      const response = await apiService.healthCheck();
      Alert.alert(
        'Connection Test', 
        `Backend is reachable!\nStatus: ${response.status}\nLatency: ${response.connectionTime ? 'Good' : 'Unknown'}`
      );
      console.log('✅ Health check passed:', response);
    } catch (error) {
      Alert.alert('Connection Test', 'Backend is not reachable. Please check your network connection.');
      console.error('❌ Health check failed:', error);
    }
  };

  // Connection status indicator
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#00ff88';
      case 'disconnected': return '#ff4757';
      case 'checking': return '#ffa502';
      default: return '#888';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return isConnected ? 'Connected (Real-time)' : 'Connected (API only)';
      case 'disconnected': return 'No connection';
      case 'checking': return 'Checking connection...';
      default: return 'Unknown';
    }
  };

  // Keypad configuration
  const keypadRows = [
    [{ digit: '1', letters: '' }, { digit: '2', letters: 'ABC' }, { digit: '3', letters: 'DEF' }],
    [{ digit: '4', letters: 'GHI' }, { digit: '5', letters: 'JKL' }, { digit: '6', letters: 'MNO' }],
    [{ digit: '7', letters: 'PQRS' }, { digit: '8', letters: 'TUV' }, { digit: '9', letters: 'WXYZ' }],
    [{ digit: '*', letters: '' }, { digit: '0', letters: '+' }, { digit: '#', letters: '' }],
  ];

  return (
    <View style={mobileStyles.containerWithSafeArea}>
      <Text style={mobileStyles.title}>SmartConnect</Text>

      <Text style={mobileStyles.subtitle}>
        Welcome, {user?.displayName || 'User'}
      </Text>

      {/* Connection Status Indicator */}
      <View style={[mobileStyles.infoCard, { marginBottom: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={mobileStyles.bodyTextBold}>📡 Connection Status</Text>
            <Text style={[mobileStyles.smallText, { color: getConnectionStatusColor() }]}>
              {getConnectionStatusText()}
            </Text>
          </View>
          {connectionStatus === 'checking' && (
            <ActivityIndicator size="small" color="#ffa502" />
          )}
          {connectionStatus === 'disconnected' && (
            <TouchableOpacity 
              onPress={checkConnectionStatus}
              style={{ padding: 8, backgroundColor: 'rgba(255,71,87,0.2)', borderRadius: 4 }}
            >
              <Text style={{ color: '#ff4757', fontSize: 12 }}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={mobileStyles.numberDisplay}>
        <Text style={mobileStyles.numberText} numberOfLines={1} adjustsFontSizeToFit>
          {number || "Enter number"}
        </Text>
        {number ? (
          <TouchableOpacity style={mobileStyles.deleteButton} onPress={deleteDigit}>
            <Text style={mobileStyles.deleteText}>⌫</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* AI Routing Info */}
      {number && connectionStatus === 'connected' && (
        <View style={mobileStyles.infoCard}>
          <Text style={mobileStyles.bodyTextBold}>🤖 AI Route Analysis</Text>
          <Text style={mobileStyles.greenText}>
            Backend connected • Real-time optimization active
          </Text>
          <Text style={mobileStyles.smallText}>
            Estimated savings: 65-75% • Best carrier selection in progress
          </Text>
        </View>
      )}

      {number && connectionStatus === 'disconnected' && (
        <View style={[mobileStyles.infoCard, { borderColor: '#ff4757' }]}>
          <Text style={mobileStyles.bodyTextBold}>⚠️ Limited Functionality</Text>
          <Text style={[mobileStyles.smallText, { color: '#ff4757' }]}>
            No connection - calls may not work properly
          </Text>
        </View>
      )}

      <View style={mobileStyles.keypad}>
        {keypadRows.map((row, rowIndex) => (
          <View key={rowIndex} style={mobileStyles.keypadRow}>
            {row.map((button) => (
              <TouchableOpacity
                key={button.digit}
                style={mobileStyles.keypadButton}
                onPress={() => addDigit(button.digit)}
                onLongPress={button.digit === '0' ? handleLongPressZero : undefined}
              >
                <Text style={mobileStyles.keyText}>{button.digit}</Text>
                {button.letters ? (
                  <Text style={mobileStyles.keyLetters}>{button.letters}</Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={[
          mobileStyles.callButton,
          (!number || calling || connectionStatus === 'disconnected') && { backgroundColor: '#666' }
        ]} 
        onPress={makeCall}
        disabled={!number || calling || connectionStatus === 'disconnected'}
      >
        {calling ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator color="#000" style={{ marginRight: 8 }} />
            <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 18 }}>
              Connecting...
            </Text>
          </View>
        ) : (
          <Text style={[
            { color: '#000', fontWeight: 'bold', fontSize: 18 },
            (!number || connectionStatus === 'disconnected') && { color: '#ccc' }
          ]}>
            📞 Call
          </Text>
        )}
      </TouchableOpacity>

      {/* Quick access buttons */}
      <View style={mobileStyles.buttonRow}>
        <TouchableOpacity 
          style={mobileStyles.secondaryButton}
          onPress={() => router.push('/tabs/contacts')}
        >
          <Text style={mobileStyles.whiteText}>👥 Contacts</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={mobileStyles.secondaryButton}
          onPress={() => router.push('/tabs/recent')}
        >
          <Text style={mobileStyles.whiteText}>🕐 Recent</Text>
        </TouchableOpacity>
      </View>

      {/* Development tools */}
      {__DEV__ && (
        <TouchableOpacity 
          style={[mobileStyles.secondaryButton, { marginTop: 10 }]}
          onPress={testConnection}
        >
          <Text style={mobileStyles.whiteText}>🧪 Test Backend Connection</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}