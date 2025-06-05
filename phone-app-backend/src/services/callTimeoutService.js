import Call from '../models/Call.js';
import callingService from './callingService.js';

class CallTimeoutService {
  constructor() {
    this.timeouts = new Map();
    this.RING_TIMEOUT = 60 * 1000; // 60 seconds
    this.INACTIVE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
    this.cleanup_interval = null;
  }

  start() {
    // Run cleanup every minute
    this.cleanup_interval = setInterval(() => {
      this.cleanupStaleCalls();
    }, 60 * 1000);
    
    console.log('📞 Call timeout service started');
  }

  stop() {
    if (this.cleanup_interval) {
      clearInterval(this.cleanup_interval);
    }
    
    // Clear all timeouts
    for (const timeoutId of this.timeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.timeouts.clear();
    
    console.log('📞 Call timeout service stopped');
  }

  // Set timeout for ringing calls
  setRingTimeout(callId) {
    const timeoutId = setTimeout(async () => {
      try {
        const call = await Call.findOne({ callId });
        if (call && ['initiated', 'ringing'].includes(call.status)) {
          console.log(`⏰ Call ${callId} timed out (no answer)`);
          await call.updateStatus('missed');
          await callingService.removeActiveCall(callId);
          
          // Notify both parties
          if (call.fromUserId) {
            await callingService.notifyCallStatusChange(call.fromUserId, callId, 'missed');
          }
          if (call.toUserId) {
            await callingService.notifyCallStatusChange(call.toUserId, callId, 'missed');
          }
        }
      } catch (error) {
        console.error(`Error handling ring timeout for call ${callId}:`, error);
      } finally {
        this.timeouts.delete(callId);
      }
    }, this.RING_TIMEOUT);

    this.timeouts.set(callId, timeoutId);
    console.log(`⏲️  Set ring timeout for call ${callId}`);
  }

  // Clear timeout when call is answered/rejected
  clearTimeout(callId) {
    const timeoutId = this.timeouts.get(callId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(callId);
      console.log(`✅ Cleared timeout for call ${callId}`);
    }
  }

  // Cleanup stale calls (background job)
  async cleanupStaleCalls() {
    try {
      const now = new Date();
      const staleTime = new Date(now.getTime() - this.INACTIVE_TIMEOUT);

      // Find calls that are stuck in initiated/ringing state
      const staleCalls = await Call.find({
        status: { $in: ['initiated', 'ringing'] },
        startTime: { $lt: staleTime }
      });

      for (const call of staleCalls) {
        console.log(`🧹 Cleaning up stale call: ${call.callId}`);
        await call.updateStatus('failed');
        await callingService.removeActiveCall(call.callId);
        
        // Clear any existing timeouts
        this.clearTimeout(call.callId);
      }

      // Find active calls that haven't been updated recently
      const inactiveCalls = await Call.find({
        status: 'active',
        updatedAt: { $lt: staleTime }
      });

      for (const call of inactiveCalls) {
        console.log(`🧹 Ending inactive call: ${call.callId}`);
        call.endTime = now;
        call.duration = Math.round((now - call.startTime) / 1000);
        await call.updateStatus('ended');
        await callingService.removeActiveCall(call.callId);
      }

      if (staleCalls.length > 0 || inactiveCalls.length > 0) {
        console.log(`🧹 Cleaned up ${staleCalls.length} stale and ${inactiveCalls.length} inactive calls`);
      }

    } catch (error) {
      console.error('Error during call cleanup:', error);
    }
  }

  // Get service statistics
  getStats() {
    return {
      activeTimeouts: this.timeouts.size,
      ringTimeoutMs: this.RING_TIMEOUT,
      inactiveTimeoutMs: this.INACTIVE_TIMEOUT,
      cleanupRunning: !!this.cleanup_interval
    };
  }
}

export default new CallTimeoutService();