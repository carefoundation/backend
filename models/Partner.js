const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Partner name is required'],
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Partner type is required'],
    enum: ['health', 'food'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  logo: {
    type: String,
    default: null,
  },
  photo: {
    type: String,
    default: null,
  },
  programs: [{
    type: String,
  }],
  impact: {
    type: String,
    default: null,
  },
  since: {
    type: String,
    default: null,
  },
  phone: {
    type: String,
    default: null,
  },
  email: {
    type: String,
    default: null,
    lowercase: true,
  },
  address: {
    type: String,
    default: null,
  },
  city: {
    type: String,
    default: null,
  },
  state: {
    type: String,
    default: null,
  },
  pincode: {
    type: String,
    default: null,
  },
  website: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active'],
    default: 'pending',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  formData: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Partner', partnerSchema);

