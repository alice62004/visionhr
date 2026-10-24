const express = require('express');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const {
  getEmployees,
  getEmployeeById,
  getNextEmployeeCode,
  getUnlinkedAccounts,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  enrollFace,
  deleteFaceEnrollment,
  getMyProfile,
  updateMyProfile,
  getMyWorkHistory,
  sendEmployeeOnboardingEmail,
} = require('../controllers/employeeController');

const router = express.Router();

router.use(auth);

// Routes cho tài khoản cá nhân nhân viên (cho phép tất cả role đã đăng nhập)
router.get('/me/profile', getMyProfile);
router.put('/me/profile', updateMyProfile);
router.get('/me/work-history', getMyWorkHistory);

router.get('/', role(['admin', 'hr', 'manager']), getEmployees);
router.get('/next-code', role(['admin', 'hr']), getNextEmployeeCode);
router.get('/unlinked-accounts', role(['admin', 'hr']), getUnlinkedAccounts);
router.get('/:id', role(['admin', 'hr', 'manager']), getEmployeeById);
router.post('/', role(['admin', 'hr']), createEmployee);
router.put('/:id', role(['admin', 'hr']), updateEmployee);
router.delete('/:id', role(['admin', 'hr']), deleteEmployee);
router.post('/face-enrollment', role(['admin', 'hr', 'manager', 'employee']), enrollFace);
router.post('/:id/face-enrollment', role(['admin', 'hr', 'manager', 'employee']), enrollFace);
router.delete('/:id/face-enrollment', role(['admin', 'hr', 'manager']), deleteFaceEnrollment);
router.post('/send-onboarding-email', role(['admin', 'hr', 'manager']), sendEmployeeOnboardingEmail);

module.exports = router;
