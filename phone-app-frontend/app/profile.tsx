import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { mobileStyles } from '../styles/mobileStyles';

export default function Profile() {
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john.doe@example.com');
  const [phone, setPhone] = useState('+1 (555) 123-4567');

  return (
    <View style={mobileStyles.scrollContainer}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={mobileStyles.header}>Profile</Text>
        
        <View style={mobileStyles.avatarMedium}>
          <Text style={mobileStyles.avatarTextLarge}>JD</Text>
        </View>

        <View style={mobileStyles.formGroup}>
          <Text style={mobileStyles.label}>Name</Text>
          <TextInput 
            style={mobileStyles.input} 
            value={name} 
            onChangeText={setName} 
          />
        </View>

        <View style={mobileStyles.formGroup}>
          <Text style={mobileStyles.label}>Email</Text>
          <TextInput 
            style={mobileStyles.input} 
            value={email} 
            onChangeText={setEmail} 
          />
        </View>

        <View style={mobileStyles.formGroup}>
          <Text style={mobileStyles.label}>Phone</Text>
          <TextInput 
            style={mobileStyles.input} 
            value={phone} 
            onChangeText={setPhone} 
          />
        </View>

        <View style={mobileStyles.infoCard}>
          <Text style={mobileStyles.bodyTextBold}>Total Savings This Month</Text>
          <Text style={mobileStyles.greenTextLarge}>$47.80</Text>
          <Text style={mobileStyles.smallText}>152 calls • AI routing saved 68%</Text>
        </View>

        <View style={mobileStyles.buttonRow}>
          <TouchableOpacity style={mobileStyles.primaryButton}>
            <Text style={mobileStyles.whiteText}>Update</Text>
          </TouchableOpacity>
          <TouchableOpacity style={mobileStyles.secondaryButton}>
            <Text style={mobileStyles.whiteText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}