const Attendance = require('../models/Attendance');
const { processFaceCheckIn } = require('../services/attendanceService');

async function getAttendanceRecords(req, res) {
  const records = await Attendance.findAll();
  res.json(records);
}

async function getAttendanceById(req, res) {
  const record = await Attendance.findById(req.params.id);
  if (!record) return res.status(404).json({ message: 'Không tìm thấy bản ghi chấm công.' });
  res.json(record);
}

async function faceCheckIn(req, res) {
  try {
    const result = await processFaceCheckIn(req.body.imageBase64);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

module.exports = { getAttendanceRecords, getAttendanceById, faceCheckIn };
