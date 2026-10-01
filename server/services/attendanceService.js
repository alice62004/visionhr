const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { detectFace, matchFace } = require('./faceRecognitionService');
const { checkLiveness } = require('./livenessService');
const pool = require('../config/db');

// Luồng chấm công đầy đủ: kiểm tra danh sách đã đăng ký -> phát hiện khuôn mặt -> kiểm tra liveness -> so khớp -> ghi nhận chấm công
async function processFaceCheckIn(imageBase64) {
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
  if (!match.employeeId || match.confidence < 0.55) {
    throw new Error('Khuôn mặt chưa khớp với nhân viên nào đã đăng ký trong hệ thống. Vui lòng đứng gần camera, đủ ánh sáng và nhìn thẳng.');
  }

  const matchedEmp = candidates.find((c) => Number(c.id) === Number(match.employeeId));
  if (!matchedEmp) {
    throw new Error('Khuôn mặt chưa khớp với nhân viên nào đã đăng ký trong hệ thống.');
  }

  // 5. Đối chiếu ca làm việc để phân loại đúng giờ / đi muộn
  let status = 'dung_gio';
  try {
    const [shifts] = await pool.query(
      `SELECT gio_bat_dau FROM ca_lam_viec 
       WHERE ma_phong_ban = ? OR ma_phong_ban IS NULL 
       ORDER BY (ma_phong_ban IS NOT NULL) DESC LIMIT 1`,
      [matchedEmp.department_id || null]
    );
    if (shifts.length > 0 && shifts[0].gio_bat_dau) {
      const now = new Date();
      const [shH, shM] = shifts[0].gio_bat_dau.split(':').map(Number);
      const shiftStartTime = new Date();
      shiftStartTime.setHours(shH, shM + 15, 0, 0); // Cho phép trễ 15 phút
      if (now > shiftStartTime) {
        status = 'di_muon';
      }
    }
  } catch {
    status = 'dung_gio';
  }

  // 6. Ghi nhận vào CSDL
  const result = await Attendance.recordCheckIn({
    employeeId: matchedEmp.id,
    method: 'nhan_dien_khuon_mat',
    status,
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
    employeeId: matchedEmp.id,
    employeeCode: matchedEmp.code,
    employeeName: matchedEmp.name,
    department: matchedEmp.department || 'Chưa phân phòng ban',
    time: new Date().toLocaleTimeString('vi-VN'),
    status,
    statusLabel: status === 'dung_gio' ? 'Đúng giờ' : 'Đi muộn',
    avatar: faceImg,
  };
}

module.exports = { processFaceCheckIn };

