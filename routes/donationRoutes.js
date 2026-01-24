const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const { protect, optionalAuth } = require('../middleware/auth');

router.post('/', optionalAuth, donationController.createDonation);
router.get('/me', protect, donationController.getMyDonations);
router.get('/', protect, donationController.getAllDonations);
router.get('/:id', protect, donationController.getDonationById);
router.put('/:id', protect, donationController.updateDonation);
router.delete('/:id', protect, donationController.deleteDonation);

module.exports = router;
