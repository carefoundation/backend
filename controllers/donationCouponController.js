const DonationCoupon = require('../models/DonationCoupon');
const Partner = require('../models/Partner');

// Get user's donation coupons
exports.getMyDonationCoupons = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    const coupons = await DonationCoupon.find({ userId })
      .populate('partnerId', 'name email type')
      .sort({ createdAt: -1 });

    // Update expired coupons
    const now = new Date();
    for (const coupon of coupons) {
      if (coupon.status === 'active' && coupon.isExpired()) {
        coupon.status = 'expired';
        await coupon.save();
      }
    }

    // Get fresh data after updates
    const updatedCoupons = await DonationCoupon.find({ userId })
      .populate('partnerId', 'name email type')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: updatedCoupons,
      count: updatedCoupons.length,
    });
  } catch (error) {
    console.error('Get donation coupons error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching donation coupons',
      message: error.message
    });
  }
};

// Get a specific donation coupon by ID
exports.getDonationCouponById = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const coupon = await DonationCoupon.findOne({
      _id: req.params.id,
      userId
    }).populate('partnerId', 'name email type');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }

    // Check if expired
    if (coupon.status === 'active' && coupon.isExpired()) {
      coupon.status = 'expired';
      await coupon.save();
    }

    res.json({
      success: true,
      data: coupon
    });
  } catch (error) {
    console.error('Get donation coupon error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching donation coupon',
      message: error.message
    });
  }
};

