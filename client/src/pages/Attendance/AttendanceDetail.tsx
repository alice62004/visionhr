import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  Clock,
  ArrowLeft,
  UserCheck,
  Calendar,
  ShieldCheck,
  Camera,
  Briefcase,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { getAttendanceById } from '../../services/attendanceApi';
import Button from '../../components/Button/Button';
import { AttendanceRecord, AttendanceStatus } from '../../types';
import { formatDisplayDate, getDayOfWeek, calculateWorkDuration } from '../../utils/formatters';

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

  if (!record) {
    return (
      <div style={{ padding: 24, color: '#64748b' }}>
        <p>Đang tải chi tiết chấm công...</p>
      </div>
    );
  }

  const isWorking = record.status === 'dung_gio';

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <button
        type="button"
        onClick={() => navigate('/attendance')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          color: '#2563eb',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          padding: 0,
          marginBottom: 16,
        }}
      >
        <ArrowLeft size={16} />
        <span>Quay lại Bảng chấm công</span>
      </button>

      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#184a8c',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              {record.employeeName ? record.employeeName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 2px 0', color: '#0f172a' }}>
                {record.employeeName}
              </h1>
              <div style={{ display: 'flex', gap: 12, fontSize: 12.5, color: '#64748b' }}>
                {(record as any).employeeCode && (
                  <span>Mã NV: <strong style={{ color: '#1e40af' }}>{(record as any).employeeCode}</strong></span>
                )}
                {(record as any).department && (
                  <span>Phòng: <strong>{(record as any).department}</strong></span>
                )}
              </div>
            </div>
          </div>

          <span
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 12.5,
              background: isWorking ? '#f0fdf4' : '#fffbeb',
              color: isWorking ? '#166534' : '#d97706',
              border: `1px solid ${isWorking ? '#bbf7d0' : '#fde68a'}`,
            }}
          >
            {isWorking ? '✓ Đi làm đúng giờ' : '⚠️ Đi muộn'}
          </span>
        </div>

        {/* Content Body */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 2 Big Cards: Check-in & Check-out */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 10,
                padding: '16px',
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#166534', marginBottom: 4 }}>
                GIỜ VÀO (CHECK-IN)
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#166534' }}>
                {record.checkIn ? record.checkIn.slice(0, 5) : '--:--'}
              </div>
              <div style={{ fontSize: 12, color: '#15803d', marginTop: 4 }}>
                {record.status === 'dung_gio' ? '✓ Đúng khung giờ' : '⚠️ Quá giờ quy định'}
              </div>
            </div>

            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 10,
                padding: '16px',
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1e40af', marginBottom: 4 }}>
                GIỜ RA (CHECK-OUT)
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#1e40af' }}>
                {record.checkOut ? record.checkOut.slice(0, 5) : '--:--'}
              </div>
              <div style={{ fontSize: 12, color: '#1d4ed8', marginTop: 4 }}>
                {record.checkOut ? '✓ Đã hoàn tất ca' : 'Chưa quét giờ ra'}
              </div>
            </div>
          </div>

          {/* Details Table Card */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '16px 20px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              fontSize: 13.5,
            }}
          >
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: 12, marginBottom: 2 }}>
                Ngày làm việc
              </span>
              <strong style={{ color: '#0f172a' }}>
                {getDayOfWeek(record.date)}, {formatDisplayDate(record.date)}
              </strong>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: 12, marginBottom: 2 }}>
                Thời gian làm việc thực tế
              </span>
              <strong style={{ color: '#0f172a' }}>
                {calculateWorkDuration(record.checkIn, record.checkOut)}
              </strong>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: 12, marginBottom: 2 }}>
                Ca làm việc quy định
              </span>
              <strong style={{ color: '#184a8c' }}>
                Sáng: 08:00 - 11:30 | Chiều: 13:30 - 17:00
              </strong>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: 12, marginBottom: 2 }}>
                Phương thức xác thực
              </span>
              <strong style={{ color: '#059669' }}>
                {record.method === 'nhan_dien_khuon_mat'
                  ? 'AI Khuôn mặt + Face Liveness'
                  : 'Thủ công'}
              </strong>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: 12, marginBottom: 2 }}>
                Thiết bị điểm danh
              </span>
              <strong style={{ color: '#475569' }}>Kiosk Camera Terminal VisionHR AI</strong>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="secondary" onClick={() => navigate('/attendance')}>
              Quay lại danh sách
            </Button>
            <Button onClick={() => navigate('/attendance/terminal')}>
              Mở Kiosk Chấm công
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
