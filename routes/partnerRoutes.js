const express = require('express');
const router = express.Router();
const partnerController = require('../controllers/partnerController');
const { protect, optionalAuth } = require('../middleware/auth');

router.post('/', optionalAuth, partnerController.createPartner);
router.get('/type/:type', optionalAuth, partnerController.getPartnersByType);
router.get('/:id', optionalAuth, partnerController.getPartnerById);
router.get('/', optionalAuth, partnerController.getAllPartners);
router.put('/:id', protect, partnerController.updatePartner);
router.patch('/:id/status', protect, partnerController.updatePartnerStatus);
router.delete('/:id', protect, partnerController.deletePartner);

module.exports = router;

