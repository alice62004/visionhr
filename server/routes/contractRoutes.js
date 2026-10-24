const express = require('express');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const {
  getContracts,
  getContractStats,
  getContractById,
  getNextContractCode,
  createContract,
  updateContract,
  renewContract,
  terminateContract,
} = require('../controllers/contractController');

const router = express.Router();
router.use(auth);

// Lấy danh sách và thống kê (mọi role đăng nhập đều có thể truy cập, controller tự lọc phân quyền)
router.get('/', getContracts);
router.get('/stats', getContractStats);
router.get('/next-code', role(['admin', 'hr']), getNextContractCode);
router.get('/:id', getContractById);

// Các hành động thay đổi chỉ dành cho HR và Admin
router.post('/', role(['admin', 'hr']), createContract);
router.put('/:id', role(['admin', 'hr']), updateContract);
router.post('/:id/renew', role(['admin', 'hr']), renewContract);
router.patch('/:id/terminate', role(['admin', 'hr']), terminateContract);

module.exports = router;
