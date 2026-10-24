const pool = require('../config/db');

function formatEmployeeRow(row) {
  if (!row) return null;
  let cv = null;
  let parsedFace = null;
  if (row.face_data) {
    try {
      parsedFace = typeof row.face_data === 'string' ? JSON.parse(row.face_data) : row.face_data;
      if (parsedFace && parsedFace.cv) {
        cv = parsedFace.cv;
      }
    } catch {}
  }
  return {
    ...row,
    cv,
    hasFace: Boolean(parsedFace && parsedFace.image),
  };
}

const Employee = {
  async findAll() {
    const [rows] = await pool.query(
      `SELECT e.ma_nhan_vien AS id, e.ma_so AS code, e.ho_ten AS name, e.email, e.so_dien_thoai AS phone,
              e.ma_phong_ban AS department_id, e.chuc_vu AS position, e.trang_thai AS status,
              e.bang_cap AS education, e.chuyen_nganh AS major, e.ngay_sinh AS dob, e.gioi_tinh AS gender,
              e.so_cccd AS idCard, e.dia_chi AS address, e.ngay_vao_lam AS joinDate,
              (e.du_lieu_khuon_mat IS NOT NULL) AS hasFace,
              e.du_lieu_khuon_mat AS face_data,
              d.ten_phong_ban AS department,
              u.ma_tai_khoan AS accountId, u.email AS accountEmail, u.vai_tro AS accountRole
       FROM nhan_vien e
       LEFT JOIN phong_ban d ON d.ma_phong_ban = e.ma_phong_ban
       LEFT JOIN tai_khoan u ON u.ma_nhan_vien = e.ma_nhan_vien
       ORDER BY e.ma_nhan_vien DESC`
    );
    return rows.map(formatEmployeeRow);
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT e.ma_nhan_vien AS id, e.ma_so AS code, e.ho_ten AS name, e.email, e.so_dien_thoai AS phone,
              e.ma_phong_ban AS department_id, e.chuc_vu AS position, e.trang_thai AS status,
              e.bang_cap AS education, e.chuyen_nganh AS major, e.ngay_sinh AS dob, e.gioi_tinh AS gender,
              e.so_cccd AS idCard, e.dia_chi AS address, e.ngay_vao_lam AS joinDate,
              (e.du_lieu_khuon_mat IS NOT NULL) AS hasFace,
              e.du_lieu_khuon_mat AS face_data, d.ten_phong_ban AS department,
              u.ma_tai_khoan AS accountId, u.email AS accountEmail, u.vai_tro AS accountRole
       FROM nhan_vien e
       LEFT JOIN phong_ban d ON d.ma_phong_ban = e.ma_phong_ban
       LEFT JOIN tai_khoan u ON u.ma_nhan_vien = e.ma_nhan_vien
       WHERE e.ma_nhan_vien = ? LIMIT 1`,
      [id]
    );
    return formatEmployeeRow(rows[0]);
  },

  async findByAccountId(accountId) {
    const [rows] = await pool.query(
      `SELECT e.ma_nhan_vien AS id, e.ma_so AS code, e.ho_ten AS name, e.email, e.so_dien_thoai AS phone,
              e.ma_phong_ban AS department_id, e.chuc_vu AS position, e.trang_thai AS status,
              e.bang_cap AS education, e.chuyen_nganh AS major, e.ngay_sinh AS dob, e.gioi_tinh AS gender,
              e.so_cccd AS idCard, e.dia_chi AS address, e.ngay_vao_lam AS joinDate,
              (e.du_lieu_khuon_mat IS NOT NULL) AS hasFace,
              e.du_lieu_khuon_mat AS face_data,
              d.ten_phong_ban AS department,
              u.ma_tai_khoan AS accountId, u.email AS accountEmail, u.vai_tro AS accountRole
       FROM nhan_vien e
       LEFT JOIN phong_ban d ON d.ma_phong_ban = e.ma_phong_ban
       JOIN tai_khoan u ON u.ma_nhan_vien = e.ma_nhan_vien
       WHERE u.ma_tai_khoan = ? LIMIT 1`,
      [accountId]
    );
    return formatEmployeeRow(rows[0]);
  },

  async findByCode(code, excludeId = null) {
    if (!code) return null;
    let sql = 'SELECT ma_nhan_vien AS id, ma_so AS code, ho_ten AS name FROM nhan_vien WHERE ma_so = ?';
    const params = [code.trim()];
    if (excludeId) {
      sql += ' AND ma_nhan_vien != ?';
      params.push(excludeId);
    }
    sql += ' LIMIT 1';
    const [rows] = await pool.query(sql, params);
    return rows[0];
  },

  async findByEmail(email, excludeId = null) {
    if (!email) return null;
    let sql = 'SELECT ma_nhan_vien AS id, email, ho_ten AS name FROM nhan_vien WHERE LOWER(email) = LOWER(?)';
    const params = [email.trim()];
    if (excludeId) {
      sql += ' AND ma_nhan_vien != ?';
      params.push(excludeId);
    }
    sql += ' LIMIT 1';
    const [rows] = await pool.query(sql, params);
    return rows[0];
  },

  async findWithRegisteredFace() {
    const [rows] = await pool.query(
      `SELECT e.ma_nhan_vien AS id, e.ma_so AS code, e.ho_ten AS name, e.email,
              e.ma_phong_ban AS department_id, e.chuc_vu AS position,
              d.ten_phong_ban AS department, e.du_lieu_khuon_mat AS face_data
       FROM nhan_vien e
       LEFT JOIN phong_ban d ON d.ma_phong_ban = e.ma_phong_ban
       WHERE e.du_lieu_khuon_mat IS NOT NULL AND e.trang_thai = 'dang_lam_viec'`
    );
    return rows;
  },

  async getNextCode() {
    const [rows] = await pool.query(
      "SELECT MAX(CAST(SUBSTRING(ma_so, 3) AS UNSIGNED)) AS maxNum FROM nhan_vien WHERE ma_so REGEXP '^NV[0-9]+'"
    );
    const maxNum = rows[0]?.maxNum || 0;
    const nextNum = Number(maxNum) + 1;
    return `NV${String(nextNum).padStart(3, '0')}`;
  },

  async create({ code, name, email, phone, departmentId, position, joinDate, education, major, dob, gender, idCard, address, cv }) {
    let finalCode = (code && code.trim()) || '';
    if (!finalCode || finalCode.toUpperCase() === 'AUTO') {
      finalCode = await this.getNextCode();
    }
    const faceInitial = cv ? JSON.stringify({ cv }) : null;
    const [result] = await pool.query(
      `INSERT INTO nhan_vien 
       (ma_so, ho_ten, email, so_dien_thoai, ma_phong_ban, chuc_vu, bang_cap, chuyen_nganh, ngay_sinh, gioi_tinh, so_cccd, dia_chi, trang_thai, ngay_vao_lam, du_lieu_khuon_mat) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "dang_lam_viec", ?, ?)`,
      [
        finalCode,
        name.trim(),
        email.trim().toLowerCase(),
        phone || null,
        departmentId || null,
        position || null,
        education || null,
        major || null,
        dob || null,
        gender || 'nam',
        idCard || null,
        address || null,
        joinDate || new Date().toISOString().slice(0, 10),
        faceInitial,
      ]
    );
    return this.findById(result.insertId);
  },

  async update(id, { code, name, email, phone, departmentId, position, status, joinDate, education, major, dob, gender, idCard, address, cv }) {
    await pool.query(
      `UPDATE nhan_vien 
       SET ma_so=?, ho_ten=?, email=?, so_dien_thoai=?, ma_phong_ban=?, chuc_vu=?,
           bang_cap=?, chuyen_nganh=?, ngay_sinh=?, gioi_tinh=?, so_cccd=?, dia_chi=?,
           trang_thai=?, ngay_vao_lam=?
       WHERE ma_nhan_vien=?`,
      [
        code.trim(),
        name.trim(),
        email.trim().toLowerCase(),
        phone || null,
        departmentId || null,
        position || null,
        education || null,
        major || null,
        dob || null,
        gender || 'nam',
        idCard || null,
        address || null,
        status || 'dang_lam_viec',
        joinDate || null,
        id,
      ]
    );

    if (cv !== undefined) {
      const [currRows] = await pool.query('SELECT du_lieu_khuon_mat FROM nhan_vien WHERE ma_nhan_vien = ?', [id]);
      let curr = {};
      if (currRows[0]?.du_lieu_khuon_mat) {
        try {
          curr = typeof currRows[0].du_lieu_khuon_mat === 'string' ? JSON.parse(currRows[0].du_lieu_khuon_mat) : currRows[0].du_lieu_khuon_mat;
        } catch {}
      }
      curr.cv = cv;
      await pool.query('UPDATE nhan_vien SET du_lieu_khuon_mat = ? WHERE ma_nhan_vien = ?', [JSON.stringify(curr), id]);
    }

    return this.findById(id);
  },

  async delete(id) {
    await pool.query('DELETE FROM nhan_vien WHERE ma_nhan_vien = ?', [id]);
  },

  async saveFaceEmbedding(employeeId, faceData) {
    await pool.query('UPDATE nhan_vien SET du_lieu_khuon_mat = ? WHERE ma_nhan_vien = ?', [
      JSON.stringify(faceData),
      employeeId,
    ]);
  },

  async deleteFaceEmbedding(employeeId) {
    await pool.query('UPDATE nhan_vien SET du_lieu_khuon_mat = NULL WHERE ma_nhan_vien = ?', [
      employeeId,
    ]);
  },
};

module.exports = Employee;
