// Get unassigned interns for a project (for dropdown)
exports.getUnassignedInternsForProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    // Find assignment for this project
    const assignment = await ProjectAssignment.findOne({ projectId });
    const assignedInternIds = assignment ? assignment.assignedInterns.map(i => i.userId.toString()) : [];
    // Only interns from the same company, not already assigned
    const unassignedInterns = await User.find({
      type: 'intern',
      company: project.company,
      _id: { $nin: assignedInternIds }
    }, 'name email _id');
    return res.status(200).json({ success: true, data: unassignedInterns });
  } catch (error) {
    console.error('Error fetching unassigned interns:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Get unassigned developers for a project (for dropdown)
exports.getUnassignedDevelopersForProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    // Find assignment for this project
    const assignment = await ProjectAssignment.findOne({ projectId });
    const assignedDeveloperIds = assignment ? assignment.assignedDevelopers.map(d => d.userId.toString()) : [];
    // Only developers from the same company, not already assigned
    const unassignedDevelopers = await User.find({
      type: 'developer',
      company: project.company,
      _id: { $nin: assignedDeveloperIds }
    }, 'name email _id');
    return res.status(200).json({ success: true, data: unassignedDevelopers });
  } catch (error) {
    console.error('Error fetching unassigned developers:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
const ProjectAssignment = require('../models/projectAssignmentsModel');
const Project = require('../models/projectsModel');
const User = require('../models/usersModel');
const { volunteerSchema, reviewVolunteerSchema, assignUserSchema, removeUserSchema, notifyProjectMembersSchema, notifyAllProjectsMembersSchema } = require('../middlewares/validator'); // Added notifyAllProjectsMembersSchema
const mailTransport = require('../middlewares/sendMail');

// Helper function to send project assignment notification emails
async function sendProjectAssignmentEmail(userEmail, userName, projectName, assignedUserName, assignedUserRole, teamMembers) {
  let teamDetails = teamMembers.map(member => {
    let role = '';
    if (member.type === 'developer') role = 'Mentor';
    else if (member.type === 'intern') role = 'Intern';
    else if (member.type === 'panelist') role = 'Panelist';
    return `${member.name} (${member.email}) - ${role}`;
  }).join('\n');

  if (!teamDetails) {
    teamDetails = "You are the first member of this project team.";
  }

  const mailOptions = {
    from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
    to: userEmail,
    subject: `Project Assignment Update: ${projectName}`,
    text: `Hello ${userName},\n\nThere has been an update to the project "${projectName}".\n\n${assignedUserName} has been assigned as ${assignedUserRole}.\n\nCurrent Project Team:\n${teamDetails}\n\nRegards,\nThe TallyIntern Team`
  };

  try {
    await mailTransport.sendMail(mailOptions);
  } catch (error) {
  }
}

// Helper function to gather all project members and send notifications
async function notifyAllProjectMembers(projectId, newlyAssignedUser, newlyAssignedUserRole, triggeredByUserId) {
  try {
    const assignment = await ProjectAssignment.findOne({ projectId })
      .populate('projectId', 'name company') // Ensure company is populated for project
      .populate('assignedDevelopers.userId', 'name email type company')
      .populate('assignedInterns.userId', 'name email type company')
      .populate('panelists.userId', 'name email type company');

    if (!assignment || !assignment.projectId) {
      console.error('Could not find project or assignment details for notification.');
      return;
    }

    // Security Check: Ensure the user triggering the notification is an HR of the project's company or a system admin
    const triggeringUser = await User.findById(triggeredByUserId);
    if (!triggeringUser) {
        console.error('Triggering user not found for notification.');
        return;
    }

    if (triggeringUser.type !== 'admin' && (triggeringUser.type !== 'hr' || triggeringUser.company !== assignment.projectId.company)) {
        console.error(`User ${triggeringUser.email} (type: ${triggeringUser.type}, company: ${triggeringUser.company}) is not authorized to send notifications for project ${assignment.projectId.name} (company: ${assignment.projectId.company}).`);
        // Optionally, you could throw an error here to be caught by the calling function if this check is critical path
        // For now, just logging and returning to prevent unauthorized emails.
        return; 
    }

    const projectName = assignment.projectId.name;
    let allMembers = [];

    assignment.assignedDevelopers.forEach(dev => allMembers.push({ ...dev.userId._doc, type: 'developer' }));
    assignment.assignedInterns.forEach(intern => allMembers.push({ ...intern.userId._doc, type: 'intern' }));
    assignment.panelists.forEach(panelist => allMembers.push({ ...panelist.userId._doc, type: 'panelist' }));

    // Ensure the newly assigned user is included if not already captured by the population (e.g., if save() hasn't fully propagated)
    // This might be redundant if the assignment object is up-to-date post-save, but good for safety.
    const isNewlyAssignedUserInList = allMembers.some(member => member._id.toString() === newlyAssignedUser._id.toString());
    if (!isNewlyAssignedUserInList) {
        allMembers.push({ ...newlyAssignedUser._doc, type: newlyAssignedUserRole === 'Mentor' ? 'developer' : (newlyAssignedUserRole === 'Intern' ? 'intern' : 'panelist') });
    }
    
    // Filter out users without email or name (should not happen with proper data)
    allMembers = allMembers.filter(member => member.email && member.name);


    for (const member of allMembers) {
      // Determine the role string for the newly assigned user for the email body
      let assignedRoleString = '';
      if (newlyAssignedUserRole.toLowerCase().includes('developer') || newlyAssignedUserRole.toLowerCase().includes('mentor')) assignedRoleString = 'Mentor';
      else if (newlyAssignedUserRole.toLowerCase().includes('intern')) assignedRoleString = 'Intern';
      else if (newlyAssignedUserRole.toLowerCase().includes('panelist')) assignedRoleString = 'Panelist';
      else assignedRoleString = newlyAssignedUserRole; // Fallback

      await sendProjectAssignmentEmail(
        member.email,
        member.name,
        projectName,
        newlyAssignedUser.name,
        assignedRoleString,
        allMembers // Send the full list of current members
      );
    }
  } catch (error) {
    console.error('Error notifying project members:', error);
  }
}


// Volunteer for a project (developers and interns only)
exports.volunteerForProject = async (req, res) => {
  // Check if user is verified first
  if (!req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before volunteering for projects' });
  }

  // Only developers and interns can volunteer
  if (!['developer', 'intern'].includes(req.user?.type)) {
    return res.status(403).json({ success: false, message: 'Forbidden: only developers and interns can volunteer for projects' });
  }

  // Check if user is approved
  if (!req.user?.isApproved) {
    return res.status(403).json({ success: false, message: 'You must be approved before volunteering for projects' });
  }  try {
    // Validate input
    const { error, value } = volunteerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { projectId } = value;

    // Check if project exists and is approved
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!project.isApproved) {
      return res.status(403).json({ success: false, message: 'Cannot volunteer for unapproved projects' });
    }

    // Check if project belongs to user's company
    if (project.company !== req.user?.company) {
      return res.status(403).json({ success: false, message: 'You can only volunteer for projects from your own company' });
    }

    // Find or create project assignment
    let assignment = await ProjectAssignment.findOne({ projectId: projectId });
    
    if (!assignment) {
      assignment = new ProjectAssignment({
        projectId: projectId,
        company: req.user.company,
        assignedDevelopers: [],
        assignedInterns: [],
        volunteerDevelopers: [],
        volunteerInterns: []
      });
    }    // If a developer is volunteering, check if they are already a panelist
    if (req.user.type === 'developer') {
        if (assignment.panelists && assignment.panelists.some(p => p.userId.toString() === req.user.userId)) {
            return res.status(400).json({
                success: false,
                message: 'You are already a panelist for this project and cannot also volunteer as a mentor.'
            });
        }
    }

    // Check if user has already volunteered
    const volunteerField = req.user.type === 'developer' ? 'volunteerDevelopers' : 'volunteerInterns';
    const existingVolunteer = assignment[volunteerField].find(
      v => v.userId.toString() === req.user.userId.toString()
    );

    if (existingVolunteer) {
      return res.status(400).json({ 
        success: false, 
        message: `You have already volunteered for this project. Status: ${existingVolunteer.status}` 
      });
    }    // Add volunteer request
    assignment[volunteerField].push({
      userId: req.user.userId, // Use userId from JWT instead of _id
      requestedAt: new Date(),
      status: 'pending'
    });

    await assignment.save();

    res.status(201).json({ 
      success: true, 
      message: 'Volunteer request submitted successfully. Awaiting HR approval.',
      data: assignment
    });
  } catch (error) {
    console.error('Error volunteering for project:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Get pending volunteer requests (HR and admin only)
exports.getPendingVolunteers = async (req, res) => {
  // Check if user is verified first
  if (!req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before viewing volunteer requests' });
  }

  // Only HR and admin can view pending volunteers
  if (!['hr', 'admin'].includes(req.user?.type)) {
    return res.status(403).json({ success: false, message: 'Forbidden: only HR and admin can view volunteer requests' });
  }

  try {
    let filter = {};

    // HR can only see requests from their company
    if (req.user?.type === 'hr') {
      if (!req.user?.company) {
        return res.status(403).json({ success: false, message: 'Company information is required' });
      }
      filter.company = req.user.company;
    }

    const assignments = await ProjectAssignment.find(filter)
      .populate('projectId', 'description company estimatedTimeToComplete')
      .populate('volunteerDevelopers.userId', 'email type company')
      .populate('volunteerInterns.userId', 'email type company')
      .sort({ createdAt: -1 });

    // Filter to only show pending requests
    const pendingRequests = assignments.map(assignment => {
      const pendingDevelopers = assignment.volunteerDevelopers.filter(v => v.status === 'pending');
      const pendingInterns = assignment.volunteerInterns.filter(v => v.status === 'pending');
      
      if (pendingDevelopers.length > 0 || pendingInterns.length > 0) {
        return {
          ...assignment.toObject(),
          volunteerDevelopers: pendingDevelopers,
          volunteerInterns: pendingInterns
        };
      }
      return null;
    }).filter(Boolean);

    res.status(200).json({ success: true, data: pendingRequests });
  } catch (error) {
    console.error('Error fetching pending volunteers:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Approve or reject volunteer requests (HR and admin only)
exports.reviewVolunteerRequest = async (req, res) => {
  // Check if user is verified first
  if (!req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before reviewing volunteer requests' });
  }

  // Only HR and admin can review volunteer requests
  if (!['hr', 'admin'].includes(req.user?.type)) {
    return res.status(403).json({ success: false, message: 'Forbidden: only HR and admin can review volunteer requests' });
  }
  try {
    // Validate input
    const { error, value } = reviewVolunteerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { assignmentId, userId, userType, status } = value;

    // Find the assignment
    const assignment = await ProjectAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // HR can only review requests from their company
    if (req.user?.type === 'hr') {
      if (!req.user?.company || assignment.company !== req.user.company) {
        return res.status(403).json({ success: false, message: 'You can only review requests from your own company' });
      }
    }

    // Find and update the volunteer request
    const volunteerField = userType === 'developer' ? 'volunteerDevelopers' : 'volunteerInterns';
    const volunteerIndex = assignment[volunteerField].findIndex(
      v => v.userId.toString() === userId
    );

    if (volunteerIndex === -1) {
      return res.status(404).json({ success: false, message: 'Volunteer request not found' });
    }    // Update the volunteer status
    assignment[volunteerField][volunteerIndex].status = status;
    assignment[volunteerField][volunteerIndex].reviewedBy = req.user.userId;
    assignment[volunteerField][volunteerIndex].reviewedAt = new Date();

    // If approved, move to assigned list
    if (status === 'approved') {
      // If a developer is being approved, check if they are already a panelist for this project
      if (userType === 'developer') {
        if (assignment.panelists && assignment.panelists.some(p => p.userId.toString() === userId)) {
          return res.status(400).json({
            success: false,
            message: 'This developer is already a panelist for this project and cannot be approved as a mentor.'
          });
        }
      }
      
      const assignedField = userType === 'developer' ? 'assignedDevelopers' : 'assignedInterns';
      assignment[assignedField].push({
        userId: userId,
        assignedBy: req.user.userId,
        assignedAt: new Date()
      });

      await assignment.save(); // Save before trying to notify

      // Send notification email
      const user = await User.findById(userId);
      if (user) {
        const role = userType === 'developer' ? 'Mentor' : 'Intern';
        await notifyAllProjectMembers(assignment.projectId, user, role, req.user.userId);
      }

    } else {
        await assignment.save(); // Save if not approved (status changed to rejected)
    }


    const statusMessage = status === 'approved' ? 'approved and assigned' : status;
    res.status(200).json({ 
      success: true, 
      message: `Volunteer request ${statusMessage} successfully`,
      data: assignment
    });
  } catch (error) {
    console.error('Error reviewing volunteer request:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Manually assign users to project (HR and admin only)
exports.assignUserToProject = async (req, res) => {
  // Check if user is verified first
  if (!req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before assigning users to projects' });
  }

  // Only HR and admin can assign users
  if (!['hr', 'admin'].includes(req.user?.type)) {
    return res.status(403).json({ success: false, message: 'Forbidden: only HR and admin can assign users to projects' });
  }
  try {
    // Validate input
    const { error, value } = assignUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { projectId, userId, userType } = value;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check if user exists and has correct type
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.type !== userType) {
      return res.status(400).json({ success: false, message: `User is not a ${userType}` });
    }

    // HR can only assign for their company projects and users
    if (req.user?.type === 'hr') {
      if (!req.user?.company) {
        return res.status(403).json({ success: false, message: 'Company information is required' });
      }
      
      if (project.company !== req.user.company) {
        return res.status(403).json({ success: false, message: 'You can only assign users to projects from your own company' });
      }

      if (user.company !== req.user.company) {
        return res.status(403).json({ success: false, message: 'You can only assign users from your own company' });
      }
    }

    // Find or create project assignment for the current project
    let assignment = await ProjectAssignment.findOne({ projectId: projectId });
    
    if (!assignment) {
      assignment = new ProjectAssignment({
        projectId: projectId,
        company: project.company, // Use project's company
        assignedDevelopers: [],
        assignedInterns: [],
        volunteerDevelopers: [],
        volunteerInterns: [],
        panelists: [],
        volunteerPanelists: []
      });
    }

    if (userType === 'developer') {
      // 1. Global Mentor Check: Check if this developer is already a mentor for ANY project.
      const existingMentorAssignment = await ProjectAssignment.findOne({ 'assignedDevelopers.userId': userId });
      if (existingMentorAssignment) {
          return res.status(400).json({
              success: false,
              message: 'This developer is already assigned as a mentor to another project and can only mentor one project at a time.'
          });
      }

      // 2. Project Panelist Check: Check if this developer is a panelist for THIS project.
      // The 'assignment' variable here is for the current projectId
      if (assignment.panelists && assignment.panelists.some(p => p.userId.toString() === userId)) {
          return res.status(400).json({
              success: false,
              message: 'This developer is a panelist for this project and cannot also be assigned as a mentor.'
          });
      }
    }

    // Check if user is already assigned (for the specified userType to this project)
    const assignedField = userType === 'developer' ? 'assignedDevelopers' : 'assignedInterns';
    const existingUserInProject = assignment[assignedField].find(
      a => a.userId.toString() === userId
    );

    if (existingUserInProject) {
      return res.status(400).json({ 
        success: false, 
        message: `${userType.charAt(0).toUpperCase() + userType.slice(1)} is already assigned to this project` 
      });
    }
    
    // Add assignment
    assignment[assignedField].push({
      userId: userId,
      assignedBy: req.user.userId,
      assignedAt: new Date()
    });

    await assignment.save();

    // Send notification email
    const assignedUser = await User.findById(userId);
    if (assignedUser) {
        const role = userType === 'developer' ? 'Mentor' : (userType === 'intern' ? 'Intern' : 'Panelist'); 
        await notifyAllProjectMembers(projectId, assignedUser, role, req.user.userId);
    }

    res.status(201).json({ 
      success: true, 
      message: `${userType.charAt(0).toUpperCase() + userType.slice(1)} assigned to project successfully`,
      data: assignment
    });
  } catch (error) {
    console.error('Error assigning user to project:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Remove a panelist from a project (HR and admin only)
exports.removePanelistFromProject = async (req, res) => {
  if (!req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email.' });
  }
  if (!['hr', 'admin'].includes(req.user?.type)) {
    return res.status(403).json({ success: false, message: 'Forbidden: only HR and admin can remove panelists.' });
  }

  try {
    // Validate: assignmentId, userId (panelistId)
    // Re-use or adapt removeUserSchema if it fits, or create a specific one.
    // For now, assuming body contains assignmentId and userId.
    const { assignmentId, userId } = req.body; 

    if (!assignmentId || !userId) {
      return res.status(400).json({ success: false, message: 'Assignment ID and User ID are required.' });
    }

    const assignment = await ProjectAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Project assignment not found.' });
    }

    if (req.user?.type === 'hr' && assignment.company !== req.user.company) {
      return res.status(403).json({ success: false, message: 'HR can only remove panelists from their own company projects.' });
    }

    const initialLength = assignment.panelists.length;
    assignment.panelists = assignment.panelists.filter(
      p => p.userId.toString() !== userId
    );

    if (assignment.panelists.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Panelist not found in this project assignment.' });
    }

    await assignment.save();
    // Consider sending a notification email about removal if required by product spec
    // For now, no email on removal to keep it simple.
    res.status(200).json({ 
      success: true, 
      message: 'Panelist removed from project successfully.',
      data: assignment
    });
  } catch (error) {
    console.error('Error removing panelist from project:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Get project assignments with filtering (all authenticated users)
exports.getProjectAssignments = async (req, res) => {
  // Check if user is verified first
  if (!req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before viewing project assignments' });
  }

  try {
    let filter = {};

    // Apply company filtering based on user type
    if (req.user?.type === 'admin') {
      // Admin can see all assignments
    } else {
      // Other users can only see assignments from their company
      if (!req.user?.company) {
        return res.status(403).json({ success: false, message: 'Company information is required' });
      }
      filter.company = req.user.company;
    }

    const assignments = await ProjectAssignment.find(filter)
      .populate('projectId', 'name description company estimatedTimeToComplete isApproved') // Added name to projectId populate
      .populate('assignedDevelopers.userId', 'name email type company') // Added name
      .populate('assignedInterns.userId', 'name email type company') // Added name
      .populate('volunteerDevelopers.userId', 'name email type company') // Added name
      .populate('volunteerInterns.userId', 'name email type company') // Added name
      .populate('panelists.userId', 'name email type company') // Added population for panelists
      .populate('volunteerPanelists.userId', 'name email type company') // Added population for volunteerPanelists
      .populate('assignedDevelopers.assignedBy', 'name email type') // Added name
      .populate('assignedInterns.assignedBy', 'name email type') // Added name
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: assignments });
  } catch (error) {
    console.error('Error fetching project assignments:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Get assignments for a specific project
exports.getProjectAssignmentById = async (req, res) => {
  // Check if user is verified first
  if (!req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before viewing project assignments' });
  }

  try {
    const { projectId } = req.params;

    const assignment = await ProjectAssignment.findOne({ projectId: projectId })
      .populate('projectId', 'name description company estimatedTimeToComplete isApproved') // Added name
      .populate('assignedDevelopers.userId', 'name email type company') // Added name
      .populate('assignedInterns.userId', 'name email type company') // Added name
      .populate('volunteerDevelopers.userId', 'name email type company') // Added name
      .populate('volunteerInterns.userId', 'name email type company') // Added name
      .populate('panelists.userId', 'name email type company') // Added population for panelists
      .populate('volunteerPanelists.userId', 'name email type company') // Added population for volunteerPanelists
      .populate('assignedDevelopers.assignedBy', 'name email type') // Added name
      .populate('assignedInterns.assignedBy', 'name email type'); // Added name

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'No assignments found for this project' });
    }

    // Apply company filtering
    if (req.user?.type !== 'admin') {
      if (!req.user?.company || assignment.company !== req.user.company) {
        return res.status(403).json({ success: false, message: 'You can only view assignments from your own company' });
      }
    }

    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    console.error('Error fetching project assignment:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Fetch a project assignment by its own _id (assignmentId)
exports.getProjectAssignmentByAssignmentId = async (req, res) => {
  // Check if user is verified first
  if (!req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before viewing project assignments' });
  }

  try {
    const { assignmentId } = req.params;

    const assignment = await ProjectAssignment.findById(assignmentId)
      .populate('projectId', 'name description company estimatedTimeToComplete isApproved')
      .populate('assignedDevelopers.userId', 'name email type company')
      .populate('assignedInterns.userId', 'name email type company')
      .populate('volunteerDevelopers.userId', 'name email type company')
      .populate('volunteerInterns.userId', 'name email type company')
      .populate('panelists.userId', 'name email type company')
      .populate('volunteerPanelists.userId', 'name email type company')
      .populate('assignedDevelopers.assignedBy', 'name email type')
      .populate('assignedInterns.assignedBy', 'name email type');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Company filtering
    if (req.user?.type !== 'admin') {
      if (!req.user?.company || assignment.company !== req.user.company) {
        return res.status(403).json({ success: false, message: 'You can only view assignments from your own company' });
      }
    }

    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    console.error('Error fetching project assignment by assignmentId:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Remove user from project assignment (HR and admin only)
exports.removeUserFromProject = async (req, res) => {
  // Check if user is verified first
  if (!req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before removing users from projects' });
  }

  // Only HR and admin can remove users
  if (!['hr', 'admin'].includes(req.user?.type)) {
    return res.status(403).json({ success: false, message: 'Forbidden: only HR and admin can remove users from projects' });
  }
  try {
    // Validate input
    const { error, value } = removeUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { assignmentId, userId, userType } = value;

    // Find the assignment
    const assignment = await ProjectAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // HR can only remove from their company
    if (req.user?.type === 'hr') {
      if (!req.user?.company || assignment.company !== req.user.company) {
        return res.status(403).json({ success: false, message: 'You can only remove users from your own company projects' });
      }
    }

    // Remove from assigned list
    const assignedField = userType === 'developer' ? 'assignedDevelopers' : 'assignedInterns';
    const initialLength = assignment[assignedField].length;
    assignment[assignedField] = assignment[assignedField].filter(
      a => a.userId.toString() !== userId
    );

    if (assignment[assignedField].length === initialLength) {
      return res.status(404).json({ success: false, message: `${userType} is not assigned to this project` });
    }

    await assignment.save();

    res.status(200).json({ 
      success: true, 
      message: `${userType} removed from project successfully`,
      data: assignment
    });
  } catch (error) {
    console.error('Error removing user from project:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Get project assignments for a specific developer
exports.getProjectAssignmentsByDeveloper = async (req, res) => {
  try {
    const { developerId } = req.params;

    // Find assignments where the developer is assigned as mentor or panelist
    const assignments = await ProjectAssignment.find({
      $or: [
        { 'assignedDevelopers.userId': developerId },
        { 'panelists.userId': developerId }
      ]
    })
    .populate('projectId', 'name description company estimatedTimeToComplete')
    .populate('assignedInterns.userId', 'name email type company')
    .populate('assignedDevelopers.userId', 'name email type company')
    .populate('panelists.userId', 'name email type company');

    if (!assignments || assignments.length === 0) {
      return res.status(200).json({ 
        success: true, 
        data: [],
        message: 'No project assignments found for this developer'
      });
    }

    // Transform the data to include role information
    const transformedAssignments = assignments
      .filter(assignment => assignment.projectId) // Filter out assignments without valid project data
      .map(assignment => {
        const roles = [];
        // Check if developer is a mentor
        const isMentor = assignment.assignedDevelopers.some(dev => 
          dev.userId && dev.userId._id.toString() === developerId
        );
        if (isMentor) roles.push('Mentor');
        // Check if developer is a panelist
        const isPanelist = assignment.panelists.some(panelist => 
          panelist.userId && panelist.userId._id.toString() === developerId
        );
        if (isPanelist) roles.push('Panelist');

        // Map assignedInterns to include name/email
        const populatedInterns = Array.isArray(assignment.assignedInterns)
          ? assignment.assignedInterns.map(intern => {
              if (intern.userId && typeof intern.userId === 'object') {
                return {
                  _id: intern.userId._id,
                  name: intern.userId.name,
                  email: intern.userId.email,
                  assignedAt: intern.assignedAt
                };
              }
              return null;
            }).filter(Boolean)
          : [];

        return {
          _id: assignment._id,
          projectId: assignment.projectId,
          project: assignment.projectId,
          roles,
          assignedInterns: populatedInterns,
          assignedDevelopers: assignment.assignedDevelopers,
          panelists: assignment.panelists,
          company: assignment.company
        };
      });

    res.status(200).json({ 
      success: true, 
      data: transformedAssignments
    });
  } catch (error) {
    console.error('Error fetching project assignments for developer:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

exports.getProjectAssignmentsByIntern = async (req, res) => {
  try {
    const internId = req.params.internId;

    // Security check
    if (req.user.userId !== internId && !['admin', 'hr'].includes(req.user.type)) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only view your own project assignments.' });
    }

    const assignments = await ProjectAssignment.find({ 'assignedInterns.userId': internId })
      .populate({
          path: 'projectId',
          select: 'name description company estimatedTimeToComplete isApproved skillRequirement'
      })
      .populate({
          path: 'assignedDevelopers.userId',
          select: 'name email'
      })
      .populate({
          path: 'assignedInterns.userId',
          select: 'name email'
      })
      .populate({
          path: 'panelists.userId',
          select: 'name email'
      })
      .lean();

    if (!assignments || assignments.length === 0) {
      return res.status(200).json({ success: true, data: [], message: 'Not assigned to any projects yet.' });
    }

    const formatUser = (userRef) => {
        if (!userRef || !userRef.userId) return null;
        return {
            _id: userRef.userId._id,
            name: userRef.userId.name,
            email: userRef.userId.email,
            assignedAt: userRef.assignedAt
        };
    };

    const transformedAssignments = assignments.map(assignment => {
      const internInfo = assignment.assignedInterns.find(intern => intern.userId?._id.toString() === internId);

      return {
        _id: assignment._id,
        project: assignment.projectId,
        company: assignment.company,
        assignedAt: internInfo ? internInfo.assignedAt : null,
        mentors: assignment.assignedDevelopers.map(formatUser).filter(Boolean),
        interns: assignment.assignedInterns.map(formatUser).filter(Boolean),
        panelists: assignment.panelists.map(formatUser).filter(Boolean),
      };
    });

    let dataToSend = transformedAssignments;
    if (req.user.type === 'hr') {
        dataToSend = transformedAssignments.filter(a => a.company === req.user.company);
    }

    res.status(200).json({ success: true, data: dataToSend });
  } catch (error) {
    console.error('Error fetching project assignments for intern:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Volunteer to be a Panelist (developers only)
exports.volunteerForPanelist = async (req, res) => {
  if (!req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before volunteering.' });
  }
  if (req.user?.type !== 'developer') {
    return res.status(403).json({ success: false, message: 'Forbidden: only developers can volunteer as panelists.' });
  }
  if (!req.user?.isApproved) {
    return res.status(403).json({ success: false, message: 'You must be approved before volunteering.' });
  }

  try {
    const { error, value } = volunteerSchema.validate(req.body); // Using existing volunteerSchema for projectId
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const { projectId } = value;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    if (!project.isApproved) {
      return res.status(403).json({ success: false, message: 'Cannot volunteer for unapproved projects' });
    }
    if (project.company !== req.user?.company) {
      return res.status(403).json({ success: false, message: 'You can only volunteer for projects from your own company' });
    }

    let assignment = await ProjectAssignment.findOne({ projectId: projectId });
    if (!assignment) {
      assignment = new ProjectAssignment({
        projectId: projectId,
        company: req.user.company,
        assignedDevelopers: [],
        assignedInterns: [],
        volunteerDevelopers: [],
        volunteerInterns: [],
        panelists: [],
        volunteerPanelists: []
      });
    }

    // Check if the developer is already a mentor for this project
    if (assignment.assignedDevelopers && assignment.assignedDevelopers.some(d => d.userId.toString() === req.user.userId)) {
        return res.status(400).json({
            success: false,
            message: 'You are already a mentor for this project and cannot also volunteer as a panelist.'
        });
    }

    // Check if user has already volunteered as a panelist
    const existingVolunteer = assignment.volunteerPanelists.find(
      v => v.userId.toString() === req.user.userId.toString()
    );

    if (existingVolunteer) {
      return res.status(400).json({ 
        success: false, 
        message: `You have already volunteered for this project as a panelist. Status: ${existingVolunteer.status}` 
      });
    }

    // Add panelist volunteer request
    assignment.volunteerPanelists.push({
      userId: req.user.userId,
      requestedAt: new Date(),
      status: 'pending'
    });

    await assignment.save();

    res.status(201).json({ 
      success: true, 
      message: 'Panelist volunteer request submitted successfully. Awaiting HR approval.',
      data: assignment
    });
  } catch (error) {
    console.error('Error volunteering for panelist:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Review Panelist Volunteer Request (HR and admin only)
exports.reviewPanelistVolunteerRequest = async (req, res) => {
  if (!req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before reviewing volunteer requests' });
  }
  if (!['hr', 'admin'].includes(req.user?.type)) {
    return res.status(403).json({ success: false, message: 'Forbidden: only HR and admin can review volunteer requests' });
  }

  try {
    // Validate input - should be similar to reviewVolunteerRequest
    const { error, value } = reviewVolunteerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { assignmentId, userId, status } = value; // userType is not needed here, it's always developer for panelist

    // Find the assignment
    const assignment = await ProjectAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // HR can only review requests from their company
    if (req.user?.type === 'hr') {
      if (!req.user?.company || assignment.company !== req.user.company) {
        return res.status(403).json({ success: false, message: 'You can only review requests from your own company' });
      }
    }

    // Find and update the volunteer request
    const volunteerIndex = assignment.volunteerPanelists.findIndex(
      v => v.userId.toString() === userId
    );

    if (volunteerIndex === -1) {
      return res.status(404).json({ success: false, message: 'Panelist volunteer request not found' });
    }

    // If approved, first check if they are a mentor
    if (status === 'approved') {
        if (assignment.assignedDevelopers && assignment.assignedDevelopers.some(d => d.userId.toString() === userId)) {
            return res.status(400).json({
                success: false,
                message: 'This developer is already a mentor for this project and cannot be approved as a panelist.'
            });
        }
    }

    // Update the volunteer status
    assignment.volunteerPanelists[volunteerIndex].status = status;
    assignment.volunteerPanelists[volunteerIndex].reviewedBy = req.user.userId;
    assignment.volunteerPanelists[volunteerIndex].reviewedAt = new Date();

    // If approved, move to assigned list
    if (status === 'approved') {
      assignment.panelists.push({
        userId: userId,
        assignedBy: req.user.userId,
        assignedAt: new Date()
      });
      
      await assignment.save(); // Save before trying to notify

      // Send notification email
      const user = await User.findById(userId);
      if (user) {
        await notifyAllProjectMembers(assignment.projectId, user, 'Panelist', req.user.userId);
      }

    } else {
        await assignment.save(); // Save if not approved (status changed to rejected)
    }

    const statusMessage = status === 'approved' ? 'approved and assigned as panelist' : status;
    res.status(200).json({ 
      success: true, 
      message: `Panelist volunteer request ${statusMessage} successfully`,
      data: assignment
    });
  } catch (error) {
    console.error('Error reviewing panelist volunteer request:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Assign a developer as a panelist for a project (HR and admin only)
exports.assignPanelist = async (req, res) => {
    // Check if user is verified first
    if (!req.user?.verified) {
        return res.status(403).json({ success: false, message: 'Please verify your email before assigning panelists.' });
    }

    // Only HR and admin can assign panelists
    if (!['hr', 'admin'].includes(req.user?.type)) {
        return res.status(403).json({ success: false, message: 'Forbidden: only HR and admin can assign panelists.' });
    }

    try {
        // Validate input - projectId and userId (of the developer to be made a panelist)
        const { error, value } = assignUserSchema.validate({ ...req.body, userType: 'developer' }); // Re-use schema, force userType
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const { projectId, userId } = value;

        // Check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Check if user exists and is a developer
        const user = await User.findById(userId);
        if (!user || user.type !== 'developer') {
            return res.status(404).json({ success: false, message: 'Developer not found' });
        }

        // HR can only assign for their company projects and users
        if (req.user?.type === 'hr') {
            if (!req.user?.company) {
                return res.status(403).json({ success: false, message: 'Company information is required' });
            }
            if (project.company !== req.user.company || user.company !== req.user.company) {
                return res.status(403).json({ success: false, message: 'You can only assign developers to projects from your own company' });
            }
        }

        let assignment = await ProjectAssignment.findOne({ projectId: projectId });
        if (!assignment) {
            assignment = new ProjectAssignment({
                projectId: projectId,
                company: project.company,
                panelists: [],
                volunteerPanelists: []
            });
        }

        // Check if developer is already a mentor for this project
        if (assignment.assignedDevelopers && assignment.assignedDevelopers.some(d => d.userId.toString() === userId)) {
            return res.status(400).json({
                success: false,
                message: 'This developer is already a mentor for this project and cannot be assigned as a panelist.'
            });
        }

        // Check if developer is already a panelist
        if (assignment.panelists && assignment.panelists.some(p => p.userId.toString() === userId)) {
            return res.status(400).json({
                success: false,
                message: 'This developer is already a panelist for this project.'
            });
        }

        assignment.panelists.push({
            userId: userId,
            assignedBy: req.user.userId,
            assignedAt: new Date()
        });

        await assignment.save();

        res.status(201).json({
            success: true,
            message: 'Developer successfully assigned as a panelist.',
            data: assignment
        });

    } catch (error) {
        console.error('Error assigning panelist:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.assignRandomPanelist = async (req, res) => {
    if (!['hr', 'admin'].includes(req.user?.type)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    try {
        const { projectId } = req.body;
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const assignment = await ProjectAssignment.findOne({ projectId: projectId });

        // Find developers in the same company who are not mentors or panelists for this project
        const assignedDeveloperIds = assignment ? assignment.assignedDevelopers.map(d => d.userId) : [];
        const panelistIds = assignment ? assignment.panelists.map(p => p.userId) : [];
        const excludedIds = [...assignedDeveloperIds, ...panelistIds];

        const availableDevelopers = await User.find({
            type: 'developer',
            company: project.company,
            _id: { $nin: excludedIds }
        });

        if (availableDevelopers.length === 0) {
            return res.status(404).json({ success: false, message: 'No available developers to assign as a panelist.' });
        }

        const randomDeveloper = availableDevelopers[Math.floor(Math.random() * availableDevelopers.length)];

        if (!assignment) {
            assignment = new ProjectAssignment({
                projectId: projectId,
                company: project.company,
                panelists: [],
            });
        }

        assignment.panelists.push({
            userId: randomDeveloper._id,
            assignedBy: req.user.userId,
            assignedAt: new Date()
        });

        await assignment.save();

        res.status(201).json({
            success: true,
            message: `Successfully assigned ${randomDeveloper.name} as a random panelist.`,
            data: assignment
        });

    } catch (error) {
        console.error('Error assigning random panelist:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.notifyProjectMembersManually = async (req, res) => {
    if (!['hr', 'admin'].includes(req.user?.type)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    try {
        const { projectId, message, subject } = req.body;
        const assignment = await ProjectAssignment.findOne({ projectId: projectId })
            .populate('assignedDevelopers.userId', 'name email')
            .populate('assignedInterns.userId', 'name email')
            .populate('panelists.userId', 'name email');

        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Project assignment not found.' });
        }

        const members = [
            ...assignment.assignedDevelopers.map(d => d.userId),
            ...assignment.assignedInterns.map(i => i.userId),
            ...assignment.panelists.map(p => p.userId)
        ].filter(user => user && user.email);

        const emailPromises = members.map(member => {
            const mailOptions = {
                from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
                to: member.email,
                subject: subject || `A message regarding project: ${assignment.projectId.name}`,
                text: message
            };
            return mailTransport.sendMail(mailOptions);
        });

        await Promise.all(emailPromises);

        res.status(200).json({ success: true, message: 'Successfully sent notifications to all project members.' });

    } catch (error) {
        console.error('Error manually notifying project members:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.notifyAllProjectsMembersGlobally = async (req, res) => {
    if (req.user?.type !== 'admin') { // Only admin can do this globally
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    try {
        const { message, subject } = req.body;
        const allAssignments = await ProjectAssignment.find({})
            .populate('assignedDevelopers.userId', 'name email')
            .populate('assignedInterns.userId', 'name email')
            .populate('panelists.userId', 'name email');

        const allUsers = new Map();

        for (const assignment of allAssignments) {
            const members = [
                ...assignment.assignedDevelopers.map(d => d.userId),
                ...assignment.assignedInterns.map(i => i.userId),
                ...assignment.panelists.map(p => p.userId)
            ].filter(user => user && user.email);

            for (const member of members) {
                if (!allUsers.has(member.email)) {
                    allUsers.set(member.email, member);
                }
            }
        }

        const emailPromises = Array.from(allUsers.values()).map(user => {
            const mailOptions = {
                from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
                to: user.email,
                subject: subject || 'Important Announcement for all TallyIntern Projects',
                text: message
            };
            return mailTransport.sendMail(mailOptions);
        });

        await Promise.all(emailPromises);

        res.status(200).json({ success: true, message: 'Successfully sent notifications to all members of all projects.' });

    } catch (error) {
        console.error('Error notifying all projects members globally:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Initialize project assignment for a project (HR and admin only)
exports.initializeProjectAssignment = async (req, res) => {
  // Check if user is verified first
  if (!req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before initializing project assignments' });
  }

  // Only HR and admin can initialize project assignments
  if (!['hr', 'admin'].includes(req.user?.type)) {
    return res.status(403).json({ success: false, message: 'Forbidden: only HR and admin can initialize project assignments' });
  }

  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    // Check if project exists and is approved
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!project.isApproved) {
      return res.status(403).json({ success: false, message: 'Cannot initialize assignment for unapproved projects' });
    }

    // HR can only initialize for their company projects
    if (req.user?.type === 'hr') {
      if (!req.user?.company) {
        return res.status(403).json({ success: false, message: 'Company information is required' });
      }
      
      if (project.company !== req.user.company) {
        return res.status(403).json({ success: false, message: 'You can only initialize assignments for projects from your own company' });
      }
    }

    // Check if project assignment already exists
    const existingAssignment = await ProjectAssignment.findOne({ projectId: projectId });
    if (existingAssignment) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project assignment already exists for this project',
        data: existingAssignment
      });
    }

    // Create new project assignment
    const newAssignment = new ProjectAssignment({
      projectId: projectId,
      company: project.company,
      assignedDevelopers: [],
      assignedInterns: [],
      volunteerDevelopers: [],
      volunteerInterns: [],
      panelists: [],
      volunteerPanelists: []
    });

    await newAssignment.save();

    // Populate the created assignment before sending response
    const populatedAssignment = await ProjectAssignment.findById(newAssignment._id)
      .populate('projectId', 'name description company estimatedTimeToComplete isApproved');

    res.status(201).json({ 
      success: true, 
      message: 'Project assignment initialized successfully',
      data: populatedAssignment
    });
  } catch (error) {
    console.error('Error initializing project assignment:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};