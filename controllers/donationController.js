const Donation = require('../models/Donation');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const DonationCoupon = require('../models/DonationCoupon');
const Partner = require('../models/Partner');
const generateCouponCode = require('../utils/generateCouponCode');
const { generateQRCode } = require('../utils/generateQRCode');
const mongoose = require('mongoose');

exports.createDonation = async (req, res) => {
  try {
    const { amount, firstName, lastName, email, phoneNumber, address, message, campaignId, partnerId, paymentMethod, status } = req.body;

    if (!amount || !firstName || !email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide required fields: amount, firstName, and email'
      });
    }

    if (parseFloat(amount) < 1) {
      return res.status(400).json({
        success: false,
        error: 'Minimum donation amount is ₹1'
      });
    }

    const userId = req.user ? req.user._id : null;

    // Validate campaignId - must be a valid ObjectId or null
    let validCampaignId = null;
    if (campaignId) {
      // Check if campaignId is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(campaignId) && !campaignId.toString().startsWith('partner-')) {
        validCampaignId = campaignId;
      } else {
        // Invalid ObjectId (e.g., "partner-xxx") - set to null
        validCampaignId = null;
      }
    }

    const donation = await Donation.create({
      amount: parseFloat(amount),
      firstName,
      lastName: lastName || null,
      email: email.toLowerCase(),
      phoneNumber: phoneNumber || null,
      address: address || null,
      message: message || null,
      userId: userId,
      campaignId: validCampaignId,
      paymentMethod: paymentMethod || 'razorpay',
      status: status || 'completed',
    });

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
                userId: userId,
                partnerId: partnerId,
                amount: parseFloat(amount),
                donationId: donation._id,
                paymentId: `payment_${Date.now()}`,
                status: 'active',
                expiryDate,
              });
            }
          }
        }
      } catch (error) {
        console.error('Coupon creation error:', error);
        // Don't fail the donation if coupon creation fails
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
      message: 'Donation submitted successfully',
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
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate('userId', 'name email')
      .populate('campaignId', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: donations.length,
      data: donations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getDonationById = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('campaignId', 'title');

    if (!donation) {
      return res.status(404).json({
        success: false,
        error: 'Donation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: donation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ userId: req.user._id })
      .populate('campaignId', 'title image')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: donations.length,
      data: donations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.updateDonation = async (req, res) => {
  try {
    const donation = await Donation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!donation) {
      return res.status(404).json({
        success: false,
        error: 'Donation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: donation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findByIdAndDelete(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        error: 'Donation not found'
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
