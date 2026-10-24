const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { detectFace, matchFace } = require('./faceRecognitionService');
const { checkLiveness } = require('./livenessService');
const pool = require('../config/db');

// Luồng chấm công đầy đủ: kiểm tra danh sách đã đăng ký -> phát hiện khuôn mặt -> kiểm tra liveness -> so khớp -> ghi nhận chấm công
async function processFaceCheckIn(imageBase64, actionType = 'auto', shiftMode = 'auto') {
  // 1. Kiểm tra danh sách nhân viên đã đăng ký khuôn mặt trong hệ thống
  const candidates = await Employee.findWithRegisteredFace();
  if (!candidates || candidates.length === 0) {
    throw new Error('Chưa có nhân viên nào đăng ký khuôn mặt trong hệ thống. Vui lòng đăng ký khuôn mặt trước khi quét chấm công!');
  }

  // 2. Phát hiện khuôn mặt trong khung hình
  const detection = await detectFace(imageBase64);
  if (!detection.faceDetected) {
    throw new Error('Không phát hiện khuôn mặt trong khung hình. Vui lòng hướng thẳng mặt vào camera.');
  }

  // 3. Kiểm tra liveness chống giả mạo
  const liveness = await checkLiveness(imageBase64);
  if (!liveness.isLive) {
    throw new Error('Cảnh báo: Không xác thực được liveness (nghi ngờ ảnh giả mạo hoặc video phát lại).');
  }

  // 4. So khớp khuôn mặt với ứng viên đã đăng ký
  const match = await matchFace(detection.croppedFace, candidates);
  if (!match.employeeId || match.confidence < 0.35) {
    throw new Error('Khuôn mặt chưa khớp với nhân viên nào đã đăng ký trong hệ thống. Vui lòng đứng gần camera, đủ ánh sáng và nhìn thẳng.');
  }

  const matchedEmp = candidates.find((c) => Number(c.id) === Number(match.employeeId));
  if (!matchedEmp) {
    throw new Error('Khuôn mặt chưa khớp với nhân viên nào đã đăng ký trong hệ thống.');
  }

  // 5. Ghi nhận vào CSDL với logic ca sáng / ca chiều riêng biệt và lưu ảnh chấm công
  const result = await Attendance.recordCheckIn({
    employeeId: matchedEmp.id,
    employeeName: matchedEmp.name,
    method: 'nhan_dien_khuon_mat',
    actionType,
    shiftMode,
    imageBase64,
  });

  let faceImg = null;
  if (matchedEmp.face_data) {
    if (typeof matchedEmp.face_data === 'object') {
      faceImg = matchedEmp.face_data.image;
    } else if (typeof matchedEmp.face_data === 'string') {
      try {
        faceImg = JSON.parse(matchedEmp.face_data).image;
      } catch {}
    }
  }

  return {
    attendanceId: result.id,
    action: result.action,
    message: result.message,
    shiftName: result.shiftName,
    checkIn: result.checkIn,
    checkOut: result.checkOut,
    employeeId: matchedEmp.id,
    employeeCode: matchedEmp.code,
    employeeName: matchedEmp.name,
    department: matchedEmp.department || 'Chưa phân phòng ban',
    time: new Date().toLocaleTimeString('vi-VN'),
    status: result.status,
    statusLabel: result.status === 'dung_gio' ? 'Đúng giờ' : 'Đi muộn',
    avatar: result.snapshotImage || faceImg,
    snapshotImage: result.snapshotImage || faceImg,
  };
}

module.exports = { processFaceCheckIn };

