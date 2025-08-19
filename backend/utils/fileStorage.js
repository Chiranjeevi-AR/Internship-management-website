const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directories exist
const reportsUploadDir = path.join(__dirname, '../uploads/reports');
const assignmentsUploadDir = path.join(__dirname, '../uploads/assignments');

if (!fs.existsSync(reportsUploadDir)) {
  fs.mkdirSync(reportsUploadDir, { recursive: true });
}
if (!fs.existsSync(assignmentsUploadDir)) {
  fs.mkdirSync(assignmentsUploadDir, { recursive: true });
}

// Configure multer storage for reports
const reportsStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, reportsUploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename: timestamp-randomnumber-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'report-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer storage for assignments
const assignmentsStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, assignmentsUploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename: timestamp-randomnumber-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'assignment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for PDFs only
const pdfFileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

// File filter for assignments (PDF, DOC, DOCX)
const assignmentFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed!'), false);
  }
};

// Configure multer for reports (PDF only)
const reportsUpload = multer({
  storage: reportsStorage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only allow 1 file per request
  }
});

// Configure multer for assignments (PDF, DOC, DOCX)
const assignmentsUpload = multer({
  storage: assignmentsStorage,
  fileFilter: assignmentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for assignments
    files: 1 // Only allow 1 file per request
  }
});

module.exports = {
  reportsUpload,
  assignmentsUpload,
  // Keep backward compatibility for reports
  upload: reportsUpload
};