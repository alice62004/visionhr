const axios = require('axios');
require('dotenv').config();

// AI HR Agent: nhận câu hỏi ngôn ngữ tự nhiên, kèm role/scope của người hỏi để giới hạn dữ liệu trả lời
async function askAgent({ question, user }) {
  const { data } = await axios.post(`${process.env.AI_SERVICE_URL}/hr-agent/ask`, {
    question,
    userId: user.id,
    role: user.role,
    department: user.department,
  });
  return data; // { answer }
}

module.exports = { askAgent };
