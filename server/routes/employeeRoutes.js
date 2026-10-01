const express = require('express');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const {
  getEmployees,
  getEmployeeById,
  getUnlinkedAccounts,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  enrollFace,
  deleteFaceEnrollment,
} = require('../controllers/employeeController');

const router = express.Router();

router.use(auth);

router.get('/', role(['admin', 'hr', 'manager']), getEmployees);
router.get('/unlinked-accounts', role(['admin', 'hr']), getUnlinkedAccounts);
router.get('/:id', role(['admin', 'hr', 'manager']), getEmployeeById);
router.post('/', role(['admin', 'hr']), createEmployee);
router.put('/:id', role(['admin', 'hr']), updateEmployee);
router.delete('/:id', role(['admin', 'hr']), deleteEmployee);
router.post('/face-enrollment', role(['admin', 'hr']), enrollFace);
router.post('/:id/face-enrollment', role(['admin', 'hr']), enrollFace);
router.delete('/:id/face-enrollment', role(['admin', 'hr']), deleteFaceEnrollment);

module.exports = router;
