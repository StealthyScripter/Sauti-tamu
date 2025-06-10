import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { mobileStyles } from '../../styles/mobileStyles';
import apiService from '../../services/apiService';
import { AppIcons, Icon } from '../../components/Icons';

interface RecentCall {
  id: string;
  callId: string;
  fromUserId: string;
  toUserId?: string;
  toPhoneNumber: string;
  callType: 'voice' | 'video';
  status: 'initiated' | 'ringing' | 'active' | 'ended' | 'failed' | 'missed' | 'rejected';
  startTime: string;
  endTime?: string;
  duration?: number;
  metadata?: any;
}

export default function Recent() {
  const router = useRouter();
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load call history when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadCallHistory();
    }, [])
  );

  const loadCallHistory = async () => {
    try {
      console.log('📞 Loading call history...');
      setLoading(true);
      const response = await apiService.getCallHistory();
      
      if (response.success) {
        console.log('✅ Call history loaded:', response.data?.length || 0);
        setRecentCalls(response.data || []);
      } else {
        console.error('❌ Failed to load call history:', response.message);
        Alert.alert('Error', 'Failed to load call history');
      }
    } catch (error) {
      console.error('❌ Error loading call history:', error);
      Alert.alert('Connection Error', 'Unable to load call history. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCallHistory();
    setRefreshing(false);
  };

  const getCallTypeIcon = (type: 'voice' | 'video', status: string) => {
    if (type === 'video') {
      return <Icon library="ionicons" name="videocam" size={18} color="#fff" />;
    }
    
    // Different call icons based on status
    switch (status) {
      case 'missed':
        return <Icon library="ionicons" name="call" size={18} color="#ff4757" />;
      case 'rejected':
        return <Icon library="ionicons" name="call" size={18} color="#ff6b6b" />;
      default:
        return <AppIcons.phone size={18} color="#00ff88" />;
    }
  };

  const getCallTypeColor = (status: string): string => {
    switch (status) {
      case 'ended': return '#00ff88';
      case 'missed': return '#ff4757';
      case 'rejected': return '#ff6b6b';
      case 'failed': return '#ff4757';
      default: return '#fff';
    }
  };

  const getCallDirection = (call: RecentCall): 'Incoming' | 'Outgoing' => {
    // Simplified logic - you'll need to compare with current user's ID
    return call.toUserId ? 'Outgoing' : 'Incoming';
  };

  const formatCallTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return minutes <= 1 ? 'Just now' : `${minutes} min ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCallBack = async (phoneNumber: string) => {
    try {
      console.log('📞 Calling back:', phoneNumber);
      const response = await apiService.initiateCall(phoneNumber, 'voice');
      
      if (response.success) {
        console.log('✅ Call initiated:', response.data);
        // Navigate to active call screen
        router.push({
          pathname: '/active-call',
          params: {
            callId: response.data.callId,
            phoneNumber,
          }
        });
      } else {
        Alert.alert('Call Failed', response.message || 'Unable to initiate call');
      }
    } catch (error) {
      console.error('❌ Error initiating call:', error);
      Alert.alert('Error', 'Failed to initiate call. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={[mobileStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00ff88" />
        <Text style={[mobileStyles.bodyText, { marginTop: 16 }]}>Loading call history...</Text>
      </View>
    );
  }

  return (
    <View style={mobileStyles.container}>
      <Text style={mobileStyles.header}>Recent Calls</Text>
      
      {/* API Status */}
      <View style={mobileStyles.infoCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Icon library="ionicons" name="stats-chart" size={20} color="#00ff88" />
          <Text style={mobileStyles.bodyTextBold}>Call History</Text>
        </View>
        <Text style={mobileStyles.greenText}>Live data from backend</Text>
        <Text style={mobileStyles.smallText}>
          {recentCalls.length} calls loaded from database
        </Text>
      </View>
      
      {recentCalls.length === 0 ? (
        <View style={mobileStyles.card}>
          <Text style={mobileStyles.bodyTextBold}>No recent calls</Text>
          <Text style={mobileStyles.smallText}>
            Your call history will appear here once you start making calls
          </Text>
          <TouchableOpacity 
            style={[mobileStyles.primaryButton, { marginTop: 16 }]}
            onPress={() => router.push('/tabs')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AppIcons.phone size={18} color="#000" />
              <Text style={{ color: '#000', fontWeight: 'bold' }}>Make Your First Call</Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recentCalls}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#00ff88"
            />
          }
          renderItem={({ item }) => (
            <View style={mobileStyles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {getCallTypeIcon(item.callType, item.status)}
                  <View style={{ flex: 1 }}>
                    <Text style={mobileStyles.bodyTextBold}>{item.toPhoneNumber}</Text>
                    <Text style={[mobileStyles.smallText, { color: getCallTypeColor(item.status) }]}>
                      {getCallDirection(item)} • {item.status}
                    </Text>
                    <Text style={mobileStyles.greenText}>
                      {formatCallTime(item.startTime)}
                      {item.duration && ` • ${formatDuration(item.duration)}`}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={[mobileStyles.callControlButton, { backgroundColor: '#00ff88' }]}
                  onPress={() => handleCallBack(item.toPhoneNumber)}
                >
                  <AppIcons.phone size={20} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}