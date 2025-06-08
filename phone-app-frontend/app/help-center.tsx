import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { mobileStyles } from '../styles/mobileStyles';

export default function HelpCenter() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [ref, setRef] = useState('');
  const [issue, setIssue] = useState('');

  const faqs = [
    {
      question: 'How does AI call routing work?',
      answer: 'Our AI analyzes call patterns and finds the most cost-effective routes in real-time, saving you up to 70% on international calls.'
    },
    {
      question: 'Why are my calls cheaper?',
      answer: 'We use multiple carrier networks and intelligent routing to find the best rates for each destination automatically.'
    },
    {
      question: 'Is call quality affected by cost savings?',
      answer: 'No, we maintain HD quality standards while optimizing costs through smart routing algorithms.'
    },
    {
      question: 'How do I view my savings?',
      answer: 'Check your profile or recent calls to see detailed savings information for each call.'
    },
    {
      question: 'Can I disable AI routing?',
      answer: 'Yes, you can toggle AI routing in Settings, though this will disable cost optimization features.'
    }
  ];

  const handleSubmitIssue = () => {
    if (!name.trim() || !email.trim() || !issue.trim()) {
      Alert.alert('Error', 'Please fill in name, email, and issue description');
      return;
    }

    Alert.alert('Issue Submitted', 'Thank you! We\'ll get back to you within 24 hours.');
    setName('');
    setEmail('');
    setRef('');
    setIssue('');
    setShowForm(false);
  };

  return (
    <View style={mobileStyles.scrollContainer}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={mobileStyles.header}>Help Center</Text>
        
        {!showForm ? (
          <>
            <Text style={mobileStyles.sectionTitle}>Frequently Asked Questions</Text>
            
            {faqs.map((faq, index) => (
              <View key={index} style={mobileStyles.card}>
                <Text style={mobileStyles.bodyTextBold}>{faq.question}</Text>
                <Text style={[mobileStyles.smallText, { marginTop: 8 }]}>{faq.answer}</Text>
              </View>
            ))}

            <View style={mobileStyles.buttonRow}>
              <TouchableOpacity 
                style={mobileStyles.primaryButton}
                onPress={() => setShowForm(true)}
              >
                <Text style={mobileStyles.whiteText}>Report an Issue</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={mobileStyles.secondaryButton} 
                onPress={() => router.back()}
              >
                <Text style={mobileStyles.whiteText}>Back</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={mobileStyles.sectionTitle}>Report an Issue</Text>
            
            <View style={mobileStyles.formGroup}>
              <Text style={mobileStyles.label}>Name *</Text>
              <TextInput 
                style={mobileStyles.input} 
                value={name} 
                onChangeText={setName} 
                placeholder="Your full name" 
                placeholderTextColor="#888" 
              />
            </View>

            <View style={mobileStyles.formGroup}>
              <Text style={mobileStyles.label}>Email *</Text>
              <TextInput 
                style={mobileStyles.input} 
                value={email} 
                onChangeText={setEmail} 
                keyboardType="email-address"
                placeholder="your.email@example.com" 
                placeholderTextColor="#888" 
              />
            </View>

            <View style={mobileStyles.formGroup}>
              <Text style={mobileStyles.label}>Reference (Optional)</Text>
              <TextInput 
                style={mobileStyles.input} 
                value={ref} 
                onChangeText={setRef} 
                placeholder="Call ID, order number, etc." 
                placeholderTextColor="#888" 
              />
            </View>

            <View style={mobileStyles.formGroup}>
              <Text style={mobileStyles.label}>Issue Description *</Text>
              <TextInput 
                style={[mobileStyles.input, { 
                  height: 120, 
                  textAlignVertical: 'top',
                  paddingTop: 16 
                }]} 
                value={issue} 
                onChangeText={setIssue} 
                placeholder="Please describe the issue you're experiencing..." 
                placeholderTextColor="#888" 
                multiline={true}
                numberOfLines={4}
              />
            </View>

            <View style={mobileStyles.buttonRow}>
              <TouchableOpacity 
                style={mobileStyles.primaryButton}
                onPress={handleSubmitIssue}
              >
                <Text style={mobileStyles.whiteText}>Submit Issue</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={mobileStyles.secondaryButton} 
                onPress={() => setShowForm(false)}
              >
                <Text style={mobileStyles.whiteText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}