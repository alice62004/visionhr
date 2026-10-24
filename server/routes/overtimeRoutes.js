const express = require('express');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const {
  getOvertimeRequests,
  createOvertimeRequest,
  approveOvertimeRequest,
  rejectOvertimeRequest,
} = require('../controllers/overtimeController');

const router = express.Router();
router.use(auth);

// Chỉ HR, Quản lý và Admin mới có quyền truy cập module Tăng ca (OT) theo thực tế nhân viên
router.use(role(['admin', 'hr', 'manager']));

router.get('/', getOvertimeRequests);
router.post('/', createOvertimeRequest);
router.patch('/:id/approve', approveOvertimeRequest);
router.patch('/:id/reject', rejectOvertimeRequest);

module.exports = router;
