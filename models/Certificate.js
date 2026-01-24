const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  volunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Volunteer',
    required: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null,
  },
  certificateNumber: {
    type: String,
    unique: true,
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Certificate title is required'],
  },
  description: {
    type: String,
    default: null,
  },
  certificateImage: {
    type: String,
    default: null,
  },
  issuedDate: {
    type: Date,
    default: Date.now,
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  hours: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['issued', 'revoked'],
    default: 'issued',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Certificate', certificateSchema);

