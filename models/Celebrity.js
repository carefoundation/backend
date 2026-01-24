const mongoose = require('mongoose');

const celebritySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Celebrity name is required'],
    trim: true,
  },
  image: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    default: null,
  },
  profession: {
    type: String,
    default: null,
  },
  socialLinks: {
    instagram: { type: String, default: null },
    twitter: { type: String, default: null },
    facebook: { type: String, default: null },
    youtube: { type: String, default: null },
  },
  campaigns: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Celebrity', celebritySchema);

