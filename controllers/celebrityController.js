const Celebrity = require('../models/Celebrity');
const Campaign = require('../models/Campaign');

exports.createCelebrity = async (req, res) => {
  try {
    const { name, image, bio, profession, socialLinks, campaigns } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Please provide celebrity name'
      });
    }

    const celebrity = await Celebrity.create({
      name,
      image: image || null,
      bio: bio || null,
      profession: profession || null,
      socialLinks: socialLinks || {},
      campaigns: campaigns || [],
      status: 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Celebrity created successfully',
      data: celebrity
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAllCelebrities = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status) query.status = status;

    const celebrities = await Celebrity.find(query)
      .populate('campaigns', 'title image')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: celebrities.length,
      data: celebrities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getCelebrityById = async (req, res) => {
  try {
    const celebrity = await Celebrity.findById(req.params.id)
      .populate('campaigns', 'title image currentAmount goalAmount');

    if (!celebrity) {
      return res.status(404).json({
        success: false,
        error: 'Celebrity not found'
      });
    }

    res.status(200).json({
      success: true,
      data: celebrity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.updateCelebrity = async (req, res) => {
  try {
    const celebrity = await Celebrity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!celebrity) {
      return res.status(404).json({
        success: false,
        error: 'Celebrity not found'
      });
    }

    res.status(200).json({
      success: true,
      data: celebrity
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.deleteCelebrity = async (req, res) => {
  try {
    const celebrity = await Celebrity.findByIdAndDelete(req.params.id);

    if (!celebrity) {
      return res.status(404).json({
        success: false,
        error: 'Celebrity not found'
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

