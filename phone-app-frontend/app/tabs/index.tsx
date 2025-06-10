import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { mobileStyles } from "../../styles/mobileStyles";
import { useAuth } from "../../context/AuthContext";
import apiService from "../../services/apiService";
import { AppIcons, Icon } from "../../components/Icons";

export default function DialerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [number, setNumber] = useState("");
  const [calling, setCalling] = useState(false);

  const addDigit = (digit:unknown) => {
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

    // Format the number
    let formattedNumber = number;
    if (!formattedNumber.startsWith('+')) {
      // Add country code if not present
      formattedNumber = `+1${number.replace(/\D/g, '')}`;
    }

    setCalling(true);
    try {
      console.log('📞 Initiating call to:', formattedNumber);
      const response = await apiService.initiateCall(formattedNumber, 'voice');
      
      if (response.success) {
        console.log('✅ Call initiated successfully:', response.data);
        
        // Navigate to active call screen with call data
        router.push({
          pathname: '/active-call',
          params: {
            callId: response.data.callId,
            phoneNumber: formattedNumber,
            agoraToken: response.data.agoraToken,
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
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setCalling(false);
    }
  };

  const handleLongPressZero = () => {
    setNumber((prev) => prev + "+");
  };

  // Test connection
  const testConnection = async () => {
    try {
      const response = await apiService.healthCheck();
      Alert.alert('Connection Test', 'Backend is reachable!');
      console.log('✅ Health check passed:', response);
    } catch (error) {
      Alert.alert('Connection Test', 'Backend is not reachable');
      console.error('❌ Health check failed:', error);
    }
  };

  // Always maintain 3 columns: 123, 456, 789, *0#
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

      <View style={mobileStyles.numberDisplay}>
        <Text style={mobileStyles.numberText} numberOfLines={1} adjustsFontSizeToFit>
          {number || "Enter number"}
        </Text>
        {number ? (
          <TouchableOpacity style={mobileStyles.deleteButton} onPress={deleteDigit}>
            <Icon library="ionicons" name="backspace" size={20} color="#00ff88" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* AI Routing Info */}
      {number && (
        <View style={mobileStyles.infoCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <AppIcons.aiRouting size={20} />
            <Text style={mobileStyles.bodyTextBold}>AI Route Analysis</Text>
          </View>
          <Text style={mobileStyles.greenText}>
            Backend connected • Optimizing route...
          </Text>
          <Text style={mobileStyles.smallText}>
            Estimated savings: 65-75% • Best carrier selection in progress
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
          (!number || calling) && { backgroundColor: '#666' }
        ]} 
        onPress={makeCall}
        disabled={!number || calling}
      >
        {calling ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator color="#000" style={{ marginRight: 8 }} />
            <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 18 }}>
              Connecting...
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <AppIcons.phone size={18} color={number ? "#000" : "#ccc"} />
            <Text style={[
              { fontWeight: 'bold', fontSize: 18 },
              number ? { color: '#000' } : { color: '#ccc' }
            ]}>
              Call
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Quick access buttons */}
      <View style={mobileStyles.buttonRow}>
        <TouchableOpacity 
          style={mobileStyles.secondaryButton}
          onPress={() => router.push('/tabs/contacts')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <AppIcons.contacts size={18} color="#fff" />
            <Text style={mobileStyles.whiteText}>Contacts</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={mobileStyles.secondaryButton}
          onPress={() => router.push('/tabs/recent')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <AppIcons.recent size={18} color="#fff" />
            <Text style={mobileStyles.whiteText}>Recent</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Development tools */}
      {__DEV__ && (
        <TouchableOpacity 
          style={[mobileStyles.secondaryButton, { marginTop: 10 }]}
          onPress={testConnection}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon library="ionicons" name="flask" size={18} color="#fff" />
            <Text style={mobileStyles.whiteText}>Test Backend Connection</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}