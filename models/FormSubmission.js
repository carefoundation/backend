const mongoose = require('mongoose');

const formSubmissionSchema = new mongoose.Schema({
  formType: {
    type: String,
    required: [true, 'Form type is required'],
    enum: ['volunteer', 'partner', 'query', 'contact', 'fundraiser', 'other'],
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    default: null,
    trim: true,
  },
  subject: {
    type: String,
    default: null,
    trim: true,
  },
  message: {
    type: String,
    default: null,
  },
  formData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'resolved', 'archived'],
    default: 'new',
  },
  repliedAt: {
    type: Date,
    default: null,
  },
  repliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  replyMessage: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('FormSubmission', formSubmissionSchema);

