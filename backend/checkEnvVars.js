const dotenv = require('dotenv');
dotenv.config();

// Check if essential environment variables exist
const requiredVars = [
  'NODE_CODE_SENDING_EMAIL_ADDRESS',
  'NODE_CODE_SENDING_EMAIL_PASSWORD',
  'TOKEN_SECRET',
  'HMAC_VERIFICATION_CODE_SECRET'
];

let missingVars = false;

console.log('Checking environment variables:');
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    console.log(`❌ Missing: ${varName}`);
    missingVars = true;
  } else {
    console.log(`✅ Found: ${varName}`);
  }
});

if (missingVars) {
  console.log('\n⚠️ Some required environment variables are missing!');
  console.log('Please add them to your .env file in the backend directory.');
  console.log('\nExample .env file structure:');
  console.log(`
NODE_CODE_SENDING_EMAIL_ADDRESS=yourapp@gmail.com
NODE_CODE_SENDING_EMAIL_PASSWORD=your-app-password-or-service-account
TOKEN_SECRET=your-jwt-secret-key
HMAC_VERIFICATION_CODE_SECRET=your-hmac-secret-key
`);
} else {
  console.log('\n✅ All required environment variables are present.');
}
