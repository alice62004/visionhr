const express = require('express');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const departmentController = require('../controllers/departmentController');

const router = express.Router();
router.use(auth);

// GET all departments with statistics
router.get('/', departmentController.getDepartments);

// GET single department by ID
router.get('/:id', departmentController.getDepartmentById);

// GET employees of a department
router.get('/:id/employees', departmentController.getDepartmentEmployees);

// CREATE department (Admin & HR)
router.post('/', role(['admin', 'hr']), departmentController.createDepartment);

// UPDATE department (Admin & HR)
router.put('/:id', role(['admin', 'hr']), departmentController.updateDepartment);

// DELETE department (Admin only)
router.delete('/:id', role(['admin']), departmentController.deleteDepartment);

module.exports = router;
