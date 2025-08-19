const mongoose = require('mongoose');

// Internship schema with detailed fields
const internshipSchema = mongoose.Schema(
  {
    role: { type: String, required: [true, 'Role is required!'] },
    company: { type: String, required: [true, 'Company is required!'] },
    location: { type: String, required: [true, 'Location is required!'] },
    internshipStartDate: { type: Date, required: [true, 'Internship Start Date is required!'] },
    internshipEndDate: { type: Date, required: [true, 'Internship End Date is required!'] },
    duration: { type: String },
    type: { type: String, required: [true, 'Internship type is required!'] },
    skills: [{ type: String }],
    stipend: {
        amount: { type: Number },
        currency: { type: String, enum: ['INR', 'USD'] }
    },
    expectedSalary: { type: Number },
    eligibility: { type: String },
    openings: { type: Number },
    jobDescription: { type: String },
    applyLink: { type: String },
    assignedInterns: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Internship', internshipSchema);
