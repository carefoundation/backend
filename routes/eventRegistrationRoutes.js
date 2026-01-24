const express = require('express');
const router = express.Router();
const eventRegistrationController = require('../controllers/eventRegistrationController');
const { protect, optionalAuth } = require('../middleware/auth');

// Register for event (public, but can be authenticated)
router.post('/register', optionalAuth, eventRegistrationController.registerForEvent);

// Get registrations for a specific event (admin only)
router.get('/event/:eventId', protect, eventRegistrationController.getEventRegistrations);

// Get my registrations (authenticated users)
router.get('/my-registrations', protect, eventRegistrationController.getMyRegistrations);

module.exports = router;

