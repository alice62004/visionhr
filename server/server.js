const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const overtimeRoutes = require('./routes/overtimeRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const reportRoutes = require('./routes/reportRoutes');
const aiRoutes = require('./routes/aiRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const userRoutes = require('./routes/userRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const contractRoutes = require('./routes/contractRoutes');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' })); // limit lớn hơn mặc định vì có ảnh base64 từ camera
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/overtime', overtimeRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/audit-log', auditLogRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/contracts', contractRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Middleware xử lý lỗi tập trung
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
});

const { ensureAIServiceRunning } = require('./services/aiProcessManager');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`VisionHR server đang chạy tại http://localhost:${PORT}`);
  ensureAIServiceRunning();
});
