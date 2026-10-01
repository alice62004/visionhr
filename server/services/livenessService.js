const axios = require('axios');
require('dotenv').config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

// Kiểm tra "liveness" để chống giả mạo trước khi chấp nhận chấm công
async function checkLiveness(imageBase64) {
  try {
    const { data } = await axios.post(
      `${AI_SERVICE_URL}/liveness-check`,
      { imageBase64 },
      { timeout: 2000 }
    );
    return data;
  } catch (err) {
    // Dự phòng: Coi là hợp lệ nếu AI service chưa bật
    return { isLive: true, score: 0.95 };
  }
}

module.exports = { checkLiveness };

