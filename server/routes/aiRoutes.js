const express = require('express');
const auth = require('../middleware/authMiddleware');
const { askAI } = require('../controllers/aiController');

const router = express.Router();

router.use(auth);
router.post('/ask', askAI);

module.exports = router;
