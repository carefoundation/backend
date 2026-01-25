const express = require('express');
const router = express.Router();
const volunteerController = require('../controllers/volunteerController');
const { protect, optionalAuth } = require('../middleware/auth');

router.post('/', optionalAuth, volunteerController.createVolunteer);
router.get('/me', protect, volunteerController.getMyVolunteerProfile);
router.get('/verify/:id', optionalAuth, volunteerController.getVolunteerById); // Public verification endpoint
router.get('/:id', protect, volunteerController.getVolunteerById);
router.get('/', optionalAuth, volunteerController.getAllVolunteers);
router.put('/:id', protect, volunteerController.updateVolunteer);
router.delete('/:id', protect, volunteerController.deleteVolunteer);

module.exports = router;

