const pool = require('../config/db');

async function initContractTable() {
  console.log('--- KHỞI TẠO BẢNG HỢP ĐỒNG LAO ĐỘNG ---');

  const createTableSql = `
    CREATE TABLE IF NOT EXISTS hop_dong_lao_dong (
      ma_hop_dong INT AUTO_INCREMENT PRIMARY KEY,
      so_hop_dong VARCHAR(50) UNIQUE NOT NULL,
      ma_nhan_vien INT NOT NULL,
      loai_hop_dong ENUM('thu_viec', 'xac_dinh_thoi_han', 'khong_xac_dinh_thoi_han', 'thoi_vu') NOT NULL DEFAULT 'xac_dinh_thoi_han',
      ngay_ky DATE NOT NULL,
      ngay_hieu_luc DATE NOT NULL,
      ngay_het_han DATE NULL,
      luong_co_ban DECIMAL(12, 2) NOT NULL DEFAULT 0,
      luong_dong_bao_hiem DECIMAL(12, 2) NOT NULL DEFAULT 0,
      so_cong_chuan INT NOT NULL DEFAULT 26,
      so_ngay_phep_nam INT NOT NULL DEFAULT 12,
      phan_tram_luong INT NOT NULL DEFAULT 100,
      chuc_danh VARCHAR(150) NULL,
      dia_diem_lam_viec VARCHAR(255) DEFAULT 'Trụ sở chính VisionHR',
      ghi_chu TEXT NULL,
      trang_thai ENUM('hieu_luc', 'sap_het_han', 'het_han', 'da_cham_dut') NOT NULL DEFAULT 'hieu_luc',
      ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (ma_nhan_vien) REFERENCES nhan_vien(ma_nhan_vien) ON DELETE CASCADE
    );
  `;

  await pool.query(createTableSql);
  console.log('✓ Bảng hop_dong_lao_dong đã được tạo thành công.');

  // Kiểm tra số lượng hợp đồng hiện tại
  const [existing] = await pool.query('SELECT COUNT(*) as count FROM hop_dong_lao_dong');
  if (existing[0].count === 0) {
    console.log('-> Đang nạp dữ liệu mẫu hợp đồng...');
    // Lấy danh sách nhân viên thực tế có trong DB
    const [employees] = await pool.query('SELECT ma_nhan_vien, ma_so, ho_ten, chuc_vu FROM nhan_vien LIMIT 10');

    if (employees.length > 0) {
      // 1. Nhân viên 1 (nếu có): HĐ xác định thời hạn 1 năm
      const emp1 = employees[0];
      await pool.query(
        `INSERT INTO hop_dong_lao_dong 
        (so_hop_dong, ma_nhan_vien, loai_hop_dong, ngay_ky, ngay_hieu_luc, ngay_het_han, luong_co_ban, luong_dong_bao_hiem, so_cong_chuan, so_ngay_phep_nam, phan_tram_luong, chuc_danh, trang_thai)
        VALUES (?, ?, 'xac_dinh_thoi_han', '2026-01-01', '2026-01-01', '2026-12-31', 20000000, 5000000, 26, 12, 100, ?, 'hieu_luc')`,
        [`HDLD-2026/${emp1.ma_so || '001'}`, emp1.ma_nhan_vien, emp1.chuc_vu || 'Lập trình viên']
      );

      // 2. Nhân viên 2 (nếu có): HĐ Không thời hạn
      if (employees.length > 1) {
        const emp2 = employees[1];
        await pool.query(
          `INSERT INTO hop_dong_lao_dong 
          (so_hop_dong, ma_nhan_vien, loai_hop_dong, ngay_ky, ngay_hieu_luc, ngay_het_han, luong_co_ban, luong_dong_bao_hiem, so_cong_chuan, so_ngay_phep_nam, phan_tram_luong, chuc_danh, trang_thai)
          VALUES (?, ?, 'khong_xac_dinh_thoi_han', '2025-01-10', '2025-01-10', NULL, 25000000, 6000000, 26, 14, 100, ?, 'hieu_luc')`,
          [`HDLD-VC/${emp2.ma_so || '002'}`, emp2.ma_nhan_vien, emp2.chuc_vu || 'Trưởng phòng']
        );
      }

      // 3. Nhân viên 3 (nếu có): HĐ SẮP HẾT HẠN (sau 15 ngày nữa) để test cảnh báo
      if (employees.length > 2) {
        const emp3 = employees[2];
        const today = new Date();
        const expireDate = new Date(today);
        expireDate.setDate(today.getDate() + 15);
        const expireStr = expireDate.toISOString().split('T')[0];

        await pool.query(
          `INSERT INTO hop_dong_lao_dong 
          (so_hop_dong, ma_nhan_vien, loai_hop_dong, ngay_ky, ngay_hieu_luc, ngay_het_han, luong_co_ban, luong_dong_bao_hiem, so_cong_chuan, so_ngay_phep_nam, phan_tram_luong, chuc_danh, trang_thai)
          VALUES (?, ?, 'xac_dinh_thoi_han', '2025-11-01', '2025-11-01', ?, 18000000, 5000000, 26, 12, 100, ?, 'sap_het_han')`,
          [`HDLD-2025/${emp3.ma_so || '003'}`, emp3.ma_nhan_vien, expireStr, emp3.chuc_vu || 'Chuyên viên']
        );
      }

      // 4. Nếu có nhân viên tên Mai hoặc nhân viên cuối: Hợp đồng Thử việc 2 tháng (85% lương)
      const maiEmp = employees.find((e) => e.ho_ten.includes('Mai')) || employees[employees.length - 1];
      if (maiEmp && maiEmp.ma_nhan_vien !== employees[0].ma_nhan_vien) {
        await pool.query(
          `INSERT INTO hop_dong_lao_dong 
          (so_hop_dong, ma_nhan_vien, loai_hop_dong, ngay_ky, ngay_hieu_luc, ngay_het_han, luong_co_ban, luong_dong_bao_hiem, so_cong_chuan, so_ngay_phep_nam, phan_tram_luong, chuc_danh, ghi_chu, trang_thai)
          VALUES (?, ?, 'thu_viec', CURDATE(), CURDATE(), DATE_ADD(CURDATE(), INTERVAL 2 MONTH), 12000000, 0, 26, 0, 85, ?, 'Hợp đồng thử việc 02 tháng, hưởng 85% lương', 'hieu_luc')`,
          [`HDTV-2026/${maiEmp.ma_so || '014'}`, maiEmp.ma_nhan_vien, maiEmp.chuc_vu || 'Nhân viên mới']
        );
      }

      console.log('✓ Đã nạp thành công các hợp đồng mẫu đa dạng (Thử việc, 1 năm, Vô thời hạn, Sắp hết hạn).');
    }
  }

  console.log('--- HOÀN TẤT KHỞI TẠO BẢNG HỢP ĐỒNG ---');
}

initContractTable()
  .catch((err) => console.error('Lỗi khởi tạo:', err))
  .finally(() => pool.end());
