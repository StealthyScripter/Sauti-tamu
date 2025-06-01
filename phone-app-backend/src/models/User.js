import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  displayName: {
    type: String,
    trim: true
  },
  avatarUrl: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  settings: {
    callSettings: {
      autoAcceptCalls: { type: Boolean, default: false },
      allowVideoSalls: { type: Boolean, default: true },
      blockUnknownCallers: { type: Boolean, default: false }
    },
    privacy: {
      showLastSeen: { type: Boolean, default: true },
      showOnlineStatus: { type: Boolean, default: true }
    },
    notifications: {
      callNotifications: { type: Boolean, default: true },
      messageNotifications: { type: Boolean, default: true }
    }
  },
  metadata: {
    registrationIP: String,
    deviceInfo: {
      platform: String,
      version: String,
      userAgent: String
    },
    timezone: String,
    locale: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
userSchema.index({ phoneNumber: 1 });
userSchema.index({ displayName: 'text' });
userSchema.index({ isActive: 1, lastLoginAt: -1 });

// Virtual for user status
userSchema.virtual('isOnline').get(function() {
  // Consider user online if last login was within 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.lastLoginAt > fiveMinutesAgo;
});

// Method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

// Method to update settings
userSchema.methods.updateSettings = function(newSettings) {
  this.settings = { ...this.settings.toObject(), ...newSettings };
  return this.save();
};

// Static method to find active users
userSchema.statics.findActiveUsers = function(limit = 50) {
  return this.find({ isActive: true })
    .sort({ lastLoginAt: -1 })
    .limit(limit);
};

export default mongoose.model('User', userSchema);