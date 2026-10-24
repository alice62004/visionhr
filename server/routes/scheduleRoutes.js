const express = require('express');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const {
  getMySchedule,
  getSchedules,
  assignSchedule,
  bulkAssignSchedule,
  deleteSchedule,
} = require('../controllers/scheduleController');

const router = express.Router();
router.use(auth);

// Nhân viên lấy lịch cá nhân
router.get('/my', getMySchedule);

// Manager / HR / Admin lấy danh sách phân ca
router.get('/', role(['admin', 'hr', 'manager', 'employee']), getSchedules);

// Phân ca (Manager / HR / Admin)
router.post('/assign', role(['admin', 'hr', 'manager']), assignSchedule);
router.post('/bulk-assign', role(['admin', 'hr', 'manager']), bulkAssignSchedule);
router.delete('/:id', role(['admin', 'hr', 'manager']), deleteSchedule);

module.exports = router;
