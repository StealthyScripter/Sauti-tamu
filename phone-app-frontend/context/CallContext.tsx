import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
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
  const { token, user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // FIX: Memoize handlers to prevent recreation on every render
  const handleConnect = useCallback(() => {
    console.log('✅ WebSocket connected');
    setIsConnected(true);
  }, []);

  const handleDisconnect = useCallback(() => {
    console.log('❌ WebSocket disconnected');
    setIsConnected(false);
  }, []);

  const handleConnectError = useCallback((error: any) => {
    console.error('❌ WebSocket connection error:', error);
    setIsConnected(false);
  }, []);

  const handleIncomingCall = useCallback((callData: CallData) => {
    console.log('📞 Incoming call received:', callData);
    setIncomingCall(callData);
    
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
  }, []);

  const handleCallStatusChange = useCallback((data: any) => {
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
  }, []);

  const handleUserStatusChange = useCallback((data: any) => {
    console.log('👤 User status change:', data);
  }, []);

  useEffect(() => {
    // FIX: Only connect when fully authenticated
    if (isAuthenticated && token && user) {
      console.log('🔌 Connecting to WebSocket...');
      
      const newSocket = io(API_CONFIG.BASE_URL, {
        auth: {
          token: token
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
      });

      // Add event listeners
      newSocket.on('connect', handleConnect);
      newSocket.on('disconnect', handleDisconnect);
      newSocket.on('connect_error', handleConnectError);
      newSocket.on('incoming_call', handleIncomingCall);
      newSocket.on('call_status_change', handleCallStatusChange);
      newSocket.on('user_status_change', handleUserStatusChange);

      // Send user online status after connection
      newSocket.on('connect', () => {
        newSocket.emit('user_online');
      });

      setSocket(newSocket);

      // FIX: Proper cleanup function
      return () => {
        console.log('🔌 Cleaning up WebSocket connection');
        
        // Remove all event listeners
        newSocket.off('connect', handleConnect);
        newSocket.off('disconnect', handleDisconnect);
        newSocket.off('connect_error', handleConnectError);
        newSocket.off('incoming_call', handleIncomingCall);
        newSocket.off('call_status_change', handleCallStatusChange);
        newSocket.off('user_status_change', handleUserStatusChange);
        
        // Disconnect socket
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Clean up if not authenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, token, user, 
      handleConnect, handleDisconnect, handleConnectError, 
      handleIncomingCall, handleCallStatusChange, handleUserStatusChange]);

  const acceptCall = useCallback(async (callId: string) => {
    try {
      console.log('✅ Accepting call:', callId);
      setIncomingCall(null);
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      Alert.alert('Error', 'Failed to accept call');
    }
  }, []);

  const rejectCall = useCallback(async (callId: string) => {
    try {
      console.log('❌ Rejecting call:', callId);
      setIncomingCall(null);
    } catch (error) {
      console.error('❌ Error rejecting call:', error);
      Alert.alert('Error', 'Failed to reject call');
    }
  }, []);

  const clearIncomingCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

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