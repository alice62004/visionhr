const express = require('express');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const {
  getOvertimeRequests, createOvertimeRequest, approveOvertimeRequest, rejectOvertimeRequest,
} = require('../controllers/overtimeController');

const router = express.Router();
router.use(auth);

router.get('/', getOvertimeRequests);
router.post('/', createOvertimeRequest);
router.patch('/:id/approve', role(['admin', 'hr', 'manager']), approveOvertimeRequest);
router.patch('/:id/reject', role(['admin', 'hr', 'manager']), rejectOvertimeRequest);

module.exports = router;
