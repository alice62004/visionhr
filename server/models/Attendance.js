const pool = require('../config/db');

const Attendance = {
  async findAll() {
    const [rows] = await pool.query(
      `SELECT a.ma_cham_cong AS id, a.ma_nhan_vien AS employeeId, e.ho_ten AS employeeName,
              a.ngay AS date, a.gio_vao AS checkIn, a.gio_ra AS checkOut,
              a.trang_thai AS status, a.phuong_thuc AS method
       FROM cham_cong a
       JOIN nhan_vien e ON e.ma_nhan_vien = a.ma_nhan_vien
       ORDER BY a.ngay DESC, a.gio_vao DESC`
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT a.ma_cham_cong AS id, a.ma_nhan_vien AS employeeId, e.ho_ten AS employeeName,
              a.ngay AS date, a.gio_vao AS checkIn, a.gio_ra AS checkOut,
              a.trang_thai AS status, a.phuong_thuc AS method
       FROM cham_cong a JOIN nhan_vien e ON e.ma_nhan_vien = a.ma_nhan_vien
       WHERE a.ma_cham_cong = ? LIMIT 1`,
      [id]
    );
    return rows[0];
  },

  async recordCheckIn({ employeeId, method, status = 'dung_gio' }) {
    // Kiểm tra xem hôm nay nhân viên đã có bản ghi chấm công chưa
    const [existing] = await pool.query(
      `SELECT ma_cham_cong, gio_vao, gio_ra FROM cham_cong 
       WHERE ma_nhan_vien = ? AND ngay = CURDATE() 
       ORDER BY ma_cham_cong DESC LIMIT 1`,
      [employeeId]
    );

    // Nếu đã check-in cách đây hơn 2 phút và chưa có giờ ra thì cập nhật giờ ra
    if (existing.length > 0 && !existing[0].gio_ra) {
      await pool.query(
        `UPDATE cham_cong SET gio_ra = CURTIME() WHERE ma_cham_cong = ?`,
        [existing[0].ma_cham_cong]
      );
      return { id: existing[0].ma_cham_cong, action: 'check_out' };
    }

    const [result] = await pool.query(
      `INSERT INTO cham_cong (ma_nhan_vien, ngay, gio_vao, trang_thai, phuong_thuc)
       VALUES (?, CURDATE(), CURTIME(), ?, ?)`,
      [employeeId, status, method]
    );
    return { id: result.insertId, action: 'check_in' };
  },
};

module.exports = Attendance;
