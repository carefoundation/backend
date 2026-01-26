const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const donationRoutes = require('./donationRoutes');
const campaignRoutes = require('./campaignRoutes');
const partnerRoutes = require('./partnerRoutes');
const volunteerRoutes = require('./volunteerRoutes');
const formSubmissionRoutes = require('./formSubmissionRoutes');
const eventRoutes = require('./eventRoutes');
const blogRoutes = require('./blogRoutes');
const productRoutes = require('./productRoutes');
const couponRoutes = require('./couponRoutes');
const couponClaimRoutes = require('./couponClaimRoutes');
const donationCouponRoutes = require('./donationCouponRoutes');
const walletRoutes = require('./walletRoutes');
const certificateRoutes = require('./certificateRoutes');
const celebrityRoutes = require('./celebrityRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const testRoutes = require('./testRoutes');
const razorpayRoutes = require('./razorpayRoutes');
const eventRegistrationRoutes = require('./eventRegistrationRoutes');
const uploadRoutes = require('./uploadRoutes');

router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/donations', donationRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/partners', partnerRoutes);
router.use('/volunteers', volunteerRoutes);
router.use('/form-submissions', formSubmissionRoutes);
router.use('/events', eventRoutes);
router.use('/blogs', blogRoutes);
router.use('/products', productRoutes);
router.use('/coupons', couponRoutes);
router.use('/coupon-claims', couponClaimRoutes);
router.use('/donation-coupons', donationCouponRoutes);
router.use('/wallets', walletRoutes);
router.use('/certificates', certificateRoutes);
router.use('/celebrities', celebrityRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/razorpay', razorpayRoutes);
router.use('/event-registrations', eventRegistrationRoutes);
router.use('/upload', uploadRoutes);
router.use('/', testRoutes);

router.get('/', (req, res) => {
  res.json({ message: 'API is working' });
});

module.exports = router;


