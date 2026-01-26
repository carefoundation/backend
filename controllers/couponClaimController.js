const CouponClaim = require('../models/CouponClaim');
const DonationCoupon = require('../models/DonationCoupon');
const User = require('../models/User');
const Partner = require('../models/Partner');

// Partner claims a coupon by code or QR code
exports.claimCoupon = async (req, res) => {
  try {
    const { couponCode, couponId } = req.body;
    const partnerId = req.user._id;

    if (!couponCode && !couponId) {
      return res.status(400).json({
        success: false,
        error: 'Coupon code or ID is required'
      });
    }

    // Fetch fresh user data from database to ensure we have latest approval status
    const user = await User.findById(partnerId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is a partner
    if (user.role !== 'partner') {
      return res.status(403).json({
        success: false,
        error: 'Only partners can claim coupons'
      });
    }

    // Check if user account is approved
    if (!user.isApproved) {
      return res.status(403).json({
        success: false,
        error: 'Your account needs to be approved by admin before claiming coupons'
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

    // Check if partner has completed KYC - use partner record status as source of truth
    // If partner is approved/active, KYC is considered completed
    // Also check user's partnerKycCompleted flag, but update it if partner is approved
    if (!user.partnerKycCompleted && (partnerRecord.status === 'approved' || partnerRecord.status === 'active')) {
      // Update user's partnerKycCompleted flag if partner is approved
      await User.findByIdAndUpdate(partnerId, { partnerKycCompleted: true });
      user.partnerKycCompleted = true;
    }

    if (!user.partnerKycCompleted) {
      return res.status(403).json({
        success: false,
        error: 'Please complete your partnership KYC form first. Go to "Become Partner" page to fill the form.'
      });
    }

    // Find coupon by code or ID
    let coupon;
    if (couponCode) {
      coupon = await DonationCoupon.findOne({ couponCode: couponCode.toUpperCase().trim() });
    } else {
      coupon = await DonationCoupon.findById(couponId);
    }

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found or invalid coupon code'
      });
    }

    // Check if coupon can be used
    if (!coupon.canBeUsed()) {
      let reason = 'Coupon cannot be used';
      if (coupon.status === 'used') {
        reason = 'This coupon has already been used';
      } else if (coupon.status === 'expired' || coupon.isExpired()) {
        reason = 'This coupon has expired';
      }
      return res.status(400).json({
        success: false,
        error: reason
      });
    }

    // Check if coupon is for this partner
    if (coupon.partnerId.toString() !== partnerRecord._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'This coupon is not valid for your partner account'
      });
    }

    // Check if already claimed
    const existingClaim = await CouponClaim.findOne({
      couponId: coupon._id,
      partnerId,
      status: { $in: ['pending', 'approved', 'paid'] }
    });

    if (existingClaim) {
      return res.status(400).json({
        success: false,
        error: 'This coupon has already been claimed'
      });
    }

    // Mark coupon as used
    coupon.status = 'used';
    coupon.redeemedBy = partnerId;
    coupon.redeemedAt = new Date();
    await coupon.save();

    // Create claim request
    const claim = await CouponClaim.create({
      couponId: coupon._id,
      partnerId,
      amount: coupon.amount,
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

// Admin: Mark claim as paid
exports.markAsPaid = async (req, res) => {
  try {
    const claim = await CouponClaim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({
        success: false,
        error: 'Claim not found'
      });
    }

    if (claim.status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Only approved claims can be marked as paid'
      });
    }

    claim.status = 'paid';
    claim.paidAt = new Date();
    claim.paidBy = req.user._id;
    await claim.save();

    res.status(200).json({
      success: true,
      message: 'Claim marked as paid successfully',
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
      .populate('paidBy', 'name email')
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

// Admin: Get all claims (with filters)
exports.getAllClaims = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    
    const claims = await CouponClaim.find(query)
      .populate('couponId')
      .populate('partnerId', 'name email role')
      .populate('reviewedBy', 'name email')
      .populate('paidBy', 'name email')
      .sort({ createdAt: -1 });

    // Get partner details with bank information
    const Partner = require('../models/Partner');
    const claimsWithPartnerDetails = await Promise.all(
      claims.map(async (claim) => {
        const claimObj = claim.toObject();
        if (claim.partnerId && claim.partnerId._id) {
          // partnerId is a User reference, so find Partner where createdBy = partnerId
          const partner = await Partner.findOne({ createdBy: claim.partnerId._id }).select('formData');
          if (partner && partner.formData) {
            // Extract bank details from formData
            const formData = partner.formData;
            const bankDetails = {
              accountNumber: formData.bankDetails?.accountNumber || formData.accountNumber || null,
              accountHolderName: formData.bankDetails?.accountHolderName || formData.bankDetails?.accountHolder || formData.accountHolderName || null,
              ifscCode: formData.bankDetails?.ifscCode || formData.bankDetails?.ifsc || formData.ifscCode || formData.ifsc || null,
              bankName: formData.bankDetails?.bankName || formData.bankName || null,
              branchName: formData.bankDetails?.branchName || formData.bankDetails?.branch || formData.branchName || formData.branch || null,
            };
            claimObj.partnerId = {
              ...claimObj.partnerId,
              bankDetails: Object.keys(bankDetails).some(key => bankDetails[key] !== null) ? bankDetails : null
            };
          }
        }
        return claimObj;
      })
    );

    res.status(200).json({
      success: true,
      count: claimsWithPartnerDetails.length,
      data: claimsWithPartnerDetails
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
