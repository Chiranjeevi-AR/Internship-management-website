const User = require('../models/usersModel');
const Internship = require('../models/internshipsModel'); // Needed for checking company context if applying

// HR blacklists a candidate for their company
exports.blacklistCandidate = async (req, res) => {
  try {
    const hrUser = req.user; // Assuming identifier middleware populates req.user
    const { candidateEmail } = req.body;

    if (!hrUser || hrUser.type !== 'hr' || !hrUser.isApproved) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only approved HR personnel can perform this action.' });
    }

    if (!candidateEmail) {
      return res.status(400).json({ success: false, message: 'Candidate email is required.' });
    }

    const candidate = await User.findOne({ email: candidateEmail });

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }

    if (candidate.type !== 'candidate' && candidate.type !== 'intern') {
      return res.status(400).json({ success: false, message: 'Can only blacklist candidates or interns.' });
    }

    // Prevent HR from blacklisting themselves or other HRs/Admins
    if (candidate._id.equals(hrUser._id) || candidate.type === 'hr' || candidate.type === 'admin') {
        return res.status(400).json({ success: false, message: 'Invalid action.' });
    }
    
    const hrCompany = hrUser.company;

    if (candidate.blacklistedByCompanies.includes(hrCompany)) {
      return res.status(400).json({ success: false, message: `Candidate is already blacklisted by ${hrCompany}.` });
    }

    candidate.blacklistedByCompanies.push(hrCompany);
    await candidate.save();

    res.status(200).json({ success: true, message: `Candidate ${candidateEmail} has been blacklisted by ${hrCompany}.` });

  } catch (error) {
    console.error('Error blacklisting candidate:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};

// HR unblacklists a candidate for their company
exports.unblacklistCandidate = async (req, res) => {
  try {
    const hrUser = req.user;
    const { candidateEmail } = req.body;

    if (!hrUser || hrUser.type !== 'hr' || !hrUser.isApproved) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only approved HR personnel can perform this action.' });
    }

    if (!candidateEmail) {
      return res.status(400).json({ success: false, message: 'Candidate email is required.' });
    }

    const candidate = await User.findOne({ email: candidateEmail });

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }
    
    const hrCompany = hrUser.company;

    if (!candidate.blacklistedByCompanies.includes(hrCompany)) {
      return res.status(400).json({ success: false, message: `Candidate is not currently blacklisted by ${hrCompany}.` });
    }

    candidate.blacklistedByCompanies = candidate.blacklistedByCompanies.filter(company => company !== hrCompany);
    await candidate.save();

    res.status(200).json({ success: true, message: `Candidate ${candidateEmail} has been removed from the blacklist for ${hrCompany}.` });

  } catch (error) {
    console.error('Error unblacklisting candidate:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};

// HR gets a list of candidates blacklisted by their company
exports.getBlacklistedCandidatesByMyCompany = async (req, res) => {
  try {
    const hrUser = req.user;

    if (!hrUser || hrUser.type !== 'hr' || !hrUser.isApproved) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only approved HR personnel can perform this action.' });
    }

    const hrCompany = hrUser.company;
    const blacklistedUsers = await User.find({ blacklistedByCompanies: hrCompany })
                                       .select('email type blacklistedByCompanies'); // Select relevant fields

    res.status(200).json({ success: true, data: blacklistedUsers });

  } catch (error) {
    console.error('Error fetching blacklisted candidates:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};
