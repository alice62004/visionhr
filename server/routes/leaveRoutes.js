const express = require('express');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const {
  getLeaveRequests, createLeaveRequest, approveLeaveRequest, rejectLeaveRequest,
} = require('../controllers/leaveController');

const router = express.Router();
router.use(auth);

router.get('/', getLeaveRequests);
router.post('/', createLeaveRequest);
router.patch('/:id/approve', role(['admin', 'hr', 'manager']), approveLeaveRequest);
router.patch('/:id/reject', role(['admin', 'hr', 'manager']), rejectLeaveRequest);

module.exports = router;
