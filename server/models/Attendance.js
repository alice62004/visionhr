const pool = require('../config/db');
const { saveAttendanceSnapshot, getAttendanceSnapshot } = require('../services/attendanceSnapshotService');

function attachSnapshot(row) {
  if (!row) return null;
  const snapshot = getAttendanceSnapshot(row.id);
  let fallbackImg = null;
  if (row.face_data) {
    try {
      const parsed = typeof row.face_data === 'string' ? JSON.parse(row.face_data) : row.face_data;
      if (parsed && parsed.image) fallbackImg = parsed.image;
    } catch {}
  }

  // Ưu tiên đọc từ cột MySQL anh_vao/anh_ra, sau đó fallback sang file JSON snapshot, cuối cùng fallback sang ảnh khuôn mặt hồ sơ
  const inImg = row.anh_vao || snapshot?.inImage || fallbackImg;
  const outImg = row.anh_ra || snapshot?.outImage || inImg;
  const snapshotImage = inImg || outImg || fallbackImg;

  return {
    ...row,
    avatar: fallbackImg,
    snapshotImage,
    inImage: inImg,
    outImage: outImg,
    hasRealSnapshot: Boolean(row.anh_vao || row.anh_ra || snapshot?.inImage || snapshot?.outImage),
  };
}

function buildAttendanceResult({
  id = null,
  action,
  message,
  checkIn = null,
  checkOut = null,
  status = null,
  shiftName = '',
  imageBase64 = null,
  employeeId = null,
  employeeName = '',
}) {
  if (imageBase64 && id) {
    saveAttendanceSnapshot(id, {
      imageBase64,
      action: action === 'already_checked_in' || action === 'already_completed' ? 'check_in' : action,
      shiftName,
      employeeId,
      employeeName,
    });
  }
  return {
    id,
    action,
    message,
    checkIn,
    checkOut,
    status,
    shiftName,
    snapshotImage: imageBase64,
  };
}

const Attendance = {
  async findAll(filterEmployeeId = null) {
    let sql = `
      SELECT a.ma_cham_cong AS id, a.ma_nhan_vien AS employeeId,
             e.ho_ten AS employeeName, e.ma_so AS employeeCode,
             d.ten_phong_ban AS department, e.chuc_vu AS position,
             e.du_lieu_khuon_mat AS face_data,
             DATE_FORMAT(a.ngay, '%Y-%m-%d') AS date,
             a.gio_vao AS checkIn, a.gio_ra AS checkOut,
             a.trang_thai AS status, a.phuong_thuc AS method,
             a.anh_vao, a.anh_ra,
             CASE 
               WHEN HOUR(a.gio_vao) < 12 THEN 'Ca Sáng (08:00 - 11:30)'
               ELSE 'Ca Chiều (13:30 - 17:00)'
             END AS shiftName
      FROM cham_cong a
      JOIN nhan_vien e ON e.ma_nhan_vien = a.ma_nhan_vien
      LEFT JOIN phong_ban d ON d.ma_phong_ban = e.ma_phong_ban
    `;
    const params = [];
    if (filterEmployeeId) {
      sql += ' WHERE a.ma_nhan_vien = ?';
      params.push(filterEmployeeId);
    }
    sql += ' ORDER BY a.ngay DESC, a.gio_vao DESC';

    const [rows] = await pool.query(sql, params);
    return rows.map(attachSnapshot);
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT a.ma_cham_cong AS id, a.ma_nhan_vien AS employeeId,
              e.ho_ten AS employeeName, e.ma_so AS employeeCode,
              d.ten_phong_ban AS department, e.chuc_vu AS position,
              e.du_lieu_khuon_mat AS face_data,
              DATE_FORMAT(a.ngay, '%Y-%m-%d') AS date,
              a.gio_vao AS checkIn, a.gio_ra AS checkOut,
              a.trang_thai AS status, a.phuong_thuc AS method,
              a.anh_vao, a.anh_ra,
              CASE 
                WHEN HOUR(a.gio_vao) < 12 THEN 'Ca Sáng (08:00 - 11:30)'
                ELSE 'Ca Chiều (13:30 - 17:00)'
              END AS shiftName
       FROM cham_cong a
       JOIN nhan_vien e ON e.ma_nhan_vien = a.ma_nhan_vien
       LEFT JOIN phong_ban d ON d.ma_phong_ban = e.ma_phong_ban
       WHERE a.ma_cham_cong = ? LIMIT 1`,
      [id]
    );
    return attachSnapshot(rows[0]);
  },

  async findByEmployeeId(employeeId) {
    return this.findAll(employeeId);
  },

  async recordCheckIn({
    employeeId,
    method = 'nhan_dien_khuon_mat',
    actionType = 'auto',
    shiftMode = 'auto',
    imageBase64 = null,
    employeeName = '',
  }) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMin = currentHour * 60 + currentMinute;

    // 1. Lấy danh sách các bản ghi chấm công trong ngày của nhân viên
    const [existingToday] = await pool.query(
      `SELECT ma_cham_cong, gio_vao, gio_ra, trang_thai,
              TIMESTAMPDIFF(MINUTE, gio_vao, CURTIME()) AS diffMinutes,
              HOUR(gio_vao) AS inHour
       FROM cham_cong 
       WHERE ma_nhan_vien = ? AND DATE_FORMAT(ngay, '%Y-%m-%d') = CURDATE() 
       ORDER BY ma_cham_cong ASC`,
      [employeeId]
    );

    const morningRecord = existingToday.find((r) => Number(r.inHour) < 12);
    const afternoonRecord = existingToday.find((r) => Number(r.inHour) >= 12);

    // =========================================================================
    // XỬ LÝ 1: CA SÁNG - VÀO (morning_in)
    // =========================================================================
    if (shiftMode === 'morning_in') {
      const shiftName = 'Ca Sáng (08:00 - 11:30)';
      const isLate = currentTotalMin > 8 * 60;
      const statusMorning = isLate ? 'di_muon' : 'dung_gio';

      if (morningRecord) {
        return buildAttendanceResult({
          id: morningRecord.ma_cham_cong,
          action: 'already_checked_in',
          message: `Bạn đã điểm danh Vào Ca Sáng lúc ${(morningRecord.gio_vao || '').slice(0, 5)} (${morningRecord.trang_thai === 'dung_gio' ? 'Đúng giờ' : 'Đi muộn'}).`,
          checkIn: morningRecord.gio_vao,
          checkOut: morningRecord.gio_ra,
          status: morningRecord.trang_thai,
          shiftName,
          imageBase64,
          employeeId,
          employeeName,
        });
      }

      const [ins] = await pool.query(
        `INSERT INTO cham_cong (ma_nhan_vien, ngay, gio_vao, trang_thai, phuong_thuc)
         VALUES (?, CURDATE(), CURTIME(), ?, ?)`,
        [employeeId, statusMorning, method]
      );

      const [rec] = await pool.query('SELECT gio_vao FROM cham_cong WHERE ma_cham_cong = ?', [ins.insertId]);
      const formattedIn = (rec[0]?.gio_vao || '').slice(0, 5);
      return buildAttendanceResult({
        id: ins.insertId,
        action: 'check_in',
        message: `Vào Ca Sáng thành công lúc ${formattedIn} (${statusMorning === 'dung_gio' ? 'Đúng giờ' : 'Đi muộn'}). Chúc bạn buổi sáng làm việc hiệu quả!`,
        checkIn: rec[0]?.gio_vao,
        checkOut: null,
        status: statusMorning,
        shiftName,
        imageBase64,
        employeeId,
        employeeName,
      });
    }

    // =========================================================================
    // XỬ LÝ 2: CA SÁNG - RA NGHỈ TRƯA (morning_out)
    // =========================================================================
    if (shiftMode === 'morning_out') {
      const shiftName = 'Ca Sáng (08:00 - 11:30)';
      if (!morningRecord) {
        return buildAttendanceResult({
          action: 'not_checked_in_yet',
          message: 'Hôm nay bạn chưa có lượt Vào Ca Sáng nên không thể ghi nhận Ra ca sáng!',
          shiftName,
        });
      }

      await pool.query('UPDATE cham_cong SET gio_ra = CURTIME() WHERE ma_cham_cong = ?', [morningRecord.ma_cham_cong]);
      const [upd] = await pool.query('SELECT gio_ra FROM cham_cong WHERE ma_cham_cong = ?', [morningRecord.ma_cham_cong]);
      const formattedOut = (upd[0]?.gio_ra || '').slice(0, 5);
      return buildAttendanceResult({
        id: morningRecord.ma_cham_cong,
        action: 'check_out',
        message: `Ghi nhận Ra Ca Sáng (nghỉ trưa) thành công lúc ${formattedOut}. Ca chiều bắt đầu lúc 13:30!`,
        checkIn: morningRecord.gio_vao,
        checkOut: upd[0]?.gio_ra,
        status: morningRecord.trang_thai,
        shiftName,
        imageBase64,
        employeeId,
        employeeName,
      });
    }

    // =========================================================================
    // XỬ LÝ 3: CA CHIỀU - VÀO (afternoon_in)
    // =========================================================================
    if (shiftMode === 'afternoon_in') {
      const shiftName = 'Ca Chiều (13:30 - 17:00)';
      const isLateAfternoon = currentTotalMin > 13 * 60 + 30;
      const statusAfternoon = isLateAfternoon ? 'di_muon' : 'dung_gio';

      if (afternoonRecord) {
        return buildAttendanceResult({
          id: afternoonRecord.ma_cham_cong,
          action: 'already_checked_in',
          message: `Bạn đã điểm danh Vào Ca Chiều lúc ${(afternoonRecord.gio_vao || '').slice(0, 5)} (${afternoonRecord.trang_thai === 'dung_gio' ? 'Đúng giờ' : 'Đi muộn'}).`,
          checkIn: afternoonRecord.gio_vao,
          checkOut: afternoonRecord.gio_ra,
          status: afternoonRecord.trang_thai,
          shiftName,
          imageBase64,
          employeeId,
          employeeName,
        });
      }

      const [ins] = await pool.query(
        `INSERT INTO cham_cong (ma_nhan_vien, ngay, gio_vao, trang_thai, phuong_thuc)
         VALUES (?, CURDATE(), CURTIME(), ?, ?)`,
        [employeeId, statusAfternoon, method]
      );

      const [rec] = await pool.query('SELECT gio_vao FROM cham_cong WHERE ma_cham_cong = ?', [ins.insertId]);
      const formattedIn = (rec[0]?.gio_vao || '').slice(0, 5);
      return buildAttendanceResult({
        id: ins.insertId,
        action: 'check_in',
        message: `Vào Ca Chiều thành công lúc ${formattedIn} (${statusAfternoon === 'dung_gio' ? 'Đúng giờ' : 'Đi muộn'}). Chúc bạn buổi chiều làm việc hiệu quả!`,
        checkIn: rec[0]?.gio_vao,
        checkOut: null,
        status: statusAfternoon,
        shiftName,
        imageBase64,
        employeeId,
        employeeName,
      });
    }

    // =========================================================================
    // XỬ LÝ 4: CA CHIỀU - RA TAN SỞ (afternoon_out)
    // =========================================================================
    if (shiftMode === 'afternoon_out') {
      const shiftName = 'Ca Chiều (13:30 - 17:00)';
      if (!afternoonRecord) {
        return buildAttendanceResult({
          action: 'not_checked_in_yet',
          message: 'Hôm nay bạn chưa có lượt Vào Ca Chiều nên không thể ghi nhận Ra ca chiều!',
          shiftName,
        });
      }

      await pool.query('UPDATE cham_cong SET gio_ra = CURTIME() WHERE ma_cham_cong = ?', [afternoonRecord.ma_cham_cong]);
      const [upd] = await pool.query('SELECT gio_ra FROM cham_cong WHERE ma_cham_cong = ?', [afternoonRecord.ma_cham_cong]);
      const formattedOut = (upd[0]?.gio_ra || '').slice(0, 5);
      return buildAttendanceResult({
        id: afternoonRecord.ma_cham_cong,
        action: 'check_out',
        message: `Ghi nhận Ra Ca Chiều (tan sở) thành công lúc ${formattedOut}. Tạm biệt và hẹn gặp lại!`,
        checkIn: afternoonRecord.gio_vao,
        checkOut: upd[0]?.gio_ra,
        status: afternoonRecord.trang_thai,
        shiftName,
        imageBase64,
        employeeId,
        employeeName,
      });
    }

    // =========================================================================
    // XỬ LÝ 5: CHẾ ĐỘ TỰ ĐỘNG THEO THỜI GIAN THỰC (shiftMode === 'auto')
    // =========================================================================
    const isAfternoon = currentTotalMin >= 12 * 60; // từ 12:00 trở đi là chiều

    if (isAfternoon) {
      const shiftName = 'Ca Chiều (13:30 - 17:00)';
      const isLateAfternoon = currentTotalMin > 13 * 60 + 30;
      const statusAfternoon = isLateAfternoon ? 'di_muon' : 'dung_gio';

      // Nếu chưa có lượt vào chiều
      if (!afternoonRecord) {
        if (actionType === 'check_out') {
          return buildAttendanceResult({
            action: 'not_checked_in_yet',
            message: 'Bạn chưa có lượt Chấm công Vào Ca Chiều hôm nay nên không thể ghi nhận Giờ Ra!',
            shiftName,
          });
        }

        const [insertRes] = await pool.query(
          `INSERT INTO cham_cong (ma_nhan_vien, ngay, gio_vao, trang_thai, phuong_thuc)
           VALUES (?, CURDATE(), CURTIME(), ?, ?)`,
          [employeeId, statusAfternoon, method]
        );

        const [created] = await pool.query('SELECT gio_vao FROM cham_cong WHERE ma_cham_cong = ?', [insertRes.insertId]);
        const formattedIn = (created[0]?.gio_vao || '').slice(0, 5);
        return buildAttendanceResult({
          id: insertRes.insertId,
          action: 'check_in',
          message: `Ghi nhận Vào Ca Chiều thành công lúc ${formattedIn} (${statusAfternoon === 'dung_gio' ? 'Đúng giờ' : 'Đi muộn'}).`,
          checkIn: created[0]?.gio_vao,
          checkOut: null,
          status: statusAfternoon,
          shiftName,
          imageBase64,
          employeeId,
          employeeName,
        });
      }

      // Đã có giờ vào chiều nhưng chưa có giờ ra -> ghi nhận giờ ra
      if (!afternoonRecord.gio_ra || actionType === 'check_out') {
        const diffMin = afternoonRecord.diffMinutes != null ? Number(afternoonRecord.diffMinutes) : 0;
        if (actionType !== 'check_out' && diffMin < 5) {
          return buildAttendanceResult({
            id: afternoonRecord.ma_cham_cong,
            action: 'already_checked_in',
            message: `Bạn vừa điểm danh vào ca chiều lúc ${(afternoonRecord.gio_vao || '').slice(0, 5)} rồi! Vui lòng không quét trùng liên tiếp.`,
            checkIn: afternoonRecord.gio_vao,
            checkOut: null,
            status: afternoonRecord.trang_thai,
            shiftName,
            imageBase64,
            employeeId,
            employeeName,
          });
        }

        await pool.query('UPDATE cham_cong SET gio_ra = CURTIME() WHERE ma_cham_cong = ?', [afternoonRecord.ma_cham_cong]);
        const [updated] = await pool.query('SELECT gio_ra FROM cham_cong WHERE ma_cham_cong = ?', [afternoonRecord.ma_cham_cong]);
        const formattedOut = (updated[0]?.gio_ra || '').slice(0, 5);
        return buildAttendanceResult({
          id: afternoonRecord.ma_cham_cong,
          action: 'check_out',
          message: `Ghi nhận Ra về Ca Chiều thành công lúc ${formattedOut}. Tạm biệt và hẹn gặp lại!`,
          checkIn: afternoonRecord.gio_vao,
          checkOut: updated[0]?.gio_ra,
          status: afternoonRecord.trang_thai,
          shiftName,
          imageBase64,
          employeeId,
          employeeName,
        });
      }

      return buildAttendanceResult({
        id: afternoonRecord.ma_cham_cong,
        action: 'already_completed',
        message: `Hôm nay bạn đã hoàn thành điểm danh Ca Chiều (Vào: ${(afternoonRecord.gio_vao || '').slice(0, 5)} - Ra: ${(afternoonRecord.gio_ra || '').slice(0, 5)}).`,
        checkIn: afternoonRecord.gio_vao,
        checkOut: afternoonRecord.gio_ra,
        status: afternoonRecord.trang_thai,
        shiftName,
        imageBase64,
        employeeId,
        employeeName,
      });
    }

    // Buổi sáng tự động
    const shiftName = 'Ca Sáng (08:00 - 11:30)';
    const isLateMorning = currentTotalMin > 8 * 60;
    const statusMorning = isLateMorning ? 'di_muon' : 'dung_gio';

    if (!morningRecord) {
      if (actionType === 'check_out') {
        return buildAttendanceResult({
          action: 'not_checked_in_yet',
          message: 'Bạn chưa có lượt Chấm công Vào Ca Sáng hôm nay nên không thể ghi nhận Giờ Ra!',
          shiftName,
        });
      }

      const [insertRes] = await pool.query(
        `INSERT INTO cham_cong (ma_nhan_vien, ngay, gio_vao, trang_thai, phuong_thuc)
         VALUES (?, CURDATE(), CURTIME(), ?, ?)`,
        [employeeId, statusMorning, method]
      );

      const [created] = await pool.query('SELECT gio_vao FROM cham_cong WHERE ma_cham_cong = ?', [insertRes.insertId]);
      const formattedIn = (created[0]?.gio_vao || '').slice(0, 5);
      return buildAttendanceResult({
        id: insertRes.insertId,
        action: 'check_in',
        message: `Check-in Ca Sáng thành công lúc ${formattedIn} (${statusMorning === 'dung_gio' ? 'Đúng giờ' : 'Đi muộn'}).`,
        checkIn: created[0]?.gio_vao,
        checkOut: null,
        status: statusMorning,
        shiftName,
        imageBase64,
        employeeId,
        employeeName,
      });
    }

    if (!morningRecord.gio_ra || actionType === 'check_out') {
      const diffMin = morningRecord.diffMinutes != null ? Number(morningRecord.diffMinutes) : 0;
      if (actionType !== 'check_out' && diffMin < 5) {
        return buildAttendanceResult({
          id: morningRecord.ma_cham_cong,
          action: 'already_checked_in',
          message: `Bạn vừa điểm danh vào ca sáng lúc ${(morningRecord.gio_vao || '').slice(0, 5)} rồi! Vui lòng không quét trùng liên tiếp.`,
          checkIn: morningRecord.gio_vao,
          checkOut: null,
          status: morningRecord.trang_thai,
          shiftName,
          imageBase64,
          employeeId,
          employeeName,
        });
      }

      await pool.query('UPDATE cham_cong SET gio_ra = CURTIME() WHERE ma_cham_cong = ?', [morningRecord.ma_cham_cong]);
      const [updated] = await pool.query('SELECT gio_ra FROM cham_cong WHERE ma_cham_cong = ?', [morningRecord.ma_cham_cong]);
      const formattedOut = (updated[0]?.gio_ra || '').slice(0, 5);
      return buildAttendanceResult({
        id: morningRecord.ma_cham_cong,
        action: 'check_out',
        message: `Ghi nhận Giờ Ra nghỉ trưa Ca Sáng thành công lúc ${formattedOut}. Ca chiều bắt đầu lúc 13:30!`,
        checkIn: morningRecord.gio_vao,
        checkOut: updated[0]?.gio_ra,
        status: morningRecord.trang_thai,
        shiftName,
        imageBase64,
        employeeId,
        employeeName,
      });
    }

    return buildAttendanceResult({
      id: morningRecord.ma_cham_cong,
      action: 'already_completed',
      message: `Bạn đã điểm danh Ca Sáng (Vào: ${(morningRecord.gio_vao || '').slice(0, 5)} - Ra: ${(morningRecord.gio_ra || '').slice(0, 5)}). Ca chiều bắt đầu lúc 13:30!`,
      checkIn: morningRecord.gio_vao,
      checkOut: morningRecord.gio_ra,
      status: morningRecord.trang_thai,
      shiftName,
      imageBase64,
      employeeId,
      employeeName,
    });  },
};

module.exports = Attendance;
