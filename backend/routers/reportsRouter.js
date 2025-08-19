const express = require('express');
const router = express.Router();
const { identifier } = require('../middlewares/identification');
const { reportsUpload } = require('../utils/fileStorage');
const {
  submitReport,
  getInternReports,
  getMentorReports,
  downloadReport,
  updateReportFeedback
} = require('../controllers/reportsController');

// Apply authentication middleware to all routes
router.use(identifier);

// Routes for report submission and management
router.post('/submit', reportsUpload.single('reportFile'), submitReport);
router.get('/intern', getInternReports);
router.get('/mentor', getMentorReports);
router.get('/download/:reportId', downloadReport);
router.patch('/:reportId/feedback', updateReportFeedback);

module.exports = router; 