const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool kết nối MySQL dùng chung cho toàn bộ models
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Mai12345',
  database: process.env.DB_NAME || 'visionhr',
  timezone: '+07:00',
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;

// const mysql = require('mysql2/promise');
// require('dotenv').config();

// const isRemote = process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1';

// // Pool kết nối MySQL dùng chung cho toàn bộ models
// const pool = mysql.createPool({
//   host: process.env.DB_HOST || 'localhost',
//   // port: process.env.DB_PORT || 3306,
//   port: Number(process.env.DB_PORT) || 3306,
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASSWORD || 'Mai12345',
//   database: process.env.DB_NAME || 'visionhr',
//   ssl: isRemote || process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
//   timezone: '+07:00',
//   dateStrings: true,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

// module.exports = pool;
