const Event = require('../models/Event');
const User = require('../models/User');

exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      image,
      images,
      startDate,
      endDate,
      location,
      address,
      city,
      state,
      latitude,
      longitude,
      category,
      expectedAttendees,
      time
    } = req.body;

    if (!title || !description || !startDate || !endDate || !location) {
      return res.status(400).json({
        success: false,
        error: 'Please provide required fields: title, description, startDate, endDate, and location'
      });
    }

    const event = await Event.create({
      title,
      description,
      image: image || null,
      images: images || [],
      startDate,
      endDate,
      location,
      address: address || null,
      city: city || null,
      state: state || null,
      latitude: latitude || null,
      longitude: longitude || null,
      category: category || null,
      expectedAttendees: expectedAttendees ? parseInt(expectedAttendees) : 0,
      time: time || null,
      createdBy: req.user._id,
      status: 'upcoming',
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const { status, category } = req.query;
    const query = {};

    // For non-admin users, only show approved/upcoming events
    if (!req.user || req.user.role !== 'admin') {
      query.status = { $in: ['upcoming', 'ongoing'] };
    } else if (status) {
      query.status = status;
    }

    if (category) query.category = category;

    const events = await Event.find(query)
      .populate('createdBy', 'name email')
      .populate('volunteers', 'name email')
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('volunteers', 'name email phone');

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
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

