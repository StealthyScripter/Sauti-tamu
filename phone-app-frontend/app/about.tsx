import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { mobileStyles } from '../styles/mobileStyles';

export default function About() {
  const router = useRouter();

  const features = [
    { icon: '🤖', title: 'AI-Powered Routing', description: 'Smart algorithms find the best call routes automatically' },
    { icon: '💰', title: 'Cost Savings', description: 'Save up to 70% on international and long-distance calls' },
    { icon: '📱', title: 'Easy to Use', description: 'Simple interface with powerful features underneath' },
    { icon: '🌍', title: 'Global Coverage', description: 'Connect to over 200 countries worldwide' },
    { icon: '🔒', title: 'Secure & Private', description: 'End-to-end encryption for all your communications' },
    { icon: '📊', title: 'Analytics', description: 'Track your savings and call quality in real-time' }
  ];

  const stats = [
    { value: '2M+', label: 'Happy Users' },
    { value: '200+', label: 'Countries' },
    { value: '70%', label: 'Average Savings' },
    { value: '99.9%', label: 'Uptime' }
  ];

  return (
    <View style={mobileStyles.scrollContainer}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={mobileStyles.header}>About SmartConnect</Text>
        
        <View style={mobileStyles.infoCard}>
          <Text style={mobileStyles.title}>🚀</Text>
          <Text style={mobileStyles.bodyTextBold}>SmartConnect AI</Text>
          <Text style={mobileStyles.smallText}>
            Revolutionizing global communications through intelligent call routing and AI-powered cost optimization.
          </Text>
        </View>

        <Text style={mobileStyles.sectionTitle}>Our Mission</Text>
        <View style={mobileStyles.card}>
          <Text style={mobileStyles.bodyText}>
            To make global communication affordable and accessible for everyone by leveraging AI to optimize call routes and reduce costs without compromising quality.
          </Text>
        </View>

        <Text style={mobileStyles.sectionTitle}>Key Features</Text>
        {features.map((feature, index) => (
          <View key={index} style={mobileStyles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 24, marginRight: 12 }}>{feature.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={mobileStyles.bodyTextBold}>{feature.title}</Text>
                <Text style={mobileStyles.smallText}>{feature.description}</Text>
              </View>
            </View>
          </View>
        ))}

        <Text style={mobileStyles.sectionTitle}>By the Numbers</Text>
        <View style={mobileStyles.card}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {stats.map((stat, index) => (
              <View key={index} style={{ width: '48%', alignItems: 'center', marginBottom: 16 }}>
                <Text style={mobileStyles.greenTextLarge}>{stat.value}</Text>
                <Text style={mobileStyles.smallText}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={mobileStyles.sectionTitle}>Company Information</Text>
        <View style={mobileStyles.card}>
          <Text style={mobileStyles.bodyTextBold}>SmartConnect AI Inc.</Text>
          <Text style={mobileStyles.smallText}>Founded: 2020</Text>
          <Text style={mobileStyles.smallText}>Headquarters: Tech Valley, California</Text>
          <Text style={mobileStyles.smallText}>Version: 1.0.0</Text>
          <Text style={mobileStyles.smallText}>Build: 2024.12.09</Text>
        </View>

        <View style={mobileStyles.card}>
          <Text style={mobileStyles.bodyTextBold}>Legal</Text>
          <Text style={mobileStyles.smallText}>© 2024 SmartConnect AI Inc.</Text>
          <Text style={mobileStyles.smallText}>All rights reserved.</Text>
          <Text style={mobileStyles.greenText}>Privacy Policy • Terms of Service</Text>
        </View>

        <TouchableOpacity 
          style={[mobileStyles.primaryButton, { marginTop: 20 }]} 
          onPress={() => router.back()}
        >
          <Text style={mobileStyles.whiteText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}