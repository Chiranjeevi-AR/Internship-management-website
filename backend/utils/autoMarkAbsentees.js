// Auto-mark absentees for all interns who did not check in on a working day (Mon-Fri)
const mongoose = require('mongoose');
const Attendance = require('../models/attendanceModel');
const User = require('../models/usersModel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/im2';


async function autoMarkAbsentees(date = new Date()) {
  // Set date to 00:00:00 for comparison
  date.setHours(0, 0, 0, 0);
  const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    console.log('Selected date is weekend. No attendance marking.');
    return;
  }

  await mongoose.connect(MONGO_URI);
  try {
    // Get all approved interns
    const interns = await User.find({ type: 'intern', isApproved: true });
    for (const intern of interns) {
      const attendance = await Attendance.findOne({ userId: intern._id, date });
      if (!attendance) {
        await Attendance.create({
          userId: intern._id,
          date,
          status: 'Absent',
          remarks: 'Auto-marked as absent',
          markedBy: 'System',
          markedAt: new Date(),
        });
        console.log(`Marked absent: ${intern.name} (${intern.email})`);
      }
    }
    console.log('Auto-marking complete.');
  } catch (err) {
    console.error('Error in autoMarkAbsentees:', err);
  } finally {
    await mongoose.disconnect();
  }
}


// Helper to get previous working days (skipping weekends)
function getPreviousWorkingDays(numDays, fromDate = new Date()) {
  const days = [];
  let date = new Date(fromDate);
  date.setHours(0, 0, 0, 0);
  while (days.length < numDays) {
    date.setDate(date.getDate() - 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      days.push(new Date(date));
    }
  }
  return days;
}

// Run for today or pre-fetch for previous N working days
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args[0] === '--prefetch' && args[1]) {
    const numDays = parseInt(args[1], 10);
    if (isNaN(numDays) || numDays < 1) {
      console.error('Usage: node autoMarkAbsentees.js --prefetch <numDays>');
      process.exit(1);
    }
    const days = getPreviousWorkingDays(numDays);
    (async () => {
      for (const d of days.reverse()) { // oldest to newest
        console.log(`\n--- Marking absentees for ${d.toDateString()} ---`);
        await autoMarkAbsentees(new Date(d));
      }
      process.exit(0);
    })();
  } else {
    autoMarkAbsentees();
  }
}

module.exports = autoMarkAbsentees;
