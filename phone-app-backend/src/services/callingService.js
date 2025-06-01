import { v4 as uuidv4 } from 'uuid';
import Call from '../models/Call.js';
import redis from '../config/redis.js';
import authService from './authService.js';

class CallingService {
  constructor() {
    this.activeCallsCache = new Map();
  }

  // Initiate a new call
  async initiateCall(fromUserId, toPhoneNumber, callType = 'voice', metadata = {}) {
    try {
      const callId = uuidv4();
      
      // Check if the caller has any active calls
      const activeCalls = await this.getActiveCalls(fromUserId);
      if (activeCalls.length > 0) {
        throw new Error('User already has an active call');
      }
      
      // Normalize the phone number
      const normalizedPhone = authService.normalizePhoneNumber(toPhoneNumber);
      
      // Check if the recipient exists in our system
      const toUser = await authService.getUserByPhone(normalizedPhone);
      const toUserId = toUser ? toUser.id : null;
      
      // Check if recipient has active calls
      if (toUserId) {
        const recipientActiveCalls = await this.getActiveCalls(toUserId);
        if (recipientActiveCalls.length > 0) {
          throw new Error('Recipient is currently on another call');
        }
      }
      
      // Create call record
      const call = new Call({
        callId,
        fromUserId,
        toUserId,
        toPhoneNumber: normalizedPhone,
        callType,
        status: 'initiated',
        metadata
      });
      
      await call.save();
      
      // Cache active call
      await this.cacheActiveCall(callId, call);
      
      // TODO: Send push notification to recipient if they're a registered user
      if (toUserId) {
        await this.notifyRecipient(toUserId, call);
      }
      
      return {
        success: true,
        callId,
        status: 'initiated',
        toPhoneNumber: normalizedPhone,
        callType
      };
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  }

  // Accept an incoming call
  async acceptCall(callId, userId, metadata = {}) {
    try {
      const call = await Call.findOne({ callId });
      
      if (!call) {
        throw new Error('Call not found');
      }
      
      // Verify user is the recipient
      if (call.toUserId !== userId && call.toPhoneNumber !== userId) {
        throw new Error('Unauthorized to accept this call');
      }
      
      // Check if call is still in a state that can be accepted
      if (!['initiated', 'ringing'].includes(call.status)) {
        throw new Error(`Cannot accept call in ${call.status} state`);
      }
      
      // Update call status
      await call.updateStatus('active');
      
      // Update cache
      await this.cacheActiveCall(callId, call);
      
      // Notify caller that call was accepted
      await this.notifyCallStatusChange(call.fromUserId, callId, 'active');

      console.log('services-callingservice line 99', metadata);
      
      return {
        success: true,
        callId,
        status: 'active',
        message: 'Call accepted successfully'
      };
      
    } catch (error) {
      console.error('Error accepting call:', error);
      throw error;
    }
  }

  // Reject an incoming call
  async rejectCall(callId, userId, reason = 'rejected') {
    try {
      const call = await Call.findOne({ callId });
      
      if (!call) {
        throw new Error('Call not found');
      }
      
      // Verify user is the recipient
      if (call.toUserId !== userId) {
        throw new Error('Unauthorized to reject this call');
      }
      
      // Check if call can be rejected
      if (!['initiated', 'ringing'].includes(call.status)) {
        throw new Error(`Cannot reject call in ${call.status} state`);
      }
      
      // Update call status
      await call.updateStatus('rejected');
      
      // Remove from active calls cache
      await this.removeActiveCall(callId);
      
      // Notify caller that call was rejected
      await this.notifyCallStatusChange(call.fromUserId, callId, 'rejected');

      console.log('services-callingservice line 142', reason);
      
      return {
        success: true,
        callId,
        status: 'rejected',
        message: 'Call rejected successfully'
      };
    } catch (error) {
      console.error('Error rejecting call:', error);
      throw error;
    }
  }

  // End an active call
  async endCall(callId, userId, qualityScore = null) {
    try {
      const call = await Call.findOne({ callId });
      
      if (!call) {
        throw new Error('Call not found');
      }
      
      // Verify user is part of the call
      if (call.fromUserId !== userId && call.toUserId !== userId) {
        throw new Error('Unauthorized to end this call');
      }
      
      // Update call status and duration
      call.endTime = new Date();
      call.duration = Math.round((call.endTime - call.startTime) / 1000);
      
      if (qualityScore) {
        call.qualityScore = qualityScore;
      }
      
      await call.updateStatus('ended');
      
      // Remove from active calls cache
      await this.removeActiveCall(callId);
      
      // Notify other party that call ended
      const otherUserId = call.fromUserId === userId ? call.toUserId : call.fromUserId;
      if (otherUserId) {
        await this.notifyCallStatusChange(otherUserId, callId, 'ended');
      }
      
      return {
        success: true,
        callId,
        status: 'ended',
        duration: call.duration,
        message: 'Call ended successfully'
      };
    } catch (error) {
      console.error('Error ending call:', error);
      throw error;
    }
  }

  // Get active calls for a user
  async getActiveCalls(userId) {
    try {
      // Check cache first
      const cacheKey = `active_calls:${userId}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Query database
      const calls = await Call.findActiveCalls(userId);
      
      // Cache for 30 seconds
      await redis.setEx(cacheKey, 30, JSON.stringify(calls));
      
      return calls;
    } catch (error) {
      console.error('Error getting active calls:', error);
      throw error;
    }
  }

  // Get call by ID
  async getCall(callId) {
    try {
      return await Call.findOne({ callId });
    } catch (error) {
      console.error('Error getting call:', error);
      throw error;
    }
  }

  // Cache active call information
  async cacheActiveCall(callId, call) {
    const cacheKey = `call:${callId}`;
    await redis.setEx(cacheKey, 3600, JSON.stringify(call)); // 1 hour
    
    // Also update user's active calls cache
    if (call.fromUserId) {
      await redis.del(`active_calls:${call.fromUserId}`);
    }
    if (call.toUserId) {
      await redis.del(`active_calls:${call.toUserId}`);
    }
  }

  // Remove call from cache
  async removeActiveCall(callId) {
    const call = await this.getCall(callId);
    if (call) {
      await redis.del(`call:${callId}`);
      
      // Clear user active calls cache
      if (call.fromUserId) {
        await redis.del(`active_calls:${call.fromUserId}`);
      }
      if (call.toUserId) {
        await redis.del(`active_calls:${call.toUserId}`);
      }
    }
  }

  // Notify recipient of incoming call (placeholder for push notifications)
  async notifyRecipient(userId, call) {
    // TODO: Implement push notification logic
    console.log(`📞 Notifying user ${userId} of incoming call ${call.callId}`);
    
    // Store notification in Redis for real-time delivery
    const notification = {
      type: 'incoming_call',
      callId: call.callId,
      fromUserId: call.fromUserId,
      callType: call.callType,
      timestamp: new Date().toISOString()
    };
    
    await redis.publish(`notifications:${userId}`, JSON.stringify(notification));
  }

  // Notify user of call status changes
  async notifyCallStatusChange(userId, callId, status) {
    const notification = {
      type: 'call_status_change',
      callId,
      status,
      timestamp: new Date().toISOString()
    };
    
    await redis.publish(`notifications:${userId}`, JSON.stringify(notification));
  }

  // Handle missed calls (called by background job)
  async handleMissedCalls() {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const missedCalls = await Call.find({
        status: { $in: ['initiated', 'ringing'] },
        startTime: { $lt: fiveMinutesAgo }
      });
      
      for (const call of missedCalls) {
        await call.updateStatus('missed');
        await this.removeActiveCall(call.callId);
        
        // Notify both parties
        if (call.fromUserId) {
          await this.notifyCallStatusChange(call.fromUserId, call.callId, 'missed');
        }
        if (call.toUserId) {
          await this.notifyCallStatusChange(call.toUserId, call.callId, 'missed');
        }
      }
      
      console.log(`Marked ${missedCalls.length} calls as missed`);
    } catch (error) {
      console.error('Error handling missed calls:', error);
    }
  }
}

export default new CallingService();