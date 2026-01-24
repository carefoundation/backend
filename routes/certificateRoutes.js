const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { protect } = require('../middleware/auth');

router.post('/', protect, certificateController.createCertificate);
router.get('/me', protect, certificateController.getMyCertificates);
router.get('/', protect, certificateController.getAllCertificates);
router.get('/:id', protect, certificateController.getCertificateById);
router.put('/:id', protect, certificateController.updateCertificate);
router.delete('/:id', protect, certificateController.deleteCertificate);

module.exports = router;

