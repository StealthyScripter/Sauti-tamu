import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { mobileStyles } from '../styles/mobileStyles';

// Helper function to ensure string type from params
const getStringParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) {
    return param[0] || '';
  }
  return param || '';
};

export default function AddContact() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');

  const isEditing = getStringParam(params.edit) === 'true';

  useEffect(() => {
    if (isEditing) {
      setName(getStringParam(params.name));
      setNumber(getStringParam(params.number));
      setLocation(getStringParam(params.location));
    }
  }, [isEditing, params.name, params.number, params.location]);

  const handleSave = () => {
    if (!name.trim() || !number.trim()) {
      Alert.alert('Error', 'Please fill in name and phone number');
      return;
    }

    const action = isEditing ? 'updated' : 'saved';
    Alert.alert('Success', `Contact ${action} successfully!`);
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={mobileStyles.scrollContainer}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={mobileStyles.header}>
          {isEditing ? 'Edit Contact' : 'Add Contact'}
        </Text>

        <View style={mobileStyles.formGroup}>
          <Text style={mobileStyles.label}>Name *</Text>
          <TextInput 
            style={mobileStyles.input} 
            value={name} 
            onChangeText={setName} 
            placeholder="Enter full name" 
            placeholderTextColor="#888" 
          />
        </View>

        <View style={mobileStyles.formGroup}>
          <Text style={mobileStyles.label}>Phone Number *</Text>
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
          <Text style={mobileStyles.label}>Location</Text>
          <TextInput 
            style={mobileStyles.input} 
            value={location} 
            onChangeText={setLocation} 
            placeholder="City, Country" 
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
          <TouchableOpacity style={mobileStyles.primaryButton} onPress={handleSave}>
            <Text style={mobileStyles.whiteText}>
              {isEditing ? 'Update' : 'Save'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={mobileStyles.secondaryButton} onPress={handleCancel}>
            <Text style={mobileStyles.whiteText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}