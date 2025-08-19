const Project = require('../models/projectsModel');
const ProjectAssignment = require('../models/projectAssignmentsModel');
const { projectSchema } = require('../middlewares/validator');

// Fetch all available projects (company-restricted)
exports.getAllProjects = async (req, res) => {
  console.log('Controller: getAllProjects called');
  
  // Check if user is verified first
  if (!req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before viewing projects' });
  }
  try {
    let projects;
    
    // Admin can see all projects (approved and pending)
    if (req.user?.type === 'admin') {
      projects = await Project.find().sort({ createdAt: -1 });
    } else {
      // Other users can only see projects from their company
      if (!req.user?.company) {
        return res.status(403).json({ success: false, message: 'Company information is required to view projects' });
      }
      
      let filter = { company: req.user.company };
      
      // HR can see all projects from their company (approved and pending)
      // Developers can see approved projects and their own pending suggestions
      // Interns can only see approved projects
      if (req.user?.type === 'developer') {
        filter.$or = [{ isApproved: true }, { suggested_by: req.user.email }];
      } else if (req.user?.type === 'intern') {
        filter.isApproved = true;
      }
      
      projects = await Project.find(filter).sort({ createdAt: -1 });
    }
    
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

// Fetch a single project by ID (company-restricted)
exports.getProjectById = async (req, res) => {
  // Check if user is verified first
  if (!req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before viewing projects' });
  }

  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Admin can see any project
    if (req.user?.type === 'admin') {
      return res.status(200).json({ success: true, data: project });
    }    // Other users can only see projects from their company
    if (!req.user?.company) {
      return res.status(403).json({ success: false, message: 'Company information is required to view projects' });
    }

    if (project.company !== req.user.company) {
      return res.status(403).json({ success: false, message: 'You can only view projects from your own company' });
    }

    // Developers can only see approved projects, HR can see all
    if (req.user?.type === 'developer' && !project.isApproved) {
      return res.status(403).json({ success: false, message: 'This project is pending approval' });
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Add a new project (protected)
exports.addProject = async (req, res) => {
  // Check if user is verified first
  if (!req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before adding projects' });
  }

  // only admin, developer, and hr can add projects
  if (!['admin', 'developer', 'hr'].includes(req.user?.type)) {
    return res.status(403).json({ success: false, message: 'Forbidden: only admin, developer, and HR can add projects' });
  }

  // HR and developer can only add projects for their own company
  if (req.user?.type !== 'admin') {
    if ((req.user?.type === 'hr' || req.user?.type === 'developer') && req.user?.isApproved && req.user?.company === req.body.company) {
      console.log(`${req.user.type} user adding project for their company`);
    } else {
      return res.status(403).json({ success: false, message: 'Forbidden: you can only add projects for your own company' });
    }
  }

  try {
    const { error, value } = projectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    // Set project approval and suggestion logic based on user type
    let projectData = { ...value, createdAt: new Date() };
    
    if (req.user?.type === 'developer') {
      // Developers suggest projects - need approval
      projectData.suggested_by = req.user.email;
      projectData.isApproved = false;
    } else if (req.user?.type === 'hr' || req.user?.type === 'admin') {
      // HR and admin can add projects with automatic approval
      projectData.suggested_by = req.user.email;
      projectData.isApproved = true;
    }

    const created = await Project.create(projectData);
    
    if (req.user?.type === 'developer') {
      res.status(201).json({ 
        success: true, 
        data: created, 
        message: 'Project suggestion submitted successfully. Awaiting HR approval.' 
      });
    } else {
      res.status(201).json({ success: true, data: created });
    }
  } catch (error) {
    console.error('Error adding project:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Update an existing project (protected)
exports.updateProject = async (req, res) => {
  // Check if user is verified first
  if (!req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before updating projects' });
  }

  try {
    const { id } = req.params;
    
    // Check if project exists first
    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // only admin, developer, and hr can update projects
    if (!['admin', 'developer', 'hr'].includes(req.user?.type)) {
      return res.status(403).json({ success: false, message: 'Forbidden: only admin, developer, and HR can update projects' });
    }

    // Admin has no restrictions, but HR and developer can only update projects from their own company
    if (req.user?.type !== 'admin') {
      if ((req.user?.type === 'hr' || req.user?.type === 'developer') && req.user?.isApproved) {
        // Check if user's company matches the project company
        if (req.user?.company === existingProject.company) {
          console.log(`${req.user.type} user updating project for their company`);
        } else {
          return res.status(403).json({ success: false, message: "You are not allowed to edit someone else's company projects" });
        }
      } else {
        return res.status(403).json({ success: false, message: 'Forbidden: you must be approved to update projects' });
      }
    }

    const { error, value } = projectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    
    const updatedProject = await Project.findByIdAndUpdate(id, { ...value, updatedAt: new Date() }, { new: true });
    res.status(200).json({ success: true, data: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Delete a project (protected)
exports.deleteProject = async (req, res) => {
  // Check if user is verified first
  if (!req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before deleting projects' });
  }

  try {
    const { id } = req.params;
    
    // Check if project exists first
    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // only admin, developer, and hr can delete projects
    if (!['admin', 'developer', 'hr'].includes(req.user?.type)) {
      return res.status(403).json({ success: false, message: 'Forbidden: only admin, developer, and HR can delete projects' });
    }

    // Admin has no restrictions, but HR and developer can only delete projects from their own company
    if (req.user?.type !== 'admin') {
      if ((req.user?.type === 'hr' || req.user?.type === 'developer') && req.user?.isApproved) {
        // Check if user's company matches the project company
        if (req.user?.company === existingProject.company) {
          console.log(`${req.user.type} user deleting project for their company`);
        } else {
          return res.status(403).json({ success: false, message: "You are not allowed to delete someone else's company projects" });
        }
      } else {
        return res.status(403).json({ success: false, message: 'Forbidden: you must be approved to delete projects' });
      }
    }

    await Project.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Fetch paginated projects with company restrictions
exports.getProjectsPaginated = async (req, res) => {
  console.log('Controller: getProjectsPaginated called');
  
  // Check if user is verified first
  if (!req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before viewing projects' });
  }

  try {
    const pageNum = parseInt(req.params.id) || 1;
    const limit = parseInt(process.env.PROJECTS_PER_PAGE) || 10;
    const skip = (pageNum - 1) * limit;

    let projects;
    let totalProjects;    // Admin can see all projects (approved and pending)
    if (req.user?.type === 'admin') {
      totalProjects = await Project.countDocuments();
      projects = await Project.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    } else {
      // Other users can only see projects from their company
      if (!req.user?.company) {
        return res.status(403).json({ success: false, message: 'Company information is required to view projects' });
      }
      
      let companyFilter = { company: req.user.company };
      
      // HR can see all projects from their company (approved and pending)
      // Developers can see approved projects and their own pending suggestions
      // Interns can only see approved projects
      if (req.user?.type === 'developer') {
        companyFilter.$or = [{ isApproved: true }, { suggested_by: req.user.email }];
      } else if (req.user?.type === 'intern') {
        companyFilter.isApproved = true;
      }
      
      totalProjects = await Project.countDocuments(companyFilter);
      projects = await Project.find(companyFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }

    const totalPages = Math.ceil(totalProjects / limit);

    res.status(200).json({ 
      success: true, 
      data: projects,
      pagination: {
        currentPage: pageNum,
        totalPages: totalPages,
        totalProjects: totalProjects,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        limit: limit
      }
    });
  } catch (error) {
    console.error('Error fetching paginated projects:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error', 
      error: error.message 
    });
  }
};

// Approve a project (HR/Admin only)
exports.approveProject = async (req, res) => {
  // Check if user is verified first
  if (!req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before approving projects' });
  }

  // Only HR and admin can approve projects
  if (!['admin', 'hr'].includes(req.user?.type)) {
    return res.status(403).json({ success: false, message: 'Forbidden: only HR and admin can approve projects' });
  }

  try {
    const { id } = req.params;
    
    // Check if project exists
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // HR can only approve projects from their company
    if (req.user?.type === 'hr' && project.company !== req.user.company) {
      return res.status(403).json({ success: false, message: 'You can only approve projects from your own company' });
    }

    // Update project status
    project.isApproved = true;
    project.approvedBy = req.user._id;
    project.approvedAt = new Date();
    await project.save();

    // Create project assignment entry
    const projectAssignment = new ProjectAssignment({
      projectId: project._id,
      company: project.company,
      assignedDevelopers: [{
        userId: project.suggested_by, // The developer who suggested the project
        assignedBy: req.user._id,
        assignedAt: new Date()
      }]
    });
    await projectAssignment.save();

    res.status(200).json({ 
      success: true, 
      data: project,
      message: 'Project approved successfully and assigned to the developer'
    });
  } catch (error) {
    console.error('Error approving project:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Get pending projects for approval (HR and admin only)
exports.getPendingProjects = async (req, res) => {
  // Check if user is verified first
  if (!req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before viewing pending projects' });
  }

  // Only HR and admin can view pending projects
  if (!['hr', 'admin'].includes(req.user?.type)) {
    return res.status(403).json({ success: false, message: 'Forbidden: only HR and admin can view pending projects' });
  }

  try {
    let filter = { isApproved: false };

    // HR can only see pending projects from their company
    if (req.user?.type === 'hr') {
      if (!req.user?.company) {
        return res.status(403).json({ success: false, message: 'Company information is required to view pending projects' });
      }
      filter.company = req.user.company;
    }

    const pendingProjects = await Project.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: pendingProjects });
  } catch (error) {
    console.error('Error fetching pending projects:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Get available projects for an intern to volunteer for
exports.getAvailableProjectsForIntern = async (req, res) => {
  // Check if user is an intern and verified
  if (req.user?.type !== 'intern' || !req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Forbidden: Only verified interns can view available projects.' });
  }

  try {
    const internId = req.user.userId;
    const internCompany = req.user.company;

    if (!internCompany) {
      return res.status(400).json({ success: false, message: 'You must be associated with a company to see projects.' });
    }

    // Find projects the intern is already assigned to or has volunteered for
    const existingAssignments = await ProjectAssignment.find({
      $or: [
        { 'assignedInterns.userId': internId },
        { 'volunteerInterns.userId': internId }
      ]
    }).select('projectId');

    const excludedProjectIds = existingAssignments.map(a => a.projectId);

    // Find all approved projects from the intern's company, excluding those they are already involved with
    const availableProjects = await Project.find({
      company: internCompany,
      isApproved: true,
      _id: { $nin: excludedProjectIds }
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: availableProjects });
  } catch (error) {
    console.error('Error fetching available projects for intern:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Get available projects for a developer to volunteer for
exports.getAvailableProjectsForDeveloper = async (req, res) => {
  // Check if user is a developer and verified
  if (req.user?.type !== 'developer' || !req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Forbidden: Only verified developers can view available projects.' });
  }

  try {
    const developerId = req.user.userId;
    const developerCompany = req.user.company;

    if (!developerCompany) {
      return res.status(400).json({ success: false, message: 'You must be associated with a company to see projects.' });
    }

    // Find projects the developer is already assigned to or has volunteered for
    const existingAssignments = await ProjectAssignment.find({
      $or: [
        { 'assignedDevelopers.userId': developerId },
        { 'volunteerDevelopers.userId': developerId }
      ]
    }).select('projectId');

    const excludedProjectIds = existingAssignments.map(a => a.projectId);

    // Find all approved projects from the developer's company, excluding those they are already involved with
    const availableProjects = await Project.find({
      company: developerCompany,
      isApproved: true,
      _id: { $nin: excludedProjectIds }
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: availableProjects });
  } catch (error) {
    console.error('Error fetching available projects for developer:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
