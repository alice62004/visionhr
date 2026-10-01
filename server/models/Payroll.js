const pool = require('../config/db');

const Payroll = {
  async findAll(month) {
    const [rows] = await pool.query(
      `SELECT p.ma_bang_luong AS id, p.ma_nhan_vien AS employeeId, e.ho_ten AS employeeName,
              p.thang AS month, p.luong_co_ban AS baseSalary,
              p.luong_tang_ca AS otPay, p.luong_thuc_nhan AS netSalary
       FROM bang_luong p JOIN nhan_vien e ON e.ma_nhan_vien = p.ma_nhan_vien
       WHERE (? IS NULL OR p.thang = ?)
       ORDER BY p.thang DESC`,
      [month || null, month || null]
    );
    return rows;
  },
};

module.exports = Payroll;
