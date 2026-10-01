const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

const router = express.Router();
router.use(auth);

// GET all departments with position count, headcount and face registration status stats
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.ma_phong_ban AS id,
              d.ten_phong_ban AS name,
              m.ho_ten AS manager,
              m.ma_nhan_vien AS managerId,
              COUNT(DISTINCT e.ma_nhan_vien) AS headcount,
              COUNT(DISTINCT NULLIF(TRIM(e.chuc_vu), '')) AS positionCount,
              COUNT(DISTINCT CASE WHEN e.du_lieu_khuon_mat IS NOT NULL THEN e.ma_nhan_vien END) AS faceEnrolledCount,
              COUNT(DISTINCT CASE WHEN e.du_lieu_khuon_mat IS NULL AND e.ma_nhan_vien IS NOT NULL THEN e.ma_nhan_vien END) AS facePendingCount,
              GROUP_CONCAT(DISTINCT NULLIF(TRIM(e.chuc_vu), '') ORDER BY e.chuc_vu SEPARATOR ', ') AS positions
       FROM phong_ban d
       LEFT JOIN nhan_vien m ON m.ma_nhan_vien = d.ma_truong_phong
       LEFT JOIN nhan_vien e ON e.ma_phong_ban = d.ma_phong_ban
       GROUP BY d.ma_phong_ban, d.ten_phong_ban, m.ho_ten, m.ma_nhan_vien
       ORDER BY d.ma_phong_ban ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('[DepartmentRoutes] GET / error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET single department with stats
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.ma_phong_ban AS id,
              d.ten_phong_ban AS name,
              d.ma_truong_phong AS managerId,
              m.ho_ten AS manager,
              COUNT(DISTINCT e.ma_nhan_vien) AS headcount,
              COUNT(DISTINCT NULLIF(TRIM(e.chuc_vu), '')) AS positionCount,
              COUNT(DISTINCT CASE WHEN e.du_lieu_khuon_mat IS NOT NULL THEN e.ma_nhan_vien END) AS faceEnrolledCount,
              COUNT(DISTINCT CASE WHEN e.du_lieu_khuon_mat IS NULL AND e.ma_nhan_vien IS NOT NULL THEN e.ma_nhan_vien END) AS facePendingCount,
              GROUP_CONCAT(DISTINCT NULLIF(TRIM(e.chuc_vu), '') ORDER BY e.chuc_vu SEPARATOR ', ') AS positions
       FROM phong_ban d
       LEFT JOIN nhan_vien m ON m.ma_nhan_vien = d.ma_truong_phong
       LEFT JOIN nhan_vien e ON e.ma_phong_ban = d.ma_phong_ban
       WHERE d.ma_phong_ban = ?
       GROUP BY d.ma_phong_ban, d.ten_phong_ban, d.ma_truong_phong, m.ho_ten
       LIMIT 1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Không tìm thấy phòng ban.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[DepartmentRoutes] GET /:id error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET employees of a specific department with their face registration status and linked account
router.get('/:id/employees', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.ma_nhan_vien AS id,
              e.ma_so AS code,
              e.ho_ten AS name,
              e.email,
              e.so_dien_thoai AS phone,
              e.chuc_vu AS position,
              e.trang_thai AS status,
              e.ngay_vao_lam AS joinDate,
              (e.du_lieu_khuon_mat IS NOT NULL) AS hasFace,
              e.du_lieu_khuon_mat AS face_data,
              u.ma_tai_khoan AS accountId,
              u.email AS accountEmail,
              u.vai_tro AS accountRole
       FROM nhan_vien e
       LEFT JOIN tai_khoan u ON u.ma_nhan_vien = e.ma_nhan_vien
       WHERE e.ma_phong_ban = ?
       ORDER BY e.ma_nhan_vien ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('[DepartmentRoutes] GET /:id/employees error:', err);
    res.status(500).json({ message: err.message });
  }
});

// CREATE department with duplicate name prevention
router.post('/', role(['admin', 'hr']), async (req, res) => {
  try {
    const { name, managerId } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Tên phòng ban là bắt buộc.' });

    const trimmedName = name.trim();

    // Kiểm tra tên phòng ban trùng lặp
    const [existing] = await pool.query(
      'SELECT ma_phong_ban FROM phong_ban WHERE LOWER(TRIM(ten_phong_ban)) = LOWER(?) LIMIT 1',
      [trimmedName]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: `Phòng ban "${trimmedName}" đã tồn tại.` });
    }

    const [result] = await pool.query(
      'INSERT INTO phong_ban (ten_phong_ban, ma_truong_phong) VALUES (?, ?)',
      [trimmedName, managerId || null]
    );
    res.status(201).json({ id: result.insertId, name: trimmedName, managerId });
  } catch (err) {
    console.error('[DepartmentRoutes] POST / error:', err);
    res.status(500).json({ message: err.message });
  }
});

// UPDATE department with duplicate name check
router.put('/:id', role(['admin', 'hr']), async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const { name, managerId } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Tên phòng ban là bắt buộc.' });

    const trimmedName = name.trim();

    // Kiểm tra tên phòng ban trùng lặp
    const [existing] = await pool.query(
      'SELECT ma_phong_ban FROM phong_ban WHERE LOWER(TRIM(ten_phong_ban)) = LOWER(?) AND ma_phong_ban != ? LIMIT 1',
      [trimmedName, targetId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: `Phòng ban "${trimmedName}" đã tồn tại.` });
    }

    await pool.query(
      'UPDATE phong_ban SET ten_phong_ban=?, ma_truong_phong=? WHERE ma_phong_ban=?',
      [trimmedName, managerId || null, targetId]
    );
    res.json({ id: targetId, name: trimmedName, managerId });
  } catch (err) {
    console.error('[DepartmentRoutes] PUT /:id error:', err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE department
router.delete('/:id', role(['admin']), async (req, res) => {
  try {
    // Check if any employees are in this department
    const [employees] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM nhan_vien WHERE ma_phong_ban = ?',
      [req.params.id]
    );
    if (employees[0].cnt > 0) {
      return res.status(400).json({ message: `Không thể xóa: Vẫn còn ${employees[0].cnt} nhân viên thuộc phòng ban này.` });
    }
    await pool.query('DELETE FROM phong_ban WHERE ma_phong_ban = ?', [req.params.id]);
    res.json({ message: 'Đã xóa phòng ban thành công.' });
  } catch (err) {
    console.error('[DepartmentRoutes] DELETE /:id error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
