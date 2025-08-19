const mongoose = require('mongoose');

// Track applications by candidates for internships
const applicationSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    internshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Internship',
      required: true,
    },
    // Application form fields
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    resume: {
      filename: {
        type: String,
        required: true,
      },
      data: {
        type: Buffer,
        required: true,
      },
      contentType: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        required: true,
      },
    },
    linkedinId: {
      type: String,
      required: true,
      trim: true,
    },
    githubId: {
      type: String,
      required: true,
      trim: true,
    },
    codingPlatformsId: {
      type: String,
      required: false,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'accepted', 'rejected', 'joined'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Application', applicationSchema);