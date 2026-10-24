import React from 'react';
import { Camera, CheckCircle2 } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import Button from '../../components/Button/Button';
import { AttendanceStatus } from '../../types';
import { EmployeeAvatar, AttendanceBadge } from './AttendanceBadges';
import { formatDisplayDate } from '../../utils/formatters';

export interface PhotoModalData {
  name: string;
  code?: string;
  department?: string;
  date: string;
  time?: string;
  shiftName: string;
  imageUrl: string;
  inImage?: string | null;
  outImage?: string | null;
  avatar?: string | null;
  hasRealSnapshot?: boolean;
  status: AttendanceStatus;
  checkIn?: string | null;
  checkOut?: string | null;
}

interface AttendancePhotoModalProps {
  open: boolean;
  onClose: () => void;
  data: PhotoModalData | null;
  activeType: 'in' | 'out';
  setActiveType: (type: 'in' | 'out') => void;
}

export default function AttendancePhotoModal({
  open,
  onClose,
  data,
  activeType,
  setActiveType,
}: AttendancePhotoModalProps) {
  if (!data) return null;

  const hasInImg = Boolean(data.inImage);
  const hasOutImg = Boolean(data.outImage);
  const showTabs = hasInImg && hasOutImg;

  // Xác định ảnh và giờ theo tab đang chọn
  const currentImg =
    activeType === 'in'
      ? (data.inImage || data.imageUrl || data.avatar)
      : (data.outImage || data.imageUrl || data.avatar);

  const currentTime =
    activeType === 'in'
      ? (data.checkIn || data.time || '--:--')
      : (data.checkOut || data.time || '--:--');

  const isRealSnapshot =
    Boolean(currentImg && (currentImg.includes('/uploads/attendance/') || currentImg.startsWith('data:image')));

  return (
    <Modal
      open={open}
      title="Khung ảnh chấm công AI của nhân viên"
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <Button variant="secondary" onClick={onClose}>
            Đóng cửa sổ
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header info */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
            padding: '12px 16px',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <EmployeeAvatar name={data.name} avatarUrl={data.avatar} size={42} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                {data.name}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                {data.code ? `Mã NV: ${data.code} · ` : ''}
                {data.department ? `Phòng: ${data.department} · ` : ''}
                Ngày: {formatDisplayDate(data.date)}
              </div>
            </div>
          </div>
          <AttendanceBadge status={data.status} />
        </div>

        {/* Tabs chuyển đổi Ảnh Vào Ca / Ảnh Ra Ca (nếu có đủ) */}
        {showTabs && (
          <div style={{ display: 'flex', gap: 8, background: '#f1f5f9', padding: 4, borderRadius: 8 }}>
            <button
              type="button"
              onClick={() => setActiveType('in')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: activeType === 'in' ? '#ffffff' : 'transparent',
                color: activeType === 'in' ? '#0284c7' : '#64748b',
                fontWeight: 700,
                fontSize: 12.5,
                cursor: 'pointer',
                boxShadow: activeType === 'in' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span>🌅 Ảnh Vào Ca</span>
              {data.checkIn && (
                <span style={{ fontSize: 11, background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: 10 }}>
                  {data.checkIn.slice(0, 5)}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveType('out')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: activeType === 'out' ? '#ffffff' : 'transparent',
                color: activeType === 'out' ? '#ea580c' : '#64748b',
                fontWeight: 700,
                fontSize: 12.5,
                cursor: 'pointer',
                boxShadow: activeType === 'out' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span>🌇 Ảnh Ra Ca</span>
              {data.checkOut && (
                <span style={{ fontSize: 11, background: '#ffedd5', color: '#c2410c', padding: '1px 6px', borderRadius: 10 }}>
                  {data.checkOut.slice(0, 5)}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Photo Container Frame with High Tech HUD */}
        <div
          style={{
            position: 'relative',
            background: '#020617',
            borderRadius: 14,
            overflow: 'hidden',
            border: '2px solid #38bdf8',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            minHeight: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {currentImg ? (
            <img
              src={currentImg}
              alt={data.name}
              style={{ width: '100%', maxHeight: 380, objectFit: 'contain' }}
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
                const parent = (e.currentTarget.parentElement as HTMLElement);
                const fallback = parent?.querySelector('.photo-error-fallback');
                if (fallback) (fallback as HTMLElement).style.display = 'flex';
              }}
            />
          ) : null}

          {/* Fallback khi không có ảnh hoặc ảnh hỏng */}
          <div
            className="photo-error-fallback"
            style={{
              display: currentImg ? 'none' : 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              color: '#94a3b8',
              padding: 40,
            }}
          >
            <Camera size={48} color="#38bdf8" />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
              Chưa có ảnh snapshot chụp từ Kiosk cho lần quét này
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Hệ thống sẽ tự động lưu ảnh tại thời điểm camera quét thành công
            </div>
          </div>

          {/* Watermark badge chỉ rõ nguồn ảnh */}
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              background: isRealSnapshot ? 'rgba(6, 78, 59, 0.9)' : 'rgba(2, 6, 23, 0.85)',
              backdropFilter: 'blur(6px)',
              border: `1px solid ${isRealSnapshot ? '#34d399' : '#38bdf8'}`,
              borderRadius: 8,
              padding: '5px 12px',
              color: isRealSnapshot ? '#6ee7b7' : '#38bdf8',
              fontSize: 11.5,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Camera size={13} />
            {isRealSnapshot ? '📸 Bằng chứng Snapshot Kiosk Camera AI (Đã lưu CSDL)' : '👤 Ảnh khuôn mặt hồ sơ đã đăng ký'}
          </div>

          {/* Timestamp HUD */}
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              right: 12,
              background: 'rgba(2, 6, 23, 0.85)',
              backdropFilter: 'blur(6px)',
              borderRadius: 8,
              padding: '8px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#ffffff',
              fontSize: 12,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div>
              <span style={{ color: '#94a3b8' }}>Ca quét: </span>
              <strong style={{ color: '#38bdf8' }}>{data.shiftName}</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Thời điểm {activeType === 'out' ? 'Ra' : 'Vào'}: </span>
              <strong style={{ color: '#4ade80' }}>{currentTime}</strong> ({formatDisplayDate(data.date)})
            </div>
          </div>
        </div>

        {/* Note box */}
        <div
          style={{
            fontSize: 12,
            color: '#475569',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '10px 14px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle2 size={16} color="#16a34a" />
          <span>
            Ảnh chụp chấm công được lưu trữ an toàn trong Database MySQL và thư mục máy chủ, đảm bảo tính minh bạch và chống điểm danh hộ 100%.
          </span>
        </div>
      </div>
    </Modal>
  );
}
