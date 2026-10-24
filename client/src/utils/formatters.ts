// Các hàm tiện ích định dạng dữ liệu dùng chung cho toàn bộ Frontend VisionHR

/**
 * Định dạng số tiền sang tiền tệ Việt Nam Đồng (VND)
 * Ví dụ: 15000000 -> "15.000.000 đ"
 */
export function formatVND(n?: number | string | null): string {
  if (n === null || n === undefined || n === '') return '0 đ';
  const num = typeof n === 'string' ? Number(n) : n;
  if (isNaN(num)) return '0 đ';
  return num.toLocaleString('vi-VN') + ' đ';
}

/**
 * Chuẩn hóa hiển thị ngày tháng theo định dạng DD/MM/YYYY chuẩn giờ Việt Nam
 * Hỗ trợ cả chuỗi ISO (2026-10-24T00:00:00), YYYY-MM-DD hoặc Date object
 */
export function formatDisplayDate(dateInput?: string | Date | null): string {
  if (!dateInput) return '--';
  if (dateInput instanceof Date) {
    const d = String(dateInput.getDate()).padStart(2, '0');
    const m = String(dateInput.getMonth() + 1).padStart(2, '0');
    const y = dateInput.getFullYear();
    return `${d}/${m}/${y}`;
  }
  const clean = dateInput.includes('T') ? dateInput.split('T')[0] : dateInput;
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return dateInput;
}

/**
 * Lấy tên thứ trong tuần (Thứ Hai, Thứ Ba... Chủ Nhật)
 */
export function getDayOfWeek(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  let d: Date;
  if (dateInput instanceof Date) {
    d = dateInput;
  } else {
    const clean = dateInput.includes('T') ? dateInput.split('T')[0] : dateInput;
    d = new Date(clean + 'T00:00:00');
  }
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return days[d.getDay()] || '';
}

/**
 * Tính tổng thời lượng làm việc giữa giờ vào và giờ ra (giờ phút)
 */
export function calculateWorkDuration(checkIn?: string | null, checkOut?: string | null): string {
  if (!checkIn || !checkOut) return 'Chưa hoàn tất (chưa có giờ ra)';
  const [inH, inM, inS = 0] = checkIn.split(':').map(Number);
  const [outH, outM, outS = 0] = checkOut.split(':').map(Number);
  const inSeconds = inH * 3600 + inM * 60 + inS;
  const outSeconds = outH * 3600 + outM * 60 + outS;
  if (outSeconds <= inSeconds) return '0 giờ 0 phút';
  const diffSec = outSeconds - inSeconds;
  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  return `${hours} giờ ${minutes} phút`;
}
