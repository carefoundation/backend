const User = require('../models/User');
const Partner = require('../models/Partner');
const { sendApprovedAccountEmail } = require('../utils/emailService');
const { processFileFields, deleteS3FilesFromObject } = require('../utils/fileHelper');

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Check if partner has completed KYC
    let partnerKycCompleted = false;
    if (user.role === 'partner') {
      const partnerRecord = await Partner.findOne({ createdBy: user._id });
      partnerKycCompleted = !!partnerRecord;
      
      // Update user's partnerKycCompleted field
      if (partnerKycCompleted && !user.partnerKycCompleted) {
        await User.findByIdAndUpdate(user._id, { partnerKycCompleted: true });
      }
    }
    
    const userObj = user.toObject();
    userObj.partnerKycCompleted = partnerKycCompleted;
    
    res.status(200).json({
      success: true,
      data: userObj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

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

exports.updateUser = async (req, res) => {
  try {
    // If role is being updated, ensure only admin can do it
    if (req.body.role && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admin can change user roles'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Delete old files from S3 if new ones are being uploaded
    const fieldsToCheck = ['profileImage'];
    const oldFiles = {};
    fieldsToCheck.forEach(field => {
      if (req.body[field] !== undefined && user[field]) {
        oldFiles[field] = user[field];
      }
    });

    // Process and upload new files to S3
    const processedData = await processFileFields(req.body, ['profileImage']);

    // Delete old files from S3
    if (Object.keys(oldFiles).length > 0) {
      await deleteS3FilesFromObject(oldFiles);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      processedData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Delete files from S3 before deleting user
    await deleteS3FilesFromObject(user);

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get pending users (users waiting for approval)
exports.getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ isApproved: false, role: { $ne: 'admin' } }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Approve user
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Send approval email notification for Partner, Volunteer, Fundraiser, and Staff roles
    const rolesRequiringApproval = ['partner', 'volunteer', 'fundraiser', 'staff'];
    if (rolesRequiringApproval.includes(user.role.toLowerCase())) {
      try {
        await sendApprovedAccountEmail(user.email, user.name);
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'User approved successfully',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Reject user (delete or mark as rejected)
exports.rejectUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User rejected and removed',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
