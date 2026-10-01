const express = require('express');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const { getPayrolls } = require('../controllers/payrollController');

const router = express.Router();

router.use(auth);
router.get('/', role(['admin', 'hr']), getPayrolls);

module.exports = router;
