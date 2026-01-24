const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Campaign title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Campaign description is required'],
  },
  story: {
    type: String,
    default: null,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Medical', 'Education', 'Disaster Relief', 'Food', 'Health', 'Animals', 'Community Development', 'Other'],
  },
  goalAmount: {
    type: Number,
    required: [true, 'Goal amount is required'],
    min: [1, 'Goal amount must be at least ₹1'],
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  image: {
    type: String,
    default: null,
  },
  images: [{
    type: String,
  }],
  documents: [{
    type: String,
  }],
  location: {
    type: String,
    default: null,
  },
  endDate: {
    type: Date,
    default: null,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'completed', 'cancelled', 'paused'],
    default: 'pending',
  },
  isUrgent: {
    type: Boolean,
    default: false,
  },
  donors: {
    type: Number,
    default: 0,
  },
  views: {
    type: Number,
    default: 0,
  },
  featured: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

campaignSchema.virtual('progressPercentage').get(function() {
  if (this.goalAmount === 0) return 0;
  return Math.min(100, Math.round((this.currentAmount / this.goalAmount) * 100));
});

campaignSchema.virtual('daysLeft').get(function() {
  if (!this.endDate) return null;
  const now = new Date();
  const end = new Date(this.endDate);
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
});

module.exports = mongoose.model('Campaign', campaignSchema);

