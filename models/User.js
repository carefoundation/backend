const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  mobileNumber: {
    type: String,
    required: [true, 'Please add a mobile number'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false,
  },
  role: {
    type: String,
    enum: ['donor', 'beneficiary', 'volunteer', 'vendor', 'fundraiser', 'admin', 'partner', 'staff'],
    default: 'donor',
  },
  documents: {
    type: [String],
    default: [],
  },
  profileImage: {
    type: String,
    default: null,
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
  businessName: {
    type: String,
    default: null,
  },
  businessType: {
    type: String,
    default: null,
  },
  gstNumber: {
    type: String,
    default: null,
  },
  website: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  partnerKycCompleted: {
    type: Boolean,
    default: false,
  },
  permissions: {
    type: [String],
    default: [],
    enum: [
      'manage_campaigns',
      'manage_events',
      'manage_blogs',
      'manage_celebrities',
      'manage_partners',
      'manage_users',
      'manage_donations',
      'manage_volunteers',
      'manage_fundraisers',
      'view_reports',
      'manage_products',
      'manage_coupons',
      'manage_queries',
      'manage_form_submissions',
    ],
  },
}, {
  timestamps: true,
});

userSchema.pre('save', async function(next) {
  // Auto-approve admin users
  if (this.role === 'admin') {
    this.isApproved = true;
  }
  
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
