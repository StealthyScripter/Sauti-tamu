import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { mobileStyles } from '../../styles/mobileStyles';
import apiService from '../../services/apiService';

interface Contact {
  _id: string;
  phoneNumber: string;
  displayName: string;
  // Add other fields as needed
}

export default function Contacts() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load contacts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadContacts();
    }, [])
  );

  const loadContacts = async () => {
    try {
      console.log('📱 Loading contacts...');
      setLoading(true);
      const response = await apiService.getContacts();
      
      if (response.success) {
        console.log('✅ Contacts loaded:', response.data?.length || 0);
        setContacts(response.data || []);
      } else {
        console.error('❌ Failed to load contacts:', response.message);
        Alert.alert('Error', 'Failed to load contacts');
      }
    } catch (error) {
      console.error('❌ Error loading contacts:', error);
      Alert.alert('Connection Error', 'Unable to load contacts. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const navigateToContact = (contact: Contact) => {
    router.push({
      pathname: '/contact-detail',
      params: {
        id: contact._id,
        name: contact.displayName,
        number: contact.phoneNumber,
        initials: getInitials(contact.displayName),
      }
    });
  };

  const navigateToAddContact = () => {
    router.push('/add-contacts');
  };

  if (loading) {
    return (
      <View style={[mobileStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00ff88" />
        <Text style={[mobileStyles.bodyText, { marginTop: 16 }]}>Loading contacts...</Text>
      </View>
    );
  }

  return (
    <View style={mobileStyles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={mobileStyles.header}>Contacts</Text>
        <TouchableOpacity 
          style={[mobileStyles.primaryButton, { flex: 0, paddingHorizontal: 20 }]}
          onPress={navigateToAddContact}
        >
          <Text style={{ color: '#000', fontWeight: 'bold' }}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Connection Status */}
      <View style={mobileStyles.infoCard}>
        <Text style={mobileStyles.bodyTextBold}>📡 API Status</Text>
        <Text style={mobileStyles.greenText}>Connected to backend</Text>
        <Text style={mobileStyles.smallText}>
          {contacts.length} contacts loaded from database
        </Text>
      </View>

      {contacts.length === 0 ? (
        <View style={mobileStyles.card}>
          <Text style={mobileStyles.bodyTextBold}>No contacts yet</Text>
          <Text style={mobileStyles.smallText}>
            Add your first contact to start making calls with AI-optimized routing
          </Text>
          <TouchableOpacity 
            style={[mobileStyles.primaryButton, { marginTop: 16 }]}
            onPress={navigateToAddContact}
          >
            <Text style={{ color: '#000', fontWeight: 'bold' }}>Add First Contact</Text>

          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#00ff88"
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={mobileStyles.contactCard}
              onPress={() => navigateToContact(item)}
            >
              <View style={mobileStyles.avatarSmall}>
                <Text style={mobileStyles.avatarText}>
                  {getInitials(item.displayName)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={mobileStyles.bodyTextBold}>{item.displayName}</Text>
                <Text style={mobileStyles.smallText}>{item.phoneNumber}</Text>
              </View>
              <Text style={[mobileStyles.smallText, { fontSize: 18 }]}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
