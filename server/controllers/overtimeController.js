const Overtime = require('../models/Overtime');

async function getOvertimeRequests(req, res) {
  try {
    const requests = await Overtime.findAll();
    res.json(requests);
  } catch (err) {
    console.error('[OvertimeController] getOvertimeRequests error:', err);
    res.status(500).json({ message: 'Lỗi khi tải danh sách tăng ca: ' + err.message });
  }
}

async function createOvertimeRequest(req, res) {
  try {
    const { employeeId, date, hours, reason, status } = req.body;
    const targetEmployeeId = employeeId || req.user.employeeId;
    if (!targetEmployeeId) {
      return res.status(400).json({ message: 'Vui lòng chọn nhân viên cần ghi nhận tăng ca.' });
    }
    if (!date) {
      return res.status(400).json({ message: 'Vui lòng chọn ngày tăng ca.' });
    }
    if (!hours || Number(hours) <= 0) {
      return res.status(400).json({ message: 'Số giờ tăng ca không hợp lệ.' });
    }

    const id = await Overtime.create({
      employeeId: Number(targetEmployeeId),
      date,
      hours: Number(hours),
      reason: reason || 'Tăng ca theo phân công công việc',
      status: status || 'da_duyet', // Do HR/Quản lý ghi nhận thực tế nên mặc định là đã duyệt
    });

    res.status(201).json({ id, message: 'Đã ghi nhận tăng ca thành công!' });
  } catch (err) {
    console.error('[OvertimeController] createOvertimeRequest error:', err);
    res.status(500).json({ message: 'Lỗi khi ghi nhận tăng ca: ' + err.message });
  }
}

async function approveOvertimeRequest(req, res) {
  try {
    await Overtime.approve(req.params.id);
    res.json({ message: 'Đã duyệt yêu cầu tăng ca.' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi duyệt tăng ca: ' + err.message });
  }
}

async function rejectOvertimeRequest(req, res) {
  try {
    const { reason } = req.body;
    await Overtime.reject(req.params.id, reason);
    res.json({ message: 'Đã từ chối yêu cầu tăng ca.' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi từ chối tăng ca: ' + err.message });
  }
}

module.exports = {
  getOvertimeRequests,
  createOvertimeRequest,
  approveOvertimeRequest,
  rejectOvertimeRequest,
};
