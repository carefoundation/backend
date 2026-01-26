const mongoose = require('mongoose');

const donationCouponSchema = new mongoose.Schema({
  // Coupon identification
  couponCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  
  // QR code data (stored as base64 string)
  qrCode: {
    type: String,
    required: true
  },
  
  // User who created this coupon (donor)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Partner for whom the coupon is created
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true
  },
  
  // Coupon amount (in currency units)
  amount: {
    type: Number,
    required: [true, 'Coupon amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },

  // Donation information
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: true
  },
  
  // Payment information
  paymentId: {
    type: String,
    required: true
  },
  
  // Coupon status: 'active', 'used', 'expired'
  status: {
    type: String,
    enum: ['active', 'used', 'expired'],
    default: 'active'
  },
  
  // Expiry date (1 month from creation)
  expiryDate: {
    type: Date,
    required: true
  },
  
  // Partner who redeemed this coupon (if redeemed)
  redeemedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Redemption date
  redeemedAt: {
    type: Date,
    default: null
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
donationCouponSchema.index({ userId: 1, status: 1 });
donationCouponSchema.index({ partnerId: 1 });
donationCouponSchema.index({ expiryDate: 1 });
donationCouponSchema.index({ couponCode: 1 });

// Method to check if coupon is expired
donationCouponSchema.methods.isExpired = function() {
  return new Date() > this.expiryDate;
};

// Method to check if coupon can be used
donationCouponSchema.methods.canBeUsed = function() {
  return this.status === 'active' && !this.isExpired();
};

// Update the updatedAt field before saving
donationCouponSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-update status to expired if past expiry date
  if (this.isExpired() && this.status === 'active') {
    this.status = 'expired';
  }
  
  next();
});

module.exports = mongoose.model('DonationCoupon', donationCouponSchema);

