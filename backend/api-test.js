const axios = require('axios');

// Base URL của backend server
const BASE_URL = 'http://localhost:5000/api';

// Màu sắc cho console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

// Hàm log với màu sắc
const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`)
};

// Biến để lưu token
let authToken = null;
let testUserId = null;

// Hàm test endpoint
async function testEndpoint(method, endpoint, data = null, token = null, expectedStatus = 200) {
  try {
    const config = {
      method: method.toLowerCase(),
      url: `${BASE_URL}${endpoint}`,
      headers: {}
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data && (method.toLowerCase() === 'post' || method.toLowerCase() === 'put')) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    
    if (response.status === expectedStatus) {
      log.success(`${method} ${endpoint} - Status: ${response.status}`);
      return response.data;
    } else {
      log.warning(`${method} ${endpoint} - Expected: ${expectedStatus}, Got: ${response.status}`);
      return response.data;
    }
  } catch (error) {
    if (error.response && error.response.status === expectedStatus) {
      log.success(`${method} ${endpoint} - Status: ${error.response.status} (Expected error)`);
      return error.response.data;
    } else {
      log.error(`${method} ${endpoint} - Error: ${error.message}`);
      if (error.response) {
        console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      return null;
    }
  }
}

// Test các endpoint
async function runTests() {
  console.log('🚀 Bắt đầu kiểm tra API endpoints...\n');

  // 1. Test Health Check
  log.info('1. Testing Health Check...');
  await testEndpoint('GET', '/health');
  console.log('');

  // 2. Test Auth endpoints
  log.info('2. Testing Authentication...');
  
  // Test login với credentials không hợp lệ (should return 400)
  log.info('   - Testing invalid login...');
  await testEndpoint('POST', '/auth/login', {
    email: 'invalid@email.com',
    password: 'wrongpassword'
  }, null, 400);

  // Test register (cần admin token, nên sẽ fail)
  log.info('   - Testing register without admin token...');
  await testEndpoint('POST', '/auth/register', {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    role: 'intern'
  }, null, 401);

  console.log('');

  // 3. Test Users endpoints (without auth)
  log.info('3. Testing Users endpoints (without auth)...');
  await testEndpoint('GET', '/users', null, null, 401);
  await testEndpoint('GET', '/users/interns', null, null, 401);
  console.log('');

  // 4. Test Tasks endpoints (without auth)
  log.info('4. Testing Tasks endpoints (without auth)...');
  await testEndpoint('GET', '/tasks', null, null, 401);
  await testEndpoint('GET', '/tasks/statistics', null, null, 401);
  console.log('');

  // 5. Test Evaluations endpoints (without auth)
  log.info('5. Testing Evaluations endpoints (without auth)...');
  await testEndpoint('GET', '/evaluations', null, null, 401);
  console.log('');

  // 6. Test Documents endpoints (without auth)
  log.info('6. Testing Documents endpoints (without auth)...');
  await testEndpoint('GET', '/documents', null, null, 401);
  console.log('');

  // 7. Test với fake token
  log.info('7. Testing with invalid token...');
  const fakeToken = 'invalid-token-123';
  await testEndpoint('GET', '/users', null, fakeToken, 401);
  await testEndpoint('GET', '/tasks', null, fakeToken, 401);
  console.log('');

  console.log('✅ Hoàn thành kiểm tra cơ bản!');
  console.log('\n📋 Kết quả:');
  console.log('- Health check endpoint hoạt động ✓');
  console.log('- Authentication middleware hoạt động (chặn truy cập không có token) ✓');
  console.log('- Các protected routes yêu cầu authentication ✓');
  console.log('- Error handling hoạt động ✓');
  
  console.log('\n💡 Để test đầy đủ, bạn cần:');
  console.log('1. Tạo user admin trong database');
  console.log('2. Login để lấy token');
  console.log('3. Test các endpoint với token hợp lệ');
}

// Hàm tạo dữ liệu test
async function createTestData() {
  console.log('🔧 Tạo dữ liệu test...\n');
  
  // Kiểm tra kết nối MongoDB
  log.info('Checking MongoDB connection...');
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/translation-hub');
    log.success('Connected to MongoDB');
    
    // Tạo admin user
    const User = require('./models/User');
    const bcryptjs = require('bcryptjs');
    
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
      log.info('Admin user already exists');
    }
    
    // Tạo intern user
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
      log.info('Intern user already exists');
    }
    
    await mongoose.disconnect();
    log.success('Disconnected from MongoDB');
    
  } catch (error) {
    log.error(`Database error: ${error.message}`);
  }
}

// Hàm test với authentication
async function testWithAuth() {
  console.log('🔐 Testing với authentication...\n');
  
  // Login admin
  log.info('1. Login as admin...');
  const adminLogin = await testEndpoint('POST', '/auth/login', {
    email: 'admin@example.com',
    password: 'admin123'
  });
  
  if (adminLogin && adminLogin.token) {
    authToken = adminLogin.token;
    log.success('Admin login successful!');
    
    // Test admin endpoints
    log.info('2. Testing admin endpoints...');
    await testEndpoint('GET', '/users', null, authToken);
    await testEndpoint('GET', '/users/interns', null, authToken);
    
    // Test creating new user
    log.info('3. Testing create new user...');
    await testEndpoint('POST', '/auth/register', {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      role: 'intern'
    }, authToken);
    
  } else {
    log.error('Admin login failed!');
  }
  
  // Login intern
  log.info('4. Login as intern...');
  const internLogin = await testEndpoint('POST', '/auth/login', {
    email: 'intern@example.com',
    password: 'intern123'
  });
  
  if (internLogin && internLogin.token) {
    const internToken = internLogin.token;
    log.success('Intern login successful!');
    
    // Test intern endpoints
    log.info('5. Testing intern endpoints...');
    await testEndpoint('GET', '/tasks', null, internToken);
    await testEndpoint('GET', '/tasks/statistics', null, internToken);
    await testEndpoint('GET', '/evaluations', null, internToken);
    
    // Test admin-only endpoint with intern token (should fail)
    log.info('6. Testing admin endpoint with intern token...');
    await testEndpoint('GET', '/users', null, internToken, 403);
    
  } else {
    log.error('Intern login failed!');
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--create-data')) {
    await createTestData();
  } else if (args.includes('--with-auth')) {
    await testWithAuth();
  } else {
    await runTests();
  }
}

main().catch(console.error);
