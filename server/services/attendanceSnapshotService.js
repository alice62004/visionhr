const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const dataDir = path.join(__dirname, '../data');
const snapshotsFile = path.join(dataDir, 'attendance_snapshots.json');
const uploadsDir = path.join(__dirname, '../uploads/attendance');

function ensureDirs() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
}

function loadSnapshots() {
  ensureDirs();
  try {
    if (fs.existsSync(snapshotsFile)) {
      return JSON.parse(fs.readFileSync(snapshotsFile, 'utf8'));
    }
  } catch (err) {
    console.warn('[SnapshotService] Read error:', err.message);
  }
  return {};
}

function saveSnapshots(data) {
  ensureDirs();
  try {
    fs.writeFileSync(snapshotsFile, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[SnapshotService] Write error:', err.message);
  }
}

function saveAttendanceSnapshot(attendanceId, { imageBase64, action = 'check_in', shiftName, employeeId, employeeName }) {
  if (!attendanceId || !imageBase64) return null;
  ensureDirs();

  const store = loadSnapshots();
  const key = String(attendanceId);

  // Lưu file ảnh tĩnh vào uploads/attendance
  let imageUrl = null;
  try {
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const fileName = `att_${attendanceId}_${action}_${Date.now()}.jpg`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    imageUrl = `/uploads/attendance/${fileName}`;
  } catch (e) {
    console.warn('[SnapshotService] Failed to write image file, using base64:', e.message);
  }

  const existing = store[key] || {};
  if (action === 'check_out') {
    existing.outImage = imageUrl || imageBase64;
    existing.outTime = new Date().toISOString();
  } else {
    existing.inImage = imageUrl || imageBase64;
    existing.inTime = new Date().toISOString();
  }

  existing.shiftName = shiftName || existing.shiftName;
  existing.employeeId = employeeId || existing.employeeId;
  existing.employeeName = employeeName || existing.employeeName;
  existing.lastUpdated = new Date().toISOString();

  store[key] = existing;
  saveSnapshots(store);

  // Lưu trực tiếp đường dẫn ảnh snapshot vào bảng cham_cong trong MySQL
  if (attendanceId && imageUrl) {
    const col = action === 'check_out' ? 'anh_ra' : 'anh_vao';
    pool.query(`UPDATE cham_cong SET ${col} = ? WHERE ma_cham_cong = ?`, [imageUrl, attendanceId])
      .catch((e) => console.warn('[SnapshotService] Failed to update MySQL cham_cong:', e.message));
  }

  return imageUrl || imageBase64;
}

function getAttendanceSnapshot(attendanceId) {
  if (!attendanceId) return null;
  const store = loadSnapshots();
  return store[String(attendanceId)] || null;
}

module.exports = {
  saveAttendanceSnapshot,
  getAttendanceSnapshot,
  loadSnapshots,
};
