export default function Reports() {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px 0', color: '#111827' }}>
        Báo cáo & Thống kê
      </h1>
      <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: 14 }}>
        Tổng hợp báo cáo chấm công, nghỉ phép, lương theo thời gian
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
        Khu vực này sẽ chứa các bộ lọc báo cáo và biểu đồ chi tiết theo từng module.
      </div>
    </div>
  );
}
