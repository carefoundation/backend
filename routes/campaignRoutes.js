const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { protect, optionalAuth } = require('../middleware/auth');

router.post('/', protect, campaignController.createCampaign);
router.get('/urgent', optionalAuth, campaignController.getUrgentCampaigns);
router.get('/trending', optionalAuth, campaignController.getTrendingCampaigns);
router.get('/me', protect, campaignController.getMyCampaigns);
router.get('/:id', optionalAuth, campaignController.getCampaignById);
router.get('/', optionalAuth, campaignController.getAllCampaigns);
router.put('/:id', protect, campaignController.updateCampaign);
router.delete('/:id', protect, campaignController.deleteCampaign);

module.exports = router;

