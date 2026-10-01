const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(auth, role(['admin']));

router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT al.ma_nhat_ky AS id, u.ho_ten AS user, al.hanh_dong AS action, al.chuc_nang AS module, al.ngay_tao AS timestamp
     FROM nhat_ky_he_thong al LEFT JOIN tai_khoan u ON u.ma_tai_khoan = al.ma_tai_khoan
     ORDER BY al.ngay_tao DESC LIMIT 200`
  );
  res.json(rows);
});

module.exports = router;
