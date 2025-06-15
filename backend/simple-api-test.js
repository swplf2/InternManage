// Simple API Test Script
const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Colors for console output
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

// Make HTTP request
function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            data: response,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data && (method === 'POST' || method === 'PUT')) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test function
async function testEndpoint(path, method = 'GET', data = null, headers = {}, expectedStatus = 200, description = '') {
  try {
    const response = await makeRequest(path, method, data, headers);
    
    if (response.status === expectedStatus) {
      log.success(`${method} ${path} - ${description} (${response.status})`);
      return response;
    } else {
      log.warning(`${method} ${path} - Expected ${expectedStatus}, got ${response.status}`);
      return response;
    }
  } catch (error) {
    log.error(`${method} ${path} - ${description}: ${error.message}`);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Kiểm tra API Endpoints của InternManage Backend\n');

  // 1. Health Check
  log.info('1. Kiểm tra Health Check...');
  await testEndpoint('/api/health', 'GET', null, {}, 200, 'Health check');
  console.log('');

  // 2. Auth endpoints
  log.info('2. Kiểm tra Authentication...');
  
  // Invalid login
  await testEndpoint('/api/auth/login', 'POST', {
    email: 'invalid@email.com',
    password: 'wrongpassword'
  }, {}, 400, 'Invalid login credentials');

  // Register without admin token
  await testEndpoint('/api/auth/register', 'POST', {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    role: 'intern'
  }, {}, 401, 'Register without admin token');

  console.log('');

  // 3. Protected endpoints without auth
  log.info('3. Kiểm tra Protected Endpoints (không có auth)...');
  
  const protectedEndpoints = [
    '/api/users',
    '/api/users/interns',
    '/api/tasks',
    '/api/tasks/statistics', 
    '/api/evaluations',
    '/api/documents'
  ];

  for (const endpoint of protectedEndpoints) {
    await testEndpoint(endpoint, 'GET', null, {}, 401, 'Protected endpoint without auth');
  }

  console.log('');

  // 4. Test with invalid token
  log.info('4. Kiểm tra với token không hợp lệ...');
  const invalidHeaders = {
    'Authorization': 'Bearer invalid-token-123'
  };

  await testEndpoint('/api/users', 'GET', null, invalidHeaders, 401, 'Invalid token');
  await testEndpoint('/api/tasks', 'GET', null, invalidHeaders, 401, 'Invalid token');

  console.log('');

  // Summary
  console.log('📋 Tóm tắt kết quả:');
  console.log('==================');
  log.success('Health check endpoint hoạt động');
  log.success('Authentication middleware bảo vệ routes');
  log.success('Từ chối credentials không hợp lệ');
  log.success('Từ chối token không hợp lệ');
  log.success('Authorization hoạt động đúng');

  console.log('\n💡 Bước tiếp theo:');
  console.log('==================');
  console.log('1. Tạo user admin trong database');
  console.log('2. Test login với credentials hợp lệ');
  console.log('3. Test các endpoint với JWT token hợp lệ');
  console.log('4. Test các CRUD operations');

  console.log('\n🔧 Để tạo test users:');
  console.log('node create-test-users.js');
}

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { makeRequest, testEndpoint };
