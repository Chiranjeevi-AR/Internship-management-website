const mongoose = require('mongoose');
const Attendance = require('../models/attendanceModel');
const User = require('../models/usersModel');
const ProjectAssignment = require('../models/projectAssignmentsModel');
const Internship = require('../models/internshipsModel');
const moment = require('moment');

exports.checkIn = async (req, res) => {
  try {
    if (req.user.type !== 'intern') {
      return res.status(403).json({ success: false, message: 'Only interns can perform this action.' });
    }
    const userId = req.user.userId;
    const today = moment().startOf('day');

    let attendance = await Attendance.findOne({ userId, date: today.toDate() });

    if (attendance && attendance.checkIn) {
      return res.status(400).json({ success: false, message: 'Already checked in today.' });
    }

    if (!attendance) {
      attendance = new Attendance({ userId, date: today.toDate() });
    }

    attendance.checkIn = new Date();
    attendance.checkInIP = req.ip;
    attendance.checkInLocation = req.body.location || '';
    attendance.status = 'Present';
    attendance.markedBy = userId;
    attendance.markedAt = new Date();

    await attendance.save();
    res.json({ success: true, message: 'Checked in successfully.', data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Check-in failed.' });
  }
};

exports.checkOut = async (req, res) => {
  try {
    if (req.user.type !== 'intern') {
      return res.status(403).json({ success: false, message: 'Only interns can perform this action.' });
    }
    const userId = req.user.userId;
    const today = moment().startOf('day');
    let attendance = await Attendance.findOne({ userId, date: today.toDate() });
    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ success: false, message: 'Check-in required before check-out.' });
    }
    if (attendance.checkOut) {
      return res.status(400).json({ success: false, message: 'Already checked out today.' });
    }
    attendance.checkOut = new Date();
    attendance.checkOutIP = req.ip;
    attendance.checkOutLocation = req.body.location || '';
    attendance.totalHours = moment(attendance.checkOut).diff(moment(attendance.checkIn), 'hours', true);
    await attendance.save();
    res.json({ success: true, message: 'Checked out successfully.', data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Check-out failed.' });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    if (req.user.type !== 'intern') {
      return res.status(403).json({ success: false, message: 'Only interns can perform this action.' });
    }
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;
    const total = await Attendance.countDocuments({ userId });
    const records = await Attendance.find({ userId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
    res.json({ success: true, data: records, pagination: { page, limit, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance.' });
  }
};

exports.getAssignedInternsAttendance = async (req, res) => {
  try {
    if (req.user.type !== 'developer') {
      return res.status(403).json({ success: false, message: 'Only developers can perform this action.' });
    }
    const developerId = req.user.userId;

    const projects = await ProjectAssignment.find({ 'assignedDevelopers.userId': developerId });

    const assignedInternIds = new Set();
    projects.forEach(project => {
      project.assignedInterns.forEach(intern => {
        if (intern.userId && intern.userId._id) {
          assignedInternIds.add(intern.userId._id.toString());
        }
      });
    });

    const internIdArray = Array.from(assignedInternIds);
    
    if (internIdArray.length === 0) {
      return res.json({ success: true, data: [], summary: {}, pagination: { page: 1, limit: 30, total: 0 } });
    }

    const Application = require('../models/applicationModel');
    
    const applications = await Application.find({ 
      userId: { $in: internIdArray.map(id => new mongoose.Types.ObjectId(id)) },
      status: 'joined'
    }).populate('internshipId', 'internshipStartDate internshipEndDate');

    const internData = new Map();
    applications.forEach(application => {
      if (application.internshipId && application.internshipId.internshipStartDate) {
        const internId = application.userId.toString();
        const startDate = application.internshipId.internshipStartDate;
        const endDate = application.internshipId.internshipEndDate;
        
        if (!internData.has(internId) || startDate < internData.get(internId).startDate) {
          internData.set(internId, { 
            startDate, 
            endDate,
            userId: application.userId 
          });
        }
      }
    });

    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'day').startOf('day');
    
    for (const [internId, data] of internData) {
      const internshipStartDate = moment(data.startDate).startOf('day');
      const internshipEndDate = data.endDate ? moment(data.endDate).startOf('day') : yesterday;
      
      const startDate = internshipStartDate;
      const endDate = moment.min(internshipEndDate, yesterday);
      
      if (startDate.isAfter(endDate)) {
        continue;
      }
      
      const existingRecords = await Attendance.find({
        userId: data.userId,
        date: { $gte: startDate.toDate(), $lte: endDate.toDate() }
      }).select('date');
      
      const existingDates = new Set(existingRecords.map(record => 
        moment(record.date).format('YYYY-MM-DD')
      ));
      
      let currentDate = startDate.clone();
      while (currentDate.isBefore(endDate.clone().add(1, 'day'))) {
        const dateStr = currentDate.format('YYYY-MM-DD');
        const dayOfWeek = currentDate.day(); // 0 = Sunday, 6 = Saturday
        
        // Skip weekends (Saturday and Sunday)
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !existingDates.has(dateStr)) {
          try {
            await Attendance.create({
              userId: data.userId,
              date: currentDate.toDate(),
              status: 'Absent',
              remarks: 'Auto-marked absent by system',
              markedBy: 'System',
              markedAt: new Date()
            });
          } catch (error) {
            if (error.code !== 11000) {
              console.error(`Error creating record for ${internId} on ${dateStr}:`, error);
            }
          }
        }
        currentDate.add(1, 'day');
      }
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;
    
    const internObjectIds = internIdArray.map(id => new mongoose.Types.ObjectId(id));
    const total = await Attendance.countDocuments({ userId: { $in: internObjectIds } });
    const records = await Attendance.find({ userId: { $in: internObjectIds } })
      .populate('userId', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const recordsWithMarkedBy = await Promise.all(records.map(async (record) => {
      const recordObj = record.toObject();
      if (recordObj.markedBy && recordObj.markedBy !== 'System') {
        try {
          const markedByUser = await User.findById(recordObj.markedBy).select('name email');
          recordObj.markedBy = markedByUser;
        } catch (error) {
          recordObj.markedBy = null;
        }
      } else if (recordObj.markedBy === 'System') {
        recordObj.markedBy = { name: 'System', email: null };
      }
      return recordObj;
    }));

    const summaryAgg = await Attendance.aggregate([
      { $match: { userId: { $in: internObjectIds } } },
      { $group: {
        _id: { userId: "$userId", status: "$status" },
        count: { $sum: 1 }
      } }
    ]);
    
    const summary = {};
    summaryAgg.forEach(row => {
      const uid = row._id.userId.toString();
      if (!summary[uid]) summary[uid] = { Present: 0, Absent: 0 };
      if (row._id.status === 'Present' || row._id.status === 'Absent') {
        summary[uid][row._id.status] = row.count;
      }
    });

    res.json({ success: true, data: recordsWithMarkedBy, summary, pagination: { page, limit, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch assigned interns attendance.' });
  }
};

exports.updateAttendanceStatus = async (req, res) => {
  try {
    if (req.user.type !== 'developer' && req.user.type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only developers or admins can perform this action.' });
    }
    const attendanceId = req.params.id;
    const { status, remarks } = req.body;
    if (!attendanceId || !['Present', 'Absent'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid attendanceId or status.' });
    }
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }
    attendance.status = status;
    attendance.remarks = remarks || '';
    attendance.markedBy = req.user.userId;
    attendance.markedAt = new Date();
    await attendance.save();
    res.json({ success: true, message: 'Attendance status updated.', data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update attendance status.' });
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    const internUsers = await User.find({ type: 'intern' }, '_id');
    const internUserIds = internUsers.map(u => u._id);

    if (internUserIds.length === 0) {
      return res.json({ success: true, data: [], summary: {}, pagination: { page: 1, limit: 50, total: 0 } });
    }

    const Application = require('../models/applicationModel');
    
    const applications = await Application.find({ 
      userId: { $in: internUserIds },
      status: 'joined'
    }).populate('internshipId', 'internshipStartDate internshipEndDate');

    const internData = new Map();
    applications.forEach(application => {
      if (application.internshipId && application.internshipId.internshipStartDate) {
        const internId = application.userId.toString();
        const startDate = application.internshipId.internshipStartDate;
        const endDate = application.internshipId.internshipEndDate;
        
        if (!internData.has(internId) || startDate < internData.get(internId).startDate) {
          internData.set(internId, { 
            startDate, 
            endDate,
            userId: application.userId 
          });
        }
      }
    });

    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'day').startOf('day');
    
    for (const [internId, data] of internData) {
      const internshipStartDate = moment(data.startDate).startOf('day');
      const internshipEndDate = data.endDate ? moment(data.endDate).startOf('day') : yesterday;
      
      const startDate = internshipStartDate;
      const endDate = moment.min(internshipEndDate, yesterday);
      
      if (startDate.isAfter(endDate)) {
        continue;
      }
      
      const existingRecords = await Attendance.find({
        userId: data.userId,
        date: { $gte: startDate.toDate(), $lte: endDate.toDate() }
      }).select('date');
      
      const existingDates = new Set(existingRecords.map(record => 
        moment(record.date).format('YYYY-MM-DD')
      ));
      
      let currentDate = startDate.clone();
      while (currentDate.isBefore(endDate.clone().add(1, 'day'))) {
        const dateStr = currentDate.format('YYYY-MM-DD');
        const dayOfWeek = currentDate.day(); // 0 = Sunday, 6 = Saturday
        
        // Skip weekends (Saturday and Sunday)
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !existingDates.has(dateStr)) {
          try {
            await Attendance.create({
              userId: data.userId,
              date: currentDate.toDate(),
              status: 'Absent',
              remarks: 'Auto-marked absent by system',
              markedBy: 'System',
              markedAt: new Date()
            });
          } catch (error) {
            if (error.code !== 11000) {
              console.error(`Error creating record for ${internId} on ${dateStr}:`, error);
            }
          }
        }
        currentDate.add(1, 'day');
      }
    }

    const { date, internId, guideId, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (date) {
      const start = moment(date).startOf('day').toDate();
      const end = moment(date).endOf('day').toDate();
      filter.date = { $gte: start, $lte: end };
    }
    if (internId) filter.userId = internId;
    if (guideId) {
      if (guideId === 'System') {
        filter.markedBy = 'System';
      } else {
        filter.markedBy = guideId;
      }
    }
    
    filter.userId = filter.userId || { $in: internUserIds };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Attendance.countDocuments(filter);
    const records = await Attendance.find(filter)
      .populate({
        path: 'userId',
        select: 'name email'
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const recordsWithMarkedBy = await Promise.all(records.map(async (record) => {
      const recordObj = record.toObject();
      if (recordObj.markedBy && recordObj.markedBy !== 'System') {
        try {
          const markedByUser = await User.findById(recordObj.markedBy).select('name email');
          recordObj.markedBy = markedByUser;
        } catch (error) {
          recordObj.markedBy = null;
        }
      } else if (recordObj.markedBy === 'System') {
        recordObj.markedBy = { name: 'System', email: null };
      }
      return recordObj;
    }));

    const summaryAgg = await Attendance.aggregate([
      { $match: filter },
      { $group: {
        _id: { userId: "$userId", status: "$status" },
        count: { $sum: 1 }
      } }
    ]);
    const summary = {};
    summaryAgg.forEach(row => {
      const uid = row._id.userId.toString();
      if (!summary[uid]) summary[uid] = { Present: 0, Absent: 0 };
      if (row._id.status === 'Present' || row._id.status === 'Absent') {
        summary[uid][row._id.status] = row.count;
      }
    });
    res.json({ success: true, data: recordsWithMarkedBy, summary, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch all attendance.' });
  }
};
