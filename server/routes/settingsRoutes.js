const express = require('express');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const { getSmtpStatus, verifyAndSaveSmtp, sendOnboardingEmail } = require('../services/emailService');

const router = express.Router();
router.use(auth);

// Lấy trạng thái cấu hình SMTP
router.get('/smtp', role(['admin', 'hr']), (req, res) => {
  try {
    const status = getSmtpStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi kiểm tra SMTP: ' + err.message });
  }
});

// Lưu và kiểm tra cấu hình SMTP mới
router.post('/smtp', role(['admin', 'hr']), async (req, res) => {
  try {
    const { host, port, user, pass } = req.body;
    const result = await verifyAndSaveSmtp({ host, port, user, pass });
    res.json(result);
  } catch (err) {
    console.error('[SettingsRoutes] SMTP verification failed:', err);
    res.status(400).json({
      message: 'Xác thực SMTP thất bại: ' + (err.message || 'Kiểm tra lại tài khoản hoặc App Password.'),
    });
  }
});

// Gửi email thử nghiệm
router.post('/test-email', role(['admin', 'hr']), async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) {
      return res.status(400).json({ message: 'Vui lòng cung cấp email người nhận.' });
    }
    const result = await sendOnboardingEmail({
      to,
      employeeName: 'Nhân viên Thử nghiệm',
      employeeCode: 'TEST001',
      position: 'Kỹ sư Thử nghiệm Email',
      department: 'Phòng Kỹ thuật & CNTT',
      tempPassword: 'Test@' + Math.floor(1000 + Math.random() * 9000),
      loginUrl: 'http://localhost:5173/login',
    });
    res.json(result);
  } catch (err) {
    console.error('[SettingsRoutes] Test email failed:', err);
    res.status(500).json({ message: 'Không thể gửi email thử nghiệm: ' + err.message });
  }
});

module.exports = router;
