const express = require('express');
const router = express.Router();
const celebrityController = require('../controllers/celebrityController');
const { protect, optionalAuth } = require('../middleware/auth');

router.post('/', protect, celebrityController.createCelebrity);
router.get('/', optionalAuth, celebrityController.getAllCelebrities);
router.get('/:id', optionalAuth, celebrityController.getCelebrityById);
router.put('/:id', protect, celebrityController.updateCelebrity);
router.delete('/:id', protect, celebrityController.deleteCelebrity);

module.exports = router;

