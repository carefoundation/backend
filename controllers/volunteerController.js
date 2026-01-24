const Volunteer = require('../models/Volunteer');
const User = require('../models/User');

exports.createVolunteer = async (req, res) => {
  try {
    const { name, email, phone, city, availability, interests, message, profileImage } = req.body;

    if (!name || !email || !phone || !city) {
      return res.status(400).json({
        success: false,
        error: 'Please provide required fields: name, email, phone, and city'
      });
    }

    let userId = null;
    if (req.user) {
      userId = req.user._id;
      const existingVolunteer = await Volunteer.findOne({ userId });
      if (existingVolunteer) {
        return res.status(400).json({
          success: false,
          error: 'You have already submitted a volunteer application'
        });
      }
    }

    const volunteer = await Volunteer.create({
      userId: userId,
      name,
      email: email.toLowerCase(),
      phone,
      city,
      availability: availability || null,
      interests: interests || null,
      message: message || null,
      profileImage: profileImage || null,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Volunteer application submitted successfully',
      data: volunteer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAllVolunteers = async (req, res) => {
  try {
    const { status, hasCertificate } = req.query;
    const query = {};

    if (status) query.status = status;
    
    // Filter for volunteers with certificates if requested
    if (hasCertificate === 'true') {
      query.certificates = { $exists: true, $not: { $size: 0 } };
    }

    const volunteers = await Volunteer.find(query)
      .populate('userId', 'name email mobileNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: volunteers.length,
      data: volunteers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getVolunteerById = async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id)
      .populate('userId', 'name email mobileNumber')
      .populate('certificates')
      .populate('events');

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        error: 'Volunteer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: volunteer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getMyVolunteerProfile = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id })
      .populate('certificates')
      .populate('events');

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        error: 'Volunteer profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: volunteer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.updateVolunteer = async (req, res) => {
  try {
    const volunteer = await Volunteer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        error: 'Volunteer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: volunteer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.deleteVolunteer = async (req, res) => {
  try {
    const volunteer = await Volunteer.findByIdAndDelete(req.params.id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        error: 'Volunteer not found'
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

