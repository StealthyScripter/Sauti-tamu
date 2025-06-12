import { API_CONFIG, buildApiUrl, buildApiUrlWithParams } from '../api-config';

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.headers = { ...API_CONFIG.DEFAULT_HEADERS };
  }

  // Enhanced request method with retry logic
  async request(endpoint, options = {}) {
    const url = buildApiUrl(endpoint);
    const config = {
      headers: this.headers,
      timeout: API_CONFIG.TIMEOUT,
      ...options,
    };

    let lastError;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🌐 API Request (attempt ${attempt}): ${config.method || 'GET'} ${url}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        
        const response = await fetch(url, {
          ...config,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }
          
          throw new Error(`HTTP ${response.status}: ${errorData.message || 'Request failed'}`);
        }
        
        const data = await response.json();
        console.log(`✅ API Response (attempt ${attempt}):`, data);
        return data;
        
      } catch (error) {
        lastError = error;
        console.error(`❌ API Request failed (attempt ${attempt}):`, error);
        
        // Don't retry on client errors (4xx)
        if (error.message.includes('HTTP 4')) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  // Authentication methods with enhanced error handling
  async sendVerificationCode(phoneNumber) {
    try {
      return await this.request(API_CONFIG.ENDPOINTS.VERIFY_PHONE, {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
      });
    } catch (error) {
      if (error.message.includes('429')) {
        throw new Error('Too many verification requests. Please wait before trying again.');
      }
      throw error;
    }
  }

  async login(phoneNumber, verificationCode, displayName) {
    try {
      return await this.request(API_CONFIG.ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ 
          phoneNumber, 
          verificationCode, 
          displayName 
        }),
      });
    } catch (error) {
      if (error.message.includes('400')) {
        throw new Error('Invalid verification code or phone number.');
      }
      if (error.message.includes('429')) {
        throw new Error('Too many login attempts. Please wait before trying again.');
      }
      throw error;
    }
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

  // Enhanced call methods
  async initiateCall(toPhoneNumber, callType = 'voice', metadata = {}) {
    try {
      return await this.request(API_CONFIG.ENDPOINTS.CALLS_INITIATE, {
        method: 'POST',
        body: JSON.stringify({ 
          toPhoneNumber, 
          callType,
          metadata: {
            ...metadata,
            clientVersion: '1.0.0',
            platform: API_CONFIG.DEFAULT_HEADERS['X-Platform'],
            timestamp: new Date().toISOString()
          }
        }),
      });
    } catch (error) {
      if (error.message.includes('409')) {
        throw new Error('You already have an active call or the recipient is busy.');
      }
      throw error;
    }
  }

  async acceptCall(callId, metadata = {}) {
    const endpoint = buildApiUrlWithParams(API_CONFIG.ENDPOINTS.CALLS_ACCEPT, { callId });
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify({ 
        metadata: {
          ...metadata,
          acceptedAt: new Date().toISOString()
        }
      }),
    });
  }

  async rejectCall(callId, reason = 'declined') {
    const endpoint = buildApiUrlWithParams(API_CONFIG.ENDPOINTS.CALLS_REJECT, { callId });
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify({ 
        reason,
        rejectedAt: new Date().toISOString()
      }),
    });
  }

  async endCall(callId, qualityScore = 5) {
    const endpoint = buildApiUrlWithParams(API_CONFIG.ENDPOINTS.CALLS_END, { callId });
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify({ 
        qualityScore,
        endedAt: new Date().toISOString()
      }),
    });
  }

  async getActiveCalls() {
    return this.request(API_CONFIG.ENDPOINTS.CALLS_ACTIVE);
  }

  async getCallHistory(page = 1, limit = 50) {
    return this.request(`${API_CONFIG.ENDPOINTS.CALLS_HISTORY}?page=${page}&limit=${limit}`);
  }

  // New: Get call tokens for Agora
  async getCallToken(callId, role = 'publisher') {
    return this.request(API_CONFIG.ENDPOINTS.CALLS_TOKEN, {
      method: 'POST',
      body: JSON.stringify({ callId, role }),
    });
  }

  // Recording methods
  async startRecording(callId, options = {}) {
    return this.request(API_CONFIG.ENDPOINTS.RECORDINGS_START, {
      method: 'POST',
      body: JSON.stringify({ callId, options }),
    });
  }

  async stopRecording(recordingId) {
    return this.request(API_CONFIG.ENDPOINTS.RECORDINGS_STOP, {
      method: 'POST',
      body: JSON.stringify({ recordingId }),
    });
  }

  async getUserRecordings(page = 1, limit = 20) {
    return this.request(`${API_CONFIG.ENDPOINTS.RECORDINGS}?page=${page}&limit=${limit}`);
  }

  // Notification methods
  async registerFCMToken(fcmToken, deviceInfo = {}) {
    return this.request(API_CONFIG.ENDPOINTS.NOTIFICATIONS_REGISTER, {
      method: 'POST',
      body: JSON.stringify({ 
        fcmToken,
        deviceInfo: {
          ...deviceInfo,
          platform: API_CONFIG.DEFAULT_HEADERS['X-Platform'],
          registeredAt: new Date().toISOString()
        }
      }),
    });
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

  // Enhanced health check
  async healthCheck() {
    try {
      const response = await this.request('/health');
      return {
        ...response,
        connectionTime: Date.now()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        connectionTime: Date.now()
      };
    }
  }

  // Network connectivity check
  async checkConnectivity() {
    try {
      const start = Date.now();
      await this.healthCheck();
      const latency = Date.now() - start;
      
      return {
        connected: true,
        latency,
        status: 'good'
      };
    } catch (error) {
      return {
        connected: false,
        latency: -1,
        status: 'error',
        error: error.message
      };
    }
  }
}

export default new ApiService();