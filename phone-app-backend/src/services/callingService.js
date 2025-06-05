import pkg from 'uuid';
import Call from '../models/Call.js';
import redis from '../config/redis.js';
import authService from './authService.js';
import productionPhoneService from './productionPhoneService.js';
import websocketService from './websocketService.js';
import callTimeoutService from './callTimeoutService.js';

const { v4: uuidv4 } = pkg;

class CallingService {
  constructor() {
    this.activeCallsCache = new Map();
  }

  // Initiate a new call
  async initiateCall(fromUserId, toPhoneNumber, callType = 'voice', metadata = {}) {
    try {
      const callId = uuidv4();
      
      const activeCalls = await this.getActiveCalls(fromUserId);
      if (activeCalls.length > 0) {
        throw new Error('User already has an active call');
      }

      const normalizedPhone = authService.normalizePhoneNumber(toPhoneNumber);
      const toUser = await authService.getUserByPhone(normalizedPhone);
      const toUserId = toUser ? toUser.id : null;

      if (toUserId) {
        const recipientActiveCalls = await this.getActiveCalls(toUserId);
        if (recipientActiveCalls.length > 0) {
          throw new Error('Recipient is currently on another call');
        }
      }

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

      const callRoom = await productionPhoneService.createCallRoom(callId, fromUserId, toUserId);

      await this.cacheActiveCall(callId, call);

      // NEW: Set timeout in case the call isn't picked up
      await callTimeoutService.setRingTimeout(callId);

      // NEW: Notify via WebSocket if online, fallback to push (placeholder)
      if (toUserId) {
        const notificationSent = websocketService.notifyIncomingCall(toUserId, {
          callId,
          fromUserId,
          fromDisplayName: metadata.fromDisplayName || 'Unknown',
          callType,
          agoraToken: callRoom.calleeToken
        });

        if (!notificationSent) {
          console.log(`📱 User ${toUserId} offline, should send push notification`);
          // TODO: Implement push notification fallback
        }
      }

      return {
        success: true,
        callId,
        status: 'initiated',
        toPhoneNumber: normalizedPhone,
        callType,
        agoraToken: callRoom.callerToken
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

      if (call.toUserId !== userId && call.toPhoneNumber !== userId) {
        throw new Error('Unauthorized to accept this call');
      }

      if (!['initiated', 'ringing'].includes(call.status)) {
        throw new Error(`Cannot accept call in ${call.status} state`);
      }

      await callTimeoutService.clearTimeout(callId);

      const roomInfo = await productionPhoneService.getCallRoom(callId);
      if (!roomInfo.success) {
        throw new Error('Call room not found or expired');
      }

      let calleeToken = roomInfo.room.calleeToken;
      if (!calleeToken) {
        const channelName = `call_${callId}`;
        calleeToken = productionPhoneService.generateAgoraToken(channelName, userId, 'publisher');
      }

      await call.updateStatus('active');
      await this.cacheActiveCall(callId, call);

      // NEW: WebSocket notify
      websocketService.notifyCallStatusChange(call.fromUserId, callId, 'active', {
        message: 'Call was accepted'
      });

      return {
        success: true,
        callId,
        status: 'active',
        message: 'Call accepted successfully',
        agoraToken: calleeToken
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

      if (call.toUserId !== userId) {
        throw new Error('Unauthorized to reject this call');
      }

      if (!['initiated', 'ringing'].includes(call.status)) {
        throw new Error(`Cannot reject call in ${call.status} state`);
      }

      await callTimeoutService.clearTimeout(callId);
      await call.updateStatus('rejected');
      await this.removeActiveCall(callId);

      // NEW: Notify via WebSocket
      websocketService.notifyCallStatusChange(call.fromUserId, callId, 'rejected', {
        reason,
        message: 'Call was rejected'
      });

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

      if (call.fromUserId !== userId && call.toUserId !== userId) {
        throw new Error('Unauthorized to end this call');
      }

      await callTimeoutService.clearTimeout(callId);

      call.endTime = new Date();
      call.duration = Math.round((call.endTime - call.startTime) / 1000);

      if (qualityScore) {
        call.qualityScore = qualityScore;
      }

      await call.updateStatus('ended');
      await this.removeActiveCall(callId);

      const otherUserId = call.fromUserId === userId ? call.toUserId : call.fromUserId;
      if (otherUserId) {
        websocketService.notifyCallStatusChange(otherUserId, callId, 'ended', {
          duration: call.duration,
          message: 'Call was ended'
        });
      }

      await productionPhoneService.cleanupCallRoom(callId);

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

  async getActiveCalls(userId) {
    try {
      const cacheKey = `active_calls:${userId}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const calls = await Call.findActiveCalls(userId);
      await redis.setEx(cacheKey, 30, JSON.stringify(calls));
      return calls;
    } catch (error) {
      console.error('Error getting active calls:', error);
      throw error;
    }
  }

  async getCall(callId) {
    try {
      return await Call.findOne({ callId });
    } catch (error) {
      console.error('Error getting call:', error);
      throw error;
    }
  }

  async cacheActiveCall(callId, call) {
    const cacheKey = `call:${callId}`;
    await redis.setEx(cacheKey, 3600, JSON.stringify(call));

    if (call.fromUserId) {
      await redis.del(`active_calls:${call.fromUserId}`);
    }
    if (call.toUserId) {
      await redis.del(`active_calls:${call.toUserId}`);
    }
  }

  async removeActiveCall(callId) {
    const call = await this.getCall(callId);
    if (call) {
      await redis.del(`call:${callId}`);
      if (call.fromUserId) {
        await redis.del(`active_calls:${call.fromUserId}`);
      }
      if (call.toUserId) {
        await redis.del(`active_calls:${call.toUserId}`);
      }
    }
  }

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

  // Still used only in missed calls fallback
  async notifyCallStatusChange(userId, callId, status) {
    const notification = {
      type: 'call_status_change',
      callId,
      status,
      timestamp: new Date().toISOString()
    };
    await redis.publish(`notifications:${userId}`, JSON.stringify(notification));
  }
}

export default new CallingService();
