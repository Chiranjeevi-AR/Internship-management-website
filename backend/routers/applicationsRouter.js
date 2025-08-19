const express = require('express');
const applicationsController = require('../controllers/applicationsController');
const { identifier } = require('../middlewares/identification'); // Import identifier middleware
const router = express.Router();

// candidate can apply with file upload
router.post('/apply', identifier,applicationsController.uploadResume, applicationsController.applyToInternship);

// admin can view all applications
router.get('/all', identifier, applicationsController.getAllApplications);

// admin can download resume
router.get('/resume/:applicationId', identifier, applicationsController.downloadResume);

// admin can update application status
router.patch('/status/:applicationId', identifier, applicationsController.updateApplicationStatus);

// --- HR Routes for Applications ---
// HR can view applications for their company's internships
router.get('/hr/view', identifier, applicationsController.getApplicationsForHr);

// HR can download resume for an application to their company's internship
router.get('/hr/resume/:applicationId', identifier, applicationsController.downloadResumeForHr);

// HR can update application status for their company's internship applications
router.patch('/hr/status/:applicationId', identifier, applicationsController.updateApplicationStatusForHr);

// HR can delete a processed application record for their company
router.delete('/hr/delete/:applicationId', identifier, applicationsController.deleteApplicationForHr);

// Candidate can get IDs of internships they applied to
router.get('/candidate/:userId/applied-ids', identifier, applicationsController.getAppliedInternshipIdsForCandidate);

// Candidate can get their own applications
router.get('/my-applications', identifier, applicationsController.getMyApplications);

// Candidate can accept a company offer and become an intern
router.post('/accept-offer/:applicationId', identifier, applicationsController.acceptOffer);

module.exports = router;