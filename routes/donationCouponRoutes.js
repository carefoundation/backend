const express = require('express');
const router = express.Router();
const donationCouponController = require('../controllers/donationCouponController');
const { protect } = require('../middleware/auth');

// Get user's donation coupons
router.get('/my-coupons', protect, donationCouponController.getMyDonationCoupons);

// Get specific donation coupon by ID
router.get('/:id', protect, donationCouponController.getDonationCouponById);

module.exports = router;

