const express = require('express');
const router = express.Router();
const formSubmissionController = require('../controllers/formSubmissionController');
const { protect } = require('../middleware/auth');

router.post('/', formSubmissionController.createFormSubmission);
router.get('/', protect, formSubmissionController.getAllSubmissions);
router.get('/:id', protect, formSubmissionController.getSubmissionById);
router.put('/:id', protect, formSubmissionController.updateSubmission);
router.post('/:id/reply', protect, formSubmissionController.replyToSubmission);
router.delete('/:id', protect, formSubmissionController.deleteSubmission);

module.exports = router;

