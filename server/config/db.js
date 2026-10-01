const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool kết nối MySQL dùng chung cho toàn bộ models
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Mai12345',
  database: process.env.DB_NAME || 'visionhr',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
