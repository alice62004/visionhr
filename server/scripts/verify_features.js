const pool = require('../config/db');
const User = require('../models/User');
const Employee = require('../models/Employee');

async function testAll() {
  console.log('--- 1. Testing Departments with positions & face stats ---');
  const [depts] = await pool.query(`
    SELECT d.ma_phong_ban AS id, d.ten_phong_ban AS name, m.ho_ten AS manager,
           COUNT(DISTINCT e.ma_nhan_vien) AS headcount,
           COUNT(DISTINCT NULLIF(TRIM(e.chuc_vu), '')) AS positionCount,
           COUNT(DISTINCT CASE WHEN e.du_lieu_khuon_mat IS NOT NULL THEN e.ma_nhan_vien END) AS faceEnrolledCount,
           COUNT(DISTINCT CASE WHEN e.du_lieu_khuon_mat IS NULL AND e.ma_nhan_vien IS NOT NULL THEN e.ma_nhan_vien END) AS facePendingCount,
           GROUP_CONCAT(DISTINCT NULLIF(TRIM(e.chuc_vu), '') SEPARATOR ', ') AS positions
    FROM phong_ban d
    LEFT JOIN nhan_vien m ON m.ma_nhan_vien = d.ma_truong_phong
    LEFT JOIN nhan_vien e ON e.ma_phong_ban = d.ma_phong_ban
    GROUP BY d.ma_phong_ban, d.ten_phong_ban, m.ho_ten, m.ma_nhan_vien
  `);
  console.table(depts.map(d => ({
    id: d.id,
    name: d.name,
    manager: d.manager,
    headcount: d.headcount,
    positionCount: d.positionCount,
    faceEnrolled: d.faceEnrolledCount,
    positions: d.positions
  })));

  console.log('--- 2. Testing Department Employees with Face Status ---');
  const [dept2Emps] = await pool.query(`
    SELECT e.ma_so, e.ho_ten, e.chuc_vu, (e.du_lieu_khuon_mat IS NOT NULL) AS hasFace, u.email AS accountEmail
    FROM nhan_vien e
    LEFT JOIN tai_khoan u ON u.ma_nhan_vien = e.ma_nhan_vien
    WHERE e.ma_phong_ban = 2
  `);
  console.table(dept2Emps);

  console.log('--- 3. Testing User accounts with linked employee & face status ---');
  const users = await User.findAll();
  console.table(users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    employeeCode: u.employeeCode,
    employeeName: u.employeeName,
    hasFace: u.hasFace,
    dept: u.departmentName
  })));

  console.log('--- 4. Testing Duplicate Employee Code / Email check ---');
  const dupCode = await Employee.findByCode('NV001');
  console.log('Check NV001 exists:', !!dupCode, dupCode?.name);
  const dupEmail = await Employee.findByEmail('an.nguyen@visionhr.vn');
  console.log('Check email exists:', !!dupEmail, dupEmail?.name);

  console.log('--- 5. Testing Duplicate User Employee link check ---');
  const dupEmpUser = await User.findByEmployeeId(1);
  console.log('Check Employee 1 already linked to user:', !!dupEmpUser, dupEmpUser?.email);

  const availableEmps = await User.getEmployeesWithoutAccount();
  console.log('Available employees without account:', availableEmps.map(e => e.code + ' - ' + e.name));

  console.log('\n>>> ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY! <<<');
  process.exit(0);
}

testAll().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
