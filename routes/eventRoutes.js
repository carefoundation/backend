const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect, optionalAuth } = require('../middleware/auth');

router.post('/', protect, eventController.createEvent);
router.get('/', optionalAuth, eventController.getAllEvents);
router.get('/:id', optionalAuth, eventController.getEventById);
router.put('/:id', protect, eventController.updateEvent);
router.delete('/:id', protect, eventController.deleteEvent);

module.exports = router;

