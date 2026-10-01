const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');

const router = express.Router();
router.use(auth);

// Gộp dữ liệu cho các stat card + chart trên trang Dashboard
router.get('/dashboard-overview', async (req, res) => {
  const [[{ totalEmployees }]] = await pool.query('SELECT COUNT(*) AS totalEmployees FROM nhan_vien WHERE trang_thai = "dang_lam_viec"');
  const [[{ workingToday }]] = await pool.query('SELECT COUNT(DISTINCT ma_nhan_vien) AS workingToday FROM cham_cong WHERE ngay = CURDATE()');
  const [[{ lateToday }]] = await pool.query('SELECT COUNT(*) AS lateToday FROM cham_cong WHERE ngay = CURDATE() AND trang_thai = "di_muon"');

  const [departmentRows] = await pool.query(`
    SELECT d.ten_phong_ban AS name, COUNT(e.ma_nhan_vien) AS value
    FROM phong_ban d
    LEFT JOIN nhan_vien e ON e.ma_phong_ban = d.ma_phong_ban AND e.trang_thai = 'dang_lam_viec'
    GROUP BY d.ma_phong_ban, d.ten_phong_ban
  `);

  res.json({
    totalEmployees,
    workingToday,
    absentToday: Math.max(0, totalEmployees - workingToday),
    lateToday,
    attendanceTrend: [],
    departmentBreakdown: departmentRows,
  });
});

module.exports = router;
