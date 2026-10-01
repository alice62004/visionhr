const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Employee = require('../models/Employee');
const pool = require('../config/db');

async function getUsers(req, res) {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    console.error('[UserController] getUsers error:', err);
    res.status(500).json({ message: 'Lỗi khi tải danh sách tài khoản: ' + err.message });
  }
}

async function getAvailableEmployees(req, res) {
  try {
    const { excludeUserId } = req.query;
    const employees = await User.getEmployeesWithoutAccount(excludeUserId ? Number(excludeUserId) : null);
    res.json(employees);
  } catch (err) {
    console.error('[UserController] getAvailableEmployees error:', err);
    res.status(500).json({ message: 'Lỗi khi tải danh sách nhân viên khả dụng: ' + err.message });
  }
}

async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    res.json(user);
  } catch (err) {
    console.error('[UserController] getUserById error:', err);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin tài khoản: ' + err.message });
  }
}

async function createUser(req, res) {
  try {
    const { name, email, password, role, employeeId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ họ tên, email và mật khẩu.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Kiểm tra email tài khoản đã tồn tại hay chưa
    const existingByEmail = await User.findByEmail(cleanEmail);
    if (existingByEmail) {
      return res.status(400).json({ message: `Email "${cleanEmail}" đã được sử dụng bởi một tài khoản khác.` });
    }

    // 2. Nếu có gắn với nhân viên, kiểm tra nhân viên có tồn tại và đã có tài khoản chưa
    let linkedEmployeeId = employeeId ? Number(employeeId) : null;
    if (linkedEmployeeId) {
      const emp = await Employee.findById(linkedEmployeeId);
      if (!emp) {
        return res.status(404).json({ message: 'Không tìm thấy nhân viên được chỉ định.' });
      }

      const existingByEmp = await User.findByEmployeeId(linkedEmployeeId);
      if (existingByEmp) {
        return res.status(400).json({
          message: `Nhân viên "${emp.name}" (${emp.code}) đã được liên kết với tài khoản "${existingByEmp.email}". Mỗi nhân viên chỉ được sở hữu duy nhất 1 tài khoản!`,
        });
      }
    }

    // 3. Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Tạo tài khoản
    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: role || 'employee',
      employeeId: linkedEmployeeId,
    });

    // Ghi audit log
    try {
      await pool.query(
        'INSERT INTO nhat_ky_he_thong (ma_tai_khoan, hanh_dong, chuc_nang) VALUES (?, ?, ?)',
        [req.user?.id || null, `Tạo tài khoản mới cho: ${cleanEmail} (Role: ${role || 'employee'})`, 'Quản lý tài khoản']
      );
    } catch (logErr) {
      console.warn('Audit log write error:', logErr.message);
    }

    res.status(201).json(newUser);
  } catch (err) {
    console.error('[UserController] createUser error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      if (err.message.includes('email')) {
        return res.status(400).json({ message: 'Email đã tồn tại trong hệ thống.' });
      }
      if (err.message.includes('ma_nhan_vien')) {
        return res.status(400).json({ message: 'Nhân viên này đã được liên kết với một tài khoản khác.' });
      }
    }
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo tài khoản: ' + err.message });
  }
}

async function updateUser(req, res) {
  try {
    const targetId = Number(req.params.id);
    const { name, email, password, role, employeeId } = req.body;

    const existingUser = await User.findById(targetId);
    if (!existingUser) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản cần cập nhật.' });
    }

    const cleanEmail = email ? email.trim().toLowerCase() : existingUser.email;

    // 1. Kiểm tra email trùng với tài khoản khác
    if (cleanEmail !== existingUser.email) {
      const duplicateEmail = await User.findByEmail(cleanEmail, targetId);
      if (duplicateEmail) {
        return res.status(400).json({ message: `Email "${cleanEmail}" đã được sử dụng bởi một tài khoản khác.` });
      }
    }

    // 2. Kiểm tra nhân viên liên kết
    let linkedEmployeeId = employeeId !== undefined ? (employeeId ? Number(employeeId) : null) : existingUser.employeeId;
    if (linkedEmployeeId) {
      const emp = await Employee.findById(linkedEmployeeId);
      if (!emp) {
        return res.status(404).json({ message: 'Không tìm thấy nhân viên được chỉ định.' });
      }

      const duplicateEmpUser = await User.findByEmployeeId(linkedEmployeeId, targetId);
      if (duplicateEmpUser) {
        return res.status(400).json({
          message: `Nhân viên "${emp.name}" (${emp.code}) đã được liên kết với tài khoản "${duplicateEmpUser.email}".`,
        });
      }
    }

    // 3. Xử lý mật khẩu nếu có đổi
    let passwordHash = null;
    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password.trim(), salt);
    }

    const updated = await User.update(targetId, {
      name: name ? name.trim() : existingUser.name,
      email: cleanEmail,
      passwordHash,
      role: role || existingUser.role,
      employeeId: linkedEmployeeId,
    });

    // Ghi audit log
    try {
      await pool.query(
        'INSERT INTO nhat_ky_he_thong (ma_tai_khoan, hanh_dong, chuc_nang) VALUES (?, ?, ?)',
        [req.user?.id || null, `Cập nhật tài khoản ID ${targetId} (${cleanEmail})`, 'Quản lý tài khoản']
      );
    } catch (logErr) {
      console.warn('Audit log write error:', logErr.message);
    }

    res.json(updated);
  } catch (err) {
    console.error('[UserController] updateUser error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      if (err.message.includes('email')) {
        return res.status(400).json({ message: 'Email đã tồn tại trong hệ thống.' });
      }
      if (err.message.includes('ma_nhan_vien')) {
        return res.status(400).json({ message: 'Nhân viên này đã được liên kết với một tài khoản khác.' });
      }
    }
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật tài khoản: ' + err.message });
  }
}

async function deleteUser(req, res) {
  try {
    const targetId = Number(req.params.id);

    if (req.user?.id === targetId) {
      return res.status(400).json({ message: 'Bạn không thể tự xóa tài khoản của chính mình khi đang đăng nhập.' });
    }

    const user = await User.findById(targetId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    }

    await User.delete(targetId);

    // Ghi audit log
    try {
      await pool.query(
        'INSERT INTO nhat_ky_he_thong (ma_tai_khoan, hanh_dong, chuc_nang) VALUES (?, ?, ?)',
        [req.user?.id || null, `Xóa tài khoản: ${user.email} (ID: ${targetId})`, 'Quản lý tài khoản']
      );
    } catch (logErr) {
      console.warn('Audit log write error:', logErr.message);
    }

    res.json({ message: `Đã xóa tài khoản "${user.email}" thành công.` });
  } catch (err) {
    console.error('[UserController] deleteUser error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xóa tài khoản: ' + err.message });
  }
}

module.exports = {
  getUsers,
  getAvailableEmployees,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
