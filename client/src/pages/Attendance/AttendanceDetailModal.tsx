import React from 'react';
import { Camera } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import Button from '../../components/Button/Button';
import { AttendanceRecord } from '../../types';
import { AttendanceBadge } from './AttendanceBadges';
import { formatDisplayDate, getDayOfWeek, calculateWorkDuration } from '../../utils/formatters';

interface AttendanceDetailModalProps {
  open: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  onOpenPhoto: (record: AttendanceRecord) => void;
}

export default function AttendanceDetailModal({
  open,
  onClose,
  record,
  onOpenPhoto,
}: AttendanceDetailModalProps) {
  if (!record) return null;

  return (
    <Modal
      open={open}
      title="Chi tiết bản ghi chấm công"
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header Profile Box */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '12px 16px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: '#184a8c',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            {record.employeeName ? record.employeeName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              {record.employeeName}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 3, fontSize: 12, color: '#64748b' }}>
              {(record as any).employeeCode && (
                <span>Mã NV: <strong style={{ color: '#1e40af' }}>{(record as any).employeeCode}</strong></span>
              )}
              {(record as any).department && (
                <span>Phòng: <strong>{(record as any).department}</strong></span>
              )}
            </div>
          </div>
          <AttendanceBadge status={record.status} />
        </div>

        {/* Khung ảnh chụp chấm công AI trong chi tiết */}
        <div
          style={{
            background: '#0f172a',
            borderRadius: 12,
            padding: '14px 16px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: 10,
              overflow: 'hidden',
              border: '2px solid #38bdf8',
              background: '#1e293b',
              flexShrink: 0,
            }}
          >
            <img
              src={record.snapshotImage || record.inImage || record.outImage || (record as any).avatar || '/default-avatar.png'}
              alt="Ảnh chấm công"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/default-avatar.png';
              }}
            />
          </div>
          <div style={{ flex: 1, fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Camera size={14} /> Khung ảnh nhận diện Kiosk AI
            </div>
            <div style={{ color: '#e2e8f0' }}>
              Ca áp dụng: <strong>{record.shiftName || 'Ca sáng / Ca chiều'}</strong>
            </div>
            <div style={{ color: '#4ade80' }}>
              ✓ Đã lưu Database & Bộ nhớ Kiosk
            </div>
            <button
              type="button"
              onClick={() => onOpenPhoto(record)}
              style={{
                alignSelf: 'flex-start',
                marginTop: 4,
                padding: '3px 10px',
                borderRadius: 6,
                border: '1px solid #38bdf8',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Phóng to ảnh
            </button>
          </div>
        </div>

        {/* Check-in & Check-out Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Giờ vào */}
          <div
            style={{
              padding: '14px',
              borderRadius: 10,
              border: '1px solid #bbf7d0',
              background: '#f0fdf4',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: '#166534', marginBottom: 4 }}>
              GIỜ VÀO (CHECK-IN)
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#166534' }}>
              {record.checkIn ? record.checkIn.slice(0, 5) : '--:--'}
            </div>
            <div style={{ fontSize: 11.5, color: '#15803d', marginTop: 4 }}>
              {record.status === 'dung_gio' ? '✓ Đúng giờ' : '⚠️ Đi muộn'}
            </div>
          </div>

          {/* Giờ ra */}
          <div
            style={{
              padding: '14px',
              borderRadius: 10,
              border: '1px solid #bfdbfe',
              background: '#eff6ff',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1e40af', marginBottom: 4 }}>
              GIỜ RA (CHECK-OUT)
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1e40af' }}>
              {record.checkOut ? record.checkOut.slice(0, 5) : '--:--'}
            </div>
            <div style={{ fontSize: 11.5, color: '#1d4ed8', marginTop: 4 }}>
              {record.checkOut ? '✓ Đã hoàn tất ca' : 'Chưa quét giờ ra'}
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            fontSize: 13,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '14px 16px',
          }}
        >
          <div>
            <span style={{ color: '#64748b', display: 'block', marginBottom: 2 }}>Ngày chấm công:</span>
            <strong style={{ color: '#0f172a' }}>
              {getDayOfWeek(record.date)}, {formatDisplayDate(record.date)}
            </strong>
          </div>

          <div>
            <span style={{ color: '#64748b', display: 'block', marginBottom: 2 }}>Thời gian làm việc:</span>
            <strong style={{ color: '#0f172a' }}>
              {calculateWorkDuration(record.checkIn, record.checkOut)}
            </strong>
          </div>

          <div>
            <span style={{ color: '#64748b', display: 'block', marginBottom: 2 }}>Ca làm việc áp dụng:</span>
            <strong style={{ color: '#184a8c' }}>
              Sáng 08:00 - 11:30 | Chiều 13:30 - 17:00
            </strong>
          </div>

          <div>
            <span style={{ color: '#64748b', display: 'block', marginBottom: 2 }}>Phương thức điểm danh:</span>
            <strong style={{ color: '#059669' }}>
              {record.method === 'nhan_dien_khuon_mat'
                ? 'AI Nhận diện khuôn mặt + Face Liveness'
                : 'Thủ công'}
            </strong>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <span style={{ color: '#64748b', display: 'block', marginBottom: 2 }}>Thiết bị xác thực:</span>
            <strong style={{ color: '#475569' }}>Kiosk Camera Terminal VisionHR AI</strong>
          </div>
        </div>
      </div>
    </Modal>
  );
}
