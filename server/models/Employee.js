const pool = require('../config/db');

const Employee = {
  async findAll() {
    const [rows] = await pool.query(
      `SELECT e.ma_nhan_vien AS id, e.ma_so AS code, e.ho_ten AS name, e.email, e.so_dien_thoai AS phone,
              e.ma_phong_ban AS department_id, e.chuc_vu AS position, e.trang_thai AS status, e.ngay_vao_lam AS joinDate,
              (e.du_lieu_khuon_mat IS NOT NULL) AS hasFace,
              d.ten_phong_ban AS department,
              u.ma_tai_khoan AS accountId, u.email AS accountEmail, u.vai_tro AS accountRole
       FROM nhan_vien e
       LEFT JOIN phong_ban d ON d.ma_phong_ban = e.ma_phong_ban
       LEFT JOIN tai_khoan u ON u.ma_nhan_vien = e.ma_nhan_vien
       ORDER BY e.ma_nhan_vien DESC`
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT e.ma_nhan_vien AS id, e.ma_so AS code, e.ho_ten AS name, e.email, e.so_dien_thoai AS phone,
              e.ma_phong_ban AS department_id, e.chuc_vu AS position, e.trang_thai AS status, e.ngay_vao_lam AS joinDate,
              (e.du_lieu_khuon_mat IS NOT NULL) AS hasFace,
              e.du_lieu_khuon_mat AS face_data, d.ten_phong_ban AS department,
              u.ma_tai_khoan AS accountId, u.email AS accountEmail, u.vai_tro AS accountRole
       FROM nhan_vien e
       LEFT JOIN phong_ban d ON d.ma_phong_ban = e.ma_phong_ban
       LEFT JOIN tai_khoan u ON u.ma_nhan_vien = e.ma_nhan_vien
       WHERE e.ma_nhan_vien = ? LIMIT 1`,
      [id]
    );
    return rows[0];
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

  async create({ code, name, email, phone, departmentId, position }) {
    const [result] = await pool.query(
      'INSERT INTO nhan_vien (ma_so, ho_ten, email, so_dien_thoai, ma_phong_ban, chuc_vu, trang_thai, ngay_vao_lam) VALUES (?, ?, ?, ?, ?, ?, "dang_lam_viec", CURDATE())',
      [code.trim(), name.trim(), email.trim().toLowerCase(), phone || null, departmentId || null, position || null]
    );
    return this.findById(result.insertId);
  },

  async update(id, { code, name, email, phone, departmentId, position, status }) {
    await pool.query(
      `UPDATE nhan_vien SET ma_so=?, ho_ten=?, email=?, so_dien_thoai=?, ma_phong_ban=?, chuc_vu=?, trang_thai=? WHERE ma_nhan_vien=?`,
      [code.trim(), name.trim(), email.trim().toLowerCase(), phone || null, departmentId || null, position || null, status || 'dang_lam_viec', id]
    );
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
