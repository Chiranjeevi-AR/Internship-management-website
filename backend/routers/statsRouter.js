const express = require('express');
const router = express.Router();
const { getCompanyStats, getPlatformStats } = require('../controllers/statsController');
const { identifier, isAdmin } = require('../middlewares/identification');

// Route to get company-specific statistics
router.get('/company-overview', identifier, getCompanyStats);

// Route to get platform-wide statistics
router.get('/platform-overview', identifier, isAdmin, getPlatformStats);

module.exports = router;
