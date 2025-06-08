import { API_CONFIG, buildApiUrl } from '../api-config';

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.headers = { ...API_CONFIG.DEFAULT_HEADERS };
  }

  // Helper method for API requests
  async request(endpoint, options = {}) {
    const url = buildApiUrl(endpoint);
    const config = {
      headers: this.headers,
      timeout: API_CONFIG.TIMEOUT,
      ...options,
    };

    try {
      console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ API Response:`, data);
      return data;
    } catch (error) {
      console.error('❌ API Request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async sendVerificationCode(phoneNumber) {
    return this.request(API_CONFIG.ENDPOINTS.VERIFY_PHONE, {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  }

  async login(phoneNumber, verificationCode, displayName) {
    return this.request(API_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ 
        phoneNumber, 
        verificationCode, 
        displayName 
      }),
    });
  }

  async logout() {
    return this.request(API_CONFIG.ENDPOINTS.LOGOUT, {
      method: 'POST',
    });
  }

  // Contact methods
  async getContacts() {
    return this.request(API_CONFIG.ENDPOINTS.CONTACTS);
  }

  async createContact(contactData) {
    return this.request(API_CONFIG.ENDPOINTS.CONTACTS, {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  }

  async updateContact(contactId, contactData) {
    return this.request(`${API_CONFIG.ENDPOINTS.CONTACTS}/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(contactData),
    });
  }

  async deleteContact(contactId) {
    return this.request(`${API_CONFIG.ENDPOINTS.CONTACTS}/${contactId}`, {
      method: 'DELETE',
    });
  }

  // Call methods
  async initiateCall(toPhoneNumber, callType = 'voice') {
    return this.request(API_CONFIG.ENDPOINTS.CALLS_INITIATE, {
      method: 'POST',
      body: JSON.stringify({ toPhoneNumber, callType }),
    });
  }

  async acceptCall(callId) {
    const endpoint = API_CONFIG.ENDPOINTS.CALLS_ACCEPT.replace(':callId', callId);
    return this.request(endpoint, {
      method: 'POST',
    });
  }

  async rejectCall(callId, reason = 'declined') {
    const endpoint = API_CONFIG.ENDPOINTS.CALLS_REJECT.replace(':callId', callId);
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async endCall(callId, qualityScore) {
    const endpoint = API_CONFIG.ENDPOINTS.CALLS_END.replace(':callId', callId);
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify({ qualityScore }),
    });
  }

  async getActiveCalls() {
    return this.request(API_CONFIG.ENDPOINTS.CALLS_ACTIVE);
  }

  async getCallHistory(page = 1, limit = 50) {
    return this.request(`${API_CONFIG.ENDPOINTS.CALLS_HISTORY}?page=${page}&limit=${limit}`);
  }

  // Set authentication token
  setAuthToken(token) {
    this.headers.Authorization = `Bearer ${token}`;
    console.log('🔐 Auth token set');
  }

  // Remove authentication token
  clearAuthToken() {
    delete this.headers.Authorization;
    console.log('🔓 Auth token cleared');
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export default new ApiService();