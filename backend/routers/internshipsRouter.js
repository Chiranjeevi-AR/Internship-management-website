const express = require('express');
const internshipsController = require('../controllers/internshipsController');
const { identifier } = require('../middlewares/identification');
const router = express.Router();

// Public routes to view internships
router.get('/all', internshipsController.getAvailableInternships);
router.get('/front-page/:id', internshipsController.getAvailableInternshipsFrontPage);
router.get('/:id', internshipsController.getInternshipById);

// Route for org admins to get their company's internships (paginated, searchable)
router.get('/organization/my-internships', identifier, internshipsController.getOrgInternships);

// Protected route to add new internship (sysadmin or orgadmin)
router.post('/add', identifier, internshipsController.addInternship);
// Protected route to update internship (sysadmin or orgadmin for own company)
router.put('/update/:id', identifier, internshipsController.updateInternship);
// Protected route to delete internship (sysadmin or orgadmin for own company)
router.delete('/delete/:id', identifier, internshipsController.deleteInternship);

module.exports = router;
