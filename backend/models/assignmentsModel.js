const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileUrl: {
    type: String,
    required: false
  },
  fileName: {
    type: String,
    required: false
  },
  fileType: {
    type: String,
    required: false,
    enum: ['pdf', 'doc', 'docx']
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'reviewed'],
    default: 'pending'
  },
  submission: {
    replyText: String, // Intern's text reply
    fileUrl: String,
    fileName: String,
    fileType: String,
    submittedAt: Date,
    submittedLate: {
      type: Boolean,
      default: false
    },
    feedback: String,
    grade: {
      type: String,
      enum: ['excellent', 'good', 'satisfactory', 'needs_improvement'],
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
assignmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Assignment', assignmentSchema);