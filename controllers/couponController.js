const Coupon = require('../models/Coupon');
const DonationCoupon = require('../models/DonationCoupon');
const CouponClaim = require('../models/CouponClaim');
const User = require('../models/User');

exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      validFrom,
      validUntil,
      usageLimit,
      issuedTo
    } = req.body;

    if (!code || !discountType || !discountValue || !validFrom || !validUntil) {
      return res.status(400).json({
        success: false,
        error: 'Please provide required fields: code, discountType, discountValue, validFrom, and validUntil'
      });
    }

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        error: 'Coupon code already exists'
      });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      description: description || null,
      discountType,
      discountValue: parseFloat(discountValue),
      minPurchase: minPurchase || 0,
      maxDiscount: maxDiscount || null,
      validFrom,
      validUntil,
      usageLimit: usageLimit || null,
      issuedBy: req.user._id,
      issuedTo: issuedTo || null,
      status: 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAllCoupons = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status) query.status = status;

    // Fetch regular coupons
    const regularCoupons = await Coupon.find(query)
      .populate('issuedBy', 'name email')
      .populate('issuedTo', 'name email')
      .sort({ createdAt: -1 });

    // Fetch donation coupons
    const donationQuery = {};
    if (status) {
      if (status === 'redeemed') {
        donationQuery.status = 'used';
      } else {
        donationQuery.status = status;
      }
    }
    const donationCoupons = await DonationCoupon.find(donationQuery)
      .populate('userId', 'name email')
      .populate('partnerId', 'name email type')
      .populate('redeemedBy', 'name email')
      .sort({ createdAt: -1 });

    // Get claim information for donation coupons
    const donationCouponIds = donationCoupons.map(c => c._id);
    const claims = await CouponClaim.find({ couponId: { $in: donationCouponIds } })
      .populate('partnerId', 'name email')
      .populate('reviewedBy', 'name email')
      .populate('paidBy', 'name email')
      .sort({ createdAt: -1 });

    // Map claims to coupons
    const claimsMap = {};
    claims.forEach(claim => {
      const couponId = claim.couponId.toString();
      if (!claimsMap[couponId]) {
        claimsMap[couponId] = [];
      }
      claimsMap[couponId].push(claim);
    });

    // Format regular coupons
    const formattedRegularCoupons = regularCoupons.map(coupon => ({
      _id: coupon._id,
      code: coupon.code,
      couponCode: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      type: coupon.discountType,
      value: coupon.discountValue,
      status: coupon.status,
      issuedBy: coupon.issuedBy,
      issuedTo: coupon.issuedTo,
      userId: coupon.issuedTo,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      expiryDate: coupon.validUntil,
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt,
      couponType: 'regular',
      redeemedBy: null,
      redeemedAt: null,
      claims: []
    }));

    // Format donation coupons
    const formattedDonationCoupons = donationCoupons.map(coupon => ({
      _id: coupon._id,
      code: coupon.couponCode,
      couponCode: coupon.couponCode,
      discountType: 'fixed',
      discountValue: coupon.amount,
      type: 'fixed',
      value: coupon.amount,
      status: coupon.status === 'used' ? 'redeemed' : coupon.status,
      issuedBy: null,
      issuedTo: coupon.userId,
      userId: coupon.userId,
      validFrom: coupon.createdAt,
      validUntil: coupon.expiryDate,
      expiryDate: coupon.expiryDate,
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt,
      couponType: 'donation',
      redeemedBy: coupon.redeemedBy,
      redeemedAt: coupon.redeemedAt,
      partnerId: coupon.partnerId,
      claims: claimsMap[coupon._id.toString()] || []
    }));

    // Combine and sort by creation date
    const allCoupons = [...formattedRegularCoupons, ...formattedDonationCoupons]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      count: allCoupons.length,
      data: allCoupons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('issuedBy', 'name email')
      .populate('issuedTo', 'name email');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }

    res.status(200).json({
      success: true,
      data: coupon
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { code, amount } = req.body;

    if (!code || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Please provide coupon code and amount'
      });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Invalid coupon code'
      });
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return res.status(400).json({
        success: false,
        error: 'Coupon has expired or is not yet valid'
      });
    }

    if (coupon.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Coupon is not active'
      });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        error: 'Coupon usage limit reached'
      });
    }

    if (amount < coupon.minPurchase) {
      return res.status(400).json({
        success: false,
        error: `Minimum purchase amount is ₹${coupon.minPurchase}`
      });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (amount * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    res.status(200).json({
      success: true,
      data: {
        coupon,
        discount: Math.round(discount * 100) / 100,
        finalAmount: Math.round((amount - discount) * 100) / 100
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }

    res.status(200).json({
      success: true,
      data: coupon
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }

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

