const pool = require('../config/db');

const Leave = {
  async findAll() {
    const [rows] = await pool.query(
      `SELECT l.ma_don AS id, l.ma_nhan_vien AS employeeId, e.ho_ten AS employeeName,
              l.loai_phep AS type, l.tu_ngay AS fromDate, l.den_ngay AS toDate,
              l.ly_do AS reason, l.trang_thai AS status, l.ly_do_tu_choi AS reject_reason
       FROM don_nghi_phep l JOIN nhan_vien e ON e.ma_nhan_vien = l.ma_nhan_vien
       ORDER BY l.ngay_tao DESC`
    );
    return rows;
  },

  async create({ employeeId, type, fromDate, toDate, reason }) {
    const [result] = await pool.query(
      `INSERT INTO don_nghi_phep (ma_nhan_vien, loai_phep, tu_ngay, den_ngay, ly_do, trang_thai)
       VALUES (?, ?, ?, ?, ?, 'cho_duyet')`,
      [employeeId, type, fromDate, toDate, reason]
    );
    return result.insertId;
  },

  async approve(id) {
    await pool.query('UPDATE don_nghi_phep SET trang_thai = "da_duyet" WHERE ma_don = ?', [id]);
  },

  async reject(id, reason) {
    await pool.query(
      'UPDATE don_nghi_phep SET trang_thai = "tu_choi", ly_do_tu_choi = ? WHERE ma_don = ?',
      [reason || null, id]
    );
  },
};

module.exports = Leave;
