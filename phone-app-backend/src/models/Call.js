// src/models/Call.js
import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
  caller_id: {
    type: String,
    required: true,
    ref: 'User'
  },
  callee_id: {
    type: String,
    required: true,
    ref: 'User'
  },
  channel_name: {
    type: String,
    required: true,
    unique: true
  },
  call_type: {
    type: String,
    enum: ['audio', 'video'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'connected', 'ended', 'missed', 'rejected'],
    default: 'pending'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  connected_at: {
    type: Date,
    default: null
  },
  ended_at: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // Duration in seconds
    default: null
  },
  recording_url: {
    type: String,
    default: null
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
callSchema.index({ caller_id: 1, created_at: -1 });
callSchema.index({ callee_id: 1, created_at: -1 });
callSchema.index({ status: 1 });
callSchema.index({ channel_name: 1 }, { unique: true });

// Virtual for call participants
callSchema.virtual('participants').get(function() {
  return [this.caller_id, this.callee_id];
});

// Method to check if user is participant
callSchema.methods.isParticipant = function(userId) {
  return this.caller_id === userId || this.callee_id === userId;
};

// Method to get other participant
callSchema.methods.getOtherParticipant = function(userId) {
  return this.caller_id === userId ? this.callee_id : this.caller_id;
};

// Pre-save middleware
callSchema.pre('save', function(next) {
  // Auto-set ended_at if status is ended/rejected/missed and ended_at is not set
  if (['ended', 'rejected', 'missed'].includes(this.status) && !this.ended_at) {
    this.ended_at = new Date();
  }
  
  // Calculate duration if call was connected and ended
  if (this.status === 'ended' && this.connected_at && this.ended_at && !this.duration) {
    this.duration = Math.floor((this.ended_at - this.connected_at) / 1000);
  }
  
  next();
});

const Call = mongoose.model('Call', callSchema);

export default Call;