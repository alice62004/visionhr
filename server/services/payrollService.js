// Tính lương dựa trên lương cơ bản + giờ OT (đơn giản hoá — tuỳ chỉnh theo chính sách công ty)
function calculateNetSalary({ baseSalary, otHours, otRatePerHour }) {
  const otPay = otHours * otRatePerHour;
  const netSalary = baseSalary + otPay;
  return { otPay, netSalary };
}

module.exports = { calculateNetSalary };
