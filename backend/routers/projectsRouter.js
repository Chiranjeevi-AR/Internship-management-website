const express = require('express');
const projectsController = require('../controllers/projectsController');
const { identifier } = require('../middlewares/identification');
const router = express.Router();

// Protected routes to view projects (company-restricted)
router.get('/all', identifier, projectsController.getAllProjects);
router.get('/available-for-intern', identifier, projectsController.getAvailableProjectsForIntern);
router.get('/available-for-developer', identifier, projectsController.getAvailableProjectsForDeveloper);
router.get('/pending', identifier, projectsController.getPendingProjects);
router.get('/page/:id', identifier, projectsController.getProjectsPaginated);
router.get('/:id', identifier, projectsController.getProjectById);

// Protected routes (admin, developer, hr only)
router.post('/add', identifier, projectsController.addProject);
router.put('/update/:id', identifier, projectsController.updateProject);
router.put('/approve/:id', identifier, projectsController.approveProject);
router.delete('/delete/:id', identifier, projectsController.deleteProject);

module.exports = router;
