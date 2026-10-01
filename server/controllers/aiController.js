const { askAgent } = require('../services/aiService');

async function askAI(req, res) {
  try {
    const result = await askAgent({ question: req.body.question, user: req.user });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'AI HR Agent hiện chưa thể trả lời.', error: err.message });
  }
}

module.exports = { askAI };
