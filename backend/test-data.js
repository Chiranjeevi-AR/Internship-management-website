const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/usersModel');
const Internship = require('./models/internshipsModel');
const ProjectAssignment = require('./models/projectAssignmentsModel');
const Attendance = require('./models/attendanceModel');

async function testData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check interns
    const interns = await User.find({ type: 'intern' }).select('name email');
    console.log('\n=== INTERNS ===');
    console.log('Total interns:', interns.length);
    interns.forEach(intern => {
      console.log(`- ${intern.name} (${intern.email})`);
    });
    
    // Check internships
    const internships = await Internship.find({}).populate('userId', 'name email');
    console.log('\n=== INTERNSHIPS ===');
    console.log('Total internships:', internships.length);
    internships.forEach(internship => {
      console.log(`- ${internship.userId?.name}: ${internship.internshipStartDate} to ${internship.internshipEndDate}`);
    });
    
    // Check project assignments
    const projects = await ProjectAssignment.find({}).populate('assignedInterns.userId', 'name email').populate('assignedDevelopers.userId', 'name email');
    console.log('\n=== PROJECT ASSIGNMENTS ===');
    console.log('Total projects:', projects.length);
    projects.forEach(project => {
      console.log(`\nProject: ${project.projectId}`);
      console.log('Assigned interns:', project.assignedInterns.map(i => i.userId?.name || 'Unknown'));
      console.log('Assigned developers:', project.assignedDevelopers.map(d => d.userId?.name || 'Unknown'));
    });
    
    // Check attendance
    const attendance = await Attendance.find({}).populate('userId', 'name email');
    console.log('\n=== ATTENDANCE ===');
    console.log('Total attendance records:', attendance.length);
    attendance.slice(0, 5).forEach(record => {
      console.log(`- ${record.userId?.name}: ${record.date} - ${record.status}`);
    });
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

testData();
