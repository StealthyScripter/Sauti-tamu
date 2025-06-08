import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { mobileStyles } from '../styles/mobileStyles';

export default function AddContact() {
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');
  const router = useRouter();

  return (
    <View style={mobileStyles.scrollContainer}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={mobileStyles.header}>Add Contact</Text>

        <View style={mobileStyles.formGroup}>
          <Text style={mobileStyles.label}>Name</Text>
          <TextInput 
            style={mobileStyles.input} 
            value={name} 
            onChangeText={setName} 
            placeholder="Enter full name" 
            placeholderTextColor="#888" 
          />
        </View>

        <View style={mobileStyles.formGroup}>
          <Text style={mobileStyles.label}>Phone Number</Text>
          <TextInput 
            style={mobileStyles.input} 
            value={number} 
            onChangeText={setNumber} 
            keyboardType="phone-pad" 
            placeholder="+1 (555) 000-0000" 
            placeholderTextColor="#888" 
          />
        </View>

        <View style={mobileStyles.formGroup}>
          <Text style={mobileStyles.label}>Country</Text>
          <TextInput 
            style={mobileStyles.input} 
            value={country} 
            onChangeText={setCountry} 
            placeholder="Country" 
            placeholderTextColor="#888" 
          />
        </View>

        <View style={mobileStyles.formGroup}>
          <Text style={mobileStyles.label}>Email (Optional)</Text>
          <TextInput 
            style={mobileStyles.input} 
            value={email} 
            onChangeText={setEmail} 
            keyboardType="email-address" 
            placeholder="contact@example.com" 
            placeholderTextColor="#888" 
          />
        </View>

        <View style={mobileStyles.buttonRow}>
          <TouchableOpacity style={mobileStyles.primaryButton}>
            <Text style={mobileStyles.whiteText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={mobileStyles.secondaryButton} 
            onPress={() => router.back()}
          >
            <Text style={mobileStyles.whiteText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}