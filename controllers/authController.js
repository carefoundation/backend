const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendPendingAccountEmail } = require('../utils/emailService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key-change-in-production', {
    expiresIn: '30d'
  });
};

exports.register = async (req, res) => {
  try {
    const { name, mobileNumber, email, password, confirmPassword, role } = req.body;

    if (!name || !mobileNumber || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    const userExists = await User.findOne({
      email: email.toLowerCase()
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    const userData = {
      name,
      mobileNumber,
      email: email.toLowerCase(),
      password,
      role: role || 'donor',
      isApproved: false // New users need admin approval
    };

    // Add documents if provided (for partner registration)
    if (req.body.documents && Array.isArray(req.body.documents)) {
      userData.documents = req.body.documents;
    }

    // Add partner specific fields
    if (role === 'partner') {
      if (req.body.address) userData.address = req.body.address;
      if (req.body.city) userData.city = req.body.city;
      if (req.body.state) userData.state = req.body.state;
      if (req.body.pincode) userData.pincode = req.body.pincode;
      if (req.body.businessName) userData.businessName = req.body.businessName;
      if (req.body.businessType) userData.businessType = req.body.businessType;
      if (req.body.gstNumber) userData.gstNumber = req.body.gstNumber;
      if (req.body.website) userData.website = req.body.website;
    }

    const user = await User.create(userData);

    // Send pending account email for Partner, Volunteer, Fundraiser, and Staff roles
    const rolesRequiringApproval = ['partner', 'volunteer', 'fundraiser', 'staff'];
    if (rolesRequiringApproval.includes(user.role.toLowerCase()) && !user.isApproved) {
      try {
        await sendPendingAccountEmail(user.email, user.name);
      } catch (emailError) {
        console.error('Error sending pending account email during registration:', emailError);
      }
    }

    // Don't generate token - user needs admin approval first
    res.status(201).json({
      success: true,
      message: 'Registration successful! Your account is pending admin approval. You will be able to login once approved.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          mobileNumber: user.mobileNumber,
          email: user.email,
          role: user.role,
          isApproved: user.isApproved
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if user is approved (admin users are auto-approved)
    // Send email for Partner, Volunteer, Fundraiser, and Staff roles when trying to login with pending status
    const rolesRequiringApproval = ['partner', 'volunteer', 'fundraiser', 'staff'];
    if (!user.isApproved && user.role !== 'admin') {
      // Send email notification about pending status for specific roles
      if (rolesRequiringApproval.includes(user.role.toLowerCase())) {
        try {
          await sendPendingAccountEmail(user.email, user.name);
        } catch (emailError) {
          console.error('Error sending pending account email:', emailError);
        }
      }
      
      return res.status(403).json({
        success: false,
        error: 'Your account is pending admin approval. Please wait for approval before logging in.'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'User signed in successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          mobileNumber: user.mobileNumber,
          email: user.email,
          role: user.role,
          permissions: user.permissions || []
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email address'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '1h' }
    );

    // In production, send email with reset link
    // For now, just return success message
    // TODO: Implement email sending service
    
    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
      // In development, you might want to return the token for testing
      // Remove this in production
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
