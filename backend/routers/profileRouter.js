const express = require('express');
const router = express.Router();
const User = require('../models/usersModel');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// Middleware to authenticate and get user from token
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ success: false, message: 'Invalid token' });
    req.user = decoded;
    next();
  });
}

// Set up multer for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/profile-pics'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, req.user.userId + '-' + Date.now() + ext);
  }
});
const upload = multer({ storage });

// GET /api/profile - get current user's profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -verificationCode -verificationCodeValidation -forgotPasswordCode -forgotPasswordCodeValidation');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/profile - update current user's profile
router.put('/', authMiddleware, async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.company) updates.company = req.body.company;
    if (req.body.phone) updates.phone = req.body.phone;
    if (req.body.address) updates.address = req.body.address;
    if (req.body.linkedin) updates.linkedin = req.body.linkedin;
    if (req.body.github) updates.github = req.body.github;
    if (req.body.college) updates.college = req.body.college;
    if (req.body.branch) updates.branch = req.body.branch;
    if (req.body.profilePic) updates.profilePic = req.body.profilePic;
    const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true, runValidators: true }).select('-password -verificationCode -verificationCodeValidation -forgotPasswordCode -forgotPasswordCodeValidation');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/profile/picture - upload profile picture
router.post('/picture', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  // Return the relative URL or filename
  const url = `/uploads/profile-pics/${req.file.filename}`;
  res.json({ success: true, url });
});

module.exports = router;
