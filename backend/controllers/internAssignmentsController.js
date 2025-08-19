const User = require('../models/usersModel');
const ProjectAssignment = require('../models/projectAssignmentsModel');

// Assign an intern to a developer
exports.assignInternToDeveloper = async (req, res) => {
  // Check if user is verified and is HR/admin
  if (!req.user?.verified) {
    return res.status(403).json({ message: 'Please verify your email first' });
  }

  if (!['hr', 'admin'].includes(req.user?.type)) {
    return res.status(403).json({ message: 'Only HR and admin can assign interns to developers' });
  }

  try {
    const { internId, developerId, projectId } = req.body;

    // Validate intern exists and is an intern
    const intern = await User.findById(internId);
    if (!intern || intern.type !== 'intern') {
      return res.status(404).json({ message: 'Invalid intern selected' });
    }

    // Validate developer exists and is a developer
    const developer = await User.findById(developerId);
    if (!developer || developer.type !== 'developer') {
      return res.status(404).json({ message: 'Invalid developer selected' });
    }

    // Check if project assignment exists
    let projectAssignment = await ProjectAssignment.findOne({ projectId });
    
    if (!projectAssignment) {
      // Create new project assignment if it doesn't exist
      projectAssignment = new ProjectAssignment({
        projectId,
        company: req.user.company,
        assignedDevelopers: [{
          userId: developerId,
          assignedBy: req.user._id,
          assignedAt: new Date()
        }]
      });
    }

    // Check if intern is already assigned to this project
    const isInternAssigned = projectAssignment.assignedInterns.some(
      assignment => assignment.userId.toString() === internId
    );

    if (isInternAssigned) {
      return res.status(400).json({ message: 'Intern is already assigned to this project' });
    }

    // Add intern to assigned interns
    projectAssignment.assignedInterns.push({
      userId: internId,
      assignedBy: req.user._id,
      assignedAt: new Date()
    });

    await projectAssignment.save();

    res.status(200).json({
      success: true,
      message: 'Intern assigned to developer successfully',
      data: projectAssignment
    });
  } catch (error) {
    console.error('Error assigning intern to developer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all interns assigned to a developer
exports.getAssignedInterns = async (req, res) => {
  try {
    const { developerId } = req.params;

    // Find all project assignments where the developer is assigned
    const assignments = await ProjectAssignment.find({
      'assignedDevelopers.userId': developerId
    })
    .populate('assignedInterns.userId', 'name email')
    .populate('projectId', 'title description');

    // Format the response
    const assignedInterns = assignments.map(assignment => ({
      project: assignment.projectId,
      interns: assignment.assignedInterns.map(intern => ({
        intern: intern.userId,
        assignedAt: intern.assignedAt,
        assignedBy: intern.assignedBy
      }))
    }));

    res.status(200).json({
      success: true,
      data: assignedInterns
    });
  } catch (error) {
    console.error('Error fetching assigned interns:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Remove intern assignment from developer
exports.removeInternAssignment = async (req, res) => {
  if (!['hr', 'admin'].includes(req.user?.type)) {
    return res.status(403).json({ message: 'Only HR and admin can remove intern assignments' });
  }

  try {
    const { projectId, internId } = req.params;

    const projectAssignment = await ProjectAssignment.findOne({ projectId });
    if (!projectAssignment) {
      return res.status(404).json({ message: 'Project assignment not found' });
    }

    // Remove intern from assigned interns
    projectAssignment.assignedInterns = projectAssignment.assignedInterns.filter(
      assignment => assignment.userId.toString() !== internId
    );

    await projectAssignment.save();

    res.status(200).json({
      success: true,
      message: 'Intern assignment removed successfully'
    });
  } catch (error) {
    console.error('Error removing intern assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 