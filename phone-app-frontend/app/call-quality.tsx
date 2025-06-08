import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { mobileStyles } from '../styles/mobileStyles';

type QualityStatus = 'Excellent' | 'Good' | 'Poor';
type IssueSeverity = 'Minor' | 'Low' | 'Medium' | 'High';

interface QualityMetric {
  label: string;
  value: string;
  status: QualityStatus;
}

interface RecentIssue {
  time: string;
  issue: string;
  severity: IssueSeverity;
}

export default function CallQuality() {
  const router = useRouter();

  const qualityMetrics: QualityMetric[] = [
    { label: 'Average Call Quality', value: '4.8/5', status: 'Excellent' },
    { label: 'Network Latency', value: '45ms', status: 'Good' },
    { label: 'Audio Clarity', value: '96%', status: 'Excellent' },
    { label: 'Connection Success', value: '99.2%', status: 'Excellent' },
    { label: 'Drop Rate', value: '0.3%', status: 'Excellent' },
  ];

  const recentIssues: RecentIssue[] = [
    { time: '2 hours ago', issue: 'Brief audio lag', severity: 'Minor' },
    { time: 'Yesterday', issue: 'Connection retry', severity: 'Minor' },
    { time: '3 days ago', issue: 'Background noise detected', severity: 'Low' },
  ];

  const getStatusColor = (status: QualityStatus): string => {
    switch (status) {
      case 'Excellent': return '#00ff88';
      case 'Good': return '#ffa502';
      case 'Poor': return '#ff4757';
      default: return '#ccc';
    }
  };

  const getSeverityColor = (severity: IssueSeverity): string => {
    switch (severity) {
      case 'Minor':
      case 'Low': return '#ffa502';
      case 'Medium': return '#ff6b6b';
      case 'High': return '#ff4757';
      default: return '#ccc';
    }
  };

  return (
    <View style={mobileStyles.scrollContainer}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={mobileStyles.header}>Call Quality Analysis</Text>
        
        <View style={mobileStyles.infoCard}>
          <Text style={mobileStyles.bodyTextBold}>Overall Score</Text>
          <Text style={[mobileStyles.greenTextLarge, { fontSize: 36 }]}>4.8/5</Text>
          <Text style={mobileStyles.smallText}>Based on your last 100 calls</Text>
        </View>

        <Text style={[mobileStyles.sectionTitle, { marginTop: 24 }]}>Quality Metrics</Text>
        
        {qualityMetrics.map((metric, index) => (
          <View key={index} style={mobileStyles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={mobileStyles.bodyTextBold}>{metric.label}</Text>
                <Text style={mobileStyles.bodyText}>{metric.value}</Text>
              </View>
              <Text style={[mobileStyles.smallText, { color: getStatusColor(metric.status) }]}>
                {metric.status}
              </Text>
            </View>
          </View>
        ))}

        <Text style={[mobileStyles.sectionTitle, { marginTop: 24 }]}>Recent Issues</Text>
        
        {recentIssues.map((issue, index) => (
          <View key={index} style={mobileStyles.card}>
            <Text style={mobileStyles.bodyText}>{issue.issue}</Text>
            <Text style={mobileStyles.smallText}>{issue.time}</Text>
            <Text style={[mobileStyles.smallText, { color: getSeverityColor(issue.severity) }]}>
              {issue.severity}
            </Text>
          </View>
        ))}

        <View style={mobileStyles.buttonRow}>
          <TouchableOpacity style={mobileStyles.primaryButton}>
            <Text style={mobileStyles.whiteText}>Run Diagnostic</Text>
          </TouchableOpacity>
          <TouchableOpacity style={mobileStyles.secondaryButton} onPress={() => router.back()}>
            <Text style={mobileStyles.whiteText}>Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}