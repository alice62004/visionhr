const pool = require('../config/db');

const Overtime = {
  async findAll() {
    const [rows] = await pool.query(
      `SELECT o.ma_don AS id, o.ma_nhan_vien AS employeeId, e.ho_ten AS employeeName,
              e.ma_so AS employeeCode, d.ten_phong_ban AS department,
              DATE_FORMAT(o.ngay, '%Y-%m-%d') AS date, o.so_gio AS hours, o.ly_do AS reason,
              o.trang_thai AS status, o.ly_do_tu_choi AS reject_reason
       FROM don_tang_ca o 
       JOIN nhan_vien e ON e.ma_nhan_vien = o.ma_nhan_vien
       LEFT JOIN phong_ban d ON d.ma_phong_ban = e.ma_phong_ban
       ORDER BY o.ngay DESC, o.ma_don DESC`
    );
    return rows;
  },

  async findByEmployeeId(employeeId) {
    const [rows] = await pool.query(
      `SELECT o.ma_don AS id, o.ma_nhan_vien AS employeeId, e.ho_ten AS employeeName,
              e.ma_so AS employeeCode, d.ten_phong_ban AS department,
              DATE_FORMAT(o.ngay, '%Y-%m-%d') AS date, o.so_gio AS hours, o.ly_do AS reason,
              o.trang_thai AS status, o.ly_do_tu_choi AS reject_reason
       FROM don_tang_ca o 
       JOIN nhan_vien e ON e.ma_nhan_vien = o.ma_nhan_vien
       LEFT JOIN phong_ban d ON d.ma_phong_ban = e.ma_phong_ban
       WHERE o.ma_nhan_vien = ?
       ORDER BY o.ngay DESC, o.ma_don DESC`,
      [employeeId]
    );
    return rows;
  },

  async create({ employeeId, date, hours, reason, status = 'da_duyet' }) {
    const [result] = await pool.query(
      `INSERT INTO don_tang_ca (ma_nhan_vien, ngay, so_gio, ly_do, trang_thai)
       VALUES (?, ?, ?, ?, ?)`,
      [employeeId, date, hours, reason, status]
    );
    return result.insertId;
  },

  async approve(id) {
    await pool.query('UPDATE don_tang_ca SET trang_thai = "da_duyet" WHERE ma_don = ?', [id]);
  },

  async reject(id, reason) {
    await pool.query(
      'UPDATE don_tang_ca SET trang_thai = "tu_choi", ly_do_tu_choi = ? WHERE ma_don = ?',
      [reason || null, id]
    );
  },
};

module.exports = Overtime;
