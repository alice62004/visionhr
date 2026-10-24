const pool = require('../config/db');

async function updateProfiles() {
  await pool.query(
    `UPDATE nhan_vien 
     SET bang_cap = 'Cử nhân Đại học', chuyen_nganh = 'Kỹ thuật Phần mềm', ngay_sinh = '1998-05-15', gioi_tinh = 'nam', so_cccd = '079198004567', dia_chi = '123 Nguyễn Huệ, Quận 1, TP.HCM'
     WHERE ma_nhan_vien = 1`
  );

  await pool.query(
    `UPDATE nhan_vien 
     SET bang_cap = 'Thạc sĩ Quản trị', chuyen_nganh = 'Quản trị Nguồn nhân lực', ngay_sinh = '1992-10-20', gioi_tinh = 'nu', so_cccd = '079192003456', dia_chi = '456 Lê Duẩn, Quận 1, TP.HCM'
     WHERE ma_nhan_vien = 2`
  );

  await pool.query(
    `UPDATE nhan_vien 
     SET bang_cap = 'Cử nhân Đại học', chuyen_nganh = 'Quản trị Kinh doanh', ngay_sinh = '2000-02-08', gioi_tinh = 'nam', so_cccd = '079200001234', dia_chi = '789 Trần Hưng Đạo, Quận 5, TP.HCM'
     WHERE ma_nhan_vien = 3`
  );

  console.log('Sample profiles updated successfully!');
  process.exit(0);
}

updateProfiles().catch((err) => {
  console.error(err);
  process.exit(1);
});
