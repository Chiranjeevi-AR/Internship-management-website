const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  checkInIP: { type: String },
  checkOutIP: { type: String },
  checkInLocation: { type: String },
  checkOutLocation: { type: String },
  totalHours: { type: Number },
  status: { type: String, enum: ['Present', 'Late', 'Half-day', 'Absent', 'Approved Leave'], default: 'Present' },
  remarks: { type: String },
  markedBy: { type: mongoose.Schema.Types.Mixed }, // Can be ObjectId for users or String for 'System'
  markedAt: { type: Date }, // When attendance was marked by developer
}, { timestamps: true });

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
