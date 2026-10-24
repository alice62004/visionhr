const mysql = require('mysql2/promise');

async function sync() {
  console.log('--- BẮT ĐẦU ĐỒNG BỘ DỮ LIỆU TỪ LOCAL SANG TIDB CLOUD ---');

  // 1. Kết nối Local MySQL
  const localConn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Mai12345',
    database: 'visionhr',
  });
  console.log('✓ Kết nối Local MySQL thành công.');

  // 2. Kết nối TiDB Cloud
  const tidbConn = await mysql.createConnection({
    host: 'gateway01.ap-northeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: 'N4632rVqNMz7diN.root',
    password: 'QVuXgWjrRQaydgi0',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
  });
  console.log('✓ Kết nối TiDB Cloud thành công.');

  // Tạo database visionhr trên TiDB Cloud
  await tidbConn.query('CREATE DATABASE IF NOT EXISTS visionhr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
  await tidbConn.query('USE visionhr;');
  console.log('✓ Database visionhr trên TiDB Cloud sẵn sàng.');

  // Lấy danh sách bảng từ Local
  const [tables] = await localConn.query('SHOW TABLES');
  const tableNames = tables.map((t) => Object.values(t)[0]);
  console.log(`Tìm thấy ${tableNames.length} bảng ở Local:`, tableNames);

  // Tắt kiểm tra khóa ngoại tạm thời khi tạo bảng và đổ data
  await tidbConn.query('SET FOREIGN_KEY_CHECKS = 0;');

  for (const table of tableNames) {
    console.log(`-> Đang đồng bộ bảng: ${table}...`);
    // Lấy câu lệnh CREATE TABLE
    const [[createRes]] = await localConn.query(`SHOW CREATE TABLE \`${table}\``);
    const createSql = createRes['Create Table'];

    await tidbConn.query(`DROP TABLE IF EXISTS \`${table}\``);
    await tidbConn.query(createSql);

    // Lấy dữ liệu
    const [rows] = await localConn.query(`SELECT * FROM \`${table}\``);
    if (rows.length > 0) {
      const columns = Object.keys(rows[0]);
      const placeholders = columns.map(() => '?').join(', ');
      const colNames = columns.map((c) => `\`${c}\``).join(', ');
      const insertSql = `INSERT INTO \`${table}\` (${colNames}) VALUES (${placeholders})`;

      for (const row of rows) {
        const values = columns.map((col) => {
          const val = row[col];
          // Chuyển JSON hoặc date object nếu cần
          if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
            return JSON.stringify(val);
          }
          return val;
        });
        await tidbConn.query(insertSql, values);
      }
      console.log(`   + Đã chèn ${rows.length} dòng vào \`${table}\`.`);
    } else {
      console.log(`   + Bảng \`${table}\` trống (0 dòng).`);
    }
  }

  await tidbConn.query('SET FOREIGN_KEY_CHECKS = 1;');
  console.log('========================================================');
  console.log('✓ ĐÃ ĐỒNG BỘ TOÀN BỘ 10 BẢNG VÀ DỮ LIỆU SANG TIDB CLOUD THÀNH CÔNG!');
  console.log('========================================================');

  await localConn.end();
  await tidbConn.end();
}

sync().catch((err) => {
  console.error('LỖI ĐỒNG BỘ:', err);
  process.exit(1);
});
