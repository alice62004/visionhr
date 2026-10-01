const pool = require('../config/db');

const User = {
  async findAll() {
    const [rows] = await pool.query(
      `SELECT u.ma_tai_khoan AS id,
              u.ho_ten AS name,
              u.email,
              u.vai_tro AS role,
              u.ma_nhan_vien AS employeeId,
              u.ngay_tao AS createdAt,
              e.ma_so AS employeeCode,
              e.ho_ten AS employeeName,
              e.chuc_vu AS employeePosition,
              e.trang_thai AS employeeStatus,
              (e.du_lieu_khuon_mat IS NOT NULL) AS hasFace,
              d.ma_phong_ban AS departmentId,
              d.ten_phong_ban AS departmentName
       FROM tai_khoan u
       LEFT JOIN nhan_vien e ON e.ma_nhan_vien = u.ma_nhan_vien
       LEFT JOIN phong_ban d ON d.ma_phong_ban = e.ma_phong_ban
       ORDER BY u.ma_tai_khoan DESC`
    );
    return rows;
  },

  async findByEmail(email, excludeId = null) {
    let sql = `
      SELECT u.ma_tai_khoan AS id, u.ho_ten AS name, u.email, u.mat_khau_hash AS password_hash,
             u.vai_tro AS role, u.ma_nhan_vien AS employee_id, e.ma_phong_ban AS department_id, u.ngay_tao AS created_at
      FROM tai_khoan u
      LEFT JOIN nhan_vien e ON e.ma_nhan_vien = u.ma_nhan_vien
      WHERE u.email = ?
    `;
    const params = [email];
    if (excludeId) {
      sql += ' AND u.ma_tai_khoan != ?';
      params.push(excludeId);
    }
    sql += ' LIMIT 1';

    const [rows] = await pool.query(sql, params);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT u.ma_tai_khoan AS id, u.ho_ten AS name, u.email, u.mat_khau_hash AS password_hash,
              u.vai_tro AS role, u.ma_nhan_vien AS employeeId,
              e.ma_so AS employeeCode, e.ho_ten AS employeeName, e.chuc_vu AS employeePosition,
              (e.du_lieu_khuon_mat IS NOT NULL) AS hasFace,
              d.ma_phong_ban AS departmentId, d.ten_phong_ban AS departmentName,
              u.ngay_tao AS createdAt
       FROM tai_khoan u
       LEFT JOIN nhan_vien e ON e.ma_nhan_vien = u.ma_nhan_vien
       LEFT JOIN phong_ban d ON d.ma_phong_ban = e.ma_phong_ban
       WHERE u.ma_tai_khoan = ? LIMIT 1`,
      [id]
    );
    return rows[0];
  },

  async findByEmployeeId(employeeId, excludeUserId = null) {
    if (!employeeId) return null;
    let sql = 'SELECT ma_tai_khoan AS id, ho_ten AS name, email FROM tai_khoan WHERE ma_nhan_vien = ?';
    const params = [employeeId];
    if (excludeUserId) {
      sql += ' AND ma_tai_khoan != ?';
      params.push(excludeUserId);
    }
    sql += ' LIMIT 1';
    const [rows] = await pool.query(sql, params);
    return rows[0];
  },

  async getEmployeesWithoutAccount(currentUserId = null) {
    let sql = `
      SELECT e.ma_nhan_vien AS id, e.ma_so AS code, e.ho_ten AS name, e.email, e.chuc_vu AS position,
             (e.du_lieu_khuon_mat IS NOT NULL) AS hasFace, d.ten_phong_ban AS department
      FROM nhan_vien e
      LEFT JOIN phong_ban d ON d.ma_phong_ban = e.ma_phong_ban
      WHERE e.ma_nhan_vien NOT IN (
        SELECT ma_nhan_vien FROM tai_khoan WHERE ma_nhan_vien IS NOT NULL
        ${currentUserId ? 'AND ma_tai_khoan != ?' : ''}
      )
      ORDER BY e.ma_nhan_vien ASC
    `;
    const params = currentUserId ? [currentUserId] : [];
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async create({ name, email, passwordHash, role, employeeId }) {
    const [result] = await pool.query(
      'INSERT INTO tai_khoan (ho_ten, email, mat_khau_hash, vai_tro, ma_nhan_vien) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, role || 'employee', employeeId || null]
    );
    return { id: result.insertId, name, email, role, employeeId };
  },

  async update(id, { name, email, passwordHash, role, employeeId }) {
    if (passwordHash) {
      await pool.query(
        'UPDATE tai_khoan SET ho_ten = ?, email = ?, mat_khau_hash = ?, vai_tro = ?, ma_nhan_vien = ? WHERE ma_tai_khoan = ?',
        [name, email, passwordHash, role, employeeId || null, id]
      );
    } else {
      await pool.query(
        'UPDATE tai_khoan SET ho_ten = ?, email = ?, vai_tro = ?, ma_nhan_vien = ? WHERE ma_tai_khoan = ?',
        [name, email, role, employeeId || null, id]
      );
    }
    return this.findById(id);
  },

  async getUnlinkedAccounts(currentEmployeeId = null) {
    let sql = `
      SELECT ma_tai_khoan AS id, ho_ten AS name, email, vai_tro AS role, ma_nhan_vien AS employeeId
      FROM tai_khoan
      WHERE ma_nhan_vien IS NULL
      ${currentEmployeeId ? 'OR ma_nhan_vien = ?' : ''}
      ORDER BY ma_tai_khoan DESC
    `;
    const params = currentEmployeeId ? [currentEmployeeId] : [];
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async linkAccountToEmployee(accountId, employeeId) {
    if (!accountId || !employeeId) return;
    // Check if employee already has another account
    const existing = await this.findByEmployeeId(employeeId, accountId);
    if (existing) {
      throw new Error(`Nhân viên này đã được liên kết với tài khoản "${existing.email}".`);
    }
    // Gỡ liên kết cũ của accountId nếu có
    await pool.query('UPDATE tai_khoan SET ma_nhan_vien = ? WHERE ma_tai_khoan = ?', [employeeId, accountId]);
  },

  async unlinkEmployee(employeeId) {
    if (!employeeId) return;
    await pool.query('UPDATE tai_khoan SET ma_nhan_vien = NULL WHERE ma_nhan_vien = ?', [employeeId]);
  },

  async delete(id) {
    await pool.query('DELETE FROM tai_khoan WHERE ma_tai_khoan = ?', [id]);
  },
};

module.exports = User;
