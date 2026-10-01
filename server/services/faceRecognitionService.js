const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

// Lấy SHA256 của chuỗi ảnh để đối chiếu nhanh
function getImageHash(base64Str) {
  if (!base64Str) return '';
  const cleanStr = base64Str.includes(',') ? base64Str.split(',')[1] : base64Str;
  return crypto.createHash('sha256').update(cleanStr.trim()).digest('hex');
}

// Trích xuất chuỗi base64 ảnh từ face_data của nhân viên
function extractImageStr(rawFace) {
  if (!rawFace) return null;
  if (typeof rawFace === 'object') return rawFace.image || null;
  if (typeof rawFace === 'string') {
    try {
      const parsed = JSON.parse(rawFace);
      return parsed.image || rawFace;
    } catch {
      return rawFace;
    }
  }
  return null;
}

// Phát hiện khuôn mặt
async function detectFace(imageBase64) {
  try {
    const { data } = await axios.post(
      `${AI_SERVICE_URL}/detect-face`,
      { imageBase64 },
      { timeout: 3500 }
    );
    return data;
  } catch (err) {
    // Dự phòng khi AI service chưa sẵn sàng: kiểm tra chuỗi ảnh cơ bản
    const isValid = typeof imageBase64 === 'string' && imageBase64.length > 500;
    return {
      faceDetected: isValid,
      croppedFace: imageBase64,
      confidence: isValid ? 0.85 : 0.0,
      fallback: true,
    };
  }
}

// Kiểm tra trùng lặp khuôn mặt: Đảm bảo 1 khuôn mặt chỉ gán cho DUY NHẤT 1 nhân viên
async function checkDuplicateFace(imageBase64, candidates = [], targetEmployeeId = null) {
  if (!candidates || candidates.length === 0) {
    return { isDuplicate: false };
  }

  const probeHash = getImageHash(imageBase64);

  // 1. Kiểm tra nhanh bằng mã hash ảnh (chính xác tuyệt đối 100% đối với ảnh giống hệt)
  for (const cand of candidates) {
    const candId = cand.id || cand.ma_nhan_vien;
    if (targetEmployeeId && String(candId) === String(targetEmployeeId)) {
      continue; // Bỏ qua nếu chính là nhân viên đang cập nhật lại ảnh
    }

    const candImg = extractImageStr(cand.face_data || cand.du_lieu_khuon_mat);
    if (!candImg) continue;

    const candHash = getImageHash(candImg);
    if (candHash && candHash === probeHash) {
      return {
        isDuplicate: true,
        duplicateWith: {
          id: candId,
          code: cand.code || cand.ma_so,
          name: cand.name || cand.ho_ten,
          similarity: 1.0,
          reason: 'Trùng khớp tệp ảnh 100%',
        },
      };
    }

    // Kiểm tra thêm originalHash / cropHash đã lưu trong face_data
    let savedData = cand.face_data || cand.du_lieu_khuon_mat;
    if (typeof savedData === 'string') {
      try { savedData = JSON.parse(savedData); } catch { savedData = null; }
    }
    if (savedData && typeof savedData === 'object') {
      if (
        (savedData.originalHash && (savedData.originalHash === probeHash)) ||
        (savedData.cropHash && (savedData.cropHash === probeHash))
      ) {
        return {
          isDuplicate: true,
          duplicateWith: {
            id: candId,
            code: cand.code || cand.ma_so,
            name: cand.name || cand.ho_ten,
            similarity: 1.0,
            reason: 'Trùng hash ảnh đã đăng ký',
          },
        };
      }
    }
  }

  // 2. Gửi sang AI Service phân tích vector đặc trưng & độ tương đồng khuôn mặt
  try {
    const { data } = await axios.post(
      `${AI_SERVICE_URL}/check-duplicate-face`,
      {
        imageBase64,
        candidates,
        targetEmployeeId: targetEmployeeId ? Number(targetEmployeeId) : null,
      },
      { timeout: 4000 }
    );

    if (data && data.isDuplicate) {
      return {
        isDuplicate: true,
        duplicateWith: {
          id: data.matchedEmployeeId,
          code: data.matchedEmployeeCode,
          name: data.matchedEmployeeName,
          similarity: data.similarity,
          reason: 'Độ tương đồng khuôn mặt cao',
        },
      };
    }
  } catch (err) {
    // Nếu AI service lỗi hoặc timeout, chỉ phụ thuộc vào hash check ở bước 1
    console.warn('[FaceService] AI duplicate check fallback:', err.message);
  }

  return { isDuplicate: false };
}

// So khớp khuôn mặt khi chấm công (Kiosk / Terminal)
async function matchFace(croppedFace, candidates = []) {
  if (!candidates || candidates.length === 0) {
    return { employeeId: null, employeeName: null, confidence: 0.0 };
  }

  // Chuẩn bị candidates đúng format (đảm bảo face_data là object với field image)
  const normalizedCandidates = candidates.map((c) => {
    const fd = c.face_data || c.du_lieu_khuon_mat;
    return { ...c, face_data: fd };
  });

  try {
    const { data } = await axios.post(
      `${AI_SERVICE_URL}/match-face`,
      { croppedFace, candidates: normalizedCandidates },
      { timeout: 5000 }
    );
    if (data && data.employeeId && data.confidence >= 0.55) {
      return data;
    }
  } catch (err) {
    console.warn('[FaceService] AI match-face fallback:', err.message);
  }

  // Dự phòng: chỉ so khớp nếu trùng hash ảnh trực tiếp
  const probeHash = getImageHash(croppedFace);
  for (const cand of candidates) {
    const candImg = extractImageStr(cand.face_data || cand.du_lieu_khuon_mat);
    if (candImg && getImageHash(candImg) === probeHash) {
      return {
        employeeId: cand.id || cand.ma_nhan_vien,
        employeeName: cand.name || cand.ho_ten,
        confidence: 1.0,
      };
    }
  }

  // KHÔNG bao giờ tự động gán candidate[0]
  return { employeeId: null, employeeName: null, confidence: 0.0 };
}

module.exports = {
  detectFace,
  checkDuplicateFace,
  matchFace,
};
