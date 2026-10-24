const express = require('express');
const auth = require('../middleware/authMiddleware');
const reportController = require('../controllers/reportController');

const router = express.Router();
router.use(auth);

// Gộp dữ liệu cho các stat card + chart trên trang Dashboard
router.get('/dashboard-overview', reportController.getDashboardOverview);

// Thống kê hiệu suất hoàn thành công việc và KPI chi tiết từng nhân viên
router.get('/kpi-overview', reportController.getKpiOverview);

module.exports = router;
