const pool = require('../config/db');

async function migrate() {
  console.log('[Migration] Checking columns in table nhan_vien...');
  const [columns] = await pool.query('SHOW COLUMNS FROM nhan_vien');
  const existingCols = columns.map((c) => c.Field);

  const addColumnIfNotExists = async (colName, colDef) => {
    if (!existingCols.includes(colName)) {
      console.log(`[Migration] Adding column ${colName}...`);
      await pool.query(`ALTER TABLE nhan_vien ADD COLUMN ${colName} ${colDef}`);
      console.log(`[Migration] Successfully added ${colName}`);
    } else {
      console.log(`[Migration] Column ${colName} already exists.`);
    }
  };

  await addColumnIfNotExists('bang_cap', 'VARCHAR(100) NULL AFTER chuc_vu');
  await addColumnIfNotExists('chuyen_nganh', 'VARCHAR(150) NULL AFTER bang_cap');
  await addColumnIfNotExists('ngay_sinh', 'DATE NULL AFTER chuyen_nganh');
  await addColumnIfNotExists('gioi_tinh', "ENUM('nam', 'nu', 'khac') DEFAULT 'nam' AFTER ngay_sinh");
  await addColumnIfNotExists('so_cccd', 'VARCHAR(20) NULL AFTER gioi_tinh');
  await addColumnIfNotExists('dia_chi', 'VARCHAR(255) NULL AFTER so_cccd');
  await addColumnIfNotExists('ngay_vao_lam', 'DATE NULL AFTER dia_chi');

  console.log('[Migration] Migration completed successfully.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('[Migration] Migration failed:', err);
  process.exit(1);
});
