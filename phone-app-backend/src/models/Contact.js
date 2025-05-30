import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  avatarUrl: String,
  isBlocked: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  tags: [String],
  metadata: {
    importSource: String,
    lastInteraction: Date,
    callCount: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Compound indexes
contactSchema.index({ userId: 1, phoneNumber: 1 }, { unique: true });
contactSchema.index({ userId: 1, displayName: 'text' });

export default mongoose.model('Contact', contactSchema);