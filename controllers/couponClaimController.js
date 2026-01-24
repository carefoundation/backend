const CouponClaim = require('../models/CouponClaim');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const Partner = require('../models/Partner');

// Partner claims a coupon
exports.claimCoupon = async (req, res) => {
  try {
    const { couponId } = req.body;
    const partnerId = req.user._id;

    if (!couponId) {
      return res.status(400).json({
        success: false,
        error: 'Coupon ID is required'
      });
    }

    // Check if user is a partner
    if (req.user.role !== 'partner') {
      return res.status(403).json({
        success: false,
        error: 'Only partners can claim coupons'
      });
    }

    // Check if user account is approved
    if (!req.user.isApproved) {
      return res.status(403).json({
        success: false,
        error: 'Your account needs to be approved by admin before claiming coupons'
      });
    }

    // Check if partner has completed KYC
    if (!req.user.partnerKycCompleted) {
      return res.status(403).json({
        success: false,
        error: 'Please complete your partnership KYC form first. Go to "Become Partner" page to fill the form.'
      });
    }

    // Check if Partner record exists and is approved
    const partnerRecord = await Partner.findOne({ createdBy: partnerId });
    if (!partnerRecord) {
      return res.status(403).json({
        success: false,
        error: 'Partner form not submitted. Please fill the partnership form first.'
      });
    }

    if (partnerRecord.status !== 'approved' && partnerRecord.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Your partner request is pending admin approval. You can claim coupons once your partner request is approved.'
      });
    }

    // Check if coupon exists
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }

    // Check if already claimed
    const existingClaim = await CouponClaim.findOne({
      couponId,
      partnerId,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingClaim) {
      return res.status(400).json({
        success: false,
        error: 'You have already claimed this coupon'
      });
    }

    // Create claim request
    const claim = await CouponClaim.create({
      couponId,
      partnerId,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Coupon claim request submitted. Waiting for admin approval.',
      data: claim
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get partner's coupon claims
exports.getMyClaims = async (req, res) => {
  try {
    const claims = await CouponClaim.find({ partnerId: req.user._id })
      .populate('couponId')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: claims.length,
      data: claims
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Admin: Get all pending claims
exports.getPendingClaims = async (req, res) => {
  try {
    const claims = await CouponClaim.find({ status: 'pending' })
      .populate('couponId')
      .populate('partnerId', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: claims.length,
      data: claims
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Admin: Approve claim
exports.approveClaim = async (req, res) => {
  try {
    const claim = await CouponClaim.findById(req.params.id)
      .populate('couponId')
      .populate('partnerId');

    if (!claim) {
      return res.status(404).json({
        success: false,
        error: 'Claim not found'
      });
    }

    if (claim.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Claim is not pending'
      });
    }

    // Update coupon to assign to partner
    await Coupon.findByIdAndUpdate(claim.couponId._id, {
      issuedTo: claim.partnerId._id
    });

    // Update claim status
    claim.status = 'approved';
    claim.reviewedAt = new Date();
    claim.reviewedBy = req.user._id;
    await claim.save();

    res.status(200).json({
      success: true,
      message: 'Coupon claim approved successfully',
      data: claim
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Admin: Reject claim
exports.rejectClaim = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const claim = await CouponClaim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({
        success: false,
        error: 'Claim not found'
      });
    }

    if (claim.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Claim is not pending'
      });
    }

    claim.status = 'rejected';
    claim.reviewedAt = new Date();
    claim.reviewedBy = req.user._id;
    claim.rejectionReason = rejectionReason || 'No reason provided';
    await claim.save();

    res.status(200).json({
      success: true,
      message: 'Coupon claim rejected',
      data: claim
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
