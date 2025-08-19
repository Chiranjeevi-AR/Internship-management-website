const express = require('express');
const router = express.Router();
const leaveManagementController = require('../controllers/leaveManagementController');
const { identifier } = require('../middlewares/identification');

// All routes require authentication
router.use(identifier);

// Submit a leave request
router.post('/', leaveManagementController.submitLeaveRequest);

// Get leave requests for the logged-in user
router.get('/my-requests', leaveManagementController.getMyLeaveRequests);

// Get leave requests for approval (for mentors/HR)
router.get('/pending-requests', leaveManagementController.getPendingLeaveRequests);

// Approve/Reject a leave request
router.put('/:requestId', leaveManagementController.updateLeaveRequest);

module.exports = router;
