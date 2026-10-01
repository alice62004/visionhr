const express = require('express');
const auth = require('../middleware/authMiddleware');
const {
  getAttendanceRecords, getAttendanceById, faceCheckIn,
} = require('../controllers/attendanceController');

const router = express.Router();

// Kiosk terminal có thể dùng token thiết bị riêng thay vì auth người dùng — điều chỉnh theo nhu cầu thực tế
router.post('/face-checkin', faceCheckIn);

router.use(auth);
router.get('/', getAttendanceRecords);
router.get('/:id', getAttendanceById);

module.exports = router;
