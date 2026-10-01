import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAttendanceById } from '../../services/attendanceApi';
import Button from '../../components/Button/Button';
import { AttendanceRecord } from '../../types';

export default function AttendanceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    if (id) {
      getAttendanceById(id)
        .then(setRecord)
        .catch(() => setRecord(null));
    }
  }, [id]);

  if (!record) return <p>Đang tải chi tiết chấm công...</p>;

  const statusLabel =
    record.status === 'dung_gio'
      ? 'Đúng giờ'
      : record.status === 'di_muon'
      ? 'Đi muộn'
      : 'Vắng mặt';

  const methodLabel =
    record.method === 'nhan_dien_khuon_mat'
      ? 'Nhận diện khuôn mặt (Vision AI + Liveness)'
      : 'Chấm công thủ công';

  return (
    <div
      style={{
        maxWidth: 540,
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px 0', color: '#111827' }}>
        Chi tiết bản ghi chấm công
      </h1>
      <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: 14 }}>
        Thông tin xác thực giờ vào / giờ ra của nhân viên
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: '#374151' }}>
        <p style={{ margin: 0 }}><strong>Nhân viên:</strong> {record.employeeName || 'NV#' + record.employeeId}</p>
        <p style={{ margin: 0 }}><strong>Ngày:</strong> {record.date}</p>
        <p style={{ margin: 0 }}><strong>Giờ vào:</strong> {record.checkIn || '--:--'}</p>
        <p style={{ margin: 0 }}><strong>Giờ ra:</strong> {record.checkOut || '--:--'}</p>
        <p style={{ margin: 0 }}><strong>Trạng thái:</strong> {statusLabel}</p>
        <p style={{ margin: 0 }}><strong>Phương thức:</strong> {methodLabel}</p>
      </div>

      <div style={{ marginTop: 24 }}>
        <Button variant="secondary" onClick={() => navigate('/attendance')}>
          Quay lại danh sách
        </Button>
      </div>
    </div>
  );
}
