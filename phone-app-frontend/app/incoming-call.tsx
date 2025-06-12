import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { mobileStyles } from '../styles/mobileStyles';
import { AppIcons, Icon } from '../components/Icons';

export default function IncomingCall() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const callerName = params.name || 'Ahmed Kofi';
  const callerNumber = params.number || '+234 803 123 4567';
  const callerInitials = params.initials || 'AK';

  useEffect(() => {
    // Create pulsing animation for incoming call
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  const handleAnswer = () => {
    console.log('📞 Answering call from:', callerName);
    router.replace('/active-call');
  };

  const handleDecline = () => {
    console.log('📞 Declining call from:', callerName);
    router.back();
  };

  const handleMessage = () => {
    router.push({
      pathname: '/compose-message',
      params: {
        contactName: callerName,
        contactNumber: callerNumber,
      }
    });
  };

  return (
    <View style={mobileStyles.callContainer}>
      {/* Incoming call indicator */}
      <View style={mobileStyles.infoCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Icon library="ionicons" name="call" size={20} color="#00ff88" />
          </Animated.View>
          <Text style={mobileStyles.bodyTextBold}>Incoming Call</Text>
        </View>
        <Text style={mobileStyles.greenText}>SmartConnect routing</Text>
        <Text style={mobileStyles.smallText}>
          Optimized connection • HD Quality
        </Text>
      </View>

      {/* Caller Avatar with pulse animation */}
      <Animated.View 
        style={[
          mobileStyles.avatarLarge, 
          { transform: [{ scale: pulseAnim }] }
        ]}
      >
        <Text style={mobileStyles.avatarTextLarge}>{callerInitials}</Text>
      </Animated.View>

      <Text style={mobileStyles.title}>{callerName}</Text>
      <Text style={mobileStyles.subtitle}>{callerNumber}</Text>

      {/* Call quality info */}
      <View style={mobileStyles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <AppIcons.quality size={20} />
          <Text style={mobileStyles.bodyTextBold}>Connection Quality</Text>
        </View>
        <Text style={mobileStyles.greenText}>Excellent signal strength</Text>
        <Text style={mobileStyles.smallText}>
          Via Carrier A • 99.2% uptime • $0.08/min rate
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={mobileStyles.callControlGrid}>
        <TouchableOpacity 
          style={mobileStyles.callControlButton}
          onPress={handleMessage}
        >
          <AppIcons.message size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={mobileStyles.callControlButton}>
          <Icon library="ionicons" name="person-add" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={mobileStyles.callControlButton}>
          <Icon library="ionicons" name="information-circle" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Answer/Decline buttons */}
      <View style={mobileStyles.incomingCallButtons}>
        <TouchableOpacity 
          style={mobileStyles.declineButton} 
          onPress={handleDecline}
        >
          <Icon library="ionicons" name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={mobileStyles.answerButton} 
          onPress={handleAnswer}
        >
          <AppIcons.callAnswer size={32} />
        </TouchableOpacity>
      </View>

      {/* Swipe hints */}
      <View style={{ marginTop: 20, alignItems: 'center' }}>
        <Text style={mobileStyles.smallText}>
          Swipe up for more options
        </Text>
      </View>
    </View>
  );
}