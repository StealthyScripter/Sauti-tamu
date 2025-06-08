import { Platform } from 'react-native';

// Determine the correct base URL based on platform
const getBaseURL = () => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'ios') {
      return 'http://localhost:3000'; // iOS Simulator
    } else if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000'; // Android Emulator
    } else {
      return 'http://localhost:3000'; // Web/Desktop
    }
  } else {
    // Production mode
    return 'https://your-production-api.com';
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
    
    // Notifications
    NOTIFICATIONS_REGISTER: '/api/notifications/register-token',
    NOTIFICATIONS_SETTINGS: '/api/notifications/settings',
    
    // Recordings
    RECORDINGS: '/api/recordings',
    RECORDINGS_START: '/api/recordings/start',
    RECORDINGS_STOP: '/api/recordings/stop',
  },
  
  // Default headers for API requests
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Request timeout
  TIMEOUT: 30000, // 30 seconds
};

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

export default API_CONFIG;