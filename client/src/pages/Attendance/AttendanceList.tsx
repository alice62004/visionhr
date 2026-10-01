import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAttendanceRecords } from '../../services/attendanceApi';
import Table, { Column } from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import { AttendanceRecord, AttendanceStatus, AttendanceMethod } from '../../types';

export default function AttendanceList() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getAttendanceRecords()
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<AttendanceRecord>[] = [
    { key: 'employeeName', label: 'Nhân viên' },
    { key: 'date', label: 'Ngày' },
    { key: 'checkIn', label: 'Giờ vào', render: (r) => r.checkIn || '--:--' },
    { key: 'checkOut', label: 'Giờ ra', render: (r) => r.checkOut || '--:--' },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (r) => <AttendanceBadge status={r.status} />,
    },
    {
      key: 'method',
      label: 'Phương thức',
      render: (r) => <MethodBadge method={r.method} />,
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <Button variant="secondary" onClick={() => navigate(`/attendance/${r.id}`)}>
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px 0', color: '#111827' }}>
            Bảng chấm công
          </h1>
          <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: 14 }}>
            Theo dõi giờ vào/ra và phương thức xác thực của toàn bộ nhân viên
          </p>
        </div>
        <Button onClick={() => navigate('/attendance/terminal')}>Mở Attendance Terminal</Button>
      </div>

      {loading ? <p>Đang tải dữ liệu...</p> : <Table columns={columns} data={records} />}
    </div>
  );
}

function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  const map: Record<AttendanceStatus, { color: string; bg: string; border: string; label: string }> = {
    dung_gio: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Đúng giờ' },
    di_muon: { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Đi muộn' },
    vang_mat: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Vắng mặt' },
  };
  const item = map[status] || { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', label: status };
  return (
    <span
      style={{
        color: item.color,
        background: item.bg,
        border: `1px solid ${item.border}`,
        padding: '2px 8px',
        borderRadius: 6,
        fontWeight: 600,
        fontSize: 12,
      }}
    >
      {item.label}
    </span>
  );
}

function MethodBadge({ method }: { method: AttendanceMethod }) {
  const isFace = method === 'nhan_dien_khuon_mat';
  return (
    <span
      style={{
        color: isFace ? '#2563eb' : '#6b7280',
        background: isFace ? '#eff6ff' : '#f3f4f6',
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {isFace ? 'Nhận diện khuôn mặt' : 'Thủ công'}
    </span>
  );
}
