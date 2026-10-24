const pool = require('../config/db');

async function updateShiftsAndSchedule() {
  try {
    // 1. Thêm Ca Sáng và Ca Chiều nếu chưa có
    const [existSang] = await pool.query("SELECT * FROM ca_lam_viec WHERE ten_ca LIKE '%Sáng%' LIMIT 1");
    let sangId = existSang.length > 0 ? existSang[0].ma_ca : null;
    if (!sangId) {
      const [res] = await pool.query(
        "INSERT INTO ca_lam_viec (ten_ca, gio_bat_dau, gio_ket_thuc) VALUES ('Ca Sáng', '08:00:00', '11:30:00')"
      );
      sangId = res.insertId;
    } else {
      await pool.query("UPDATE ca_lam_viec SET gio_bat_dau = '08:00:00', gio_ket_thuc = '11:30:00' WHERE ma_ca = ?", [sangId]);
    }

    const [existChieu] = await pool.query("SELECT * FROM ca_lam_viec WHERE ten_ca LIKE '%Chiều%' LIMIT 1");
    let chieuId = existChieu.length > 0 ? existChieu[0].ma_ca : null;
    if (!chieuId) {
      const [res] = await pool.query(
        "INSERT INTO ca_lam_viec (ten_ca, gio_bat_dau, gio_ket_thuc) VALUES ('Ca Chiều', '13:30:00', '17:00:00')"
      );
      chieuId = res.insertId;
    } else {
      await pool.query("UPDATE ca_lam_viec SET gio_bat_dau = '13:30:00', gio_ket_thuc = '17:00:00' WHERE ma_ca = ?", [chieuId]);
    }

    console.log(`Ca Sáng (ID: ${sangId}), Ca Chiều (ID: ${chieuId})`);

    // 2. Xóa các ca hiện tại trong bảng lich_lam_viec
    await pool.query('DELETE FROM lich_lam_viec');

    // 3. Lấy danh sách nhân viên
    const [employees] = await pool.query('SELECT ma_nhan_vien FROM nhan_vien');

    // 4. Lấy Thứ 2 của tuần này
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diff);

    const insertRows = [];
    // Phân từ Thứ 2 đến Thứ 7 (i = 0 đến 5). Chủ nhật (i = 6) KHÔNG LÀM!
    for (let i = 0; i < 6; i++) {
      const curDate = new Date(monday);
      curDate.setDate(monday.getDate() + i);
      const dateStr = curDate.toISOString().slice(0, 10);

      for (const emp of employees) {
        // Mỗi ngày gồm 2 ca: Ca Sáng và Ca Chiều
        insertRows.push([emp.ma_nhan_vien, sangId, dateStr, 'Ca sáng chuẩn', 'da_phan_cong']);
        insertRows.push([emp.ma_nhan_vien, chieuId, dateStr, 'Ca chiều chuẩn', 'da_phan_cong']);
      }
    }

    if (insertRows.length > 0) {
      await pool.query(
        'INSERT IGNORE INTO lich_lam_viec (ma_nhan_vien, ma_ca, ngay_lam_viec, ghi_chu, trang_thai) VALUES ?',
        [insertRows]
      );
      console.log(`✅ Đã phân lại thành công ${insertRows.length} ca làm việc (Thứ 2 đến Thứ 7: Sáng & Chiều. Chủ Nhật: Nghỉ)!`);
    }
  } catch (err) {
    console.error('Error updating schedule:', err);
  } finally {
    process.exit(0);
  }
}

updateShiftsAndSchedule();
