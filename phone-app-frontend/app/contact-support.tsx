import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { mobileStyles } from '../styles/mobileStyles';

export default function ContactSupport() {
  const router = useRouter();

  const contactMethods = [
    {
      icon: '📧',
      title: 'Email Support',
      subtitle: 'support@smartconnect.ai',
      description: 'We typically respond within 24 hours',
      action: () => Linking.openURL('mailto:support@smartconnect.ai')
    },
    {
      icon: '📞',
      title: 'Phone Support',
      subtitle: '+1 (555) 123-HELP',
      description: 'Available Mon-Fri, 9 AM - 6 PM EST',
      action: () => Linking.openURL('tel:+15551234357')
    },
    {
      icon: '💬',
      title: 'Live Chat',
      subtitle: 'Chat with our team',
      description: 'Available during business hours',
      action: () => console.log('Open live chat')
    },
    {
      icon: '🌐',
      title: 'Knowledge Base',
      subtitle: 'help.smartconnect.ai',
      description: 'Self-service articles and guides',
      action: () => Linking.openURL('https://help.smartconnect.ai')
    }
  ];

  const businessHours = [
    'Monday - Friday: 9:00 AM - 6:00 PM EST',
    'Saturday: 10:00 AM - 4:00 PM EST',
    'Sunday: Closed',
    'Emergency support available 24/7'
  ];

  return (
    <View style={mobileStyles.scrollContainer}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={mobileStyles.header}>Contact Support</Text>
        
        <View style={mobileStyles.infoCard}>
          <Text style={mobileStyles.bodyTextBold}>🚀 SmartConnect AI</Text>
          <Text style={mobileStyles.smallText}>Intelligent call routing for everyone</Text>
        </View>

        <Text style={mobileStyles.sectionTitle}>Get in Touch</Text>
        
        {contactMethods.map((method, index) => (
          <TouchableOpacity 
            key={index} 
            style={mobileStyles.card}
            onPress={method.action}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 24, marginRight: 12 }}>{method.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={mobileStyles.bodyTextBold}>{method.title}</Text>
                <Text style={mobileStyles.greenText}>{method.subtitle}</Text>
                <Text style={mobileStyles.smallText}>{method.description}</Text>
              </View>
              <Text style={[mobileStyles.smallText, { fontSize: 18 }]}>›</Text>
            </View>
          </TouchableOpacity>
        ))}

        <Text style={[mobileStyles.sectionTitle, { marginTop: 24 }]}>Business Hours</Text>
        
        <View style={mobileStyles.card}>
          {businessHours.map((hour, index) => (
            <Text key={index} style={[mobileStyles.smallText, { marginBottom: 4 }]}>
              {hour}
            </Text>
          ))}
        </View>

        <Text style={[mobileStyles.sectionTitle, { marginTop: 24 }]}>Company Info</Text>
        
        <View style={mobileStyles.card}>
          <Text style={mobileStyles.bodyTextBold}>SmartConnect AI Inc.</Text>
          <Text style={mobileStyles.smallText}>
            123 Innovation Drive{'\n'}
            Tech Valley, CA 94000{'\n'}
            United States
          </Text>
        </View>

        <View style={mobileStyles.buttonRow}>
          <TouchableOpacity 
            style={mobileStyles.primaryButton}
            onPress={() => router.push('/about')}
          >
            <Text style={mobileStyles.whiteText}>About SmartConnect</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={mobileStyles.secondaryButton} 
            onPress={() => router.back()}
          >
            <Text style={mobileStyles.whiteText}>Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}