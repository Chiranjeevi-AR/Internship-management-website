const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  intern: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // The 'mentor' field is removed. We will get the mentors via the projectAssignment.
  projectAssignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectAssignment',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  reportFile: {
    type: String,  // This will store the file path from multer
    required: true
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed'],
    default: 'pending'
  },
  mentorFeedback: {
    type: String
  }
}, { timestamps: true });

// Create indexes for better query performance
reportSchema.index({ intern: 1, submissionDate: -1 });
reportSchema.index({ projectAssignment: 1 });

module.exports = mongoose.model('Report', reportSchema);
