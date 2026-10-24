const Schedule = require('../models/Schedule');
const Employee = require('../models/Employee');
const pool = require('../config/db');

// Lấy lịch làm việc của chính nhân viên đang đăng nhập
async function getMySchedule(req, res) {
  try {
    let employee = null;
    if (req.user && req.user.employeeId) {
      employee = await Employee.findById(req.user.employeeId);
    }
    if (!employee && req.user && req.user.id) {
      employee = await Employee.findByAccountId(req.user.id);
    }
    if (!employee) {
      return res.status(404).json({ message: 'Tài khoản chưa được liên kết với hồ sơ nhân viên.' });
    }

    const { startDate, endDate } = req.query;
    const schedules = await Schedule.findByEmployeeId(employee.id, startDate, endDate);
    res.json({
      employee: {
        id: employee.id,
        code: employee.code,
        name: employee.name,
        position: employee.position,
        department: employee.department,
      },
      schedules,
    });
  } catch (err) {
    console.error('[ScheduleController] getMySchedule error:', err);
    res.status(500).json({ message: 'Lỗi khi tải lịch làm việc cá nhân: ' + err.message });
  }
}

// Lấy danh sách lịch phân ca (cho Manager / HR / Admin)
async function getSchedules(req, res) {
  try {
    let { departmentId, startDate, endDate, employeeId } = req.query;

    // Nếu là Manager, tự động giới hạn chỉ xem phòng ban mình quản lý
    if (req.user && req.user.role === 'manager') {
      let managerEmp = null;
      if (req.user.employeeId) managerEmp = await Employee.findById(req.user.employeeId);
      if (!managerEmp && req.user.id) managerEmp = await Employee.findByAccountId(req.user.id);

      if (managerEmp && managerEmp.department_id) {
        departmentId = managerEmp.department_id;
      }
    }

    const schedules = await Schedule.findAll({
      departmentId: departmentId ? Number(departmentId) : undefined,
      startDate,
      endDate,
      employeeId: employeeId ? Number(employeeId) : undefined,
    });

    res.json(schedules);
  } catch (err) {
    console.error('[ScheduleController] getSchedules error:', err);
    res.status(500).json({ message: 'Lỗi khi tải lịch làm việc: ' + err.message });
  }
}

// Phân ca cho một ngày cụ thể
async function assignSchedule(req, res) {
  try {
    const { employeeId, shiftId, date, note } = req.body;
    if (!employeeId || !shiftId || !date) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ Nhân viên, Ca làm việc và Ngày làm việc.' });
    }

    await Schedule.assign({
      employeeId: Number(employeeId),
      shiftId: Number(shiftId),
      date,
      note,
      assignedBy: req.user ? req.user.id : null,
    });

    res.json({ success: true, message: 'Phân ca làm việc thành công.' });
  } catch (err) {
    console.error('[ScheduleController] assignSchedule error:', err);
    res.status(500).json({ message: 'Lỗi khi phân ca: ' + err.message });
  }
}

// Phân ca hàng loạt theo khoảng ngày
async function bulkAssignSchedule(req, res) {
  try {
    const { employeeIds, shiftId, startDate, endDate, note } = req.body;
    if (!employeeIds || !employeeIds.length || !shiftId || !startDate || !endDate) {
      return res.status(400).json({ message: 'Vui lòng chọn danh sách nhân viên, ca làm việc và khoảng ngày bắt đầu - kết thúc.' });
    }

    const affected = await Schedule.bulkAssign({
      employeeIds: employeeIds.map(Number),
      shiftId: Number(shiftId),
      startDate,
      endDate,
      note,
      assignedBy: req.user ? req.user.id : null,
    });

    res.json({ success: true, message: `Phân ca thành công (${affected} lượt phân công).` });
  } catch (err) {
    console.error('[ScheduleController] bulkAssignSchedule error:', err);
    res.status(500).json({ message: 'Lỗi khi phân ca hàng loạt: ' + err.message });
  }
}

// Xóa/hủy phân ca
async function deleteSchedule(req, res) {
  try {
    const { id } = req.params;
    await Schedule.deleteById(Number(id));
    res.json({ success: true, message: 'Đã hủy phân ca làm việc.' });
  } catch (err) {
    console.error('[ScheduleController] deleteSchedule error:', err);
    res.status(500).json({ message: 'Lỗi khi xóa phân ca: ' + err.message });
  }
}

module.exports = {
  getMySchedule,
  getSchedules,
  assignSchedule,
  bulkAssignSchedule,
  deleteSchedule,
};
