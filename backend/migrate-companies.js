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