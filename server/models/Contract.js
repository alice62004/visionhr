const pool = require('../config/db');

const Contract = {
  // Lấy danh sách hợp đồng (hỗ trợ lọc theo phòng ban, trạng thái, loại hợp đồng, tìm kiếm từ khóa)
  async findAll({ departmentId, status, type, search, employeeId } = {}) {
    let sql = `
      SELECT 
        c.ma_hop_dong AS id,
        c.so_hop_dong AS contractCode,
        c.ma_nhan_vien AS employeeId,
        e.ma_so AS employeeCode,
        e.ho_ten AS employeeName,
        e.email AS employeeEmail,
        e.so_dien_thoai AS employeePhone,
        e.so_cccd AS employeeIdCard,
        d.ma_phong_ban AS departmentId,
        d.ten_phong_ban AS departmentName,
        c.loai_hop_dong AS contractType,
        c.ngay_ky AS signDate,
        c.ngay_hieu_luc AS effectiveDate,
        c.ngay_het_han AS expireDate,
        c.luong_co_ban AS baseSalary,
        c.luong_dong_bao_hiem AS insuranceSalary,
        c.so_cong_chuan AS standardWorkDays,
        c.so_ngay_phep_nam AS annualLeaveDays,
        c.phan_tram_luong AS salaryPercentage,
        c.chuc_danh AS position,
        c.dia_diem_lam_viec AS workLocation,
        c.ghi_chu AS note,
        c.trang_thai AS status,
        c.ngay_tao AS createdAt,
        DATEDIFF(c.ngay_het_han, CURDATE()) AS daysRemaining
      FROM hop_dong_lao_dong c
      JOIN nhan_vien e ON e.ma_nhan_vien = c.ma_nhan_vien
      LEFT JOIN phong_ban d ON d.ma_phong_ban = e.ma_phong_ban
      WHERE 1=1
    `;
    const params = [];

    if (employeeId) {
      sql += ' AND c.ma_nhan_vien = ?';
      params.push(employeeId);
    }
    if (departmentId) {
      sql += ' AND e.ma_phong_ban = ?';
      params.push(departmentId);
    }
    if (status) {
      sql += ' AND c.trang_thai = ?';
      params.push(status);
    }
    if (type) {
      sql += ' AND c.loai_hop_dong = ?';
      params.push(type);
    }
    if (search) {
      sql += ' AND (e.ho_ten LIKE ? OR e.ma_so LIKE ? OR c.so_hop_dong LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY c.ma_hop_dong DESC';

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  // Lấy chi tiết 1 hợp đồng
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT 
        c.ma_hop_dong AS id,
        c.so_hop_dong AS contractCode,
        c.ma_nhan_vien AS employeeId,
        e.ma_so AS employeeCode,
        e.ho_ten AS employeeName,
        e.email AS employeeEmail,
        e.so_dien_thoai AS employeePhone,
        e.so_cccd AS employeeIdCard,
        e.dia_chi AS employeeAddress,
        d.ma_phong_ban AS departmentId,
        d.ten_phong_ban AS departmentName,
        c.loai_hop_dong AS contractType,
        c.ngay_ky AS signDate,
        c.ngay_hieu_luc AS effectiveDate,
        c.ngay_het_han AS expireDate,
        c.luong_co_ban AS baseSalary,
        c.luong_dong_bao_hiem AS insuranceSalary,
        c.so_cong_chuan AS standardWorkDays,
        c.so_ngay_phep_nam AS annualLeaveDays,
        c.phan_tram_luong AS salaryPercentage,
        c.chuc_danh AS position,
        c.dia_diem_lam_viec AS workLocation,
        c.ghi_chu AS note,
        c.trang_thai AS status,
        c.ngay_tao AS createdAt,
        DATEDIFF(c.ngay_het_han, CURDATE()) AS daysRemaining
      FROM hop_dong_lao_dong c
      JOIN nhan_vien e ON e.ma_nhan_vien = c.ma_nhan_vien
      LEFT JOIN phong_ban d ON d.ma_phong_ban = e.ma_phong_ban
      WHERE c.ma_hop_dong = ?`,
      [id]
    );
    return rows[0] || null;
  },

  // Thống kê nhanh: tổng số, đang hiệu lực, sắp hết hạn (trong vòng 30 ngày), đã hết hạn
  async getStats() {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN trang_thai = 'hieu_luc' AND (ngay_het_han IS NULL OR ngay_het_han >= CURDATE()) THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN ngay_het_han IS NOT NULL AND DATEDIFF(ngay_het_han, CURDATE()) BETWEEN 0 AND 30 AND trang_thai != 'da_cham_dut' THEN 1 ELSE 0 END) AS expiringSoon,
        SUM(CASE WHEN (ngay_het_han IS NOT NULL AND ngay_het_han < CURDATE()) OR trang_thai = 'het_han' THEN 1 ELSE 0 END) AS expired,
        SUM(CASE WHEN trang_thai = 'da_cham_dut' THEN 1 ELSE 0 END) AS \`terminated\`
      FROM hop_dong_lao_dong
    `);
    return rows[0];
  },

  // Tạo hợp đồng mới
  async create(data) {
    const {
      contractCode,
      employeeId,
      contractType = 'xac_dinh_thoi_han',
      signDate,
      effectiveDate,
      expireDate = null,
      baseSalary = 0,
      insuranceSalary = 0,
      standardWorkDays = 26,
      annualLeaveDays = 12,
      salaryPercentage = 100,
      position = null,
      workLocation = 'Trụ sở chính VisionHR',
      note = null,
      status = 'hieu_luc',
    } = data;

    const [result] = await pool.query(
      `INSERT INTO hop_dong_lao_dong (
        so_hop_dong, ma_nhan_vien, loai_hop_dong, ngay_ky, ngay_hieu_luc, ngay_het_han,
        luong_co_ban, luong_dong_bao_hiem, so_cong_chuan, so_ngay_phep_nam, phan_tram_luong,
        chuc_danh, dia_diem_lam_viec, ghi_chu, trang_thai
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contractCode,
        employeeId,
        contractType,
        signDate,
        effectiveDate,
        expireDate || null,
        baseSalary,
        insuranceSalary,
        standardWorkDays,
        annualLeaveDays,
        salaryPercentage,
        position,
        workLocation,
        note,
        status,
      ]
    );
    return result.insertId;
  },

  // Cập nhật hợp đồng
  async update(id, data) {
    const {
      contractCode,
      contractType,
      signDate,
      effectiveDate,
      expireDate,
      baseSalary,
      insuranceSalary,
      standardWorkDays,
      annualLeaveDays,
      salaryPercentage,
      position,
      workLocation,
      note,
      status,
    } = data;

    await pool.query(
      `UPDATE hop_dong_lao_dong SET
        so_hop_dong = ?,
        loai_hop_dong = ?,
        ngay_ky = ?,
        ngay_hieu_luc = ?,
        ngay_het_han = ?,
        luong_co_ban = ?,
        luong_dong_bao_hiem = ?,
        so_cong_chuan = ?,
        so_ngay_phep_nam = ?,
        phan_tram_luong = ?,
        chuc_danh = ?,
        dia_diem_lam_viec = ?,
        ghi_chu = ?,
        trang_thai = ?
      WHERE ma_hop_dong = ?`,
      [
        contractCode,
        contractType,
        signDate,
        effectiveDate,
        expireDate || null,
        baseSalary,
        insuranceSalary,
        standardWorkDays,
        annualLeaveDays,
        salaryPercentage,
        position,
        workLocation,
        note,
        status,
        id,
      ]
    );
  },

  // Chấm dứt/thanh lý hợp đồng
  async terminate(id, note) {
    await pool.query(
      `UPDATE hop_dong_lao_dong 
       SET trang_thai = 'da_cham_dut', ghi_chu = CONCAT(IFNULL(ghi_chu, ''), '\n[Đã chấm dứt: ', CURDATE(), '] ', ?)
       WHERE ma_hop_dong = ?`,
      [note || 'Thanh lý hợp đồng', id]
    );
  },

  // Kiểm tra trùng số hợp đồng
  async findByCode(contractCode, excludeId = null) {
    let sql = 'SELECT ma_hop_dong FROM hop_dong_lao_dong WHERE so_hop_dong = ?';
    const params = [contractCode];
    if (excludeId) {
      sql += ' AND ma_hop_dong != ?';
      params.push(excludeId);
    }
    const [rows] = await pool.query(sql, params);
    return rows[0] || null;
  },

  // Tự động sinh số hợp đồng tiếp theo
  async generateNextCode(type = 'HDLD') {
    const prefix = type === 'thu_viec' ? 'HDTV' : 'HDLD';
    const year = new Date().getFullYear();
    const [rows] = await pool.query(
      `SELECT so_hop_dong FROM hop_dong_lao_dong 
       WHERE so_hop_dong LIKE ? ORDER BY ma_hop_dong DESC LIMIT 1`,
      [`${prefix}-${year}/%`]
    );
    if (!rows.length) {
      return `${prefix}-${year}/001`;
    }
    const lastCode = rows[0].so_hop_dong;
    const parts = lastCode.split('/');
    const seq = parseInt(parts[1], 10) || 0;
    return `${prefix}-${year}/${String(seq + 1).padStart(3, '0')}`;
  },
};

module.exports = Contract;
