const express = require('express');
const router = express.Router();
const internAssignmentsController = require('../controllers/internAssignmentsController');
const { identifier } = require('../middlewares/identification');

// All routes require authentication
router.use(identifier);

// Assign an intern to a developer
router.post('/assign', internAssignmentsController.assignInternToDeveloper);

// Get all interns assigned to a developer
router.get('/developer/:developerId', internAssignmentsController.getAssignedInterns);

// Remove an intern assignment
router.delete('/:projectId/intern/:internId', internAssignmentsController.removeInternAssignment);

module.exports = router; 