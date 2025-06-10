import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { mobileStyles } from '../styles/mobileStyles';
import { AppIcons, Icon } from '../components/Icons';

interface SupportCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  available: boolean;
}

export default function ContactSupport() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [urgent, setUrgent] = useState<boolean>(false);

  const supportCategories: SupportCategory[] = [
    { id: 'billing', title: 'Billing & Payments', icon: <Icon library="ionicons" name="card" size={20} color="#00ff88" /> },
    { id: 'technical', title: 'Technical Issues', icon: <Icon library="ionicons" name="build" size={20} color="#00ff88" /> },
    { id: 'quality', title: 'Call Quality', icon: <AppIcons.quality size={20} /> },
    { id: 'account', title: 'Account Settings', icon: <AppIcons.settings size={20} color="#00ff88" /> },
    { id: 'feature', title: 'Feature Request', icon: <Icon library="ionicons" name="bulb" size={20} color="#00ff88" /> },
    { id: 'other', title: 'Other', icon: <Icon library="ionicons" name="ellipsis-horizontal" size={20} color="#00ff88" /> },
  ];

  const quickActions: QuickAction[] = [
    {
      title: 'Live Chat',
      description: 'Chat with support agent',
      icon: <AppIcons.message size={24} color="#000" />,
      action: () => Alert.alert('Live Chat', 'Connecting to support agent...'),
      available: true
    },
    {
      title: 'Call Support',
      description: 'Speak with our team',
      icon: <AppIcons.phone size={24} color="#000" />,
      action: () => Alert.alert('Call Support', 'Calling +1-800-SUPPORT...'),
      available: true
    },
    {
      title: 'Video Call',
      description: 'Screen sharing available',
      icon: <Icon library="ionicons" name="videocam" size={24} color="#000" />,
      action: () => Alert.alert('Video Support', 'Feature coming soon!'),
      available: false
    }
  ];

  const handleSubmit = (): void => {
    if (!selectedCategory || !subject.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    Alert.alert(
      'Support Ticket Created',
      'Your support request has been submitted. We\'ll get back to you within 2 hours.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handleCategorySelect = (categoryId: string): void => {
    setSelectedCategory(categoryId);
  };

  const handleUrgentToggle = (): void => {
    setUrgent(!urgent);
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
          <Text style={mobileStyles.header}>Contact Support</Text>
        </View>

        {/* Support Status */}
        <View style={mobileStyles.infoCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Icon library="ionicons" name="checkmark-circle" size={20} color="#00ff88" />
            <Text style={mobileStyles.bodyTextBold}>Support Available</Text>
          </View>
          <Text style={mobileStyles.greenText}>Average response time: 2 hours</Text>
          <Text style={mobileStyles.smallText}>
            24/7 support • Live chat available • Multiple languages
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={mobileStyles.section}>
          <Text style={mobileStyles.sectionTitle}>Quick Support Options</Text>
          <View style={{ gap: 12 }}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  mobileStyles.card,
                  !action.available && { opacity: 0.6 }
                ]}
                onPress={action.action}
                disabled={!action.available}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[
                    mobileStyles.avatarSmall,
                    { backgroundColor: action.available ? '#00ff88' : '#666' }
                  ]}>
                    {action.icon}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={mobileStyles.bodyTextBold}>{action.title}</Text>
                    <Text style={mobileStyles.smallText}>{action.description}</Text>
                  </View>
                  <AppIcons.chevronRight size={18} color="#888" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Support Ticket Form */}
        <View style={mobileStyles.section}>
          <Text style={mobileStyles.sectionTitle}>Create Support Ticket</Text>
          
          {/* Category Selection */}
          <View style={mobileStyles.formGroup}>
            <Text style={mobileStyles.label}>Category *</Text>
            <View style={{ gap: 8 }}>
              {supportCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    mobileStyles.menuItem,
                    selectedCategory === category.id && { backgroundColor: 'rgba(0, 255, 136, 0.1)' }
                  ]}
                  onPress={() => handleCategorySelect(category.id)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {category.icon}
                    <Text style={mobileStyles.bodyText}>{category.title}</Text>
                  </View>
                  {selectedCategory === category.id && (
                    <Icon library="ionicons" name="checkmark" size={18} color="#00ff88" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Subject */}
          <View style={mobileStyles.formGroup}>
            <Text style={mobileStyles.label}>Subject *</Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              style={mobileStyles.input}
              placeholder="Brief description of your issue"
              placeholderTextColor="#888"
            />
          </View>

          {/* Message */}
          <View style={mobileStyles.formGroup}>
            <Text style={mobileStyles.label}>Message *</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              style={[mobileStyles.input, { height: 120, textAlignVertical: 'top' }]}
              placeholder="Describe your issue in detail..."
              placeholderTextColor="#888"
              multiline
            />
          </View>

          {/* Priority */}
          <TouchableOpacity
            style={mobileStyles.settingItem}
            onPress={handleUrgentToggle}
          >
            <View style={{ flex: 1 }}>
              <Text style={mobileStyles.bodyTextBold}>Mark as Urgent</Text>
              <Text style={mobileStyles.smallText}>
                For critical issues affecting service
              </Text>
            </View>
            <Icon 
              library="ionicons" 
              name={urgent ? "checkbox" : "square-outline"} 
              size={24} 
              color={urgent ? "#00ff88" : "#888"} 
            />
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity style={mobileStyles.primaryButton} onPress={handleSubmit}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon library="ionicons" name="send" size={18} color="#000" />
              <Text style={{ color: '#000', fontWeight: 'bold' }}>Submit Ticket</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Additional Resources */}
        <View style={mobileStyles.section}>
          <Text style={mobileStyles.sectionTitle}>Additional Resources</Text>
          
          <TouchableOpacity 
            style={mobileStyles.menuItem}
            onPress={() => router.push('/help-center')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <AppIcons.help size={20} color="#fff" />
              <Text style={mobileStyles.bodyText}>Help Center</Text>
            </View>
            <AppIcons.chevronRight size={18} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={mobileStyles.menuItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon library="ionicons" name="document-text" size={20} color="#fff" />
              <Text style={mobileStyles.bodyText}>Knowledge Base</Text>
            </View>
            <AppIcons.chevronRight size={18} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={mobileStyles.menuItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon library="ionicons" name="people" size={20} color="#fff" />
              <Text style={mobileStyles.bodyText}>Community Forum</Text>
            </View>
            <AppIcons.chevronRight size={18} color="#888" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}