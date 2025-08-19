const Report = require('../models/reportsModel');
const ProjectAssignment = require('../models/projectAssignmentsModel');
const fs = require('fs').promises;
const path = require('path');

// Intern submits a new report
exports.submitReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Report file (PDF) is required.' });
    }

    const { title, content, projectAssignmentId } = req.body;
    if (!title || !content || !projectAssignmentId) {
      await fs.unlink(req.file.path); // Clean up uploaded file if validation fails
      return res.status(400).json({ success: false, message: 'Title, content, and project assignment are required.' });
    }

    const projectAssignment = await ProjectAssignment.findById(projectAssignmentId);
    if (!projectAssignment) {
      await fs.unlink(req.file.path);
      return res.status(404).json({ success: false, message: 'Project assignment not found.' });
    }

    const isInternAssigned = projectAssignment.assignedInterns.some(
      intern => intern.userId.toString() === req.user.userId
    );

    if (!isInternAssigned) {
      await fs.unlink(req.file.path);
      return res.status(403).json({ success: false, message: 'You are not assigned to this project.' });
    }

    const report = new Report({
      intern: req.user.userId,
      projectAssignment: projectAssignmentId,
      title: title.trim(),
      content,
      reportFile: req.file.filename // Save just the filename
    });

    await report.save();
    res.status(201).json({ success: true, message: 'Report submitted successfully', data: report });
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    console.error("Error submitting report:", error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
};

// Get reports for the logged-in intern
exports.getInternReports = async (req, res) => {
  try {
    const reports = await Report.find({ intern: req.user.userId })
      .populate({
        path: 'projectAssignment',
        select: 'projectId',
        populate: {
            path: 'projectId',
            select: 'name'
        }
      })
      .sort({ submissionDate: -1 });
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get reports for projects the logged-in developer is mentoring
exports.getMentorReports = async (req, res) => {
  try {
    const developerId = req.user.userId;

    const assignments = await ProjectAssignment.find({ 'assignedDevelopers.userId': developerId }).select('_id');

    if (!assignments.length) {
        return res.json({ success: true, data: [] });
    }

    const assignmentIds = assignments.map(a => a._id);

    const reports = await Report.find({ projectAssignment: { $in: assignmentIds } })
      .populate('intern', 'name email')
      .populate({
        path: 'projectAssignment',
        select: 'projectId',
        populate: { path: 'projectId', select: 'name' }
      })
      .sort({ submissionDate: -1 });

    res.json({ success: true, data: reports });
  } catch (error) {
    console.error("Error fetching mentor reports:", error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
};

// Developer adds feedback to a report
exports.updateReportFeedback = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { feedback } = req.body;
    const developerId = req.user.userId;

    const report = await Report.findById(reportId).populate('projectAssignment');
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const isDeveloperOnProject = report.projectAssignment.assignedDevelopers.some(
        dev => dev.userId.toString() === developerId
    );

    if (!isDeveloperOnProject) {
        return res.status(403).json({ success: false, message: 'You are not a mentor on this project and cannot provide feedback.' });
    }

    report.mentorFeedback = feedback;
    report.status = 'reviewed';
    await report.save();

    res.json({ success: true, message: 'Feedback updated successfully', data: report });
  } catch (error) {
    console.error("Error adding feedback:", error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
};

// Download a submitted report file
exports.downloadReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.reportId).populate('projectAssignment');
        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        const user = req.user;
        const isInternOnProject = report.intern.toString() === user.userId;
        const isDeveloperOnProject = report.projectAssignment.assignedDevelopers.some(dev => dev.userId.toString() === user.userId);

        if (!isInternOnProject && !isDeveloperOnProject && user.type !== 'admin' && user.type !== 'hr') {
            return res.status(403).json({ success: false, message: 'You do not have permission to download this report.' });
        }

        const filePath = path.join(__dirname, '../uploads/reports', report.reportFile);
        
        await fs.access(filePath); // Check if file exists
        res.download(filePath);

    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({ success: false, message: 'Report file not found on server.' });
        }
        res.status(500).json({ success: false, message: 'Error downloading report.', error: error.message });
    }
};
