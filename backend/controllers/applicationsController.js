const Application = require('../models/applicationModel');
const User = require('../models/usersModel');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { applySchema } = require('../middlewares/validator');
const transport = require('../middlewares/sendMail');
const Internship = require('../models/internshipsModel'); // Import Internship model

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: (process.env.MAX_FILE_SIZE_MB || 4) * 1024 * 1024 // Default 4MB
  },
  fileFilter: (req, file, cb) => {
    // Accept only PDF files for resume
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for resume upload'), false);
    }
  }
});

// Export the multer middleware for use in routes
exports.uploadResume = upload.single('resume');

// Candidate applies for an internship with security check and form data
exports.applyToInternship = async (req, res) => {
  let token;

  // Get token from headers or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.Authorization) {
    token = req.cookies.Authorization.replace('Bearer ', '');
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    const applicant = await User.findById(decoded.userId); // Fetch the full user object for blacklist check

    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Applicant not found.'});
    }
    
    // Security check: ensure user can only apply for themselves
    if (req.body.userId && req.body.userId !== decoded.userId) {
      return res.status(403).json({ success: false, message: "You can't apply for someone else's account" });
    }    // Only candidates can apply
    if (decoded.type !== 'candidate') {
      return res.status(403).json({ success: false, message: 'Forbidden: only candidates can apply' });
    }    // Only verified users can apply for internships
    if (!decoded.verified) {
      return res.status(403).json({ success: false, message: 'Please verify your email before applying for internships' });
    }

    // Validate the form data
    const { error, value } = applySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    // Check if resume file is uploaded
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Resume file is required' });
    }

    const { internshipId, fullName, address, linkedinId, githubId, codingPlatformsId } = value;

    // --- Blacklist Check ---
    const internshipToApply = await Internship.findById(internshipId);
    if (!internshipToApply) {
      return res.status(404).json({ success: false, message: 'Internship not found.' });
    }

    if (applicant.blacklistedByCompanies && applicant.blacklistedByCompanies.includes(internshipToApply.company)) {
      return res.status(403).json({
        success: false,
        message: `You are unable to apply to this internship as you have been blacklisted by ${internshipToApply.company}.`,
        reason: 'blacklisted'
      });
    }
    // --- End Blacklist Check ---

    // Use the decoded userId from token (not from request body)
    const userId = decoded.userId;

    // Check for duplicate applications
    const existing = await Application.findOne({ userId, internshipId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already applied for this internship' });
    }

    // Create application with form data and file
    const applicationData = {
      userId,
      internshipId,
      fullName,
      address,
      linkedinId,
      githubId,
      codingPlatformsId,
      resume: {
        filename: req.file.originalname,
        data: req.file.buffer,
        contentType: req.file.mimetype,
        size: req.file.size
      }
    };

    const app = await Application.create(applicationData);
    
    // Return application data without the resume buffer to avoid large response
    const responseData = {
      ...app.toObject(),
      resume: {
        filename: app.resume.filename,
        contentType: app.resume.contentType,
        size: app.resume.size
      }
    };

    res.status(201).json({ 
      success: true, 
      data: responseData, 
      message: 'Application submitted successfully' 
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: `File size too large. Maximum allowed: ${process.env.MAX_FILE_SIZE_MB || 4}MB` });
    }
    if (error.message.includes('Only PDF files are allowed')) {
      return res.status(400).json({ success: false, message: 'Only PDF files are allowed for resume upload' });
    }
    res.status(500).json({ success: false, message: 'Internal Server Error during application submission' });
  }
};

// Get all applications (Admin only)
exports.getAllApplications = async (req, res) => {
  let token;

  // Get token from headers or cookies
  if (req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  } else if (req.cookies && req.cookies.Authorization) {
    token = req.cookies.Authorization.replace('Bearer ', '');
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    
    // Check if user is verified
    if (!decoded.verified) {
      return res.status(403).json({ success: false, message: 'Please verify your email before viewing applications' });
    }
    
    // Only admins can view all applications
    if (decoded.type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: admin access required' });
    }

    const applications = await Application.find()
      .populate('userId', 'email type')
      .populate('internshipId', 'role company location')
      //.select('-resume.data') // Exclude resume data from response
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      data: applications, 
      message: 'Applications retrieved successfully' 
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    res.status(500).json({ success: false, message: 'Internal Server Error while retrieving applications' });
  }
};

// Get applications for HR (HR only, for their company's internships)
exports.getApplicationsForHr = async (req, res) => {
  try {
    if (!req.user || req.user.type !== 'hr' || !req.user.isApproved) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only approved HR personnel can access this resource.' });
    }

    const hrCompany = req.user.company;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const statusFilter = req.query.status; // e.g., 'pending', 'accepted', 'rejected'
    const internshipFilter = req.query.internshipId; // filter by a specific internship ID

    // Find internships belonging to the HR's company
    const companyInternshipIds = await require('../models/internshipsModel').find({ company: hrCompany }).distinct('_id');

    if (!companyInternshipIds || companyInternshipIds.length === 0) {
      return res.status(200).json({ 
        success: true, 
        data: [], 
        pagination: { currentPage: 1, totalPages: 0, totalApplications: 0, limit: limit },
        message: 'No internships found for your company.' 
      });
    }

    let query = { internshipId: { $in: companyInternshipIds } };
    // Do NOT filter by user verification status
    if (statusFilter) {
      query.status = statusFilter;
    }
    if (internshipFilter) {
      // Ensure the filtered internship actually belongs to the HR's company
      if (companyInternshipIds.map(id => id.toString()).includes(internshipFilter)) {
        query.internshipId = internshipFilter;
      } else {
        return res.status(403).json({ success: false, message: "You can only filter by internships belonging to your company." });
      }
    }
    
    const totalApplications = await Application.countDocuments(query);
    const totalPages = Math.ceil(totalApplications / limit);

    const applications = await Application.find(query)
      .populate('userId', 'email type fullName') // Added fullName
      .populate('internshipId', 'role company location')
      .select('-resume.data') // Exclude resume data from list
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalApplications: totalApplications,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit: limit
      },
      message: 'Applications retrieved successfully'
    });

  } catch (error) {
    console.error("Error in getApplicationsForHr:", error);
    res.status(500).json({ success: false, message: 'Internal Server Error while retrieving applications for HR' });
  }
};

// Download resume (Admin only)
exports.downloadResume = async (req, res) => {
  let token;

  // Get token from headers or cookies
  if (req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  } else if (req.cookies && req.cookies.Authorization) {
    token = req.cookies.Authorization.replace('Bearer ', '');
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    
    // Only admins can download resumes
    if (decoded.type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: admin access required' });
    }

    const { applicationId } = req.params;
    const application = await Application.findById(applicationId);

    if (!application || !application.resume || !application.resume.data) {
      return res.status(404).json({ success: false, message: 'Application or resume not found' });
    }

    res.set({
      'Content-Type': application.resume.contentType,
      'Content-Disposition': `attachment; filename="${application.resume.filename}"`,
      'Content-Length': application.resume.size
    });

    res.send(application.resume.data);

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    res.status(500).json({ success: false, message: 'Internal Server Error during resume download' });
  }
};

// Download resume for HR (HR only, for their company's internships)
exports.downloadResumeForHr = async (req, res) => {
  try {
    if (!req.user || req.user.type !== 'hr' || !req.user.isApproved) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only approved HR personnel can download resumes.' });
    }

    const { applicationId } = req.params;
    const application = await Application.findById(applicationId).populate('internshipId', 'company');

    if (!application || !application.resume || !application.resume.data) {
      return res.status(404).json({ success: false, message: 'Application or resume not found' });
    }

    // Security check: Ensure the application is for an internship within the HR's company
    if (application.internshipId.company !== req.user.company) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only download resumes for your company\'s internships.' });
    }
    
    res.set({
      'Content-Type': application.resume.contentType,
      'Content-Disposition': `attachment; filename="${application.resume.filename}"`,
      'Content-Length': application.resume.size
    });

    res.send(application.resume.data);

  } catch (error) {
    console.error("Error in downloadResumeForHr:", error);
    if (error.name === 'JsonWebTokenError') { // Though identifier middleware should catch this
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    res.status(500).json({ success: false, message: 'Internal Server Error during resume download for HR' });
  }
};

// Get applied internship IDs for a candidate
exports.getAppliedInternshipIdsForCandidate = async (req, res) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.Authorization) {
    token = req.cookies.Authorization.replace('Bearer ', '');
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    const requestedUserId = req.params.userId;

    // Security check: User can only access their own application data
    if (decoded.userId !== requestedUserId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only access your own application data.' });
    }

    // Ensure the user is a candidate
    if (decoded.type !== 'candidate') {
      return res.status(403).json({ success: false, message: 'Forbidden: Only candidates can access this resource.' });
    }

    const applications = await Application.find({ userId: requestedUserId }).select('internshipId -_id');
    const appliedInternshipIds = applications.map(app => app.internshipId.toString());

    res.status(200).json({ 
      success: true, 
      data: appliedInternshipIds, 
      message: 'Applied internship IDs retrieved successfully' 
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    console.error("Error in getAppliedInternshipIdsForCandidate:", error);
    res.status(500).json({ success: false, message: 'Internal Server Error while retrieving applied internship IDs' });
  }
};

// Update application status (Admin only)
exports.updateApplicationStatus = async (req, res) => {
  let token;

  // Get token from headers or cookies
  if (req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  } else if (req.cookies && req.cookies.Authorization) {
    token = req.cookies.Authorization.replace('Bearer ', '');
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    
    // Check if user is verified
    if (!decoded.verified) {
      return res.status(403).json({ success: false, message: 'Please verify your email before updating application status' });
    }
    
    // Only admins can update application status
    if (decoded.type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: admin access required' });
    }

    const { applicationId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'reviewed', 'accepted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const application = await Application.findByIdAndUpdate(
      applicationId,
      { status },
      { new: true }
    ).populate('userId', 'email type')
     .populate('internshipId', 'role company location');
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // If application is accepted, send congratulations email and update user type
    if (status === 'accepted') {
      try {
        // Get the user details
        const user = await User.findById(application.userId);
        if (user) {
          // Send congratulations email
          const emailInfo = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: user.email,
            subject: 'Congratulations! Your Internship Application has been Accepted',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #4CAF50; text-align: center;">🎉 Congratulations!</h1>
                <h2 style="color: #333;">Your Internship Application has been Accepted!</h2>
                <p style="font-size: 16px; line-height: 1.5; color: #666;">
                  Dear ${user.email},
                </p>
                <p style="font-size: 16px; line-height: 1.5; color: #666;">
                  We are thrilled to inform you that your application for the <strong>${application.internshipId.role}</strong> role at <strong>${application.internshipId.company}</strong> has been accepted!
                </p>
                <p style="font-size: 16px; line-height: 1.5; color: #666;">
                  Further details regarding your internship will be communicated to you shortly. 
                  In the meantime, your user role on the TallyIntern platform will be updated to 'Intern'.
                </p>
                <p style="font-size: 16px; line-height: 1.5; color: #666;">
                  Congratulations once again, and welcome aboard!
                </p>
                <p style="font-size: 16px; line-height: 1.5; color: #666;">
                  Best regards,<br>
                  The TallyIntern Team
                </p>
              </div>
            `,
          });

        } else {
        }
      } catch (emailError) {
      }
    }

    res.status(200).json({ 
      success: true, 
      data: application, 
      message: 'Application status updated successfully' 
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    // console.error('Error updating application status:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error during application status update' });
  }
};

// Update application status for HR (HR only, for their company's internships)
exports.updateApplicationStatusForHr = async (req, res) => {
  try {
    if (!req.user || req.user.type !== 'hr' || !req.user.isApproved) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only approved HR personnel can update application status.' });
    }

    const { applicationId } = req.params;
    const { status } = req.body; // Expected status: 'accepted', 'rejected' (HR might not use 'reviewed' or 'pending')

    const validStatuses = ['accepted', 'rejected', 'pending', 'reviewed']; // HR can set these
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status provided.' });
    }

    const application = await Application.findById(applicationId).populate('internshipId', 'company role').populate('userId', 'email type');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Security check: Ensure the application is for an internship within the HR's company
    if (application.internshipId.company !== req.user.company) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only update status for your company\'s internship applications.' });
    }

    // Prevent updating status if already finalized (accepted/rejected) by HR unless changing between them
    // if (['accepted', 'rejected'].includes(application.status) && application.status !== status) {
    //   return res.status(400).json({ success: false, message: `Application is already ${application.status}.` });
    // }


    const updatedApplication = await Application.findByIdAndUpdate(
      applicationId,
      { status },
      { new: true }
    ).populate('userId', 'email type').populate('internshipId', 'role company location internshipEndDate');

    if (!updatedApplication) {
      // Should not happen if previous findById worked, but as a safeguard
      return res.status(404).json({ success: false, message: 'Application not found during update.' });
    }
    
    // If application is accepted, update user type to 'intern' and set isApproved to true
    if (status === 'accepted' && updatedApplication.userId.type === 'candidate') {
      const userToUpdate = await User.findById(updatedApplication.userId._id);
      if (userToUpdate) {
        // Ensure the name field is set from the application's fullName to pass validation
        if (!userToUpdate.name && updatedApplication.fullName) {
          userToUpdate.name = updatedApplication.fullName;
        }
        // Send congratulations email
        try {
          await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: userToUpdate.email,
            subject: 'Congratulations! Your Internship Application has been Accepted',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #4CAF50; text-align: center;">🎉 Congratulations!</h1>
                <h2 style="color: #333;">Your Internship Application has been Accepted!</h2>
                <p style="font-size: 16px; line-height: 1.5; color: #666;">
                  Dear ${userToUpdate.email},
                </p>
                <p style="font-size: 16px; line-height: 1.5; color: #666;">
                  We are thrilled to inform you that your application for the <strong>${updatedApplication.internshipId.role}</strong> role at <strong>${updatedApplication.internshipId.company}</strong> has been accepted!
                </p>
                <p style="font-size: 16px; line-height: 1.5; color: #666;">
                  Please log in to your account to review the offer details and confirm your acceptance. You can choose to join the company from your applications dashboard.
                </p>
                <p style="font-size: 16px; line-height: 1.5; color: #666;">
                  Welcome aboard!
                </p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #999; text-align: center;">
                  This is an automated message. Please do not reply directly to this email.
                </p>
              </div>
            `
          });
        } catch (emailError) {
          console.error("Error sending acceptance email:", emailError);
          // Non-critical, so don't fail the whole request
        }
      }
    } else if (status === 'rejected') {
        // Optionally send a rejection email
         const userToNotify = await User.findById(updatedApplication.userId._id);
         if(userToNotify){
            try {
                await transport.sendMail({
                    from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
                    to: userToNotify.email,
                    subject: 'Internship Application Update',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h2 style="color: #333;">Internship Application Update</h2>
                            <p style="font-size: 16px; line-height: 1.5; color: #666;">
                                Dear ${userToNotify.email},
                            </p>
                            <p style="font-size: 16px; line-height: 1.5; color: #666;">
                                Thank you for your interest in the <strong>${updatedApplication.internshipId.role}</strong> role at <strong>${updatedApplication.internshipId.company}</strong>.
                            </p>
                            <p style="font-size: 16px; line-height: 1.5; color: #666;">
                                We have reviewed your application and, after careful consideration, we have decided not to move forward at this time.
                            </p>
                            <p style="font-size: 16px; line-height: 1.5; color: #666;">
                                We wish you the best in your job search and future endeavors.
                            </p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                            <p style="font-size: 12px; color: #999; text-align: center;">
                              This is an automated message. Please do not reply directly to this email.
                            </p>
                        </div>
                    `
                });
            } catch (emailError) {
                console.error("Error sending rejection email:", emailError);
            }
         }
    }


    // This part should only be reached for non-accepted statuses or if the user was not updated.
    return res.status(200).json({
      success: true,
      data: updatedApplication,
      message: `Application status updated to ${status}`
    });

  } catch (error) {
    console.error("Error in updateApplicationStatusForHr:", error);
    res.status(500).json({ success: false, message: 'Internal Server Error while updating application status for HR' });
  }
};

// HR can delete a processed application record for their company
exports.deleteApplicationForHr = async (req, res) => {
  try {
    if (!req.user || req.user.type !== 'hr' || !req.user.isApproved) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only approved HR personnel can delete applications.' });
    }

    const { applicationId } = req.params;
    const application = await Application.findById(applicationId).populate('internshipId', 'company');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Security check: Ensure the application is for an internship within the HR's company
    if (application.internshipId.company !== req.user.company) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only delete applications for your company\'s internships.' });
    }

    // Optional: Only allow deletion of already processed (accepted/rejected) applications
    // if (!['accepted', 'rejected'].includes(application.status)) {
    //   return res.status(400).json({ success: false, message: 'Only processed (accepted or rejected) applications can be deleted by HR.' });
    // }

    await Application.findByIdAndDelete(applicationId);

    res.status(200).json({
      success: true,
      message: 'Application record deleted successfully.'
    });

  } catch (error) {
    console.error("Error in deleteApplicationForHr:", error);
    res.status(500).json({ success: false, message: 'Internal Server Error while deleting application for HR' });
  }
};

// Get applications for the logged-in candidate
exports.getMyApplications = async (req, res) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.Authorization) {
    token = req.cookies.Authorization.replace('Bearer ', '');
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

    if (decoded.type !== 'candidate') {
      return res.status(403).json({ success: false, message: 'Forbidden: Only candidates can access their applications.' });
    }

    const applications = await Application.find({ userId: decoded.userId })
      .populate({
        path: 'internshipId',
        select: 'role company location stipend',
      })
      .select('-resume.data')
      .sort({ createdAt: -1 });

    if (!applications) {
      return res.status(404).json({ success: false, message: 'No applications found for this user.' });
    }
    
    const processedApplications = applications.map(app => {
      const appObj = app.toObject();
      let finalRole = 'N/A'; // Default for role/title
      let finalCompany = 'N/A'; // Default for company

      if (appObj.internshipId) {
        // Handle role (which serves as the title)
        if (typeof appObj.internshipId.role === 'string' && appObj.internshipId.role.trim() !== '') {
          finalRole = appObj.internshipId.role;
        } else if (appObj.internshipId.role) { 
          finalRole = String(appObj.internshipId.role);
        } else {
          finalRole = 'Role not available'; // More specific default if field exists but is empty/null
        }

        // Handle company
        const companyData = appObj.internshipId.company;
        if (typeof companyData === 'string' && companyData.trim() !== '') {
          finalCompany = companyData;
        } else if (companyData && typeof companyData === 'object' && typeof companyData.name === 'string' && companyData.name.trim() !== '') {
          finalCompany = companyData.name; 
        } else if (companyData) { 
            finalCompany = String(companyData);
        } else {
          finalCompany = 'Company not available';
        }
      } else {
        finalRole = 'Internship no longer available';
        // finalCompany remains 'N/A' from initialization
      }

      appObj.internship = {
        title: finalRole, // Send to frontend as 'title' for consistency if MyApplications.jsx expects that
        company: finalCompany 
      };
      
      delete appObj.internshipId; 

      return appObj;
    });

    res.status(200).json({
      success: true,
      applications: processedApplications,
      message: 'Candidate applications retrieved successfully'
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    console.error('Error in getMyApplications:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error while retrieving your applications' });
  }
};

// Candidate accepts a company offer and becomes an intern
exports.acceptOffer = async (req, res) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.Authorization) {
    token = req.cookies.Authorization.replace('Bearer ', '');
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

    if (decoded.type !== 'candidate') {
      return res.status(403).json({ success: false, message: 'Forbidden: Only candidates can accept offers.' });
    }

    const { applicationId } = req.params;
    
    const application = await Application.findById(applicationId)
      .populate('internshipId', 'role company location internshipEndDate stipend')
      .populate('userId', 'email name');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Security check: ensure candidate can only accept their own applications
    if (application.userId._id.toString() !== decoded.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only accept your own applications.' });
    }

    // Check if application is accepted by company
    if (application.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'This application has not been accepted by the company yet.' });
    }

    // Get the user and update their type to intern
    const userToUpdate = await User.findById(decoded.userId);
    if (!userToUpdate) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check if user is already an intern
    if (userToUpdate.type === 'intern') {
      return res.status(400).json({ success: false, message: 'You are already registered as an intern.' });
    }

    // Update user to intern status
    userToUpdate.type = 'intern';
    userToUpdate.company = application.internshipId.company;
    userToUpdate.isApproved = true;
    userToUpdate.endDate = application.internshipId.internshipEndDate;
    
    // Store stipend in user's collection
    if (application.internshipId.stipend) {
      userToUpdate.stipend = {
        amount: application.internshipId.stipend.amount,
        currency: application.internshipId.stipend.currency
      };
    }
    
    // Ensure name is set
    if (!userToUpdate.name && application.fullName) {
      userToUpdate.name = application.fullName;
    }

    await userToUpdate.save();

    // Update application status to indicate the candidate has joined
    application.status = 'joined';
    await application.save();

    // Send confirmation email
    try {
      await transport.sendMail({
        from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
        to: userToUpdate.email,
        subject: 'Welcome to Your Internship!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4CAF50; text-align: center;">🎉 Welcome Aboard!</h1>
            <h2 style="color: #333;">Your Internship Journey Begins!</h2>
            <p style="font-size: 16px; line-height: 1.5; color: #666;">
              Dear ${userToUpdate.name || userToUpdate.email},
            </p>
            <p style="font-size: 16px; line-height: 1.5; color: #666;">
              Congratulations! You have successfully accepted the offer for the <strong>${application.internshipId.role}</strong> position at <strong>${application.internshipId.company}</strong>.
            </p>
            <p style="font-size: 16px; line-height: 1.5; color: #666;">
              You are now registered as an intern in our system. You can access your intern dashboard to view assignments, projects, and communicate with your mentors.
            </p>
            <p style="font-size: 16px; line-height: 1.5; color: #666;">
              We wish you all the best in your internship journey!
            </p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              This is an automated message. Please do not reply directly to this email.
            </p>
          </div>
        `
      });
    } catch (emailError) {
    }

    res.status(200).json({
      success: true,
      message: 'Offer accepted successfully! You are now registered as an intern.',
      data: {
        userType: 'intern',
        company: application.internshipId.company,
        role: application.internshipId.role,
        stipend: application.internshipId.stipend
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    res.status(500).json({ success: false, message: 'Internal Server Error while accepting offer' });
  }
};