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
    ref: 'User',
    index: true
  },
  toUserId: {
    type: String,
    ref: 'User',
    index: true
  },
  toPhoneNumber: {
    type: String,
    required: true,
    index: true
  },
  channelName: {
    type: String,
    required: true,
    unique: true
  },
  callType: {
    type: String,
    enum: ['voice', 'video'],
    required: true
  },
  status: {
    type: String,
    enum: ['initiated', 'ringing', 'active', 'ended', 'missed', 'rejected', 'failed'],
    default: 'initiated',
    index: true
  },
  startTime: {
    type: Date,
    default: Date.now,
    index: true
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // Duration in seconds
    default: null
  },
  qualityScore: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  connectionType: {
    type: String,
    enum: ['wifi', 'cellular', 'unknown', 'app'],
    default: 'unknown'
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better performance
callSchema.index({ fromUserId: 1, startTime: -1 });
callSchema.index({ toUserId: 1, startTime: -1 });
callSchema.index({ status: 1, startTime: -1 });
callSchema.index({ callId: 1 }, { unique: true });

// Virtual for call participants
callSchema.virtual('participants').get(function() {
  return [this.fromUserId, this.toUserId].filter(Boolean);
});

// Method to check if user is participant
callSchema.methods.isParticipant = function(userId) {
  return this.fromUserId === userId || this.toUserId === userId;
};

// Method to get other participant
callSchema.methods.getOtherParticipant = function(userId) {
  return this.fromUserId === userId ? this.toUserId : this.fromUserId;
};

// Method to update call status with automatic field updates
callSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  
  // Auto-set endTime if status indicates call is finished
  if (['ended', 'rejected', 'missed', 'failed'].includes(newStatus) && !this.endTime) {
    this.endTime = new Date();
  }
  
  // Auto-set startTime if call becomes active
  if (newStatus === 'active' && !this.connectedAt) {
    this.connectedAt = new Date();
  }
  
  // Calculate duration if call was connected and ended
  if (newStatus === 'ended' && this.connectedAt && this.endTime && !this.duration) {
    this.duration = Math.floor((this.endTime - this.connectedAt) / 1000);
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
  }).sort({ startTime: -1 });
};

// Static method to find call history for a user
callSchema.statics.findUserCallHistory = function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  return this.find({
    $or: [
      { fromUserId: userId },
      { toUserId: userId }
    ]
  })
    .sort({ startTime: -1 })
    .skip(skip)
    .limit(limit);
};

// Pre-save middleware
callSchema.pre('save', function(next) {
  // Auto-set endTime if status is ended/rejected/missed and endTime is not set
  if (['ended', 'rejected', 'missed', 'failed'].includes(this.status) && !this.endTime) {
    this.endTime = new Date();
  }
  
  // Calculate duration if call was connected and ended
  if (this.status === 'ended' && this.connectedAt && this.endTime && !this.duration) {
    this.duration = Math.floor((this.endTime - this.connectedAt) / 1000);
  }
  
  next();
});

const Call = mongoose.model('Call', callSchema);

export default Call;