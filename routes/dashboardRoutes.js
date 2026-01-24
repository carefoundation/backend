const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/admin', protect, dashboardController.getAdminDashboard);
router.get('/customer', protect, dashboardController.getCustomerDashboard);
router.get('/home', optionalAuth, dashboardController.getHomePageStats);

module.exports = router;

