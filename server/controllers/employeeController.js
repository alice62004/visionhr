const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { detectFace, checkDuplicateFace } = require('../services/faceRecognitionService');
const { sendOnboardingEmail } = require('../services/emailService');
const pool = require('../config/db');

function computeImageHash(base64Str) {
  if (!base64Str) return '';
  const clean = base64Str.includes(',') ? base64Str.split(',')[1] : base64Str;
  return crypto.createHash('sha256').update(clean.trim()).digest('hex');
}

async function getEmployees(req, res) {
  try {
    const employees = await Employee.findAll();
    res.json(employees);
  } catch (err) {
    console.error('[EmployeeController] getEmployees error:', err);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách nhân viên: ' + err.message });
  }
}

async function getEmployeeById(req, res) {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Không tìm thấy nhân viên.' });
    res.json(employee);
  } catch (err) {
    console.error('[EmployeeController] getEmployeeById error:', err);
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết nhân viên: ' + err.message });
  }
}

async function getUnlinkedAccounts(req, res) {
  try {
    const { currentEmployeeId } = req.query;
    const accounts = await User.getUnlinkedAccounts(currentEmployeeId ? Number(currentEmployeeId) : null);
    res.json(accounts);
  } catch (err) {
    console.error('[EmployeeController] getUnlinkedAccounts error:', err);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách tài khoản: ' + err.message });
  }
}

async function createEmployee(req, res) {
  try {
    const {
      code,
      name,
      email,
      accountAction,
      linkAccountId,
      newAccountEmail,
      newAccountRole,
      newAccountPassword,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ Họ tên và Email.' });
    }

    let cleanCode = code ? code.trim() : '';
    if (!cleanCode || cleanCode.toUpperCase() === 'AUTO') {
      cleanCode = await Employee.getNextCode();
      req.body.code = cleanCode;
    } else {
      // Kiểm tra trùng mã nhân viên nếu người dùng tự nhập
      const existingCode = await Employee.findByCode(cleanCode);
      if (existingCode) {
        return res.status(400).json({ message: `Mã nhân viên "${cleanCode}" đã tồn tại trên hệ thống (${existingCode.name}).` });
      }
    }

    const cleanEmail = email.trim().toLowerCase();

    // Kiểm tra trùng email
    const existingEmail = await Employee.findByEmail(cleanEmail);
    if (existingEmail) {
      return res.status(400).json({ message: `Email "${cleanEmail}" đã được sử dụng cho nhân viên "${existingEmail.name}".` });
    }

    const employee = await Employee.create(req.body);

    // Xử lý liên kết hoặc tạo tài khoản nếu có yêu cầu
    if (accountAction === 'link' && linkAccountId) {
      await User.linkAccountToEmployee(Number(linkAccountId), employee.id);
    } else if (accountAction === 'create') {
      if (!newAccountPassword || !newAccountPassword.trim()) {
        return res.status(400).json({ message: 'Vui lòng nhập mật khẩu cho tài khoản đăng nhập mới.' });
      }
      const accEmail = (newAccountEmail || cleanEmail).trim().toLowerCase();
      const existingUser = await User.findByEmail(accEmail);
      if (existingUser) {
        return res.status(400).json({ message: `Email tài khoản "${accEmail}" đã được sử dụng bởi một tài khoản khác.` });
      }
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newAccountPassword.trim(), salt);
      await User.create({
        name: name.trim(),
        email: accEmail,
        passwordHash,
        role: newAccountRole || 'employee',
        employeeId: employee.id,
      });

      // Tự động gửi Email thật cấp tài khoản cho nhân viên
      try {
        const empCode = employee.code || req.body.code;
        const empDept = employee.department || 'VisionHR';
        const emailRes = await sendOnboardingEmail({
          to: accEmail,
          employeeName: name.trim(),
          employeeCode: empCode,
          position: req.body.position || 'Nhân viên',
          department: empDept,
          tempPassword: newAccountPassword.trim(),
          loginUrl: 'http://localhost:5173/login',
        });
        employee.emailDelivery = emailRes;
        console.log(`[EmployeeController] Auto-sent real onboarding email to ${accEmail}:`, emailRes.message);
      } catch (emailErr) {
        console.warn(`[EmployeeController] Auto email warning:`, emailErr.message);
        employee.emailDelivery = { success: false, message: emailErr.message };
      }
    }

    const result = await Employee.findById(employee.id);
    if (employee.emailDelivery) {
      result.emailDelivery = employee.emailDelivery;
    }
    res.status(201).json(result);
  } catch (err) {
    console.error('[EmployeeController] createEmployee error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      if (err.message.includes('ma_so')) {
        return res.status(400).json({ message: 'Mã nhân viên này đã tồn tại.' });
      }
      if (err.message.includes('email')) {
        return res.status(400).json({ message: 'Email này đã tồn tại trong hệ thống.' });
      }
    }
    res.status(500).json({ message: 'Lỗi khi tạo nhân viên: ' + err.message });
  }
}

async function updateEmployee(req, res) {
  try {
    const targetId = Number(req.params.id);
    const employee = await Employee.findById(targetId);
    if (!employee) return res.status(404).json({ message: 'Không tìm thấy nhân viên.' });

    const { code, email } = req.body;
    if (code) {
      const cleanCode = code.trim();
      const existingCode = await Employee.findByCode(cleanCode, targetId);
      if (existingCode) {
        return res.status(400).json({ message: `Mã nhân viên "${cleanCode}" đã tồn tại trên hệ thống (${existingCode.name}).` });
      }
    }

    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      const existingEmail = await Employee.findByEmail(cleanEmail, targetId);
      if (existingEmail) {
        return res.status(400).json({ message: `Email "${cleanEmail}" đã được sử dụng cho nhân viên khác.` });
      }
    }

    await Employee.update(targetId, req.body);

    // Xử lý các thao tác tài khoản liên kết
    const {
      accountAction, // 'unlink', 'link', 'create', 'update', 'none'
      linkAccountId,
      newAccountEmail,
      newAccountRole,
      newAccountPassword,
      currentAccountRole,
      currentAccountPassword,
    } = req.body;

    if (accountAction === 'unlink') {
      await User.unlinkEmployee(targetId);
    } else if (accountAction === 'link' && linkAccountId) {
      // Gỡ liên kết cũ nếu đang gắn tài khoản khác
      await User.unlinkEmployee(targetId);
      await User.linkAccountToEmployee(Number(linkAccountId), targetId);
    } else if (accountAction === 'create') {
      if (!newAccountPassword || !newAccountPassword.trim()) {
        return res.status(400).json({ message: 'Vui lòng nhập mật khẩu cho tài khoản mới.' });
      }
      const accEmail = (newAccountEmail || req.body.email || employee.email).trim().toLowerCase();
      const existingUser = await User.findByEmail(accEmail);
      if (existingUser) {
        return res.status(400).json({ message: `Email tài khoản "${accEmail}" đã được sử dụng bởi một tài khoản khác.` });
      }
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newAccountPassword.trim(), salt);
      await User.create({
        name: (req.body.name || employee.name).trim(),
        email: accEmail,
        passwordHash,
        role: newAccountRole || 'employee',
        employeeId: targetId,
      });
    } else if (accountAction === 'update' && employee.accountId) {
      let pwdHash = null;
      if (currentAccountPassword && currentAccountPassword.trim()) {
        const salt = await bcrypt.genSalt(10);
        pwdHash = await bcrypt.hash(currentAccountPassword.trim(), salt);
      }
      await User.update(employee.accountId, {
        name: (req.body.name || employee.name).trim(),
        email: employee.accountEmail,
        passwordHash: pwdHash,
        role: currentAccountRole || employee.accountRole || 'employee',
        employeeId: targetId,
      });
    }

    const updated = await Employee.findById(targetId);
    res.json(updated);
  } catch (err) {
    console.error('[EmployeeController] updateEmployee error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      if (err.message.includes('ma_so')) {
        return res.status(400).json({ message: 'Mã nhân viên này đã tồn tại.' });
      }
      if (err.message.includes('email')) {
        return res.status(400).json({ message: 'Email này đã tồn tại trong hệ thống.' });
      }
    }
    res.status(500).json({ message: 'Lỗi khi cập nhật nhân viên: ' + err.message });
  }
}

async function deleteEmployee(req, res) {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Không tìm thấy nhân viên.' });
    await Employee.delete(req.params.id);
    res.json({ message: 'Đã xóa nhân viên.' });
  } catch (err) {
    console.error('[EmployeeController] deleteEmployee error:', err);
    res.status(500).json({ message: 'Lỗi khi xóa nhân viên: ' + err.message });
  }
}

async function enrollFace(req, res) {
  try {
    const { imageBase64, employeeId } = req.body;
    let targetId;
    if (req.user?.role === 'employee') {
      if (!req.user.employeeId) {
        return res.status(400).json({ message: 'Tài khoản chưa được liên kết với hồ sơ nhân viên trong hệ thống.' });
      }
      targetId = Number(req.user.employeeId);
    } else {
      targetId = Number(req.params.id || employeeId || req.user?.employeeId);
    }

    if (!targetId) {
      return res.status(400).json({ message: 'Không xác định được nhân viên cần đăng ký khuôn mặt.' });
    }

    if (!imageBase64) return res.status(400).json({ message: 'Thiếu dữ liệu ảnh khuôn mặt.' });

    const employee = await Employee.findById(targetId);
    if (!employee) return res.status(404).json({ message: 'Không tìm thấy nhân viên.' });

    // 1. Kiểm tra ảnh có khuôn mặt hay không
    const detection = await detectFace(imageBase64);
    if (!detection.faceDetected) {
      return res.status(400).json({
        message: 'Không phát hiện khuôn mặt hợp lệ trong ảnh. Vui lòng chụp rõ mặt chính diện, đủ ánh sáng và không bị che khuất.',
      });
    }

    // Ảnh crop (AI đã cắt vùng khuôn mặt) dùng để lưu vào DB và so khớp khi chấm công
    const faceToSave = detection.croppedFace || imageBase64;
    // Hash của ảnh gốc để check trùng nhanh
    const originalHash = computeImageHash(imageBase64);
    // Hash của ảnh crop để check trùng chính xác
    const cropHash = computeImageHash(faceToSave);

    // 2. Kiểm tra trùng lặp khuôn mặt ở DB TRƯỚC (nhanh, không cần AI)
    const registeredEmployees = await Employee.findWithRegisteredFace();
    const otherEmployees = registeredEmployees.filter((e) => Number(e.id) !== targetId);

    // 2a. Kiểm tra nhanh bằng hash ảnh gốc và hash ảnh crop tại các nhân viên khác
    for (const other of otherEmployees) {
      let rawFace = other.face_data;
      let savedData = null;
      if (typeof rawFace === 'string') {
        try { savedData = JSON.parse(rawFace); } catch { savedData = { image: rawFace }; }
      } else if (typeof rawFace === 'object') {
        savedData = rawFace;
      }
      if (!savedData) continue;

      // Kiểm tra hash gốc
      if (savedData.originalHash && (savedData.originalHash === originalHash || savedData.originalHash === cropHash)) {
        return res.status(400).json({
          message: `Khuôn mặt này đã được đăng ký cho nhân viên "${other.name}" (Mã NV: ${other.code}). Mỗi khuôn mặt chỉ được liên kết với DUY NHẤT 1 nhân viên!`,
          duplicateEmployee: { id: other.id, code: other.code, name: other.name },
        });
      }
      // Kiểm tra hash crop
      if (savedData.cropHash && (savedData.cropHash === cropHash || savedData.cropHash === originalHash)) {
        return res.status(400).json({
          message: `Khuôn mặt này đã được đăng ký cho nhân viên "${other.name}" (Mã NV: ${other.code}). Mỗi khuôn mặt chỉ được liên kết với DUY NHẤT 1 nhân viên!`,
          duplicateEmployee: { id: other.id, code: other.code, name: other.name },
        });
      }
    }

    // 2b. Kiểm tra bằng AI (so sánh vector đặc trưng khuôn mặt - phát hiện cùng người dùng ảnh khác)
    if (otherEmployees.length > 0) {
      const dupCheck = await checkDuplicateFace(faceToSave, otherEmployees, targetId);
      if (dupCheck.isDuplicate) {
        const dup = dupCheck.duplicateWith;
        return res.status(400).json({
          message: `Khuôn mặt này đã được đăng ký cho nhân viên "${dup.name}" (Mã NV: ${dup.code}). Mỗi khuôn mặt chỉ được liên kết với DUY NHẤT 1 nhân viên trong hệ thống!`,
          duplicateEmployee: dup,
        });
      }
    }

    // 3. Gán khuôn mặt độc quyền cho nhân viên này
    const faceData = {
      image: faceToSave,           // Ảnh crop (dùng để so khớp khi chấm công)
      embedding: detection.embedding || null, // Vector ArcFace 512-dim để so khớp siêu tốc
      originalHash,                // Hash ảnh gốc (check trùng nhanh)
      cropHash,                    // Hash ảnh crop (check trùng nhanh)
      registered_at: new Date().toISOString(),
      employeeId: employee.id,
      employeeCode: employee.code,
      employeeName: employee.name,
      department: employee.department || 'Chưa phân phòng',
      position: employee.position || 'Nhân viên',
    };

    await Employee.saveFaceEmbedding(targetId, faceData);
    return res.json({
      message: `Đã đăng ký và gán khuôn mặt thành công cho nhân viên: ${employee.name} (${employee.code}).`,
      faceData,
    });
  } catch (err) {
    console.error('[EmployeeController] enrollFace error:', err);
    return res.status(500).json({ message: 'Lỗi hệ thống khi xử lý đăng ký khuôn mặt: ' + err.message });
  }
}

async function deleteFaceEnrollment(req, res) {
  const targetId = req.params.id;
  const employee = await Employee.findById(targetId);
  if (!employee) return res.status(404).json({ message: 'Không tìm thấy nhân viên.' });

  await Employee.deleteFaceEmbedding(targetId);
  res.json({ message: `Đã xóa dữ liệu khuôn mặt của nhân viên ${employee.name}.` });
}

async function getMyProfile(req, res) {
  try {
    let employee = null;
    if (req.user && req.user.employeeId) {
      employee = await Employee.findById(req.user.employeeId);
    }
    if (!employee && req.user && req.user.id) {
      employee = await Employee.findByAccountId(req.user.id);
    }
    if (!employee) {
      return res.status(404).json({ message: 'Tài khoản chưa được liên kết với hồ sơ nhân viên nào trong hệ thống.' });
    }
    res.json(employee);
  } catch (err) {
    console.error('[EmployeeController] getMyProfile error:', err);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin hồ sơ cá nhân: ' + err.message });
  }
}

async function updateMyProfile(req, res) {
  try {
    let employee = null;
    if (req.user && req.user.employeeId) {
      employee = await Employee.findById(req.user.employeeId);
    }
    if (!employee && req.user && req.user.id) {
      employee = await Employee.findByAccountId(req.user.id);
    }
    if (!employee) {
      return res.status(404).json({ message: 'Tài khoản chưa được liên kết với hồ sơ nhân viên nào trong hệ thống.' });
    }

    const { phone, address, dob, gender, idCard, education, major, cv } = req.body;

    const updatePayload = {
      code: employee.code,
      name: employee.name,
      email: employee.email,
      phone: phone !== undefined ? phone : employee.phone,
      departmentId: employee.department_id,
      position: employee.position,
      status: employee.status,
      joinDate: employee.joinDate,
      education: education !== undefined ? education : employee.education,
      major: major !== undefined ? major : employee.major,
      dob: dob !== undefined ? dob : employee.dob,
      gender: gender !== undefined ? gender : employee.gender,
      idCard: idCard !== undefined ? idCard : employee.idCard,
      address: address !== undefined ? address : employee.address,
      cv: cv !== undefined ? cv : employee.cv,
    };

    await Employee.update(employee.id, updatePayload);

    // Lưu vào nhật ký hệ thống
    try {
      await pool.query(
        'INSERT INTO nhat_ky_he_thong (ma_tai_khoan, hanh_dong, chuc_nang) VALUES (?, ?, ?)',
        [req.user.id, `Nhân viên ${employee.name} (${employee.code}) cập nhật thông tin hồ sơ cá nhân`, 'Hồ sơ cá nhân']
      );
    } catch {}

    const updated = await Employee.findById(employee.id);
    res.json(updated);
  } catch (err) {
    console.error('[EmployeeController] updateMyProfile error:', err);
    res.status(500).json({ message: 'Lỗi khi cập nhật hồ sơ cá nhân: ' + err.message });
  }
}

async function getMyWorkHistory(req, res) {
  try {
    let employee = null;
    if (req.user && req.user.employeeId) {
      employee = await Employee.findById(req.user.employeeId);
    }
    if (!employee && req.user && req.user.id) {
      employee = await Employee.findByAccountId(req.user.id);
    }
    if (!employee) {
      return res.status(404).json({ message: 'Tài khoản chưa được liên kết với hồ sơ nhân viên nào trong hệ thống.' });
    }

    const Attendance = require('../models/Attendance');
    const Leave = require('../models/Leave');
    const Overtime = require('../models/Overtime');

    const [attendance, leaves, overtimes] = await Promise.all([
      Attendance.findByEmployeeId(employee.id),
      Leave.findByEmployeeId(employee.id),
      Overtime.findByEmployeeId(employee.id),
    ]);

    res.json({
      employee,
      attendance,
      leaves,
      overtimes,
    });
  } catch (err) {
    console.error('[EmployeeController] getMyWorkHistory error:', err);
    res.status(500).json({ message: 'Lỗi khi lấy lịch sử làm việc: ' + err.message });
  }
}

async function getNextEmployeeCode(req, res) {
  try {
    const nextCode = await Employee.getNextCode();
    res.json({ nextCode });
  } catch (err) {
    console.error('[EmployeeController] getNextEmployeeCode error:', err);
    res.status(500).json({ message: 'Lỗi khi lấy mã nhân viên tự động: ' + err.message });
  }
}

async function sendEmployeeOnboardingEmail(req, res) {
  try {
    const { to, employeeName, employeeCode, position, department, tempPassword, loginUrl } = req.body;
    if (!to) {
      return res.status(400).json({ message: 'Vui lòng cung cấp địa chỉ email người nhận.' });
    }

    const result = await sendOnboardingEmail({
      to,
      employeeName: employeeName || 'Nhân viên',
      employeeCode: employeeCode || 'NV',
      position,
      department,
      tempPassword,
      loginUrl: loginUrl || 'http://localhost:5173/login',
    });

    res.json(result);
  } catch (err) {
    console.error('[EmployeeController] sendEmployeeOnboardingEmail error:', err);
    res.status(500).json({ message: 'Không thể gửi email: ' + err.message });
  }
}

module.exports = {
  getEmployees,
  getEmployeeById,
  getNextEmployeeCode,
  getUnlinkedAccounts,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  enrollFace,
  deleteFaceEnrollment,
  getMyProfile,
  updateMyProfile,
  getMyWorkHistory,
  sendEmployeeOnboardingEmail,
};

