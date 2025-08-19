const express = require('express');
const authController = require('../controllers/authController');
const { identifier } = require('../middlewares/identification');
const router = express.Router();

router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.post('/signout', identifier, authController.signout);
router.post('/refresh-token', identifier, authController.refreshToken);
router.get('/me', identifier, authController.getCurrentUser);

router.patch('/send-verification-code',authController.sendVerificationCode);
router.patch('/verify-verification-code',authController.verifyVerificationCode);
router.patch('/change-password', identifier, authController.changePassword);
router.patch('/send-forgot-password-code',authController.sendForgotPasswordCode);
router.patch('/verify-forgot-password-code',authController.verifyForgotPasswordCode);

// Approval routes
router.get('/pending-users', identifier, authController.getPendingUsers);
router.patch('/approve-user/:userId', identifier, authController.approveUser);
router.delete('/reject-user/:userId', identifier, authController.rejectUser);

// Route to get assignable users (interns/developers) for a company (for HR/Admin)
router.get('/company-assignable-users', identifier, authController.getCompanyAssignableUsers);

// Public route to get all registered companies (for developer sign-up dropdown)
router.get('/registered-companies', authController.getRegisteredCompanies);
// Public route to get all companies (for developer sign-up dropdown)
router.get('/all-companies', authController.getAllCompanies);

// Admin route to register a new company
router.post('/register-company', identifier, authController.registerCompany);

module.exports = router;
