const User = require('../models/usersModel');
const Internship = require('../models/internshipsModel');
const Application = require('../models/applicationModel');

exports.getCompanyStats = async (req, res) => {
    try {
        if (!req.user || !req.user.company || !['hr', 'admin'].includes(req.user.type)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access Denied: User must be HR/Admin with company information.' 
            });
        }
        
        const companyId = req.user.company;

        const activeInterns = await User.countDocuments({
            company: companyId,
            type: 'intern',
            isApproved: true,
            verified: true
        });

        const activeDevelopers = await User.countDocuments({
            company: companyId,
            type: 'developer',
            isApproved: true,
            verified: true
        });

        const companyInternships = await Internship.find({ company: companyId }).select('_id');
        
        const internshipIds = companyInternships.map(internship => internship._id);

        let totalApplicants = 0;
        if (internshipIds.length > 0) {
            totalApplicants = await Application.countDocuments({
                internshipId: { $in: internshipIds },
                status : "pending"
            });
        }

        console.log('[StatsController] Successfully calculated all stats. Sending response.');
        res.status(200).json({
            success: true,
            data: {
                activeInterns,
                activeDevelopers,
                totalApplicants
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error while fetching company statistics.' });
    }
};

exports.getPlatformStats = async (req, res) => {
    try {
        if (!req.user || req.user.type !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access Denied: User must be a System Administrator.'
            });
        }

        const totalOpenings = await Internship.countDocuments();

        const allCompanyNames = await Internship.distinct('company', { company: { $ne: null, $ne: "" } });
        const totalCompanies = allCompanyNames.length;
        
        const totalCandidates = await User.countDocuments({ type: 'candidate' });
        
        const totalApplications = await Application.countDocuments();

        const totalUsers = await User.countDocuments();
        const userCountsByCompanyAggregated = await User.aggregate([
            {
                $match: {
                    company: { $in: allCompanyNames }, // Consider only users from companies that have posted internships
                    isApproved: true,
                    type: { $in: ['intern', 'developer', 'hr'] }
                }
            },
            {
                $group: {
                    _id: "$company", // Group by company name
                    numberOfInterns: { $sum: { $cond: [{ $eq: ["$type", "intern"] }, 1, 0] } },
                    numberOfDevelopers: { $sum: { $cond: [{ $eq: ["$type", "developer"] }, 1, 0] } },
                    numberOfHR: { $sum: { $cond: [{ $eq: ["$type", "hr"] }, 1, 0] } }
                }
            }
        ]);

        // Create a map for easy lookup of user counts
        const userCountsMap = new Map(userCountsByCompanyAggregated.map(item => [item._id, item]));

        // Construct companyWiseData ensuring all companies from allCompanyNames are included
        const companyWiseData = allCompanyNames.map(companyName => {
            const counts = userCountsMap.get(companyName);
            return {
                companyName: companyName,
                numberOfInterns: counts ? counts.numberOfInterns : 0,
                numberOfDevelopers: counts ? counts.numberOfDevelopers : 0,
                numberOfHR: counts ? counts.numberOfHR : 0,
            };
        }).sort((a, b) => a.companyName.localeCompare(b.companyName));
        
        res.status(200).json({
            success: true,
            data: {
                totalOpenings,
                totalCompanies,
                totalCandidates,
                totalApplications,
                totalUsers,
                companyWiseData 
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error while fetching platform statistics.', error: error.message });
    }
};

// Add other stats functions here if needed in the future, e.g.:
// exports.getSysAdminPlatformOverview = async (req, res) => { ... };
