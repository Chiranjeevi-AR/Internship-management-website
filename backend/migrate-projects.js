const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Project = require('./models/projectsModel');

async function updateProjects() {
  try {
    // Find all projects that don't have a name field
    const projects = await Project.find({ name: { $exists: false } });
    
    console.log(`Found ${projects.length} projects without name field`);
    
    // Update each project to add a name field based on description
    for (const project of projects) {
      const name = project.description?.substring(0, 50) || 'Unnamed Project';
      await Project.findByIdAndUpdate(project._id, { name: name });
      console.log(`Updated project ${project._id} with name: ${name}`);
    }
    
    // Also check and show all projects
    const allProjects = await Project.find();
    console.log('\nAll projects:');
    allProjects.forEach(p => {
      console.log(`ID: ${p._id}, Name: ${p.name}, Description: ${p.description?.substring(0, 30)}...`);
    });
    
    console.log('Migration completed');
    process.exit(0);
  } catch (error) {
    console.error('Error updating projects:', error);
    process.exit(1);
  }
}

updateProjects();

// Migration script to populate Company collection from existing users
const mongoose = require('mongoose');
const User = require('./models/usersModel');
const Company = require('./models/companyModel');
require('dotenv').config();

async function migrateCompanies() {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const companies = await User.distinct('company', { company: { $ne: null, $ne: '' } });
  for (const name of companies) {
    if (name) {
      await Company.updateOne({ name }, { name }, { upsert: true });
    }
  }
  console.log('Migration complete. Companies:', companies);
  await mongoose.disconnect();
}

if (require.main === module) {
  migrateCompanies().catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
  });
}
