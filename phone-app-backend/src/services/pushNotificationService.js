import admin from 'firebase-admin';

class PushNotificationService {
  constructor() {
    this.initialized = false;
    this.initialize();
  }

  initialize() {
    try {
      // Firebase Admin should already be initialized in productionPhoneService
      if (admin.apps.length > 0) {
        this.messaging = admin.messaging();
        this.initialized = true;
        console.log('✅ Push notification service initialized');
      } else {
        console.warn('⚠️  Firebase not initialized - push notifications disabled');
        this.initialized = false;
      }
    } catch (error) {
      console.error('❌ Push notification service initialization failed:', error);
      this.initialized = false;
    }
  }

  // Send incoming call notification
  async sendIncomingCallNotification(userId, callData) {
    if (!this.initialized) {
      console.log('📱 Push notifications not available - Firebase not configured');
      return { success: false, reason: 'service_not_initialized' };
    }

    try {
      // Get user's FCM tokens from database
      const userTokens = await this.getUserFCMTokens(userId);
      
      if (!userTokens || userTokens.length === 0) {
        console.log(`📱 No FCM tokens found for user ${userId}`);
        return { success: false, reason: 'no_tokens' };
      }

      const payload = {
        notification: {
          title: `Incoming ${callData.callType} call`,
          body: `${callData.fromDisplayName || 'Unknown'} is calling...`,
          sound: 'call_ringtone.wav',
          priority: 'high',
          tag: `call_${callData.callId}` // Replaces previous call notifications
        },
        data: {
          type: 'incoming_call',
          callId: callData.callId,
          fromUserId: callData.fromUserId,
          fromDisplayName: callData.fromDisplayName || 'Unknown',
          callType: callData.callType,
          agoraToken: callData.agoraToken || '',
          timestamp: new Date().toISOString()
        },
        android: {
          priority: 'high',
          ttl: 30000, // 30 seconds
          notification: {
            channelId: 'incoming_calls',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
            category: 'call',
            visibility: 'public'
          }
        },
        apns: {
          headers: {
            'apns-priority': '10',
            'apns-push-type': 'alert'
          },
          payload: {
            aps: {
              alert: {
                title: `Incoming ${callData.callType} call`,
                body: `${callData.fromDisplayName || 'Unknown'} is calling...`
              },
              sound: 'call_ringtone.wav',
              badge: 1,
              category: 'INCOMING_CALL',
              'content-available': 1,
              'mutable-content': 1
            }
          }
        }
      };

      // Send to all user's devices
      const response = await this.messaging.sendMulticast({
        tokens: userTokens,
        ...payload
      });

      console.log(`📱 Sent incoming call notification to ${response.successCount}/${userTokens.length} devices`);

      // Clean up invalid tokens
      if (response.failureCount > 0) {
        await this.cleanupInvalidTokens(userId, response.responses, userTokens);
      }

      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        totalTokens: userTokens.length
      };

    } catch (error) {
      console.error('❌ Failed to send incoming call notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send call status change notification
  async sendCallStatusNotification(userId, callData) {
    if (!this.initialized) return { success: false, reason: 'service_not_initialized' };

    try {
      const userTokens = await this.getUserFCMTokens(userId);
      if (!userTokens || userTokens.length === 0) {
        return { success: false, reason: 'no_tokens' };
      }

      let title, body;
      switch (callData.status) {
      case 'ended':
        title = 'Call ended';
        body = `Call duration: ${this.formatDuration(callData.duration)}`;
        break;
      case 'rejected':
        title = 'Call declined';
        body = `${callData.fromDisplayName || 'Unknown'} declined your call`;
        break;
      case 'missed':
        title = 'Missed call';
        body = `Missed call from ${callData.fromDisplayName || 'Unknown'}`;
        break;
      case 'failed':
        title = 'Call failed';
        body = 'Unable to connect the call';
        break;
      default:
        return { success: false, reason: 'invalid_status' };
      }

      const payload = {
        notification: {
          title,
          body,
          sound: 'default'
        },
        data: {
          type: 'call_status_change',
          callId: callData.callId,
          status: callData.status,
          timestamp: new Date().toISOString()
        },
        android: {
          notification: {
            channelId: 'call_updates',
            priority: 'default'
          }
        }
      };

      const response = await this.messaging.sendMulticast({
        tokens: userTokens,
        ...payload
      });

      if (response.failureCount > 0) {
        await this.cleanupInvalidTokens(userId, response.responses, userTokens);
      }

      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount
      };

    } catch (error) {
      console.error('❌ Failed to send call status notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Register FCM token for user
  async registerFCMToken(userId, token, deviceInfo = {}) {
    try {
      // Store in PostgreSQL user_settings table
      const pool = (await import('../config/database.js')).default;
      
      await pool.query(`
        INSERT INTO user_settings (user_id, setting_key, setting_value, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (user_id, setting_key) 
        DO UPDATE SET setting_value = $3, updated_at = NOW()
      `, [
        userId, 
        'fcm_tokens',
        JSON.stringify({
          tokens: [{ token, deviceInfo, registeredAt: new Date().toISOString() }]
        })
      ]);

      console.log(`📱 Registered FCM token for user ${userId}`);
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to register FCM token:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's FCM tokens from database
  async getUserFCMTokens(userId) {
    try {
      const pool = (await import('../config/database.js')).default;
      
      const result = await pool.query(`
        SELECT setting_value 
        FROM user_settings 
        WHERE user_id = $1 AND setting_key = 'fcm_tokens'
      `, [userId]);

      if (result.rows.length === 0) {
        return [];
      }

      const tokenData = result.rows[0].setting_value;
      return tokenData.tokens?.map(t => t.token) || [];

    } catch (error) {
      console.error('❌ Failed to get FCM tokens:', error);
      return [];
    }
  }

  // Clean up invalid tokens
  async cleanupInvalidTokens(userId, responses, tokens) {
    try {
      const invalidTokens = [];
      
      responses.forEach((response, index) => {
        if (!response.success) {
          const errorCode = response.error?.code;
          if (['messaging/invalid-registration-token', 
            'messaging/registration-token-not-registered'].includes(errorCode)) {
            invalidTokens.push(tokens[index]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        // Remove invalid tokens from database
        const pool = (await import('../config/database.js')).default;
        
        const result = await pool.query(`
          SELECT setting_value 
          FROM user_settings 
          WHERE user_id = $1 AND setting_key = 'fcm_tokens'
        `, [userId]);

        if (result.rows.length > 0) {
          const tokenData = result.rows[0].setting_value;
          const validTokens = tokenData.tokens?.filter(t => 
            !invalidTokens.includes(t.token)
          ) || [];

          await pool.query(`
            UPDATE user_settings 
            SET setting_value = $1, updated_at = NOW()
            WHERE user_id = $2 AND setting_key = 'fcm_tokens'
          `, [JSON.stringify({ tokens: validTokens }), userId]);

          console.log(`🧹 Cleaned up ${invalidTokens.length} invalid FCM tokens for user ${userId}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to cleanup invalid tokens:', error);
    }
  }

  // Format call duration for display
  formatDuration(seconds) {
    if (!seconds || seconds < 0) return '0s';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    } else {
      return `${minutes}m ${remainingSeconds}s`;
    }
  }

  // Send test notification (for debugging)
  async sendTestNotification(userId, message = 'Test notification') {
    if (!this.initialized) return { success: false, reason: 'service_not_initialized' };

    try {
      const userTokens = await this.getUserFCMTokens(userId);
      if (!userTokens || userTokens.length === 0) {
        return { success: false, reason: 'no_tokens' };
      }

      const response = await this.messaging.sendMulticast({
        tokens: userTokens,
        notification: {
          title: 'Test Notification',
          body: message
        },
        data: {
          type: 'test',
          timestamp: new Date().toISOString()
        }
      });

      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount
      };

    } catch (error) {
      console.error('❌ Failed to send test notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Get service stats
  getStats() {
    return {
      initialized: this.initialized,
      firebaseAppsCount: admin.apps.length
    };
  }
}

export default new PushNotificationService();