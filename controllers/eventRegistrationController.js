const EventRegistration = require('../models/EventRegistration');
const Event = require('../models/Event');

exports.registerForEvent = async (req, res) => {
  try {
    const { eventId, fullName, email, mobileNumber, city } = req.body;

    if (!eventId || !fullName || !email || !mobileNumber || !city) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields: eventId, fullName, email, mobileNumber, and city'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Get userId if user is logged in
    const userId = req.user ? req.user._id : null;

    // Check if already registered
    const existingRegistration = await EventRegistration.findOne({
      eventId: eventId,
      email: email.toLowerCase()
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        error: 'You are already registered for this event'
      });
    }

    // Create registration
    const registration = await EventRegistration.create({
      eventId: eventId,
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      mobileNumber: mobileNumber.trim(),
      city: city.trim(),
      userId: userId,
      status: 'registered',
    });

    // Update event attendees count
    await Event.findByIdAndUpdate(eventId, {
      $inc: { attendees: 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Successfully registered for event',
      data: registration
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'You are already registered for this event'
      });
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to register for event'
    });
  }
};

exports.getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;

    const registrations = await EventRegistration.find({ eventId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch registrations'
    });
  }
};

exports.getMyRegistrations = async (req, res) => {
  try {
    const userId = req.user._id;

    const registrations = await EventRegistration.find({ userId })
      .populate('eventId', 'title startDate endDate location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch registrations'
    });
  }
};

