import crypto from 'crypto';

// Mock Phone Verification Service - Simulates Redis-based real service
class MockPhoneVerificationService {
  constructor() {
    this.codeLength = 6;
    this.expirationTime = 10 * 60; // 10 minutes in seconds
    this.maxAttempts = 3;
    
    // In-memory storage to simulate Redis
    this.verificationStore = new Map();
    
    // Demo users from environment variables
    this.demoUsers = this.loadDemoUsers();
  }

  // Load demo users from environment variables
  loadDemoUsers() {
    const demoUsers = [];
    
    // Load from .env.test format: DEMO_USER_1=+15551234567:John Doe
    let userIndex = 1;
    while (process.env[`DEMO_USER_${userIndex}`]) {
      const [phoneNumber, displayName] = process.env[`DEMO_USER_${userIndex}`].split(':');
      demoUsers.push({ phoneNumber, displayName: displayName || 'Demo User' });
      userIndex++;
    }
    
    // Fallback demo users if none in env
    if (demoUsers.length === 0) {
      demoUsers.push(
        { phoneNumber: '+15551234567', displayName: 'John Doe' },
        { phoneNumber: '+15551234568', displayName: 'Jane Smith' },
        { phoneNumber: '+1234567890', displayName: 'Test User' }
      );
    }
    
    console.log('📋 Loaded demo users:', demoUsers.map(u => u.phoneNumber).join(', '));
    return demoUsers;
  }

  // Generate a 6-digit verification code (same as real service)
  generateVerificationCode() {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Store verification code in memory (simulates Redis)
  async storeVerificationCode(phoneNumber, code) {
    const key = `verification:${phoneNumber}`;
    const data = {
      code,
      attempts: 0,
      createdAt: Date.now()
    };
    
    this.verificationStore.set(key, data);
    
    // Simulate expiration by setting a timeout
    setTimeout(() => {
      this.verificationStore.delete(key);
      console.log(`⏰ Verification code for ${phoneNumber} expired`);
    }, this.expirationTime * 1000);
    
    return true;
  }

  // Send verification code (simulates real service behavior)
  async sendVerificationCode(phoneNumber) {
    try {
      const code = this.generateVerificationCode();
      await this.storeVerificationCode(phoneNumber, code);
      
      // Always log the code for testing (simulates development mode)
      console.log(`📱 Verification code for ${phoneNumber}: ${code}`);
      console.log(`🔐 DEV MODE - Verification code: ${code}`);
      
      // Check if it's a demo user
      const isDemoUser = this.demoUsers.some(user => user.phoneNumber === phoneNumber);
      
      if (isDemoUser) {
        console.log(`✅ Demo user detected: ${phoneNumber}`);
      } else {
        console.log(`ℹ️  Non-demo user: ${phoneNumber} (code will still work)`);
      }
      
      return {
        success: true,
        message: 'Verification code sent successfully',
        data: {
          phoneNumber,
          expiresIn: this.expirationTime,
          // Include code in response for testing (remove in production)
          ...(process.env.NODE_ENV === 'development' && { _testCode: code })
        }
      };
    } catch (error) {
      console.error('Error sending verification code:', error);
      throw new Error('Failed to send verification code');
    }
  }

  // Verify the code provided by user (same logic as real service)
  async verifyCode(phoneNumber, providedCode) {
    try {
      const key = `verification:${phoneNumber}`;
      const storedData = this.verificationStore.get(key);
      
      if (!storedData) {
        return {
          success: false,
          message: 'Verification code expired or not found'
        };
      }
      
      // Check if max attempts exceeded
      if (storedData.attempts >= this.maxAttempts) {
        this.verificationStore.delete(key);
        return {
          success: false,
          message: 'Maximum verification attempts exceeded'
        };
      }
      
      // Increment attempt count
      storedData.attempts += 1;
      this.verificationStore.set(key, storedData);
      
      // Verify code
      if (storedData.code === providedCode) {
        // Clean up verification code
        this.verificationStore.delete(key);
        console.log(`✅ Verification successful for ${phoneNumber}`);
        return {
          success: true,
          message: 'Phone number verified successfully'
        };
      } else {
        console.log(`❌ Invalid code for ${phoneNumber}: provided ${providedCode}, expected ${storedData.code}`);
        return {
          success: false,
          message: `Invalid verification code. ${this.maxAttempts - storedData.attempts} attempts remaining`
        };
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      throw new Error('Failed to verify code');
    }
  }

  // Check if phone number is already verified (same as real service)
  async isPhoneVerified(phoneNumber) {
    // In real service, this would check database
    // For mock, always return false (session-based verification)
    console.log(phoneNumber);
    return false;
  }

  // Clean up expired verification codes (simulates background job)
  async cleanupExpiredCodes() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, data] of this.verificationStore.entries()) {
      if (now - data.createdAt > this.expirationTime * 1000) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => {
      this.verificationStore.delete(key);
    });
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleaned up ${expiredKeys.length} expired verification codes`);
    }
  }

  // Utility method to get demo users (for testing)
  getDemoUsers() {
    return this.demoUsers;
  }

  // Utility method to check current stored codes (for debugging)
  getStoredCodes() {
    const codes = {};
    for (const [key, data] of this.verificationStore.entries()) {
      const phoneNumber = key.replace('verification:', '');
      codes[phoneNumber] = {
        code: data.code,
        attempts: data.attempts,
        createdAt: new Date(data.createdAt).toISOString(),
        expiresAt: new Date(data.createdAt + this.expirationTime * 1000).toISOString()
      };
    }
    return codes;
  }
}

export default new MockPhoneVerificationService();