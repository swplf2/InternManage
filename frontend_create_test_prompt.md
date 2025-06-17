Bạn là một Lập trình viên AI chuyên sâu về Kiểm thử Phần mềm, với nhiệm vụ viết unit test và tài liệu hóa chúng một cách toàn diện cho phần frontend của một dự án full-stack.

1. Bối cảnh dự án:

Đầu tiên hãy xem qua documents, project_documentation folder ,  và toàn bộ codebased để có cái nhìn tổng quan về toàn bộ dự án

2. Nhiệm vụ chính
Viết unit test cho toàn bộ các thành phần (components) và hàm (functions) của phía frontend nếu có thể viết test. Sử dụng Jest và React Testing Library.

Tạo một file tài liệu duy nhất để mô tả tất cả các unit test của frontend mới được tạo.

3. Yêu cầu chi tiết về Unit Test
Phạm vi: Tập trung vào các thành phần (components) và hàm (functions) của phía frontend có thể viết test mà bạn xác định được sau khi phân tích codebase.

Độ bao phủ (Coverage):

Test phải bao phủ toàn bộ các luồng logic, bao gồm cả các trường hợp thành công và thất bại.

Kiểm tra việc render giao diện có đúng với props đầu vào hay không.

Mô phỏng (mock) các lời gọi API và các hàm phụ thuộc từ bên ngoài.

Kiểm tra các tương tác của người dùng (click, nhập liệu) và đảm bảo state của component được cập nhật chính xác.

Chất lượng code test:

Tên test phải rõ ràng, theo quy ước it('should [làm gì đó] when [điều kiện gì đó]').

Code test phải sạch, dễ đọc, và có comment giải thích cho những phần logic phức tạp.

Tái sử dụng code test một cách hợp lý.

4. Yêu cầu về Tài liệu hóa cho Frontend (Frontend Documentation) 📝

Tạo một file tên là FRONTEND_TESTS.md trong thư mục gốc của frontend.

File này sẽ dùng để mô tả toàn bộ các unit test của frontend mới được tạo.

Với mỗi component hoặc function của frontend được viết test, hãy tạo một mục riêng trong file markdown này.

Nội dung cho mỗi mục phải tuân theo cấu trúc sau:

Tên Component/Function
Đường dẫn: path/to/component/or/function.js
Mô tả: (Mô tả ngắn gọn chức năng chính của component/function này).

Các trường hợp kiểm thử (Test Cases):

Tên Test Case

Mô tả

Kết quả mong đợi

should render with default props

Kiểm tra component hiển thị đúng với props mặc định.

Component được render ra DOM mà không có lỗi.

should call onClick handler when clicked

Kiểm tra hàm onClick được gọi khi người dùng nhấp chuột.

Hàm onClick được gọi đúng 1 lần.

(Thêm các dòng khác...)

...

...

5. Ví dụ mẫu về Unit Test
Dưới đây là một ví dụ về unit test tôi đã viết cho component Button để bạn tham khảo phong cách:

// File: /client/src/components/Button.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button component', () => {
  it('should render with the correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call the onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

Hãy phân tích codebase của tôi, áp dụng các nguyên tắc trên để tạo ra các unit test chất lượng cao và file tài liệu đi kèm.