// Script để tạo test users trong database
require('dotenv').config();
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

// Import User model
const User = require('./models/User');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m', 
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`)
};

async function createTestUsers() {
  try {
    // Connect to MongoDB
    log.info('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/intern-manage');
    log.success('Connected to MongoDB');

    // Create Admin User
    log.info('Creating admin user...');
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    
    if (!adminExists) {
      const hashedPassword = await bcryptjs.hash('admin123', 12);
      const adminUser = new User({
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true
      });
      await adminUser.save();
      log.success('Created admin user: admin@example.com / admin123');
    } else {
      log.warning('Admin user already exists');
    }

    // Create Intern User  
    log.info('Creating intern user...');
    const internExists = await User.findOne({ email: 'intern@example.com' });
    
    if (!internExists) {
      const hashedPassword = await bcryptjs.hash('intern123', 12);
      const internUser = new User({
        email: 'intern@example.com',
        password: hashedPassword,
        firstName: 'Intern',
        lastName: 'User', 
        role: 'intern',
        isActive: true
      });
      await internUser.save();
      log.success('Created intern user: intern@example.com / intern123');
    } else {
      log.warning('Intern user already exists');
    }

    // Create another intern for testing
    log.info('Creating second intern user...');
    const intern2Exists = await User.findOne({ email: 'intern2@example.com' });
    
    if (!intern2Exists) {
      const hashedPassword = await bcryptjs.hash('intern123', 12);
      const intern2User = new User({
        email: 'intern2@example.com',
        password: hashedPassword,
        firstName: 'Intern2',
        lastName: 'User',
        role: 'intern', 
        isActive: true
      });
      await intern2User.save();
      log.success('Created second intern user: intern2@example.com / intern123');
    } else {
      log.warning('Second intern user already exists');
    }

    // Display all users
    log.info('Current users in database:');
    const users = await User.find({}).select('-password');
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - ${user.isActive ? 'Active' : 'Inactive'}`);
    });

    await mongoose.disconnect();
    log.success('Disconnected from MongoDB');

    console.log('\n🎉 Test users created successfully!');
    console.log('\n🔐 Login credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Intern: intern@example.com / intern123');
    console.log('Intern2: intern2@example.com / intern123');

    console.log('\n🧪 Now you can run:');
    console.log('node test-with-auth.js');

  } catch (error) {
    log.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

createTestUsers();
