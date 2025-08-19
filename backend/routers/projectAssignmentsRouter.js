const express = require('express');
const projectAssignmentsController = require('../controllers/projectAssignmentsController');
const { identifier } = require('../middlewares/identification');
const router = express.Router();

// Dropdown routes for HR dashboard: get unassigned interns/developers for a project
router.get('/unassigned-interns/:projectId', identifier, projectAssignmentsController.getUnassignedInternsForProject);
router.get('/unassigned-developers/:projectId', identifier, projectAssignmentsController.getUnassignedDevelopersForProject);

// Routes for volunteering (developers and interns)
router.post('/volunteer', identifier, projectAssignmentsController.volunteerForProject);

// Routes for HR/admin to manage volunteers and assignments
router.get('/pending-volunteers', identifier, projectAssignmentsController.getPendingVolunteers);
router.put('/review-volunteer', identifier, projectAssignmentsController.reviewVolunteerRequest);
router.post('/assign-user', identifier, projectAssignmentsController.assignUserToProject);
router.delete('/remove-user', identifier, projectAssignmentsController.removeUserFromProject);
router.post('/initialize', identifier, projectAssignmentsController.initializeProjectAssignment);

// Routes for Panelist Management (HR/admin)
router.post('/panelist/volunteer', identifier, projectAssignmentsController.volunteerForPanelist); // Developer volunteers
router.put('/panelist/review-volunteer', identifier, projectAssignmentsController.reviewPanelistVolunteerRequest); // HR reviews
router.post('/panelist/assign', identifier, projectAssignmentsController.assignPanelist); // HR assigns specific dev
router.post('/panelist/assign-random', identifier, projectAssignmentsController.assignRandomPanelist); // HR assigns random dev
router.post('/panelist/remove', identifier, projectAssignmentsController.removePanelistFromProject); // HR removes a panelist

// Routes to view assignments
router.get('/all', identifier, projectAssignmentsController.getProjectAssignments);
router.get('/project/:projectId', identifier, projectAssignmentsController.getProjectAssignmentById);
router.get('/intern/:internId', identifier, projectAssignmentsController.getProjectAssignmentsByIntern);
router.get('/developer/:developerId', identifier, projectAssignmentsController.getProjectAssignmentsByDeveloper);

// --- NEW ROUTE ADDED HERE ---
// This new route allows fetching details for one specific project assignment by its own ID.
router.get('/:assignmentId', identifier, projectAssignmentsController.getProjectAssignmentByAssignmentId);

// Route for HR/Admin to manually notify all project members
router.post('/notify-members', identifier, projectAssignmentsController.notifyProjectMembersManually);

// Route for HR/Admin to manually notify all members of all their projects
router.post('/notify-all-projects-members', identifier, projectAssignmentsController.notifyAllProjectsMembersGlobally);

module.exports = router;
