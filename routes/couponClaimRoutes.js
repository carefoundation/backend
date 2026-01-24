const express = require('express');
const router = express.Router();
const couponClaimController = require('../controllers/couponClaimController');
const { protect, authorize } = require('../middleware/auth');

// Partner routes
router.post('/claim', protect, couponClaimController.claimCoupon);
router.get('/my-claims', protect, couponClaimController.getMyClaims);

// Admin routes
router.get('/pending', protect, authorize('admin'), couponClaimController.getPendingClaims);
router.put('/:id/approve', protect, authorize('admin'), couponClaimController.approveClaim);
router.put('/:id/reject', protect, authorize('admin'), couponClaimController.rejectClaim);

module.exports = router;
