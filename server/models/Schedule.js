const pool = require('../config/db');

const Schedule = {
  // Lấy lịch làm việc của một nhân viên cụ thể theo khoảng ngày (kèm trạng thái chấm công & nghỉ phép)
  async findByEmployeeId(employeeId, startDate, endDate) {
    let sql = `
      SELECT l.id, l.ma_nhan_vien AS employeeId, l.ma_ca AS shiftId,
             DATE_FORMAT(l.ngay_lam_viec, '%Y-%m-%d') AS date,
             l.ghi_chu AS note, l.trang_thai AS status, l.ngay_tao AS createdAt,
             e.ho_ten AS employeeName, e.ma_so AS employeeCode, e.chuc_vu AS position,
             c.ten_ca AS shiftName, TIME_FORMAT(c.gio_bat_dau, '%H:%i') AS startTime,
             TIME_FORMAT(c.gio_ket_thuc, '%H:%i') AS endTime,
             d.ten_phong_ban AS department,
             cc.ma_cham_cong AS attendanceId,
             TIME_FORMAT(cc.gio_vao, '%H:%i:%s') AS checkInTime,
             TIME_FORMAT(cc.gio_ra, '%H:%i:%s') AS checkOutTime,
             cc.trang_thai AS attendanceStatus,
             dnp.loai_phep AS leaveType
      FROM lich_lam_viec l
      JOIN nhan_vien e ON e.ma_nhan_vien = l.ma_nhan_vien
      JOIN ca_lam_viec c ON c.ma_ca = l.ma_ca
      LEFT JOIN phong_ban d ON d.ma_phong_ban = e.ma_phong_ban
      LEFT JOIN (
        SELECT ma_nhan_vien, ngay,
               MIN(gio_vao) AS gio_vao,
               MAX(gio_ra) AS gio_ra,
               MAX(ma_cham_cong) AS ma_cham_cong,
               SUBSTRING_INDEX(GROUP_CONCAT(trang_thai ORDER BY ma_cham_cong DESC), ',', 1) AS trang_thai
        FROM cham_cong
        GROUP BY ma_nhan_vien, ngay
      ) cc ON cc.ma_nhan_vien = l.ma_nhan_vien AND cc.ngay = l.ngay_lam_viec
      LEFT JOIN (
        SELECT ma_nhan_vien, tu_ngay, den_ngay, loai_phep
        FROM don_nghi_phep
        WHERE trang_thai = 'da_duyet'
        GROUP BY ma_nhan_vien, tu_ngay, den_ngay, loai_phep
      ) dnp ON dnp.ma_nhan_vien = l.ma_nhan_vien 
            AND l.ngay_lam_viec BETWEEN dnp.tu_ngay AND dnp.den_ngay
      WHERE l.ma_nhan_vien = ?
    `;
    const params = [employeeId];

    if (startDate && endDate) {
      sql += ' AND l.ngay_lam_viec BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    sql += ' ORDER BY l.ngay_lam_viec ASC, c.gio_bat_dau ASC';

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  // Lấy lịch làm việc có bộ lọc (cho Manager / HR / Admin)
  async findAll({ departmentId, startDate, endDate, employeeId }) {
    let sql = `
      SELECT l.id, l.ma_nhan_vien AS employeeId, l.ma_ca AS shiftId,
             DATE_FORMAT(l.ngay_lam_viec, '%Y-%m-%d') AS date,
             l.ghi_chu AS note, l.trang_thai AS status, l.ngay_tao AS createdAt,
             e.ho_ten AS employeeName, e.ma_so AS employeeCode, e.chuc_vu AS position,
             e.ma_phong_ban AS departmentId,
             c.ten_ca AS shiftName, TIME_FORMAT(c.gio_bat_dau, '%H:%i') AS startTime,
             TIME_FORMAT(c.gio_ket_thuc, '%H:%i') AS endTime,
             d.ten_phong_ban AS department,
             cc.ma_cham_cong AS attendanceId,
             TIME_FORMAT(cc.gio_vao, '%H:%i:%s') AS checkInTime,
             TIME_FORMAT(cc.gio_ra, '%H:%i:%s') AS checkOutTime,
             cc.trang_thai AS attendanceStatus,
             dnp.loai_phep AS leaveType
      FROM lich_lam_viec l
      JOIN nhan_vien e ON e.ma_nhan_vien = l.ma_nhan_vien
      JOIN ca_lam_viec c ON c.ma_ca = l.ma_ca
      LEFT JOIN phong_ban d ON d.ma_phong_ban = e.ma_phong_ban
      LEFT JOIN (
        SELECT ma_nhan_vien, ngay,
               MIN(gio_vao) AS gio_vao,
               MAX(gio_ra) AS gio_ra,
               MAX(ma_cham_cong) AS ma_cham_cong,
               SUBSTRING_INDEX(GROUP_CONCAT(trang_thai ORDER BY ma_cham_cong DESC), ',', 1) AS trang_thai
        FROM cham_cong
        GROUP BY ma_nhan_vien, ngay
      ) cc ON cc.ma_nhan_vien = l.ma_nhan_vien AND cc.ngay = l.ngay_lam_viec
      LEFT JOIN (
        SELECT ma_nhan_vien, tu_ngay, den_ngay, loai_phep
        FROM don_nghi_phep
        WHERE trang_thai = 'da_duyet'
        GROUP BY ma_nhan_vien, tu_ngay, den_ngay, loai_phep
      ) dnp ON dnp.ma_nhan_vien = l.ma_nhan_vien 
            AND l.ngay_lam_viec BETWEEN dnp.tu_ngay AND dnp.den_ngay
      WHERE 1=1
    `;
    const params = [];

    if (employeeId) {
      sql += ' AND l.ma_nhan_vien = ?';
      params.push(employeeId);
    }
    if (departmentId) {
      sql += ' AND e.ma_phong_ban = ?';
      params.push(departmentId);
    }
    if (startDate && endDate) {
      sql += ' AND l.ngay_lam_viec BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    sql += ' ORDER BY l.ngay_lam_viec ASC, e.ho_ten ASC, c.gio_bat_dau ASC';

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  // Gán ca làm việc cho một ngày
  async assign({ employeeId, shiftId, date, note, assignedBy }) {
    const sql = `
      INSERT INTO lich_lam_viec (ma_nhan_vien, ma_ca, ngay_lam_viec, ghi_chu, nguoi_phan_cong, trang_thai)
      VALUES (?, ?, ?, ?, ?, 'da_phan_cong')
      ON DUPLICATE KEY UPDATE ma_ca = VALUES(ma_ca), ghi_chu = VALUES(ghi_chu), nguoi_phan_cong = VALUES(nguoi_phan_cong)
    `;
    const [result] = await pool.query(sql, [employeeId, shiftId, date, note || null, assignedBy || null]);
    return result.insertId || result.affectedRows;
  },

  // Phân ca hàng loạt theo khoảng ngày
  async bulkAssign({ employeeIds, shiftId, startDate, endDate, note, assignedBy }) {
    if (!employeeIds || employeeIds.length === 0) return 0;
    // Dùng giờ trưa (12:00) theo lịch địa phương để hoàn toàn tránh lỗi lệch múi giờ UTC
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd, 12, 0, 0);
    const end = new Date(ey, em - 1, ed, 12, 0, 0);
    const dates = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      // Mặc định bỏ qua Chủ Nhật (ngày nghỉ cố định của công ty)
      if (d.getDay() === 0) continue;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${day}`);
    }

    const values = [];
    for (const empId of employeeIds) {
      for (const dt of dates) {
        values.push([empId, shiftId, dt, note || null, assignedBy || null, 'da_phan_cong']);
      }
    }

    if (values.length === 0) return 0;

    const sql = `
      INSERT INTO lich_lam_viec (ma_nhan_vien, ma_ca, ngay_lam_viec, ghi_chu, nguoi_phan_cong, trang_thai)
      VALUES ?
      ON DUPLICATE KEY UPDATE ma_ca = VALUES(ma_ca), ghi_chu = VALUES(ghi_chu), nguoi_phan_cong = VALUES(nguoi_phan_cong)
    `;
    const [res] = await pool.query(sql, [values]);
    return res.affectedRows;
  },

  // Hủy ca làm việc
  async deleteById(id) {
    const [res] = await pool.query('DELETE FROM lich_lam_viec WHERE id = ?', [id]);
    return res.affectedRows;
  },

  async deleteByEmpAndDate(employeeId, date) {
    const [res] = await pool.query('DELETE FROM lich_lam_viec WHERE ma_nhan_vien = ? AND ngay_lam_viec = ?', [employeeId, date]);
    return res.affectedRows;
  },
};

module.exports = Schedule;
