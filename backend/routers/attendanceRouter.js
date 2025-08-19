const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { identifier } = require('../middlewares/identification');

// Intern routes
router.post('/check-in', identifier, attendanceController.checkIn);
router.post('/check-out', identifier, attendanceController.checkOut);
router.get('/my', identifier, attendanceController.getMyAttendance);

// Developer routes (to be implemented)
router.get('/assigned', identifier, attendanceController.getAssignedInternsAttendance);

// Admin routes (to be implemented)
router.get('/all', identifier, attendanceController.getAllAttendance);
router.put('/:id/status', identifier, attendanceController.updateAttendanceStatus);

module.exports = router;
