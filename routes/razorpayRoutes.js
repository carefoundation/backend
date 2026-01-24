const express = require('express');
const router = express.Router();
const razorpayController = require('../controllers/razorpayController');
const { protect, optionalAuth } = require('../middleware/auth');

// Create Razorpay order
router.post('/create-order', optionalAuth, razorpayController.createOrder);

// Verify payment
router.post('/verify-payment', optionalAuth, razorpayController.verifyPayment);

// Get payment status
router.get('/payment-status/:paymentId', protect, razorpayController.getPaymentStatus);

// Refund payment (admin only)
router.post('/refund', protect, razorpayController.refundPayment);

module.exports = router;

