import React from 'react';
import { Briefcase, Camera, CheckCircle2 } from 'lucide-react';

interface WorkHistoryTimelineProps {
  employee: {
    joinDate?: string;
    position?: string;
    department?: string;
    hasFace?: boolean | number;
  };
  attendanceCount: number;
}

export default function WorkHistoryTimeline({ employee, attendanceCount }: WorkHistoryTimelineProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 14,
        border: '1px solid #e2e8f0',
        padding: 28,
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
      }}
    >
      <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 700, color: '#184a8c' }}>
        Dòng thời gian sự nghiệp tại VisionHR
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingLeft: 12 }}>
        {/* Milestone 1: Gia nhập */}
        <div style={{ display: 'flex', gap: 16, position: 'relative' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: '#dbeafe',
              color: '#184a8c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Briefcase size={18} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              Chính thức gia nhập công ty
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Ngày: <strong>{employee.joinDate || 'Khi bắt đầu'}</strong>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: 13, color: '#334155' }}>
              Bắt đầu làm việc với chức danh <strong>{employee.position || 'Nhân viên'}</strong> tại bộ
              phận <strong>{employee.department || 'Văn phòng'}</strong>.
            </p>
          </div>
        </div>

        {/* Milestone 2: Đăng ký khuôn mặt AI */}
        <div style={{ display: 'flex', gap: 16 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: employee.hasFace ? '#dcfce7' : '#fef3c7',
              color: employee.hasFace ? '#15803d' : '#b45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Camera size={18} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              Kích hoạt nhận diện khuôn mặt Vision AI
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Trạng thái:{' '}
              <strong>
                {employee.hasFace ? 'Đã kích hoạt thành công' : 'Chưa đăng ký khuôn mặt'}
              </strong>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: 13, color: '#334155' }}>
              {employee.hasFace
                ? 'Hồ sơ vector 128 chiều đã được nạp vào hệ thống để tự động nhận diện chấm công tại Kiosk.'
                : 'Nhân viên cần chụp ảnh đăng ký khuôn mặt để kích hoạt tính năng tự động ghi nhận giờ vào/ra.'}
            </p>
          </div>
        </div>

        {/* Milestone 3: Hiện tại */}
        <div style={{ display: 'flex', gap: 16 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: '#f1f5f9',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              Hiện trạng công tác
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Đang hoạt động trên hệ thống VisionHR
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: 13, color: '#334155' }}>
              Tổng số buổi chấm công đã ghi nhận: <strong>{attendanceCount} buổi</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
