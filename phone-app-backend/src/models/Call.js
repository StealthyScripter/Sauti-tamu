import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
  callId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  fromUserId: {
    type: String,
    required: true,
    index: true
  },
  toUserId: {
    type: String,
    index: true
  },
  toPhoneNumber: {
    type: String,
    required: true,
    index: true
  },
  callType: {
    type: String,
    enum: ['voice', 'video'],
    required: true
  },
  status: {
    type: String,
    enum: ['initiated', 'ringing', 'active', 'ended', 'failed', 'missed', 'rejected'],
    default: 'initiated'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  qualityScore: {
    type: Number,
    min: 1,
    max: 5
  },
  connectionType: {
    type: String,
    enum: ['wifi', 'cellular', 'unknown'],
    default: 'unknown'
  },
  metadata: {
    deviceInfo: {
      caller: {
        platform: String,
        version: String,
        userAgent: String
      },
      callee: {
        platform: String,
        version: String,
        userAgent: String
      }
    },
    networkInfo: {
      callerIP: String,
      calleeIP: String,
      region: String
    },
    callSettings: {
      audioEnabled: { type: Boolean, default: true },
      videoEnabled: { type: Boolean, default: false },
      recordingEnabled: { type: Boolean, default: false }
    }
  },
  errorInfo: {
    errorCode: String,
    errorMessage: String,
    timestamp: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
callSchema.index({ fromUserId: 1, startTime: -1 });
callSchema.index({ toUserId: 1, startTime: -1 });
callSchema.index({ toPhoneNumber: 1, startTime: -1 });
callSchema.index({ status: 1, startTime: -1 });
callSchema.index({ callType: 1, status: 1 });

// Virtual for call duration calculation
callSchema.virtual('calculatedDuration').get(function() {
  if (this.endTime && this.startTime) {
    return Math.round((this.endTime - this.startTime) / 1000);
  }
  return 0;
});

// Method to update call status
callSchema.methods.updateStatus = function(newStatus, additionalData = {}) {
  this.status = newStatus;
  
  if (newStatus === 'ended' && !this.endTime) {
    this.endTime = new Date();
    this.duration = this.calculatedDuration;
  }
  
  if (newStatus === 'failed' && additionalData.error) {
    this.errorInfo = {
      errorCode: additionalData.error.code,
      errorMessage: additionalData.error.message,
      timestamp: new Date()
    };
  }
  
  return this.save();
};

// Static method to find active calls for a user
callSchema.statics.findActiveCalls = function(userId) {
  return this.find({
    $or: [
      { fromUserId: userId },
      { toUserId: userId }
    ],
    status: { $in: ['initiated', 'ringing', 'active'] }
  });
};

export default mongoose.model('Call', callSchema);