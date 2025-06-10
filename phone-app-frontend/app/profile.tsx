import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { mobileStyles } from '../styles/mobileStyles';
import { useAuth } from '../context/AuthContext';
import { AppIcons, Icon } from '../components/Icons';

export default function Profile() {
  const router = useRouter();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleSave = () => {
    Alert.alert('Success', 'Profile updated successfully!');
    setEditing(false);
  };

  const handleCancel = () => {
    setDisplayName(user?.displayName || '');
    setEmail(user?.email || '');
    setEditing(false);
  };

  return (
    <View style={mobileStyles.scrollContainer}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <AppIcons.back size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={mobileStyles.header}>Profile</Text>
        </View>

        <View style={mobileStyles.avatarMedium}>
          <Text style={mobileStyles.avatarTextLarge}>
            {user?.displayName?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>

        <View style={mobileStyles.infoCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Icon library="ionicons" name="person-circle" size={20} color="#00ff88" />
            <Text style={mobileStyles.bodyTextBold}>Account Information</Text>
          </View>
          <Text style={mobileStyles.greenText}>SmartConnect User</Text>
          <Text style={mobileStyles.smallText}>
            Member since: December 2024
          </Text>
        </View>

        <View style={mobileStyles.formGroup}>
          <Text style={mobileStyles.label}>Display Name</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            editable={editing}
            style={[mobileStyles.input, !editing && { backgroundColor: '#333', color: '#ccc' }]}
            placeholder="Enter your display name"
            placeholderTextColor="#888"
          />
        </View>

        <View style={mobileStyles.formGroup}>
          <Text style={mobileStyles.label}>Phone Number</Text>
          <TextInput
            value={user?.phoneNumber || '+1 234 567 8901'}
            editable={false}
            style={[mobileStyles.input, { backgroundColor: '#333', color: '#ccc' }]}
          />
          <Text style={mobileStyles.smallText}>
            Phone number cannot be changed. Contact support if needed.
          </Text>
        </View>

        <View style={mobileStyles.formGroup}>
          <Text style={mobileStyles.label}>Email Address</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            editable={editing}
            style={[mobileStyles.input, !editing && { backgroundColor: '#333', color: '#ccc' }]}
            placeholder="Enter your email"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Account Stats */}
        <View style={mobileStyles.card}>
          <Text style={mobileStyles.bodyTextBold}>Account Statistics</Text>
          <View style={{ marginTop: 12, gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={mobileStyles.smallText}>Total Calls Made:</Text>
              <Text style={mobileStyles.greenText}>47</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={mobileStyles.smallText}>Total Minutes:</Text>
              <Text style={mobileStyles.greenText}>234 min</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={mobileStyles.smallText}>Money Saved:</Text>
              <Text style={mobileStyles.greenText}>$18.72</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={mobileStyles.smallText}>Average Savings:</Text>
              <Text style={mobileStyles.greenText}>68%</Text>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        {editing ? (
          <View style={mobileStyles.buttonRow}>
            <TouchableOpacity style={mobileStyles.primaryButton} onPress={handleSave}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon library="ionicons" name="checkmark" size={18} color="#000" />
                <Text style={{ color: '#000', fontWeight: 'bold' }}>Save</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={mobileStyles.secondaryButton} onPress={handleCancel}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon library="ionicons" name="close" size={18} color="#fff" />
                <Text style={mobileStyles.whiteText}>Cancel</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={mobileStyles.primaryButton} onPress={() => setEditing(true)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AppIcons.edit size={18} color="#000" />
              <Text style={{ color: '#000', fontWeight: 'bold' }}>Edit Profile</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Additional Options */}
        <View style={mobileStyles.section}>
          <Text style={mobileStyles.sectionTitle}>Privacy & Security</Text>
          
          <TouchableOpacity style={mobileStyles.menuItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon library="ionicons" name="shield-checkmark" size={20} color="#fff" />
              <Text style={mobileStyles.bodyText}>Change Password</Text>
            </View>
            <AppIcons.chevronRight size={18} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={mobileStyles.menuItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon library="ionicons" name="lock-closed" size={20} color="#fff" />
              <Text style={mobileStyles.bodyText}>Privacy Settings</Text>
            </View>
            <AppIcons.chevronRight size={18} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={mobileStyles.menuItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon library="ionicons" name="download" size={20} color="#fff" />
              <Text style={mobileStyles.bodyText}>Export Data</Text>
            </View>
            <AppIcons.chevronRight size={18} color="#888" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}