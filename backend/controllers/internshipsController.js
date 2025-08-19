const Internship = require('../models/internshipsModel');
const Company = require('../models/companyModel');
const { internshipSchema, updateInternshipSchema } = require('../middlewares/validator');

// Fetch all available internships
exports.getAvailableInternships = async (req, res) => {
  console.log('Controller: getAvailableInternships called');
  try {
    const internships = await Internship.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: internships });
  } catch (error) {
    console.error('Error fetching internships:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

// Fetch internships for an organizational admin (HR) with pagination and search
exports.getOrgInternships = async (req, res) => {
  console.log('Controller: getOrgInternships called');
  console.log('User making request:', req.user); 
  try {
    if (req.user?.type !== 'hr' || !req.user?.isApproved) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only approved HR personnel can access this resource.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchTerm = req.query.search || '';
    const skip = (page - 1) * limit;

    const query = { company: req.user.company }; // Filter by the HR user's company

    if (searchTerm) {
      query.$or = [
        { role: { $regex: searchTerm, $options: 'i' } },
        { location: { $regex: searchTerm, $options: 'i' } },
        { skills: { $regex: searchTerm, $options: 'i' } } // Assuming skills are stored as an array of strings
      ];
    }

    const totalInternships = await Internship.countDocuments(query);
    const totalPages = Math.ceil(totalInternships / limit);

    const internships = await Internship.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: internships,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalInternships: totalInternships,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit: limit
      }
    });
  } catch (error) {
    console.error('Error fetching org internships:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

// Fetch a single internship by ID
exports.getInternshipById = async (req, res) => {
  try {
    const { id } = req.params;
    const internship = await Internship.findById(id);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }
    res.status(200).json({ success: true, data: internship });
  } catch (error) {
    console.error('Error fetching internship by ID:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Fetch paginated internships for front page
exports.getAvailableInternshipsFrontPage = async (req, res) => {
  console.log('Controller: getAvailableInternshipsFrontPage called');
  try {
    const pageNum = parseInt(req.params.id) || 1;
    const limit = parseInt(process.env.INTERNSHIP_PER_PAGE) || 10;
    const skip = (pageNum - 1) * limit;

    // Get total count for pagination info
    const totalInternships = await Internship.countDocuments();
    const totalPages = Math.ceil(totalInternships / limit);

    // Fetch internships with pagination
    const internships = await Internship.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({ 
      success: true, 
      data: internships,
      pagination: {
        currentPage: pageNum,
        totalPages: totalPages,
        totalInternships: totalInternships,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        limit: limit
      }
    });
  } catch (error) {
    console.error('Error fetching paginated internships:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error', 
      error: error.message 
    });
  }
};

// Add a new internship (protected)
exports.addInternship = async (req, res) => {
  // Check if user is verified first
  if (!req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before adding internships' });
  }

  // only admin or approved HR can add internships
  if (req.user?.type !== 'admin' && !(req.user?.type === 'hr' && req.user?.isApproved)) {
    return res.status(403).json({ success: false, message: 'Forbidden: only admin or approved HR can add internships' });
  }

  try {
        const {
            role,
            company,
            location,
            stipend, // This will be an object { amount, currency }
            duration,
            jobDescription,
            skills,
            type,
            internshipStartDate,
            internshipEndDate,
            openings,
        } = req.body;

        // Auto-register company if not exists
        if (company) {
          await Company.updateOne({ name: company }, { name: company }, { upsert: true });
        }

        // Prevent duplicate internships
        const existingInternship = await Internship.findOne({
            role: { $regex: new RegExp(`^${role}$`, 'i') },
            company: { $regex: new RegExp(`^${company}$`, 'i') },
            location: { $regex: new RegExp(`^${location}$`, 'i') },
        });

        if (existingInternship) {
            return res.status(409).json({ success: false, message: 'An internship with the same role, company, and location already exists.' });
        }

        // Auto-calculate duration if start and end dates are provided
        let calculatedDuration = duration;
        if (!duration && internshipStartDate && internshipEndDate) {
            const start = new Date(internshipStartDate);
            const end = new Date(internshipEndDate);
            const durationInMilliseconds = end - start;
            calculatedDuration = Math.ceil(durationInMilliseconds / (1000 * 60 * 60 * 24)) + ' days';
        }

        const newInternship = new Internship({
            role,
            company, // Use company from form
            location,
            stipend, // stipend is now an object
            duration: calculatedDuration,
            jobDescription,
            skills: skills, // Use skills array directly
            type,
            internshipStartDate,
            internshipEndDate,
            createdAt: new Date(),
            openings,
        });

        await newInternship.save();
        res.status(201).json({ success: true, data: newInternship });
    } catch (error) {
        console.error('Error adding internship:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


exports.updateInternship = async (req, res) => {
  // Check if user is verified first
  if (!req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before updating internships' });
  }

  try {
    const { id } = req.params;
    
    // Check if internship exists first
    const existingInternship = await Internship.findById(id);
    if (!existingInternship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    // only admin can update internships
    if (req.user?.type !== 'admin') {
      if (req.user?.type === 'hr' && req.user?.isApproved) {
        // Check if HR user's company matches the internship company
        if (req.user?.company === existingInternship.company) {
          console.log('HR user updating internship for their company');
        } else {
          return res.status(403).json({ success: false, message: "You are not allowed to edit someone else's company information" });
        }
      } else {
        return res.status(403).json({ success: false, message: 'Forbidden: only admin can update internships' });
      }
    }

    const { error, value } = updateInternshipSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    
    // Calculate duration if dates are provided
    if (value.internshipStartDate && value.internshipEndDate) {
        const startDate = new Date(value.internshipStartDate);
        const endDate = new Date(value.internshipEndDate);
        const durationInMilliseconds = endDate - startDate;
        const durationInDays = Math.ceil(durationInMilliseconds / (1000 * 60 * 60 * 24));
        value.duration = `${durationInDays} days`;
    }

    const updatedInternship = await Internship.findByIdAndUpdate(id, value, { new: true });
    res.status(200).json({ success: true, data: updatedInternship });
  } catch (error) {
    console.error('Error updating internship:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

exports.deleteInternship = async (req, res) => {
  // Check if user is verified first
  if (!req.user?.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before deleting internships' });
  }

  try {
    const { id } = req.params;
    
    // Check if internship exists first
    const existingInternship = await Internship.findById(id);
    if (!existingInternship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    // only admin can delete internships
    if (req.user?.type !== 'admin') {
      if (req.user?.type === 'hr' && req.user?.isApproved) {
        // Check if HR user's company matches the internship company
        if (req.user?.company === existingInternship.company) {
          console.log('HR user deleting internship for their company');
        } else {
          return res.status(403).json({ success: false, message: "You are not allowed to edit someone else's company information" });
        }
      } else {
        return res.status(403).json({ success: false, message: 'Forbidden: only admin can delete internships' });
      }
    }

    const deletedInternship = await Internship.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Internship deleted successfully' });
  } catch (error) {
    console.error('Error deleting internship:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}