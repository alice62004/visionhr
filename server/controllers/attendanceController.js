const Attendance = require('../models/Attendance');
const { processFaceCheckIn } = require('../services/attendanceService');

async function getAttendanceRecords(req, res) {
  try {
    let filterEmployeeId = null;
    // Nếu là tài khoản nhân viên thường, chỉ cho phép xem chấm công của chính người đó
    if (req.user && req.user.role === 'employee') {
      filterEmployeeId = req.user.employeeId;
    } else if (req.query.employeeId) {
      filterEmployeeId = Number(req.query.employeeId);
    }
    const records = await Attendance.findAll(filterEmployeeId);
    res.json(records);
  } catch (err) {
    console.error('[AttendanceController] getAttendanceRecords error:', err);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu chấm công: ' + err.message });
  }
}

async function getAttendanceById(req, res) {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Không tìm thấy bản ghi chấm công.' });

    // Bảo mật: Nhân viên thường không được xem chấm công của nhân viên khác
    if (req.user && req.user.role === 'employee' && req.user.employeeId && Number(record.employeeId) !== Number(req.user.employeeId)) {
      return res.status(403).json({ message: 'Bạn không có quyền xem bản ghi chấm công của nhân viên khác.' });
    }

    res.json(record);
  } catch (err) {
    console.error('[AttendanceController] getAttendanceById error:', err);
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết chấm công: ' + err.message });
  }
}

async function faceCheckIn(req, res) {
  try {
    const { imageBase64, actionType, shiftMode } = req.body;
    const result = await processFaceCheckIn(imageBase64, actionType || 'auto', shiftMode || 'auto');
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

module.exports = { getAttendanceRecords, getAttendanceById, faceCheckIn };
