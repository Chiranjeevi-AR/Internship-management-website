const LeaveManagement = require('../models/leaveManagementModel');

// Submit a leave request
exports.submitLeaveRequest = async (req, res) => {
    try {
        const { startDate, endDate, reason } = req.body;
        const userId = req.user.userId;

        const leaveRequest = new LeaveManagement({
            userId,
            startDate,
            endDate,
            reason,
            status: 'pending'
        });

        await leaveRequest.save();

        res.status(201).json({
            success: true,
            message: 'Leave request submitted successfully',
            data: leaveRequest
        });
    } catch (error) {
        console.error('Error submitting leave request:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Get leave requests for the logged-in user
exports.getMyLeaveRequests = async (req, res) => {
    try {
        const userId = req.user.userId;

        const leaveRequests = await LeaveManagement.find({ userId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Leave requests retrieved successfully',
            data: leaveRequests
        });
    } catch (error) {
        console.error('Error getting leave requests:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Get leave requests for approval (for mentors/HR)
exports.getPendingLeaveRequests = async (req, res) => {
    try {
        // Only mentors and HR can view pending requests
        if (!['developer', 'hr'].includes(req.user.type)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Only mentors and HR can view pending leave requests'
            });
        }

        const leaveRequests = await LeaveManagement.find({
            status: 'pending',
            company: req.user.company
        })
        .populate('userId', 'name email type')
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Pending leave requests retrieved successfully',
            data: leaveRequests
        });
    } catch (error) {
        console.error('Error getting pending leave requests:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Approve/Reject a leave request
exports.updateLeaveRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, comment } = req.body;

        // Only mentors and HR can update leave requests
        if (!['developer', 'hr'].includes(req.user.type)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Only mentors and HR can update leave requests'
            });
        }

        const leaveRequest = await LeaveManagement.findById(requestId);

        if (!leaveRequest) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found'
            });
        }

        // Check if the user is from the same company
        if (leaveRequest.company !== req.user.company) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: You can only update leave requests from your company'
            });
        }

        leaveRequest.status = status;
        leaveRequest.comment = comment;
        leaveRequest.reviewedBy = req.user.userId;
        leaveRequest.reviewedAt = new Date();

        await leaveRequest.save();

        res.status(200).json({
            success: true,
            message: 'Leave request updated successfully',
            data: leaveRequest
        });
    } catch (error) {
        console.error('Error updating leave request:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
