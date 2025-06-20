import admin from 'firebase-admin';
import fetch from 'node-fetch';

class FirebaseAuthService {
  constructor() {
    this.webApiKey = process.env.FIREBASE_WEB_API_KEY;
    this.projectId = process.env.FIREBASE_PROJECT_ID;
    
    if (!this.webApiKey || !this.projectId) {
      console.warn('⚠️  Firebase Auth credentials not configured');
      this.enabled = false;
      return;
    }
    
    this.initializeFirebase();
    this.enabled = true;
    console.log('✅ Firebase Auth service initialized');
  }

  initializeFirebase() {
    try {
      if (!admin.apps.length) {
        const firebaseConfig = {
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        };

        admin.initializeApp({
          credential: admin.credential.cert(firebaseConfig)
        });
        
        console.log('✅ Firebase Admin initialized');
      }
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      this.enabled = false;
      throw error;
    }
  }

  // Step 1: Send SMS verification code via Firebase
  async sendVerificationCode(phoneNumber) {
    if (!this.enabled) {
      throw new Error('Firebase Auth not configured');
    }

    try {
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
        provider: 'firebase'
      };

    } catch (error) {
      console.error('❌ Firebase SMS error:', error);
      throw new Error(`Firebase SMS failed: ${error.message}`);
    }
  }

  // Step 2: Verify the SMS code with Firebase
  async verifyCode(sessionInfo, verificationCode) {
    if (!this.enabled) {
      throw new Error('Firebase Auth not configured');
    }

    try {
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

  // Step 3: Create custom token for your app (optional)
  async createCustomToken(firebaseUid, additionalClaims = {}) {
    if (!this.enabled) {
      throw new Error('Firebase Auth not configured');
    }

    try {
      const customToken = await admin.auth().createCustomToken(firebaseUid, additionalClaims);
      
      return {
        success: true,
        customToken: customToken
      };
    } catch (error) {
      console.error('❌ Custom token creation failed:', error);
      throw new Error(`Custom token creation failed: ${error.message}`);
    }
  }

  // Verify Firebase ID token
  async verifyIdToken(idToken) {
    if (!this.enabled) {
      throw new Error('Firebase Auth not configured');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      return {
        success: true,
        uid: decodedToken.uid,
        phoneNumber: decodedToken.phone_number,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        authTime: decodedToken.auth_time,
        issuedAt: decodedToken.iat,
        expiresAt: decodedToken.exp
      };
    } catch (error) {
      console.error('❌ ID token verification failed:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get user by phone number
  async getUserByPhoneNumber(phoneNumber) {
    if (!this.enabled) {
      throw new Error('Firebase Auth not configured');
    }

    try {
      const userRecord = await admin.auth().getUserByPhoneNumber(phoneNumber);
      
      return {
        success: true,
        user: {
          uid: userRecord.uid,
          phoneNumber: userRecord.phoneNumber,
          email: userRecord.email,
          displayName: userRecord.displayName,
          disabled: userRecord.disabled,
          metadata: {
            creationTime: userRecord.metadata.creationTime,
            lastSignInTime: userRecord.metadata.lastSignInTime
          }
        }
      };
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return {
          success: false,
          message: 'User not found'
        };
      }
      
      console.error('❌ Get user by phone failed:', error);
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  // Update user profile
  async updateUser(uid, updateData) {
    if (!this.enabled) {
      throw new Error('Firebase Auth not configured');
    }

    try {
      const userRecord = await admin.auth().updateUser(uid, updateData);
      
      return {
        success: true,
        user: {
          uid: userRecord.uid,
          phoneNumber: userRecord.phoneNumber,
          email: userRecord.email,
          displayName: userRecord.displayName
        }
      };
    } catch (error) {
      console.error('❌ Update user failed:', error);
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Delete user
  async deleteUser(uid) {
    if (!this.enabled) {
      throw new Error('Firebase Auth not configured');
    }

    try {
      await admin.auth().deleteUser(uid);
      
      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      console.error('❌ Delete user failed:', error);
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  // Check service health
  async healthCheck() {
    if (!this.enabled) {
      return { healthy: false, message: 'Firebase not configured' };
    }

    try {
      // Try to list users to test connection
      await admin.auth().listUsers(1);
      
      return {
        healthy: true,
        projectId: this.projectId,
        hasWebApiKey: !!this.webApiKey
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
}

export default new FirebaseAuthService();