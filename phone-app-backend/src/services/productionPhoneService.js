import admin from 'firebase-admin';
import crypto from 'crypto';
import redis from '../config/redis.js';
import fetch from 'node-fetch';

// Handle Agora imports with fallback for different module systems
let RtcTokenBuilder, RtcRole;

try {
  const agoraModule = await import('agora-access-token');
  if (agoraModule.RtcTokenBuilder && agoraModule.RtcRole) {
    RtcTokenBuilder = agoraModule.RtcTokenBuilder;
    RtcRole = agoraModule.RtcRole;
  } else if (agoraModule.default) {
    RtcTokenBuilder = agoraModule.default.RtcTokenBuilder;
    RtcRole = agoraModule.default.RtcRole;
  } else {
    throw new Error('Unable to extract Agora exports');
  }
} catch (error) {
  console.warn('⚠️  Agora access token module not available:', error.message);
  RtcTokenBuilder = {
    buildTokenWithUid: () => 'mock-agora-token-for-development'
  };
  RtcRole = {
    PUBLISHER: 1,
    SUBSCRIBER: 2
  };
}

class ProductionPhoneService {
  constructor() {
    this.codeLength = 6;
    this.expirationTime = 10 * 60; // 10 minutes in seconds
    this.maxAttempts = 3;
    
    // Firebase Auth configuration
    this.webApiKey = process.env.FIREBASE_WEB_API_KEY;
    this.projectId = process.env.FIREBASE_PROJECT_ID;
    
    // Initialize Firebase Admin
    this.initializeFirebase();
    
    // Agora configuration
    this.agoraAppId = process.env.AGORA_APP_ID;
    this.agoraAppCertificate = process.env.AGORA_APP_CERTIFICATE;
    
    if (!this.agoraAppId || !this.agoraAppCertificate) {
      console.warn('⚠️  Agora credentials not configured - voice/video calling will not work');
      this.agoraEnabled = false;
    } else {
      this.agoraEnabled = true;
      console.log('✅ Agora configuration loaded');
    }
  }

  // Initialize Firebase Admin SDK
  initializeFirebase() {
    try {
      if (!admin.apps.length) {
        const firebaseConfig = {
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        };

        if (!firebaseConfig.projectId || !firebaseConfig.clientEmail || !firebaseConfig.privateKey) {
          console.warn('⚠️  Firebase credentials not configured - using fallback SMS service');
          this.firebaseEnabled = false;
          this.smsEnabled = false;
          return;
        }

        admin.initializeApp({
          credential: admin.credential.cert(firebaseConfig)
        });
        
        this.firebaseEnabled = true;
        console.log('✅ Firebase Admin initialized');
      }

      // Check if we have web API key for SMS
      if (!this.webApiKey || !this.projectId) {
        console.warn('⚠️  Firebase Web API key not configured - SMS disabled');
        this.smsEnabled = false;
      } else {
        this.smsEnabled = true;
        console.log('✅ Firebase SMS service enabled');
      }
      
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error.message);
      this.firebaseEnabled = false;
      this.smsEnabled = false;
    }
  }

  // Generate a 6-digit verification code
  generateVerificationCode() {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Store verification code in Redis (fallback for non-Firebase flow)
  async storeVerificationCode(phoneNumber, code) {
    const key = `verification:${phoneNumber}`;
    const data = {
      code,
      attempts: 0,
      createdAt: Date.now()
    };
    
    await redis.setEx(key, this.expirationTime, JSON.stringify(data));
    console.log(`🔐 Stored verification code for ${phoneNumber}`);
    return true;
  }

  // Send SMS using Firebase Auth (NEW - Primary method)
  async sendVerificationCodeFirebase(phoneNumber) {
    try {
      if (!this.smsEnabled) {
        throw new Error('Firebase SMS not configured');
      }

      const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${this.webApiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          recaptchaToken: 'test' // For testing, in production you'd need real reCAPTCHA
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Firebase SMS error:', data);
        throw new Error(data.error?.message || 'Failed to send SMS');
      }

      console.log(`📱 Firebase SMS sent to ${phoneNumber}`);
      
      return {
        success: true,
        sessionInfo: data.sessionInfo,
        message: 'Verification code sent via Firebase',
        provider: 'firebase',
        data: {
          phoneNumber,
          expiresIn: this.expirationTime,
          sessionInfo: data.sessionInfo
        }
      };

    } catch (error) {
      console.error('Firebase SMS error:', error);
      throw new Error(`Firebase SMS failed: ${error.message}`);
    }
  }

  // Verify SMS code with Firebase (NEW)
  async verifyCodeFirebase(sessionInfo, verificationCode) {
    try {
      if (!this.smsEnabled) {
        throw new Error('Firebase SMS not configured');
      }

      const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=${this.webApiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionInfo: sessionInfo,
          code: verificationCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Firebase verification error:', data);
        
        if (data.error?.message?.includes('INVALID_CODE')) {
          return {
            success: false,
            message: 'Invalid verification code'
          };
        } else if (data.error?.message?.includes('SESSION_EXPIRED')) {
          return {
            success: false,
            message: 'Verification code expired'
          };
        }
        
        throw new Error(data.error?.message || 'Verification failed');
      }

      // Verify the Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(data.idToken);
      
      console.log(`✅ Firebase verification successful for ${decodedToken.phone_number}`);
      
      return {
        success: true,
        phoneNumber: decodedToken.phone_number,
        firebaseUid: decodedToken.uid,
        idToken: data.idToken,
        refreshToken: data.refreshToken,
        message: 'Phone number verified successfully'
      };

    } catch (error) {
      console.error('❌ Firebase verification error:', error);
      
      if (error.code === 'auth/id-token-expired') {
        return {
          success: false,
          message: 'Verification session expired'
        };
      }
      
      throw new Error(`Verification failed: ${error.message}`);
    }
  }

  // Fallback SMS service (for when Firebase is not available)
  async sendVerificationCodeFallback(phoneNumber) {
    try {
      const code = this.generateVerificationCode();
      await this.storeVerificationCode(phoneNumber, code);
      
      // Log the code for development
      console.log(`📱 Fallback SMS to ${phoneNumber}: ${code}`);
      console.log(`🔐 DEV MODE - Verification code: ${code}`);
      
      return {
        success: true,
        message: 'Verification code sent (fallback mode)',
        provider: 'fallback',
        data: {
          phoneNumber,
          expiresIn: this.expirationTime,
          _testCode: code // Always include in fallback mode
        }
      };
    } catch (error) {
      console.error('Fallback SMS error:', error);
      throw new Error('Failed to send verification code');
    }
  }

  // Main SMS sending method with Firebase primary, fallback secondary
  async sendVerificationCode(phoneNumber) {
    try {
      // Normalize phone number
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      
      // Try Firebase first
      if (this.smsEnabled) {
        return await this.sendVerificationCodeFirebase(normalizedPhone);
      } else {
        // Use fallback method
        console.warn('⚠️  Firebase SMS not available, using fallback');
        return await this.sendVerificationCodeFallback(normalizedPhone);
      }
    } catch (error) {
      console.error('SMS sending failed:', error);
      
      // Try fallback if Firebase fails
      if (this.smsEnabled) {
        console.log('Trying fallback SMS method...');
        return await this.sendVerificationCodeFallback(phoneNumber);
      }
      
      throw error;
    }
  }

  // Main verification method
  async verifyCode(phoneNumber, providedCode, sessionInfo = null) {
    try {
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      
      // If we have sessionInfo, use Firebase verification
      if (sessionInfo && this.smsEnabled) {
        return await this.verifyCodeFirebase(sessionInfo, providedCode);
      }
      
      // Otherwise, use fallback Redis verification
      return await this.verifyCodeFallback(normalizedPhone, providedCode);
      
    } catch (error) {
      console.error('Error verifying code:', error);
      throw new Error('Failed to verify code');
    }
  }

  // Fallback verification (existing method)
  async verifyCodeFallback(phoneNumber, providedCode) {
    try {
      const key = `verification:${phoneNumber}`;
      const storedData = await redis.get(key);
      
      if (!storedData) {
        return {
          success: false,
          message: 'Verification code expired or not found'
        };
      }
      
      const data = JSON.parse(storedData);
      
      // Check if max attempts exceeded
      if (data.attempts >= this.maxAttempts) {
        await redis.del(key);
        return {
          success: false,
          message: 'Maximum verification attempts exceeded'
        };
      }
      
      // Increment attempt count
      data.attempts += 1;
      await redis.setEx(key, this.expirationTime, JSON.stringify(data));
      
      // Verify code
      if (data.code === providedCode) {
        // Clean up verification code
        await redis.del(key);
        console.log(`✅ Verification successful for ${phoneNumber}`);
        return {
          success: true,
          message: 'Phone number verified successfully'
        };
      } else {
        console.log(`❌ Invalid code for ${phoneNumber}: provided ${providedCode}, expected ${data.code}`);
        return {
          success: false,
          message: `Invalid verification code. ${this.maxAttempts - data.attempts} attempts remaining`
        };
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      throw new Error('Failed to verify code');
    }
  }

  // ... [Keep all your existing Agora methods: generateAgoraToken, createCallRoom, etc.] ...

  // Utility method to normalize phone numbers
  normalizePhoneNumber(phoneNumber) {
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, assume it's a US number and add +1
    if (!cleaned.startsWith('+')) {
      if (cleaned.length === 10) {
        cleaned = '+1' + cleaned;
      } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        cleaned = '+' + cleaned;
      }
    }
    
    return cleaned;
  }

  // Enhanced health check
  async healthCheck() {
    const status = {
      firebase: this.firebaseEnabled,
      firebaseSms: this.smsEnabled,
      agora: this.agoraEnabled,
      redis: false
    };

    try {
      await redis.ping();
      status.redis = true;
    } catch (error) {
      console.error('Redis health check failed:', error);
    }

    return {
      healthy: status.redis, // At minimum, Redis should work
      services: status,
      warnings: [
        ...(!status.firebase ? ['Firebase not configured'] : []),
        ...(!status.firebaseSms ? ['Firebase SMS not configured'] : []),
        ...(!status.agora ? ['Agora not configured - voice/video calling disabled'] : [])
      ]
    };
  }

  // Get service statistics
  async getStats() {
    try {
      // Get verification codes count
      const verificationKeys = await redis.keys('verification:*');
      
      // Get active call rooms count
      const callRoomKeys = await redis.keys('call_room:*');

      return {
        activeVerifications: verificationKeys.length,
        activeCallRooms: callRoomKeys.length,
        serviceStatus: await this.healthCheck()
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        error: 'Failed to get service statistics'
      };
    }
  }

  // ... [Keep all your existing Agora methods unchanged] ...
  
  // Generate Agora token for voice/video calling
  generateAgoraToken(channelName, userId, role = 'publisher') {
    try {
      if (!this.agoraEnabled) {
        console.warn('⚠️  Agora not configured, returning mock token');
        return {
          success: true,
          token: 'mock-agora-token-for-development',
          appId: 'mock-app-id',
          channelName,
          userId: parseInt(userId),
          role,
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        };
      }

      const expirationTimeInSeconds = 3600; // 1 hour
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

      const agoraRole = role.toLowerCase() === 'audience' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

      const token = RtcTokenBuilder.buildTokenWithUid(
        this.agoraAppId,
        this.agoraAppCertificate,
        channelName,
        parseInt(userId),
        agoraRole,
        privilegeExpiredTs
      );

      console.log(`🎵 Generated Agora token for user ${userId} in channel ${channelName}`);

      return {
        success: true,
        token,
        appId: this.agoraAppId,
        channelName,
        userId: parseInt(userId),
        role,
        expiresAt: new Date(privilegeExpiredTs * 1000).toISOString()
      };
    } catch (error) {
      console.error('Agora token generation error:', error);
      throw new Error('Failed to generate calling token: ' + error.message);
    }
  }

  // Create call room and generate tokens for both participants
  async createCallRoom(callId, callerUserId, calleeUserId = null) {
    try {
      const channelName = `call_${callId}`;
      
      // Generate token for caller
      const callerToken = this.generateAgoraToken(channelName, callerUserId, 'publisher');
      
      let calleeToken = null;
      if (calleeUserId) {
        calleeToken = this.generateAgoraToken(channelName, calleeUserId, 'publisher');
      }

      // Store call room info in Redis for quick access
      const roomInfo = {
        callId,
        channelName,
        appId: this.agoraEnabled ? this.agoraAppId : 'mock-app-id',
        callerUserId,
        calleeUserId,
        createdAt: new Date().toISOString(),
        expiresAt: callerToken.expiresAt
      };

      await redis.setEx(`call_room:${callId}`, 3600, JSON.stringify(roomInfo));

      return {
        success: true,
        callId,
        channelName,
        appId: roomInfo.appId,
        callerToken: callerToken,
        calleeToken: calleeToken,
        roomInfo
      };
    } catch (error) {
      console.error('Error creating call room:', error);
      throw new Error('Failed to create call room');
    }
  }

  // Get call room information
  async getCallRoom(callId) {
    try {
      const roomData = await redis.get(`call_room:${callId}`);
      
      if (!roomData) {
        return {
          success: false,
          message: 'Call room not found or expired'
        };
      }

      return {
        success: true,
        room: JSON.parse(roomData)
      };
    } catch (error) {
      console.error('Error getting call room:', error);
      throw new Error('Failed to get call room');
    }
  }

  // Clean up call room
  async cleanupCallRoom(callId) {
    try {
      await redis.del(`call_room:${callId}`);
      console.log(`🧹 Cleaned up call room: ${callId}`);
    } catch (error) {
      console.error('Error cleaning up call room:', error);
    }
  }
}

export default new ProductionPhoneService();