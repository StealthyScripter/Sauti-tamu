import { v4 as uuidv4 } from 'uuid';
import Call from '../models/Call.js';
import redis from '../config/redis.js';
import authService from './authService.js';
import productionPhoneService from './productionPhoneService.js';
import websocketService from './websocketService.js';
import callTimeoutService from './callTimeoutService.js';
import pushNotificationService from './pushNotificationService.js';
import callRecordingService from './callRecordingService.js';


class CallingService {
  constructor() {
    this.activeCallsCache = new Map();
  }

  // Enhanced initiate call with proper error handling
  async initiateCall(fromUserId, toPhoneNumber, callType = 'voice', metadata = {}) {
    const callId = uuidv4();
    let call = null;
    
    try {
      console.log(`📞 Initiating call ${callId}: ${fromUserId} -> ${toPhoneNumber}`);
      
      // Check if user already has active calls
      const activeCalls = await this.getActiveCalls(fromUserId);
      if (activeCalls.length > 0) {
        throw new Error('User already has an active call');
      }

      const normalizedPhone = authService.normalizePhoneNumber(toPhoneNumber);
      const toUser = await authService.getUserByPhone(normalizedPhone);
      const toUserId = toUser ? toUser.id : null;

      // Check if recipient is busy
      if (toUserId) {
        const recipientActiveCalls = await this.getActiveCalls(toUserId);
        if (recipientActiveCalls.length > 0) {
          throw new Error('Recipient is currently on another call');
        }
      }

      // Create call record in MongoDB with error handling
      try {
        call = new Call({
          callId,
          fromUserId,
          toUserId,
          toPhoneNumber: normalizedPhone,
          callType,
          status: 'initiated',
          metadata: {
            ...metadata,
            createdAt: new Date().toISOString(),
            initiatedBy: 'app'
          }
        });

        await call.save();
        console.log(`✅ Call record created in MongoDB: ${callId}`);
      } catch (mongoError) {
        console.error('❌ Failed to create call in MongoDB:', mongoError);
        throw new Error('Failed to create call record');
      }

      // Create Agora call room with error handling
      let callRoom;
      try {
        callRoom = await productionPhoneService.createCallRoom(callId, fromUserId, toUserId);
        console.log(`✅ Agora call room created: ${callId}`);
      } catch (agoraError) {
        console.error('❌ Failed to create Agora room:', agoraError);
        
        // Clean up call record
        try {
          await call.updateStatus('failed');
        } catch (cleanupError) {
          console.error('❌ Failed to cleanup call after Agora failure:', cleanupError);
        }
        
        throw new Error('Failed to initialize call infrastructure');
      }

      // Cache active call with error handling
      try {
        await this.cacheActiveCall(callId, call);
        console.log(`✅ Call cached: ${callId}`);
      } catch (cacheError) {
        console.error('❌ Failed to cache call:', cacheError);
        // Continue without caching - not critical
      }

      // Set call timeout
      try {
        await callTimeoutService.setRingTimeout(callId);
        console.log(`✅ Call timeout set: ${callId}`);
      } catch (timeoutError) {
        console.error('❌ Failed to set call timeout:', timeoutError);
        // Continue without timeout - not critical
      }

      // Notify recipient if they're a registered user
      if (toUserId) {
        const callData = {
          callId,
          fromUserId,
          fromDisplayName: metadata.fromDisplayName || 'Unknown',
          callType,
          agoraToken: callRoom.calleeToken?.token
        };

        // Try WebSocket notification first
        const wsNotificationSent = websocketService.notifyIncomingCall(toUserId, callData);

        // Fallback to push notification if WebSocket fails
        if (!wsNotificationSent) {
          console.log(`📱 User ${toUserId} offline, sending push notification`);
          try {
            const pushResult = await pushNotificationService.sendIncomingCallNotification(toUserId, callData);
            console.log('📱 Push notification result:', pushResult);
          } catch (pushError) {
            console.error('❌ Push notification failed:', pushError);
            // Continue without push notification - not critical for call setup
          }
        } else {
          console.log(`🔌 WebSocket notification sent to user ${toUserId}`);
        }
      }

      return {
        success: true,
        callId,
        status: 'initiated',
        toPhoneNumber: normalizedPhone,
        callType,
        agoraToken: callRoom.callerToken?.token,
        agoraAppId: callRoom.appId,
        channelName: callRoom.channelName
      };

    } catch (error) {
      console.error(`❌ Call initiation failed for ${callId}:`, error);
      
      // Enhanced cleanup on failure
      if (call) {
        try {
          await call.updateStatus('failed');
          await this.removeActiveCall(callId);
        } catch (cleanupError) {
          console.error('❌ Failed to cleanup failed call:', cleanupError);
        }
      }
      
      throw error;
    }
  }

  // Enhanced accept call with better error handling
  async acceptCall(callId, userId, metadata = {}) {
    try {
      console.log(`✅ Accepting call ${callId} by user ${userId}`);
      
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

      // Clear call timeout
      try {
        await callTimeoutService.clearTimeout(callId);
      } catch (timeoutError) {
        console.error('❌ Failed to clear timeout:', timeoutError);
        // Continue - not critical
      }

      // Verify Agora room is still available
      const roomInfo = await productionPhoneService.getCallRoom(callId);
      if (!roomInfo.success) {
        throw new Error('Call room not found or expired');
      }

      // Generate token if needed
      let calleeToken = roomInfo.room.calleeToken;
      if (!calleeToken) {
        try {
          const channelName = `call_${callId}`;
          const tokenData = productionPhoneService.generateAgoraToken(channelName, userId, 'publisher');
          calleeToken = tokenData.token;
        } catch (tokenError) {
          console.error('❌ Failed to generate Agora token:', tokenError);
          throw new Error('Failed to generate call token');
        }
      }

      // Update call status with proper synchronization
      try {
        await call.updateStatus('active');
        await this.cacheActiveCall(callId, call);
        console.log(`✅ Call ${callId} status updated to active`);
      } catch (updateError) {
        console.error('❌ Failed to update call status:', updateError);
        throw new Error('Failed to update call status');
      }

      // Notify caller via WebSocket
      try {
        websocketService.notifyCallStatusChange(call.fromUserId, callId, 'active', {
          message: 'Call was accepted'
        });
      } catch (notifyError) {
        console.error('❌ Failed to notify caller:', notifyError);
        // Continue - not critical for call function
      }

      // Handle recording if enabled
      let recordingInfo = null;
      if (metadata.enableRecording || call.metadata?.enableRecording) {
        try {
          const channelName = `call_${callId}`;
          const recordingResult = await callRecordingService.startRecording(
            callId, 
            channelName, 
            userId, 
            {
              videoEnabled: call.callType === 'video',
              subscribedUsers: [call.fromUserId, call.toUserId].filter(Boolean)
            }
          );
          
          if (recordingResult.success) {
            recordingInfo = {
              recordingId: recordingResult.recordingId,
              status: 'recording'
            };
            console.log(`🎙️ Recording started for call ${callId}`);
          } else {
            console.warn(`⚠️ Failed to start recording: ${recordingResult.error}`);
          }
        } catch (recordingError) {
          console.error('❌ Recording start error:', recordingError);
          // Continue without recording - not critical
        }
      }

      return {
        success: true,
        callId,
        status: 'active',
        message: 'Call accepted successfully',
        agoraToken: calleeToken,
        channelName: `call_${callId}`,
        recording: recordingInfo
      };

    } catch (error) {
      console.error(`❌ Call accept failed for ${callId}:`, error);
      throw error;
    }
  }

  // Enhanced reject call
  async rejectCall(callId, userId, reason = 'rejected') {
    try {
      console.log(`❌ Rejecting call ${callId} by user ${userId}, reason: ${reason}`);
      
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

      // Clear timeout and update status
      try {
        await callTimeoutService.clearTimeout(callId);
        await call.updateStatus('rejected');
        await this.removeActiveCall(callId);
      } catch (updateError) {
        console.error('❌ Failed to update call status during rejection:', updateError);
        throw new Error('Failed to process call rejection');
      }

      // Notify caller
      try {
        websocketService.notifyCallStatusChange(call.fromUserId, callId, 'rejected', {
          reason,
          message: 'Call was rejected'
        });
      } catch (notifyError) {
        console.error('❌ Failed to notify caller of rejection:', notifyError);
        // Continue - not critical
      }

      return {
        success: true,
        callId,
        status: 'rejected',
        reason,
        message: 'Call rejected successfully'
      };

    } catch (error) {
      console.error(`❌ Call reject failed for ${callId}:`, error);
      throw error;
    }
  }

  // Enhanced end call with comprehensive cleanup
  async endCall(callId, userId, qualityScore = null) {
    try {
      console.log(`📞 Ending call ${callId} by user ${userId}`);
      
      const call = await Call.findOne({ callId });

      if (!call) {
        throw new Error('Call not found');
      }

      if (call.fromUserId !== userId && call.toUserId !== userId) {
        throw new Error('Unauthorized to end this call');
      }

      // Clear timeout
      try {
        await callTimeoutService.clearTimeout(callId);
      } catch (timeoutError) {
        console.error('❌ Failed to clear timeout during call end:', timeoutError);
        // Continue
      }

      // Stop recording if active
      let recordingResult = null;
      try {
        const activeRecordings = await redis.keys('recording:*');
        for (const key of activeRecordings) {
          const recordingData = await redis.get(key);
          if (recordingData) {
            const recording = JSON.parse(recordingData);
            
            if (recording.callId === callId && recording.status === 'recording') {
              recordingResult = await callRecordingService.stopRecording(recording.recordingId, userId);
              if (recordingResult.success) {
                console.log(`🎙️ Recording stopped for call ${callId}`);
              }
              break;
            }
          }
        }
      } catch (recordingError) {
        console.error('❌ Recording stop error:', recordingError);
        // Continue - not critical for call ending
      }

      // Calculate duration and update call
      call.endTime = new Date();
      call.duration = Math.round((call.endTime - call.startTime) / 1000);

      if (qualityScore) {
        call.qualityScore = qualityScore;
      }

      try {
        await call.updateStatus('ended');
        await this.removeActiveCall(callId);
      } catch (updateError) {
        console.error('❌ Failed to update call status during end:', updateError);
        throw new Error('Failed to update call status');
      }

      // Notify other participant
      const otherUserId = call.fromUserId === userId ? call.toUserId : call.fromUserId;
      if (otherUserId) {
        try {
          websocketService.notifyCallStatusChange(otherUserId, callId, 'ended', {
            duration: call.duration,
            message: 'Call was ended'
          });

          // Send push notification for call ended
          await pushNotificationService.sendCallStatusNotification(otherUserId, {
            callId,
            status: 'ended',
            duration: call.duration,
            fromDisplayName: call.metadata?.fromDisplayName || 'Unknown'
          });
        } catch (notifyError) {
          console.error('❌ Failed to notify other participant:', notifyError);
          // Continue - not critical
        }
      }

      // Cleanup Agora resources
      try {
        await productionPhoneService.cleanupCallRoom(callId);
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup Agora room:', cleanupError);
        // Continue - not critical
      }

      return {
        success: true,
        callId,
        status: 'ended',
        duration: call.duration,
        message: 'Call ended successfully',
        recording: recordingResult
      };

    } catch (error) {
      console.error(`❌ Call end failed for ${callId}:`, error);
      throw error;
    }
  }

  // Enhanced cache methods with error handling
  async cacheActiveCall(callId, call) {
    try {
      const cacheKey = `call:${callId}`;
      await redis.setEx(cacheKey, 3600, JSON.stringify(call.toObject()));

      // Invalidate user active calls cache
      if (call.fromUserId) {
        await redis.del(`active_calls:${call.fromUserId}`);
      }
      if (call.toUserId) {
        await redis.del(`active_calls:${call.toUserId}`);
      }

      console.log(`✅ Call ${callId} cached successfully`);
    } catch (error) {
      console.error(`❌ Failed to cache call ${callId}:`, error);
      throw error;
    }
  }

  async removeActiveCall(callId) {
    try {
      const call = await this.getCall(callId);
      if (call) {
        await redis.del(`call:${callId}`);
        if (call.fromUserId) {
          await redis.del(`active_calls:${call.fromUserId}`);
        }
        if (call.toUserId) {
          await redis.del(`active_calls:${call.toUserId}`);
        }
        console.log(`✅ Call ${callId} removed from cache`);
      }
    } catch (error) {
      console.error(`❌ Failed to remove call ${callId} from cache:`, error);
      // Don't throw - this is cleanup
    }
  }

  // Enhanced active calls retrieval
  async getActiveCalls(userId) {
    try {
      const cacheKey = `active_calls:${userId}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const calls = await Call.findActiveCalls(userId);
      
      // Cache for 30 seconds
      try {
        await redis.setEx(cacheKey, 30, JSON.stringify(calls));
      } catch (cacheError) {
        console.error('❌ Failed to cache active calls:', cacheError);
        // Continue without caching
      }
      
      return calls;
    } catch (error) {
      console.error(`❌ Error getting active calls for user ${userId}:`, error);
      throw error;
    }
  }

  async getCall(callId) {
    try {
      return await Call.findOne({ callId });
    } catch (error) {
      console.error(`❌ Error getting call ${callId}:`, error);
      throw error;
    }
  }

  // Rest of the methods remain the same but with enhanced error logging...
  async handleMissedCalls() {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const missedCalls = await Call.find({
        status: { $in: ['initiated', 'ringing'] },
        startTime: { $lt: fiveMinutesAgo }
      });

      for (const call of missedCalls) {
        try {
          await call.updateStatus('missed');
          await this.removeActiveCall(call.callId);

          if (call.fromUserId) {
            await this.notifyCallStatusChange(call.fromUserId, call.callId, 'missed');
          }
          if (call.toUserId) {
            await this.notifyCallStatusChange(call.toUserId, call.callId, 'missed');
          }
        } catch (updateError) {
          console.error(`❌ Failed to update missed call ${call.callId}:`, updateError);
        }
      }

      console.log(`📞 Marked ${missedCalls.length} calls as missed`);
    } catch (error) {
      console.error('❌ Error handling missed calls:', error);
    }
  }

  async notifyCallStatusChange(userId, callId, status) {
    try {
      const notification = {
        type: 'call_status_change',
        callId,
        status,
        timestamp: new Date().toISOString()
      };
      await redis.publish(`notifications:${userId}`, JSON.stringify(notification));
    } catch (error) {
      console.error('❌ Failed to notify call status change:', error);
    }
  }

  // New: Toggle recording with enhanced error handling
  async toggleRecording(callId, userId, enable = true) {
    try {
      const call = await Call.findOne({ callId });

      if (!call) {
        throw new Error('Call not found');
      }

      if (call.fromUserId !== userId && call.toUserId !== userId) {
        throw new Error('Unauthorized to control recording for this call');
      }

      if (call.status !== 'active') {
        throw new Error('Can only control recording during active calls');
      }

      if (enable) {
        const channelName = `call_${callId}`;
        const result = await callRecordingService.startRecording(
          callId, 
          channelName, 
          userId,
          {
            videoEnabled: call.callType === 'video',
            subscribedUsers: [call.fromUserId, call.toUserId].filter(Boolean)
          }
        );

        if (result.success) {
          const otherUserId = call.fromUserId === userId ? call.toUserId : call.fromUserId;
          if (otherUserId) {
            websocketService.notifyCallStatusChange(otherUserId, callId, 'recording_started', {
              message: 'Recording started'
            });
          }
        }

        return result;
      } else {
        const activeRecordings = await redis.keys('recording:*');
        for (const key of activeRecordings) {
          const recordingData = await redis.get(key);
          const recording = JSON.parse(recordingData);
          
          if (recording.callId === callId && recording.status === 'recording') {
            const result = await callRecordingService.stopRecording(recording.recordingId, userId);
            
            if (result.success) {
              const otherUserId = call.fromUserId === userId ? call.toUserId : call.fromUserId;
              if (otherUserId) {
                websocketService.notifyCallStatusChange(otherUserId, callId, 'recording_stopped', {
                  message: 'Recording stopped'
                });
              }
            }
            
            return result;
          }
        }
        
        return { success: false, reason: 'no_active_recording' };
      }

    } catch (error) {
      console.error('❌ Error toggling recording:', error);
      throw error;
    }
  }
}

export default new CallingService();