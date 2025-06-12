import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Enhanced base URL determination
const getBaseURL = () => {
  if (__DEV__) {
    // Development mode - handle different scenarios
    if (Platform.OS === 'web') {
      return 'http://localhost:3000';
    }
    
    if (Platform.OS === 'ios') {
      // iOS Simulator
      return 'http://localhost:3000';
    }
    
    if (Platform.OS === 'android') {
      // Check if running on physical device or emulator
      const { isDevice } = Constants;
      
      if (isDevice) {
        // Physical Android device - use computer's IP
        // You'll need to replace this with your actual IP address
        const devServerIP = process.env.EXPO_PUBLIC_DEV_SERVER_IP || '192.168.1.100';
        return `http://${devServerIP}:3000`;
      } else {
        // Android Emulator
        return 'http://10.0.2.2:3000';
      }
    }
    
    return 'http://localhost:3000';
  } else {
    // Production mode
    return process.env.EXPO_PUBLIC_API_URL || 'https://your-production-api.com';
  }
};

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
  ENDPOINTS: {
    // Authentication
    VERIFY_PHONE: '/api/auth/verify-phone',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    
    // Contacts
    CONTACTS: '/api/contacts',
    
    // Calls
    CALLS_INITIATE: '/api/calls/initiate',
    CALLS_ACCEPT: '/api/calls/:callId/accept',
    CALLS_REJECT: '/api/calls/:callId/reject',
    CALLS_END: '/api/calls/:callId/end',
    CALLS_ACTIVE: '/api/calls/active',
    CALLS_HISTORY: '/api/calls/history',
    CALLS_TOKEN: '/api/calls/token',
    
    // Notifications
    NOTIFICATIONS_REGISTER: '/api/notifications/register-token',
    NOTIFICATIONS_SETTINGS: '/api/notifications/settings',
    
    // Recordings
    RECORDINGS: '/api/recordings',
    RECORDINGS_START: '/api/recordings/start',
    RECORDINGS_STOP: '/api/recordings/stop',
  },
  
  // Enhanced headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Version': '1.0.0',
    'X-Platform': Platform.OS,
  },
  
  // Increased timeout for call operations
  TIMEOUT: 30000, // 30 seconds
  
  // WebSocket configuration
  WEBSOCKET: {
    RECONNECTION_ATTEMPTS: 5,
    RECONNECTION_DELAY: 1000,
    TIMEOUT: 20000,
  }
};

// Debug logging enhanced
if (__DEV__) {
  console.log('🌐 API Configuration:', {
    BASE_URL: API_CONFIG.BASE_URL,
    Platform: Platform.OS,
    Environment: __DEV__ ? 'development' : 'production',
    Device: Constants.isDevice ? 'physical' : 'simulator/emulator'
  });
}

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to build API URL with parameters
export const buildApiUrlWithParams = (endpoint, params) => {
  let url = endpoint;
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  return buildApiUrl(url);
};

// Network status helper
export const checkNetworkConnection = async () => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
      method: 'GET',
      timeout: 5000,
    });
    return response.ok;
  } catch (error) {
    console.error('❌ Network connection check failed:', error);
    return false;
  }
};

export default API_CONFIG;