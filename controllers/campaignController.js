const Campaign = require('../models/Campaign');
const User = require('../models/User');

exports.createCampaign = async (req, res) => {
  try {
    const {
      title,
      description,
      story,
      category,
      goalAmount,
      image,
      images,
      documents,
      location,
      endDate,
      isUrgent
    } = req.body;

    if (!title || !description || !category || !goalAmount) {
      return res.status(400).json({
        success: false,
        error: 'Please provide required fields: title, description, category, and goalAmount'
      });
    }

    const campaign = await Campaign.create({
      title,
      description,
      story: story || null,
      category,
      goalAmount: parseFloat(goalAmount),
      image: image || null,
      images: images || [],
      documents: documents || [],
      location: location || null,
      endDate: endDate || null,
      isUrgent: isUrgent || false,
      createdBy: req.user._id,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAllCampaigns = async (req, res) => {
  try {
    const { status, category, featured, isUrgent } = req.query;
    const query = {};

    // Allow public access to completed campaigns for success stories
    // For non-admin users, show active campaigns by default, but allow completed status
    if (!req.user || req.user.role !== 'admin') {
      if (status === 'completed') {
        query.status = 'completed';
      } else {
        query.status = 'active';
      }
    } else if (status) {
      query.status = status;
    }

    if (category) query.category = category;
    if (featured !== undefined) query.featured = featured === 'true';
    if (isUrgent !== undefined) query.isUrgent = isUrgent === 'true';

    // Sort by updatedAt for completed campaigns (latest first), otherwise by createdAt
    const sortOption = status === 'completed' 
      ? { updatedAt: -1, createdAt: -1 } 
      : { createdAt: -1 };

    const campaigns = await Campaign.find(query)
      .populate('createdBy', 'name email')
      .sort(sortOption);

    res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    // For non-admin users, only allow viewing approved/active campaigns
    if (!req.user || req.user.role !== 'admin') {
      if (campaign.status !== 'active') {
        return res.status(403).json({
          success: false,
          error: 'Campaign is not available'
        });
      }
    }

    campaign.views += 1;
    await campaign.save();

    res.status(200).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getMyCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.updateCampaign = async (req, res) => {
  try {
    let campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    if (campaign.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this campaign'
      });
    }

    // Manual validation for status if present
    if (req.body.status) {
      const allowedStatuses = ['pending', 'approved', 'rejected', 'active', 'completed', 'cancelled', 'paused'];
      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`
        });
      }
    }

    campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: false }
    );

    res.status(200).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    if (campaign.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this campaign'
      });
    }

    await Campaign.findByIdAndDelete(req.params.id);

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

exports.getUrgentCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      isUrgent: true,
      status: 'active'
    })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getTrendingCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      status: 'active'
    })
      .populate('createdBy', 'name')
      .sort({ donors: -1, currentAmount: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

