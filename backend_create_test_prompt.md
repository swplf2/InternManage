Bạn là một Lập trình viên AI chuyên sâu về Kiểm thử Phần mềm, với nhiệm vụ viết unit test và integration test một cách toàn diện cho phần backend của một dự án full-stack.

1. Bối cảnh dự án:

Đầu tiên hãy xem qua documents, project_documentation folder ,  và toàn bộ codebased để có cái nhìn tổng quan về toàn bộ dự án

2. Nhiệm vụ chính
Viết unit test và integration test cho các API endpoints, services, và các hàm tiện ích của phía backend sử dụng Jest và Supertest.

Tạo một file tài liệu duy nhất để mô tả tất cả các test của backend mới được tạo.

3. Yêu cầu chi tiết về Test
Phạm vi:

Integration Tests: Tập trung vào các API routes để kiểm tra toàn bộ luồng request-response.

Unit Tests: Tập trung vào các hàm xử lý logic nghiệp và các hàm tiện ích.

Yêu cầu kỹ thuật:

Mocking: Toàn bộ các tương tác với cơ sở dữ liệu phải được mô phỏng (mocked) để các bài test chạy độc lập và nhanh chóng. Không thực hiện gọi database thật.

API Tests:

Kiểm tra các HTTP status code trả về có chính xác không (ví dụ: 200, 201, 400, 404, 500).

Kiểm tra cấu trúc và nội dung của dữ liệu trả về (response body).

Kiểm tra việc xác thực đầu vào (input validation), bao gồm cả các trường hợp hợp lệ và không hợp lệ.

Logic Tests: Kiểm tra các hàm logic xử lý đúng với các input khác nhau, bao gồm cả các trường hợp biên (edge cases).

4. Yêu cầu về Tài liệu hóa cho Backend (Backend Documentation) 📝
Tạo một file tên là BACKEND_TESTS.md trong thư mục gốc của backend.

File này sẽ dùng để mô tả toàn bộ các test của backend mới được tạo.

Với mỗi API endpoint được viết test, hãy tạo một mục riêng trong file markdown này.

Nội dung cho mỗi mục phải tuân theo cấu trúc sau:

Endpoint: [METHOD] /api/path/to/endpoint
File chứa test: path/to/test/file.test.js
Mô tả: (Mô tả ngắn gọn chức năng của endpoint này).

Các trường hợp kiểm thử (Test Cases):

Mô tả kịch bản

Dữ liệu đầu vào (Input)

Kết quả mong đợi

Status Code

Lấy danh sách thành công

(Không có)

Trả về một mảng các đối tượng

200

Tạo mới thành công

Body: { "name": "Test" }

Trả về đối tượng vừa tạo

201

Báo lỗi khi thiếu trường bắt buộc

Body: {}

Trả về thông báo lỗi validation

400

(Thêm các dòng khác...)

...

...

...

5. Ví dụ mẫu về Integration Test
Dưới đây là một ví dụ về integration test cho một API endpoint sử dụng Jest và Supertest:

// File: /server/tests/users.test.js
import request from 'supertest';
import app from '../app'; // file app Express chính
import User from '../models/User';

// Mock model User
jest.mock('../models/User');

describe('GET /api/users', () => {
  it('should return a list of users and status 200', async () => {
    const mockUsers = [{ name: 'John Doe' }, { name: 'Jane Doe' }];
    User.find.mockResolvedValue(mockUsers);

    const response = await request(app).get('/api/users');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(mockUsers);
    expect(User.find).toHaveBeenCalledTimes(1);
  });
});

Hãy phân tích codebase của tôi, áp dụng các nguyên tắc trên để tạo ra các bài test chất lượng cao cho backend và file tài liệu đi kèm.