const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { protect, optionalAuth } = require('../middleware/auth');

router.post('/', protect, couponController.createCoupon);
router.post('/validate', optionalAuth, couponController.validateCoupon);
router.get('/', protect, couponController.getAllCoupons);
router.get('/:id', protect, couponController.getCouponById);
router.put('/:id', protect, couponController.updateCoupon);
router.delete('/:id', protect, couponController.deleteCoupon);

module.exports = router;

