const mongoose = require('mongoose');

const urgentCampaignSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'high',
  },
  urgencyReason: {
    type: String,
    default: null,
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  featuredUntil: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('UrgentCampaign', urgentCampaignSchema);

