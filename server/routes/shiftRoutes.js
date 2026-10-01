const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

const router = express.Router();
router.use(auth);

// GET all shifts
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.ma_ca AS id, s.ten_ca AS name, s.gio_bat_dau AS startTime, s.gio_ket_thuc AS endTime,
              s.ma_phong_ban AS departmentId, d.ten_phong_ban AS department
       FROM ca_lam_viec s LEFT JOIN phong_ban d ON d.ma_phong_ban = s.ma_phong_ban
       ORDER BY s.ma_ca DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single shift
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.ma_ca AS id, s.ten_ca AS name, s.gio_bat_dau AS startTime, s.gio_ket_thuc AS endTime,
              s.ma_phong_ban AS departmentId, d.ten_phong_ban AS department
       FROM ca_lam_viec s LEFT JOIN phong_ban d ON d.ma_phong_ban = s.ma_phong_ban
       WHERE s.ma_ca = ? LIMIT 1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Không tìm thấy ca làm việc.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE shift
router.post('/', role(['admin', 'hr']), async (req, res) => {
  try {
    const { name, startTime, endTime, departmentId } = req.body;
    if (!name || !startTime || !endTime) {
      return res.status(400).json({ message: 'Tên ca, giờ bắt đầu và kết thúc là bắt buộc.' });
    }
    const [result] = await pool.query(
      'INSERT INTO ca_lam_viec (ten_ca, gio_bat_dau, gio_ket_thuc, ma_phong_ban) VALUES (?, ?, ?, ?)',
      [name, startTime, endTime, departmentId || null]
    );
    res.status(201).json({ id: result.insertId, name, startTime, endTime, departmentId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE shift
router.put('/:id', role(['admin', 'hr']), async (req, res) => {
  try {
    const { name, startTime, endTime, departmentId } = req.body;
    await pool.query(
      'UPDATE ca_lam_viec SET ten_ca=?, gio_bat_dau=?, gio_ket_thuc=?, ma_phong_ban=? WHERE ma_ca=?',
      [name, startTime, endTime, departmentId || null, req.params.id]
    );
    res.json({ id: req.params.id, name, startTime, endTime, departmentId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE shift
router.delete('/:id', role(['admin', 'hr']), async (req, res) => {
  try {
    await pool.query('DELETE FROM ca_lam_viec WHERE ma_ca = ?', [req.params.id]);
    res.json({ message: 'Đã xóa ca làm việc.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
