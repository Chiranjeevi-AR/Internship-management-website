const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const ProjectAssignment = require('../models/projectAssignmentsModel');

exports.getMessages = async (req, res) => {
    try {
        const { projectAssignmentId } = req.params;
        const { userId, type } = req.user;

        console.log('Chat getMessages called:', {
            projectAssignmentId,
            userId,
            type,
            company: req.user.company
        });

        // Security Check: Verify the user is part of this project assignment
        const assignment = await ProjectAssignment.findById(projectAssignmentId);
        if (!assignment) {
            console.log('Assignment not found:', projectAssignmentId);
            return res.status(404).json({ success: false, message: "Project assignment not found." });
        }

        console.log('Assignment found:', {
            assignmentId: assignment._id,
            company: assignment.company,
            projectId: assignment.projectId
        });

        // Robust ID comparison: always compare as strings
        const isParticipant = 
            assignment.assignedInterns.some(i => i.userId.toString() === userId.toString()) ||
            assignment.assignedDevelopers.some(d => d.userId.toString() === userId.toString()) ||
            assignment.panelists.some(p => p.userId.toString() === userId.toString()) ||
            ['hr', 'admin'].includes(type);

        console.log('Participant check:', {
            isParticipant,
            userType: type,
            assignedInterns: assignment.assignedInterns.length,
            assignedDevelopers: assignment.assignedDevelopers.length,
            panelists: assignment.panelists.length,
            isHrOrAdmin: ['hr', 'admin'].includes(type)
        });

        // Additional company check for hr users
        if (type === 'hr' && assignment.company !== req.user.company) {
            console.log('Company mismatch for HR user:', {
                assignmentCompany: assignment.company,
                userCompany: req.user.company
            });
            return res.status(403).json({ success: false, message: "You can only access chat for projects from your own company." });
        }

        if (!isParticipant) {
            console.log('User is not a participant in this project chat');
            return res.status(403).json({ success: false, message: "You are not a participant in this project's chat." });
        }

        // Find the conversation for the project
        const conversation = await Conversation.findOne({ projectAssignment: projectAssignmentId });
        if (!conversation) {
            // If no conversation exists yet, no messages have been sent.
            return res.json({ success: true, data: [] });
        }

        // Find all messages for that conversation
        const messages = await Message.find({ conversation: conversation._id })
            .populate('sender', 'name type email') // Populate sender's name and type
            .sort({ createdAt: 'asc' });

        res.json({ success: true, data: messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching messages.' });
    }
};
