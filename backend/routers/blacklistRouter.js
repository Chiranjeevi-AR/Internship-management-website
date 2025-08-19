const express = require('express');
const blacklistController = require('../controllers/blacklistController');
const { identifier, authorizeDevice } = require('../middlewares/identification'); // Assuming identifier sets req.user

const router = express.Router();

// All routes here are for HR, so they need HR identification and authorization
router.use(identifier); // Ensures req.user is populated
// router.use(authorizeDevice); // If you have device authorization

// HR blacklists a candidate
router.post('/hr/blacklist', blacklistController.blacklistCandidate);

// HR unblacklists a candidate
router.post('/hr/unblacklist', blacklistController.unblacklistCandidate);

// HR gets candidates blacklisted by their company
router.get('/hr/blacklisted', blacklistController.getBlacklistedCandidatesByMyCompany);

module.exports = router;
