const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

async function login(req, res) {
  const { email, password } = req.body;

  try {
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    const payload = {
      id: user.id,
      name: user.name,
      role: user.role,
      employeeId: user.employee_id,
      department: user.department_id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    res.json({ user: payload, token });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ khi đăng nhập.', error: err.message });
  }
}

module.exports = { login };
