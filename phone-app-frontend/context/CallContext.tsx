import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_CONFIG } from '../api-config';
import { Alert } from 'react-native';

interface CallData {
  callId: string;
  fromUserId: string;
  fromDisplayName: string;
  callType: 'voice' | 'video';
  agoraToken?: string;
}

interface CallContextType {
  socket: Socket | null;
  incomingCall: CallData | null;
  isConnected: boolean;
  acceptCall: (callId: string) => void;
  rejectCall: (callId: string) => void;
  clearIncomingCall: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

export const CallProvider = ({ children }: { children: ReactNode }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (token && user) {
      console.log('🔌 Connecting to WebSocket...');
      
      const newSocket = io(API_CONFIG.BASE_URL, {
        auth: {
          token: token
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        
        // Send user online status
        newSocket.emit('user_online');
      });

      newSocket.on('disconnect', () => {
        console.log('❌ WebSocket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        setIsConnected(false);
      });

      // Handle incoming calls
      newSocket.on('incoming_call', (callData: CallData) => {
        console.log('📞 Incoming call received:', callData);
        setIncomingCall(callData);
        
        // Show incoming call UI
        Alert.alert(
          'Incoming Call',
          `${callData.fromDisplayName} is calling...`,
          [
            {
              text: 'Decline',
              onPress: () => rejectCall(callData.callId),
              style: 'cancel'
            },
            {
              text: 'Accept',
              onPress: () => acceptCall(callData.callId)
            }
          ],
          { cancelable: false }
        );
      });

      // Handle call status changes
      newSocket.on('call_status_change', (data) => {
        console.log('📞 Call status change:', data);
        
        switch (data.status) {
          case 'ended':
            Alert.alert('Call Ended', data.message || 'Call has ended');
            setIncomingCall(null);
            break;
          case 'rejected':
            Alert.alert('Call Declined', data.message || 'Call was declined');
            setIncomingCall(null);
            break;
          case 'active':
            console.log('📞 Call is now active');
            break;
          case 'recording_started':
            Alert.alert('Recording Started', 'This call is now being recorded');
            break;
          case 'recording_stopped':
            Alert.alert('Recording Stopped', 'Call recording has stopped');
            break;
        }
      });

      // Handle user status changes
      newSocket.on('user_status_change', (data) => {
        console.log('👤 User status change:', data);
      });

      setSocket(newSocket);

      return () => {
        console.log('🔌 Cleaning up WebSocket connection');
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [token, user]);

  const acceptCall = async (callId: string) => {
    try {
      console.log('✅ Accepting call:', callId);
      // Will be handled by API call in the component
      setIncomingCall(null);
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      Alert.alert('Error', 'Failed to accept call');
    }
  };

  const rejectCall = async (callId: string) => {
    try {
      console.log('❌ Rejecting call:', callId);
      // Will be handled by API call in the component  
      setIncomingCall(null);
    } catch (error) {
      console.error('❌ Error rejecting call:', error);
      Alert.alert('Error', 'Failed to reject call');
    }
  };

  const clearIncomingCall = () => {
    setIncomingCall(null);
  };

  return (
    <CallContext.Provider value={{
      socket,
      incomingCall,
      isConnected,
      acceptCall,
      rejectCall,
      clearIncomingCall
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};