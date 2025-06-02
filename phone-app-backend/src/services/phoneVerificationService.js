import crypto from 'crypto';
import redis from '../config/redis.js';

// src/services/phoneVerificationService.js

class PhoneVerificationService {
  constructor() {
    this.codeLength = 6;
    this.expirationTime = 100 * 60; // 10 minutes in seconds
    this.maxAttempts = 3;
  }

  // Generate a 6-digit verification code
  generateVerificationCode() {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Store verification code in Redis
  async storeVerificationCode(phoneNumber, code) {
    const key = `verification:${phoneNumber}`;
    const data = {
      code,
      attempts: 0,
      createdAt: Date.now()
    };
    
    await redis.setEx(key, this.expirationTime, JSON.stringify(data));
    return true;
  }

  // Send verification code (mock implementation - integrate with SMS provider)
  async sendVerificationCode(phoneNumber) {
    try {
      const code = this.generateVerificationCode();
      await this.storeVerificationCode(phoneNumber, code);
      
      // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
      console.log(`📱 Verification code for ${phoneNumber}: ${code}`);
      
      // In development, log the code. In production, send via SMS
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔐 DEV MODE - Verification code: ${code}`);
      }
      
      return {
        success: true,
        message: 'Verification code sent successfully'
      };
    } catch (error) {
      console.error('Error sending verification code:', error);
      throw new Error('Failed to send verification code');
    }
  }

  // Verify the code provided by user
  async verifyCode(phoneNumber, providedCode) {
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
        return {
          success: true,
          message: 'Phone number verified successfully'
        };
      } else {
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

  // Check if phone number is already verified (optional helper)
  async isPhoneVerified(phoneNumber) {
    console.log(phoneNumber);
    // This could check a database flag if you want to track verified phones
    // For now, we'll assume verification is session-based
    return false;
  }

  // Clean up expired verification codes (background job)
  async cleanupExpiredCodes() {
    // This would be called by a background job
    // Redis handles expiration automatically, so this is optional
    console.log('Cleanup job for expired verification codes');
  }
}

export default new PhoneVerificationService();