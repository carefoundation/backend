const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Volunteer = require('../models/Volunteer');
const Partner = require('../models/Partner');
const FormSubmission = require('../models/FormSubmission');
const Event = require('../models/Event');
const Coupon = require('../models/Coupon');

exports.getAdminDashboard = async (req, res) => {
  try {
    const [
      totalDonations,
      totalCampaigns,
      totalUsers,
      totalVolunteers,
      foodPartners,
      healthPartners,
      couponsGenerated,
      completedCampaigns,
      recentDonations,
      recentCampaigns,
      pendingSubmissions,
      activeCampaigns,
    ] = await Promise.all([
      Donation.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Campaign.countDocuments(),
      User.countDocuments(),
      Volunteer.countDocuments(),
      Partner.countDocuments({ type: 'food', status: 'approved' }),
      Partner.countDocuments({ type: 'health', status: 'approved' }),
      Coupon.countDocuments(),
      Campaign.countDocuments({ status: 'completed' }),
      Donation.find().populate('userId', 'name email').sort({ createdAt: -1 }).limit(10),
      Campaign.find().populate('createdBy', 'name').sort({ createdAt: -1 }).limit(10),
      FormSubmission.countDocuments({ status: 'new' }),
      Campaign.countDocuments({ status: 'active' }),
    ]);

    const stats = {
      totalUsers,
      activeCampaigns,
      totalDonations: totalDonations[0]?.total || 0,
      volunteersCount: totalVolunteers,
      foodPartners,
      healthPartners,
      couponsGenerated,
      completedCampaigns,
      // Additional stats for backward compatibility
      totalRaised: totalDonations[0]?.total || 0,
      totalCampaigns,
      totalVolunteers,
      totalPartners: foodPartners + healthPartners,
      pendingSubmissions,
    };

    res.status(200).json({
      success: true,
      data: {
        stats,
        recentDonations,
        recentCampaigns,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getCustomerDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      myDonations,
      myCampaigns,
      volunteerProfile,
      wallet,
    ] = await Promise.all([
      Donation.find({ userId }).populate('campaignId', 'title image').sort({ createdAt: -1 }).limit(10),
      Campaign.find({ createdBy: userId }).sort({ createdAt: -1 }).limit(10),
      Volunteer.findOne({ userId }).populate('certificates').populate('events'),
      require('../models/Wallet').findOne({ userId }),
    ]);

    const stats = {
      totalDonations: await Donation.countDocuments({ userId }),
      totalCampaigns: await Campaign.countDocuments({ createdBy: userId }),
      walletBalance: wallet?.balance || 0,
      volunteerHours: volunteerProfile?.totalHours || 0,
    };

    res.status(200).json({
      success: true,
      data: {
        stats,
        myDonations,
        myCampaigns,
        volunteerProfile,
        wallet,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getHomePageStats = async (req, res) => {
  try {
    const [
      totalRaised,
      totalDonors,
      totalCampaigns,
      successRate,
      urgentCampaigns,
      trendingCampaigns,
      healthPartners,
      foodPartners,
    ] = await Promise.all([
      Donation.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Donation.distinct('userId').then(ids => ids.filter(id => id !== null).length),
      Campaign.countDocuments({ status: 'active' }),
      Campaign.aggregate([
        { $match: { status: { $in: ['active', 'completed'] } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: {
                $cond: [
                  { $gte: ['$currentAmount', '$goalAmount'] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]),
      Campaign.find({ isUrgent: true, status: 'active' })
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .limit(6),
      Campaign.find({ status: 'active' })
        .populate('createdBy', 'name')
        .sort({ donors: -1, currentAmount: -1 })
        .limit(6),
      Partner.find({ type: 'health', status: 'approved' }).limit(6),
      Partner.find({ type: 'food', status: 'approved' }).limit(6),
    ]);

    const rate = successRate[0] ? Math.round((successRate[0].completed / successRate[0].total) * 100) : 98;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalRaised: totalRaised[0]?.total || 0,
          totalDonors,
          totalCampaigns,
          successRate: rate,
        },
        urgentCampaigns,
        trendingCampaigns,
        healthPartners,
        foodPartners,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

