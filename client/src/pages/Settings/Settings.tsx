export default function Settings() {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px 0', color: '#111827' }}>
        Cấu hình hệ thống
      </h1>
      <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: 14 }}>
        Thiết lập chung, phân quyền và tích hợp Kiosk AI
      </p>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
          padding: 24,
          color: '#4b5563',
        }}
      >
        Khu vực cấu hình: thông tin công ty, ca làm việc mặc định, ngưỡng cảnh báo đi muộn, tích hợp AI camera...
      </div>
    </div>
  );
}
