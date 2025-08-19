const express = require('express');
const router = express.Router();
const { identifier } = require('../middlewares/identification');
const { assignmentsUpload } = require('../utils/fileStorage');
const assignmentsController = require('../controllers/assignmentsController');

// All routes require authentication
router.use(identifier);

// Create new assignment with file upload
router.post('/', assignmentsUpload.single('assignment'), assignmentsController.createAssignment);

// Get assignments for a developer
router.get('/developer', assignmentsController.getDeveloperAssignments);

// Get assignments for an intern
router.get('/intern', assignmentsController.getInternAssignments);

// Get assignment submissions
router.get('/submissions', assignmentsController.getAssignmentSubmissions);

// Download assignment or submission file
router.get('/download/:assignmentId', assignmentsController.downloadFile);

// Provide feedback on submission
router.post('/:assignmentId/feedback', assignmentsController.provideFeedback);

// Delete assignment
router.delete('/:assignmentId', assignmentsController.deleteAssignment);

// Update assignment
router.put('/:assignmentId', assignmentsUpload.single('assignment'), assignmentsController.updateAssignment);

// Submit assignment (for interns)
router.post('/:assignmentId/submit', assignmentsUpload.single('submissionFile'), assignmentsController.submitAssignment);

module.exports = router;