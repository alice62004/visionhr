const pool = require('../config/db');

async function migrate() {
  const sql = `
  CREATE TABLE IF NOT EXISTS lich_lam_viec (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ma_nhan_vien INT NOT NULL,
    ma_ca INT NOT NULL,
    ngay_lam_viec DATE NOT NULL,
    ghi_chu VARCHAR(255) NULL,
    trang_thai VARCHAR(50) DEFAULT 'da_phan_cong',
    nguoi_phan_cong INT NULL,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_emp_date_shift (ma_nhan_vien, ngay_lam_viec, ma_ca),
    CONSTRAINT fk_lich_nhanvien FOREIGN KEY (ma_nhan_vien) REFERENCES nhan_vien(ma_nhan_vien) ON DELETE CASCADE,
    CONSTRAINT fk_lich_ca FOREIGN KEY (ma_ca) REFERENCES ca_lam_viec(ma_ca) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await pool.query(sql);
    console.log('✅ TABLE lich_lam_viec created successfully!');

    // Thêm một số dữ liệu mẫu cho tuần hiện tại nếu chưa có
    const [existing] = await pool.query('SELECT COUNT(*) AS total FROM lich_lam_viec');
    if (existing[0].total === 0) {
      console.log('Inserting sample shift assignments...');
      // Lấy danh sách nhân viên và ca
      const [emps] = await pool.query('SELECT ma_nhan_vien FROM nhan_vien LIMIT 10');
      const [shifts] = await pool.query('SELECT ma_ca FROM ca_lam_viec LIMIT 2');
      if (emps.length > 0 && shifts.length > 0) {
        const today = new Date();
        const baseMonday = new Date(today);
        baseMonday.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Thứ 2 tuần này

        const insertValues = [];
        for (let i = 0; i < 6; i++) { // Thứ 2 đến Thứ 7
          const d = new Date(baseMonday);
          d.setDate(baseMonday.getDate() + i);
          const dateStr = d.toISOString().slice(0, 10);
          
          for (const emp of emps) {
            const shiftId = shifts[0].ma_ca;
            insertValues.push([emp.ma_nhan_vien, shiftId, dateStr, 'Ca hành chính tuần', 'da_phan_cong']);
          }
        }

        if (insertValues.length > 0) {
          await pool.query(
            'INSERT IGNORE INTO lich_lam_viec (ma_nhan_vien, ma_ca, ngay_lam_viec, ghi_chu, trang_thai) VALUES ?',
            [insertValues]
          );
          console.log(`✅ Seeded ${insertValues.length} schedule rows.`);
        }
      }
    }
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
