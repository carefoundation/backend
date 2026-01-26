const Razorpay = require('razorpay');
const crypto = require('crypto');
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const DonationCoupon = require('../models/DonationCoupon');
const Partner = require('../models/Partner');
const generateCouponCode = require('../utils/generateCouponCode');
const { generateQRCode } = require('../utils/generateQRCode');

// Lazy initialization of Razorpay instance
let razorpay = null;

const getRazorpayInstance = () => {
  if (!razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file.');
    }
    
    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpay;
};

// Create order
exports.createOrder = async (req, res) => {
  try {
    const razorpayInstance = getRazorpayInstance();
    const { amount, currency = 'INR', receipt, notes = {} } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be at least ₹1'
      });
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes,
    };

    const order = await razorpayInstance.orders.create(options);

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      }
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment order'
    });
  }
};

// Verify payment and create donation
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      firstName,
      lastName,
      email,
      phoneNumber,
      campaignId,
      partnerId,
      message,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Payment verification data is missing'
      });
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed - Invalid signature'
      });
    }

    // Get payment details from Razorpay
    const razorpayInstance = getRazorpayInstance();
    const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);

    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return res.status(400).json({
        success: false,
        error: 'Payment not successful'
      });
    }

    // Validate campaignId if provided
    let validCampaignId = null;
    if (campaignId) {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(campaignId) && !campaignId.toString().startsWith('partner-')) {
        validCampaignId = campaignId;
      }
    }

    // Create donation record
    const donation = await Donation.create({
      amount: parseFloat(amount),
      firstName: firstName || 'Anonymous',
      lastName: lastName || null,
      email: email ? email.toLowerCase() : null,
      phoneNumber: phoneNumber || null,
      userId: req.user ? req.user._id : null,
      campaignId: validCampaignId,
      paymentId: razorpay_payment_id,
      paymentMethod: 'razorpay',
      status: 'completed',
      transactionId: razorpay_order_id,
      message: message || null,
    });

    // Update campaign if applicable
    if (validCampaignId) {
      await Campaign.findByIdAndUpdate(validCampaignId, {
        $inc: { currentAmount: parseFloat(amount), donors: 1 }
      });
    }

    // Create coupon if payment is for a partner (only if user is logged in)
    let coupon = null;
    if (partnerId) {
      // Check if user is logged in
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          success: false,
          error: 'Please login to create a coupon. Coupons can only be created for logged-in users.'
        });
      }

      try {
        const mongoose = require('mongoose');
        // Validate partnerId
        if (mongoose.Types.ObjectId.isValid(partnerId)) {
          const partner = await Partner.findById(partnerId);
          if (partner) {
            // Generate unique coupon code
            let couponCode;
            let isUnique = false;
            let attempts = 0;
            const maxAttempts = 10;

            while (!isUnique && attempts < maxAttempts) {
              couponCode = generateCouponCode();
              const existingCoupon = await DonationCoupon.findOne({ couponCode });
              if (!existingCoupon) {
                isUnique = true;
              }
              attempts++;
            }

            if (isUnique) {
              // Generate QR code
              const qrCode = await generateQRCode(couponCode);

              // Calculate expiry date (1 month from now)
              const expiryDate = new Date();
              expiryDate.setMonth(expiryDate.getMonth() + 1);

              // Create coupon
              coupon = await DonationCoupon.create({
                couponCode,
                qrCode,
                userId: req.user._id,
                partnerId: partnerId,
                amount: parseFloat(amount),
                donationId: donation._id,
                paymentId: razorpay_payment_id,
                status: 'active',
                expiryDate,
              });
            }
          }
        }
      } catch (error) {
        console.error('Coupon creation error:', error);
        // Don't fail the payment if coupon creation fails, but log it
      }
    }

    // Get partner name if coupon exists
    let partnerName = null;
    if (coupon && coupon.partnerId) {
      try {
        const partner = await Partner.findById(coupon.partnerId);
        if (partner) {
          partnerName = partner.name || partner.businessName;
        }
      } catch (error) {
        console.error('Error fetching partner:', error);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Payment verified and donation recorded successfully',
      data: {
        donation,
        coupon: coupon ? {
          id: coupon._id,
          couponCode: coupon.couponCode,
          qrCode: coupon.qrCode,
          amount: coupon.amount,
          expiryDate: coupon.expiryDate,
          partnerId: coupon.partnerId,
          partnerName: partnerName,
        } : null
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify payment'
    });
  }
};

// Get payment status
exports.getPaymentStatus = async (req, res) => {
  try {
    const razorpayInstance = getRazorpayInstance();
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment ID is required'
      });
    }

    const payment = await razorpayInstance.payments.fetch(paymentId);

    res.status(200).json({
      success: true,
      data: {
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount / 100, // Convert from paise to rupees
        currency: payment.currency,
        method: payment.method,
        createdAt: payment.created_at,
      }
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch payment status'
    });
  }
};

// Refund payment
exports.refundPayment = async (req, res) => {
  try {
    const razorpayInstance = getRazorpayInstance();
    const { paymentId, amount } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment ID is required'
      });
    }

    const refundData = {
      payment_id: paymentId,
    };

    if (amount) {
      refundData.amount = Math.round(amount * 100); // Convert to paise
    }

    const refund = await razorpayInstance.payments.refund(paymentId, refundData);

    // Update donation status
    await Donation.findOneAndUpdate(
      { paymentId: paymentId },
      { status: 'refunded' }
    );

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      }
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process refund'
    });
  }
};

