# VisionHR — Hệ thống Quản trị Nhân sự

Web HRM với 4 vai trò (Admin, HR, Manager, Employee), tích hợp chấm công bằng nhận diện khuôn mặt và AI HR Agent.

## Cấu trúc dự án

```text
visionhr/
├── docs/                                   # Tài liệu dự án, sơ đồ thiết kế
│   └── diagrams/                           # Sơ đồ Use Case, Sequence, Activity
├── database/                               # Cơ sở dữ liệu MySQL
│   ├── schema.sql                          # Kịch bản khởi tạo bảng & quan hệ (DDL)
│   ├── seed.sql                            # Dữ liệu mẫu khởi tạo (DML)
│   └── diagrams/                           # Sơ đồ thực thể quan hệ ERD
│
├── server/                                 # BACKEND SERVICE (Node.js + Express + MySQL)
│   ├── .env.example                        # Mẫu cấu hình biến môi trường
│   ├── server.js                           # Điểm khởi chạy ứng dụng Express (Entry point)
│   ├── config/                             # Cấu hình hệ thống (Kết nối DB, JWT, Mailer...)
│   │   └── db.js
│   ├── models/                             # Tầng tương tác cơ sở dữ liệu (Data Access Layer)
│   ├── controllers/                        # Tầng điều khiển, xử lý logic nghiệp vụ
│   ├── routes/                             # Định tuyến API RESTful
│   │   ├── authRoutes.js                   # Xác thực, đăng nhập/đăng xuất
│   │   ├── employeeRoutes.js               # Quản lý hồ sơ nhân viên
│   │   ├── departmentRoutes.js             # Quản lý phòng ban, chức vụ
│   │   ├── attendanceRoutes.js             # Điểm danh, chấm công khuôn mặt
│   │   ├── shiftRoutes.js                  # Phân ca làm việc
│   │   ├── scheduleRoutes.js               # Lịch biểu làm việc
│   │   ├── leaveRoutes.js                  # Đơn xin nghỉ phép & phê duyệt
│   │   ├── overtimeRoutes.js               # Đăng ký & xét duyệt làm thêm giờ (OT)
│   │   ├── payrollRoutes.js                # Bảng lương & tính công tự động
│   │   ├── contractRoutes.js               # Hợp đồng lao động & email onboarding
│   │   ├── auditLogRoutes.js               # Nhật ký kiểm toán thao tác hệ thống
│   │   ├── reportRoutes.js                 # Báo cáo thống kê tổng hợp
│   │   ├── settingsRoutes.js               # Cấu hình tham số hệ thống & quy chế
│   │   ├── userRoutes.js                   # Quản lý tài khoản & phân vai trò
│   │   └── aiRoutes.js                     # Cầu nối gọi sang AI HR Agent / Vision
│   ├── middleware/                         # Middlewares (Xác thực JWT, Role-based Access, Upload...)
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   ├── services/                           # Logic nghiệp vụ cấp cao & tích hợp bên thứ ba
│   │   ├── faceRecognitionService.js       # Tích hợp FaceNet & Face Matching
│   │   ├── livenessService.js              # Tích hợp phát hiện thực thể sống (Liveness)
│   │   └── emailService.js                 # Gửi thư thông báo / Onboarding
│   ├── utils/                              # Các hàm tiện ích dùng chung (Helper, Formatters)
│   ├── uploads/                            # Thư mục lưu trữ file tạm / ảnh khuôn mặt
│   │
│   └── ai/                                 # AI SERVICE (Python FastAPI - Cổng 8001)
│       ├── service.py                      # Điểm khởi chạy FastAPI
│       ├── faceRecognition/                # Trích xuất vector khuôn mặt (FaceNet)
│       ├── liveness/                       # Kiểm tra chống giả mạo ảnh/video
│       ├── yolo/                           # Phát hiện vị trí khuôn mặt & căn chỉnh
│       └── roboflow/                       # Mô hình thị giác máy tính mở rộng
│
├── client/                                 # FRONTEND (React + Vite + TypeScript)
│   ├── index.html                          # File HTML gốc
│   ├── vite.config.js                      # Cấu hình Vite & API Proxy
│   ├── tsconfig.json                       # Cấu hình TypeScript
│   ├── src/
│   │   ├── main.tsx                        # Điểm khởi chạy React DOM
│   │   ├── App.tsx                         # Khai báo Routes & Điều hướng trang
│   │   ├── index.css                       # Global styles & Design tokens
│   │   ├── types/                          # Định nghĩa TypeScript Interfaces / Types
│   │   ├── store/                          # State management (Context / Zustand)
│   │   ├── layouts/                        # Bố cục giao diện dùng chung
│   │   │   └── DashboardLayout.tsx         # Sidebar, Header, Breadcrumbs, Notifications
│   │   ├── components/                     # Components dùng chung (Reusable UI)
│   │   │   ├── Navbar/
│   │   │   ├── Sidebar/
│   │   │   ├── CameraModal/                # Modal quét mặt chấm công
│   │   │   └── OnboardingEmailModal/       # Modal soạn & gửi thư chào đón nhân viên
│   │   ├── pages/                          # Các màn hình chức năng chính
│   │   │   ├── Dashboard/                  # Bảng điều khiển tổng quan (4 vai trò)
│   │   │   ├── Login/                      # Màn hình đăng nhập hệ thống
│   │   │   ├── Employees/                  # Danh sách & chi tiết hồ sơ nhân sự
│   │   │   ├── Departments/                # Cơ cấu tổ chức & phòng ban
│   │   │   ├── Attendance/                 # Chấm công camera & bảng chấm công
│   │   │   ├── Shifts/                     # Cấu hình ca làm việc
│   │   │   ├── MySchedule/                 # Lịch làm việc cá nhân / phòng ban
│   │   │   ├── Leave/                      # Quản lý & phê duyệt đơn nghỉ phép
│   │   │   ├── Overtime/                   # Đăng ký & xét duyệt tăng ca
│   │   │   ├── Contracts/                  # Quản lý hợp đồng lao động & phụ lục
│   │   │   ├── Payroll/                    # Bảng lương & phiếu lương cá nhân
│   │   │   ├── Reports/                    # Báo cáo thống kê nhân sự, biến động
│   │   │   ├── AIHR/                       # Trợ lý ảo AI HR Agent hỗ trợ giải đáp quy chế
│   │   │   ├── AuditLog/                   # Xem lịch sử tác vụ & bảo mật
│   │   │   ├── Settings/                   # Thiết lập cấu hình hệ thống & quy định
│   │   │   ├── Users/                      # Quản trị tài khoản & phân vai trò
│   │   │   └── MyProfile/                  # Thông tin tài khoản cá nhân
│   │   ├── services/                       # API Services (Axios gọi Backend)
│   │   └── utils/                          # Hàm format tiền tệ, ngày giờ, validation
│   └── public/                             # Tài nguyên tĩnh (Logo, favicon, icons)
│
├── Quy_Che_Luong_Ca_Lam_Viec_Va_Nghi_Phep_VisionHR.docx # Văn bản quy chế áp dụng vào AI HR
└── README.md                               # Hướng dẫn dự án
```

## Cài đặt & chạy thử

### 1. Database
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```
Tài khoản demo (mật khẩu cho tất cả: `123456`):
- admin@visionhr.vn (role: admin)
- binh.tran@visionhr.vn (role: hr)
- manager@visionhr.vn (role: manager)
- an.nguyen@visionhr.vn (role: employee)

### 2. Server (backend)
```bash
cd server
cp .env.example .env|| copy .env.example .env   # rồi chỉnh thông tin DB_HOST/DB_USER/DB_PASSWORD cho đúng máy bạn
npm install
npm run dev             # chạy tại http://localhost:5000
```

### 3. Client (frontend)
```bash
cd client
npm install
npm run dev              # chạy tại http://localhost:5173, tự proxy /api sang server:5000
```

## Bộ 3 Công Nghệ AI Điểm Danh (FaceNet, Face Matching, Liveness Detection)

`server/services/faceRecognitionService.js` và `livenessService.js` gọi sang **AI service Python FastAPI** (biến `AI_SERVICE_URL` trong `.env`, mặc định `http://localhost:8001`):

- **FaceNet**: Trích xuất vector đặc trưng hình học khuôn mặt chuẩn hóa 128/512 chiều.
- **Face Matching**: Tính độ tương đồng Cosine Similarity giữa vector khuôn mặt quét với hồ sơ nhân viên trong cơ sở dữ liệu.
- **Liveness Detection**: Kiểm tra tính sống (người thật đang đứng trước camera) để chống giả mạo ảnh in, màn hình điện thoại hoặc video.

Các API endpoint chính của AI Service (`server/ai/service.py`):
- `POST /detect-face` → Phát hiện khuôn mặt trong khung hình camera.
- `POST /match-face` → So khớp vector khuôn mặt với danh sách nhân viên.
- `POST /liveness-check` → Xác thực thực thể sống chống gian lận.
- `POST /check-duplicate-face` → Kiểm tra khuôn mặt đã được gán cho nhân viên khác chưa khi đăng ký.

## Phân quyền

Xem chi tiết ma trận quyền theo module trong tài liệu kiến trúc đã gửi trước đó.
Phân quyền được kiểm tra ở **cả 2 lớp**:
- Frontend: ẩn/hiện menu & route (`Sidebar.jsx`, `ProtectedRoute.jsx`)
- Backend: `roleMiddleware.js` chặn API theo role — đây mới là lớp bảo mật thật sự