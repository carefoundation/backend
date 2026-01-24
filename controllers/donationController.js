const Donation = require('../models/Donation');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const mongoose = require('mongoose');

exports.createDonation = async (req, res) => {
  try {
    const { amount, firstName, lastName, email, phoneNumber, address, message, campaignId, paymentMethod, status } = req.body;

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

    res.status(201).json({
      success: true,
      message: 'Donation submitted successfully',
      data: donation
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
