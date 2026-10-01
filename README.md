# VisionHR — Hệ thống Quản trị Nhân sự

Web HRM với 4 vai trò (Admin, HR, Manager, Employee), tích hợp chấm công bằng nhận diện khuôn mặt và AI HR Agent.

## Cấu trúc dự án

```
visionhr/
├── client/     # React (Vite)
├── server/     # Node.js + Express + MySQL
└── database/   # schema.sql, seed.sql, ERD
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

## Lưu ý về AI (YOLO / Roboflow / Face Recognition / Liveness)

`server/services/faceRecognitionService.js` và `livenessService.js` hiện gọi sang một
**AI service riêng** (biến `AI_SERVICE_URL` trong `.env`) — vì các model YOLO/Roboflow/nhận diện
khuôn mặt thường chạy tốt nhất ở Python (FastAPI/Flask), tách khỏi Node server để dễ scale và
tận dụng GPU riêng. Bạn cần dựng thêm 1 service Python cung cấp 3 endpoint:

- `POST /detect-face` → { faceDetected, boundingBox, croppedFace }
- `POST /match-face` → { employeeId, employeeName, confidence }
- `POST /liveness-check` → { isLive, score }
- `POST /hr-agent/ask` → { answer } (AI HR Agent, có thể dùng LLM + RAG trên dữ liệu HR)

Thư mục `server/ai/` (yolo, roboflow, faceRecognition, liveness) đã được tạo sẵn để bạn đặt
code Python hoặc script huấn luyện/inference nếu muốn gộp chung repo.

## Phân quyền

Xem chi tiết ma trận quyền theo module trong tài liệu kiến trúc đã gửi trước đó.
Phân quyền được kiểm tra ở **cả 2 lớp**:
- Frontend: ẩn/hiện menu & route (`Sidebar.jsx`, `ProtectedRoute.jsx`)
- Backend: `roleMiddleware.js` chặn API theo role — đây mới là lớp bảo mật thật sự
