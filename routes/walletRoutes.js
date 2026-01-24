const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

router.get('/me', protect, walletController.getMyWallet);
router.post('/transaction', protect, walletController.addTransaction);
router.post('/withdraw', protect, walletController.withdraw);
router.get('/', protect, walletController.getAllWallets);

module.exports = router;

