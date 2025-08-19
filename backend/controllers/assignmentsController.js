const Assignment = require('../models/assignmentsModel');
const ProjectAssignment = require('../models/projectAssignmentsModel');
const path = require('path');
const fs = require('fs');

// Create a new assignment
exports.createAssignment = async (req, res) => {
    try {
        // Verify user is a developer/mentor
        if (req.user.type !== 'developer') {
            return res.status(403).json({
                success: false,
                message: 'Only developers can create assignments'
            });
        }        // File upload is optional
        let fileUrl = null;
        let fileName = null;
        let fileType = null;

        if (req.file) {
            const file = req.file;
            fileType = file.originalname.split('.').pop().toLowerCase();
            
            // Validate file type if file is provided
            if (!['pdf', 'doc', 'docx'].includes(fileType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Only PDF and DOC files are allowed'
                });
            }

            // File is already saved by multer, get the file path
            fileUrl = file.path;
            fileName = file.originalname;
        }

        // Create assignment
        const assignment = new Assignment({
            title: req.body.title,
            description: req.body.description,
            projectId: req.body.projectId,
            uploadedBy: req.user.userId,
            assignedTo: req.body.internId,
            fileUrl: fileUrl,
            fileName: fileName,
            fileType: fileType,
            dueDate: new Date(req.body.dueDate)
        });

        await assignment.save();

        res.status(201).json({
            success: true,
            message: 'Assignment created successfully',
            data: assignment
        });
    } catch (error) {
        console.error('Error creating assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating assignment'
        });
    }
};

// Get assignments for a developer
exports.getDeveloperAssignments = async (req, res) => {
    try {
        const assignments = await Assignment.find({ uploadedBy: req.user.userId })
            .populate('assignedTo', 'name email')
            .populate('projectId', 'name')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            data: assignments
        });
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching assignments'
        });
    }
};

// Get assignment submissions for a developer
exports.getAssignmentSubmissions = async (req, res) => {
    try {
        const assignments = await Assignment.find({
            uploadedBy: req.user.userId,
            $or: [
                { 'submission.replyText': { $exists: true, $ne: '' } },
                { 'submission.fileUrl': { $exists: true } }
            ]
        })
            .populate('assignedTo', 'name email')
            .populate('projectId', 'name')
            .sort('-submission.submittedAt');

        res.status(200).json({
            success: true,
            data: assignments
        });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching submissions'
        });
    }
};

// Download assignment or submission
exports.downloadFile = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.assignmentId);
        
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Check if user has permission
        if (req.user.userId !== assignment.uploadedBy.toString() && 
            req.user.userId !== assignment.assignedTo.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to download this file'
            });
        }

        // Determine which file to download
        const fileUrl = req.query.type === 'submission' ? 
            assignment.submission?.fileUrl : 
            assignment.fileUrl;
        
        const fileName = req.query.type === 'submission' ?
            assignment.submission?.fileName || assignment.fileName :
            assignment.fileName;
        
        if (!fileUrl) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Get the absolute file path - handle both relative and absolute paths
        let filePath;
        if (path.isAbsolute(fileUrl)) {
            filePath = fileUrl;
        } else {
            // If it's a relative path, resolve it from the backend directory
            filePath = path.resolve(__dirname, '..', fileUrl);
        }
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found on server'
            });
        }

        const stats = fs.statSync(filePath);

        const fileType = req.query.type === 'submission' ? 
            (assignment.submission?.fileType || assignment.fileType) : 
            assignment.fileType;
        
        // Set content type based on stored file type
        let contentType = 'application/octet-stream';
        
        switch (fileType) {
            case 'pdf':
                contentType = 'application/pdf';
                break;
            case 'doc':
                contentType = 'application/msword';
                break;
            case 'docx':
                contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                break;
            default:
                contentType = 'application/octet-stream';
        }

        // Always use the correct extension based on fileType
        const fileExtension = '.' + fileType;
        let downloadFileName;
        
        if (fileName && path.extname(fileName).toLowerCase() === fileExtension.toLowerCase()) {
            // Filename already has correct extension
            downloadFileName = fileName;
        } else {
            // Create filename with correct extension
            const baseFileName = fileName ? path.parse(fileName).name : 'assignment';
            downloadFileName = baseFileName + fileExtension;
        }
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Cache-Control', 'no-cache');
        
        const fileStream = fs.createReadStream(filePath);
        fileStream.on('error', (error) => {
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Error reading file'
                });
            }
        });
        
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error downloading file:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Error downloading file'
            });
        }
    }
};

// Provide feedback on submission
exports.provideFeedback = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.assignmentId);
        
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Verify user is the assignment creator
        if (req.user.userId !== assignment.uploadedBy.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only the assignment creator can provide feedback'
            });
        }

        // Update feedback and grade
        assignment.submission.feedback = req.body.feedback;
        assignment.submission.grade = req.body.grade;
        assignment.status = 'reviewed';

        await assignment.save();

        res.status(200).json({
            success: true,
            message: 'Feedback provided successfully',
            data: assignment
        });
    } catch (error) {
        console.error('Error providing feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Error providing feedback'
        });
    }
};

// Get assignments for an intern
exports.getInternAssignments = async (req, res) => {
    try {
        const assignments = await Assignment.find({ assignedTo: req.user.userId })
            .populate('uploadedBy', 'name email')
            .populate('projectId', 'name')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            data: assignments
        });
    } catch (error) {
        console.error('Error fetching intern assignments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching assignments'
        });
    }
};

// Update an assignment
exports.updateAssignment = async (req, res) => {
    try {
        const assignmentId = req.params.assignmentId;
        
        // Find the assignment first
        const assignment = await Assignment.findById(assignmentId);
        
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }
        
        // Verify that the user is the one who created the assignment
        if (assignment.uploadedBy.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only update assignments you created'
            });
        }
        
        // Update assignment fields
        if (req.body.title) assignment.title = req.body.title;
        if (req.body.description) assignment.description = req.body.description;
        if (req.body.projectId) assignment.projectId = req.body.projectId;
        if (req.body.internId) assignment.assignedTo = req.body.internId;
        if (req.body.dueDate) assignment.dueDate = new Date(req.body.dueDate);
        
        // Handle file update if new file is uploaded
        if (req.file) {
            const file = req.file;
            const fileType = file.originalname.split('.').pop().toLowerCase();
            
            // Validate file type
            if (!['pdf', 'doc', 'docx'].includes(fileType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Only PDF and DOC files are allowed'
                });
            }
            
            // Delete old file if it exists
            if (assignment.fileUrl && fs.existsSync(assignment.fileUrl)) {
                try {
                    fs.unlinkSync(assignment.fileUrl);
                } catch (fileError) {
                    console.error('Error deleting old file:', fileError);
                }
            }
            
            // Update file information
            assignment.fileUrl = file.path;
            assignment.fileName = file.originalname;
            assignment.fileType = fileType;
        }
        
        await assignment.save();
        
        // Populate the response with related data
        const updatedAssignment = await Assignment.findById(assignmentId)
            .populate('assignedTo', 'name email')
            .populate('projectId', 'name');
        
        res.status(200).json({
            success: true,
            message: 'Assignment updated successfully',
            data: updatedAssignment
        });
        
    } catch (error) {
        console.error('Error updating assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating assignment'
        });
    }
};

// Delete an assignment
exports.deleteAssignment = async (req, res) => {
    try {
        const assignmentId = req.params.assignmentId;
        
        // Find the assignment first
        const assignment = await Assignment.findById(assignmentId);
        
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }
        
        // Verify that the user is the one who created the assignment
        if (assignment.uploadedBy.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete assignments you created'
            });
        }
        
        // Delete the file from storage if it exists
        if (assignment.fileUrl && fs.existsSync(assignment.fileUrl)) {
            try {
                fs.unlinkSync(assignment.fileUrl);
            } catch (fileError) {
                console.error('Error deleting file:', fileError);
                // Don't fail the deletion if file removal fails
            }
        }
        
        // Delete the assignment from database
        await Assignment.findByIdAndDelete(assignmentId);
        
        res.status(200).json({
            success: true,
            message: 'Assignment deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting assignment'
        });
    }
};

// Submit assignment (for interns)
exports.submitAssignment = async (req, res) => {
    try {
        const assignmentId = req.params.assignmentId;
        
        // Find the assignment
        const assignment = await Assignment.findById(assignmentId);
        
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }
        
        // Verify that the user is the one assigned to this assignment
        if (assignment.assignedTo.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only submit assignments assigned to you'
            });
        }
        
        // Check if assignment is already submitted
        if (assignment.status === 'submitted' || assignment.status === 'reviewed') {
            return res.status(400).json({
                success: false,
                message: 'Assignment has already been submitted'
            });
        }
        
        // Check if submission is late
        const currentDate = new Date();
        const isLate = currentDate > assignment.dueDate;
        
        // Initialize submission object
        assignment.submission = {
            replyText: req.body.replyText || '',
            submittedAt: currentDate,
            submittedLate: isLate
        };
        
        // Handle file upload if provided
        if (req.file) {
            const file = req.file;
            const fileType = file.originalname.split('.').pop().toLowerCase();
            
            // Validate file type
            if (!['pdf', 'doc', 'docx', 'txt', 'zip', 'rar'].includes(fileType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Only PDF, DOC, DOCX, TXT, ZIP, and RAR files are allowed'
                });
            }
            
            // Add file information to submission
            assignment.submission.fileUrl = file.path;
            assignment.submission.fileName = file.originalname;
            assignment.submission.fileType = fileType;
        }
        
        // Update assignment status
        assignment.status = 'submitted';
        
        await assignment.save();
        
        // Populate the response with related data
        const submittedAssignment = await Assignment.findById(assignmentId)
            .populate('uploadedBy', 'name email')
            .populate('projectId', 'name');
        
        res.status(200).json({
            success: true,
            message: 'Assignment submitted successfully',
            data: submittedAssignment
        });
        
    } catch (error) {
        console.error('Error submitting assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting assignment'
        });
    }
};