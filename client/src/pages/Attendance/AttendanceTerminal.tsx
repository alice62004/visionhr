import React, { useEffect, useRef, useState } from 'react';
import { checkInWithFace } from '../../services/attendanceApi';
import Button from '../../components/Button/Button';
import { useNavigate } from 'react-router-dom';

interface ScanResult {
  attendanceId: number;
  action: 'check_in' | 'check_out';
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  department: string;
  time: string;
  status: 'dung_gio' | 'di_muon' | 'vang_mat';
  statusLabel: string;
  avatar?: string | null;
}

export default function AttendanceTerminal() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('vi-VN'));
  const [currentDate, setCurrentDate] = useState(
    new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  );

  const [message, setMessage] = useState('Đưa khuôn mặt vào khung quét để nhận diện chấm công');
  const [statusType, setStatusType] = useState<'normal' | 'scanning' | 'success' | 'error'>('normal');
  const [scanning, setScanning] = useState(false);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [cooldown, setCooldown] = useState(false);

  // Cập nhật đồng hồ thời gian thực
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mở webcam
  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (e) {
            console.warn('AttendanceTerminal video play warning:', e);
          }
        }
      } catch {
        setMessage('Không thể mở camera. Bạn có thể sử dụng nút "Tải ảnh quét thử" bên dưới.');
        setStatusType('error');
      }
    })();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Hàm xử lý gửi ảnh lên backend để so khớp
  const processImageForCheckIn = async (imageBase64: string) => {
    if (scanning || cooldown) return;
    setScanning(true);
    setStatusType('scanning');
    setMessage('Đang quét khuôn mặt & xác thực AI Liveness...');

    try {
      const result: ScanResult = await checkInWithFace({ imageBase64 });
      setLastResult(result);
      setStatusType('success');
      setMessage(
        `Xác thực thành công! ${result.employeeName} (${result.employeeCode}) - ${
          result.action === 'check_out' ? 'Ghi nhận Giờ Ra' : 'Ghi nhận Giờ Vào'
        } lúc ${result.time}`
      );

      // Cooldown 5 giây sau khi chấm công thành công để tránh quét liên tiếp 1 người
      setCooldown(true);
      setTimeout(() => {
        setCooldown(false);
        setLastResult(null);
        setStatusType('normal');
        setMessage('Đưa khuôn mặt vào khung quét để nhận diện chấm công');
      }, 5000);
    } catch (err: any) {
      setStatusType('error');
      setMessage(err?.response?.data?.message || 'Không nhận diện được khuôn mặt hoặc chưa đăng ký.');
      // Cooldown nhẹ 2.5s khi lỗi
      setCooldown(true);
      setTimeout(() => {
        setCooldown(false);
        setStatusType('normal');
        setMessage('Đưa khuôn mặt vào khung quét để nhận diện chấm công');
      }, 2500);
    } finally {
      setScanning(false);
    }
  };

  // Chụp từ video stream
  const captureFromVideo = () => {
    if (!videoRef.current || scanning || cooldown) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.9);
    processImageForCheckIn(imageBase64);
  };

  // Tự động quét theo chu kỳ 4 giây (nếu bật auto scan và không trong cooldown)
  useEffect(() => {
    if (!autoScanEnabled || cooldown || scanning) return;
    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.srcObject) {
        captureFromVideo();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [autoScanEnabled, cooldown, scanning]);

  // Xử lý upload ảnh quét thử
  const handleUploadTest = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      processImageForCheckIn(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Header Kiosk */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Vision AI Attendance Terminal
          </h1>
          <p style={{ margin: '2px 0 0 0', fontSize: 13, color: '#64748b' }}>
            Hệ thống nhận diện khuôn mặt tự động & kiểm tra Liveness
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={() => navigate('/employees/face-enrollment')}>
            + Đăng ký khuôn mặt
          </Button>
          <Button variant="secondary" onClick={() => navigate('/attendance')}>
            Bảng chấm công
          </Button>
        </div>
      </div>

      {/* Đồng hồ điện tử Kiosk */}
      <div
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          borderRadius: 12,
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
            Thời gian hệ thống
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#cbd5e1' }}>{currentDate}</div>
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 2, fontFamily: 'monospace', color: '#38bdf8' }}>
          {currentTime}
        </div>
      </div>

      {/* Màn hình Camera & Scanning Frame */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 420,
          background: '#020617',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          border: `2px solid ${
            statusType === 'success'
              ? '#22c55e'
              : statusType === 'error'
              ? '#ef4444'
              : statusType === 'scanning'
              ? '#38bdf8'
              : '#2563eb'
          }`,
          transition: 'border-color 0.3s ease',
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* Khung ngắm HUD công nghệ cao */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 260,
            height: 310,
            border: `2px solid ${statusType === 'success' ? '#22c55e' : '#38bdf8'}`,
            borderRadius: 24,
            pointerEvents: 'none',
            boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.4)',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Góc định vị */}
          <div style={{ position: 'absolute', top: -2, left: -2, width: 24, height: 24, borderTop: '4px solid #38bdf8', borderLeft: '4px solid #38bdf8', borderTopLeftRadius: 18 }} />
          <div style={{ position: 'absolute', top: -2, right: -2, width: 24, height: 24, borderTop: '4px solid #38bdf8', borderRight: '4px solid #38bdf8', borderTopRightRadius: 18 }} />
          <div style={{ position: 'absolute', bottom: -2, left: -2, width: 24, height: 24, borderBottom: '4px solid #38bdf8', borderLeft: '4px solid #38bdf8', borderBottomLeftRadius: 18 }} />
          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderBottom: '4px solid #38bdf8', borderRight: '4px solid #38bdf8', borderBottomRightRadius: 18 }} />

          {/* Tia quét laser khi đang xác thực */}
          {statusType === 'scanning' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)',
                boxShadow: '0 0 10px #38bdf8',
                animation: 'scan 1.5s infinite linear',
              }}
            />
          )}
        </div>

        {/* Popup Thẻ nhân viên khi nhận diện thành công */}
        {lastResult && (
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              right: 16,
              background: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(8px)',
              borderRadius: 14,
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
              border: '2px solid #22c55e',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            {lastResult.avatar ? (
              <img
                src={lastResult.avatar}
                alt={lastResult.employeeName}
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #22c55e',
                }}
              />
            ) : (
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                }}
              >
                ✓
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                  {lastResult.employeeName}
                </span>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    background: lastResult.status === 'dung_gio' ? '#dcfce7' : '#fef3c7',
                    color: lastResult.status === 'dung_gio' ? '#15803d' : '#b45309',
                  }}
                >
                  {lastResult.statusLabel}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
                Mã NV: <strong>{lastResult.employeeCode}</strong> · {lastResult.department}
              </div>
              <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginTop: 4 }}>
                ✓ {lastResult.action === 'check_out' ? 'Ghi nhận GIỜ RA' : 'Ghi nhận GIỜ VÀO'}:{' '}
                {lastResult.time}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Thông báo trạng thái dưới camera */}
      <div
        style={{
          width: '100%',
          textAlign: 'center',
          background:
            statusType === 'success'
              ? '#f0fdf4'
              : statusType === 'error'
              ? '#fef2f2'
              : statusType === 'scanning'
              ? '#f0f9ff'
              : '#ffffff',
          border: `1px solid ${
            statusType === 'success'
              ? '#bbf7d0'
              : statusType === 'error'
              ? '#fecaca'
              : statusType === 'scanning'
              ? '#bae6fd'
              : '#e2e8f0'
          }`,
          borderRadius: 10,
          padding: 14,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          fontWeight: 600,
          fontSize: 14,
          color:
            statusType === 'success'
              ? '#15803d'
              : statusType === 'error'
              ? '#dc2626'
              : statusType === 'scanning'
              ? '#0284c7'
              : '#1e293b',
        }}
      >
        {message}
      </div>

      {/* Các nút bấm điều khiển */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button onClick={captureFromVideo} disabled={scanning || cooldown}>
          {scanning ? 'Đang quét...' : '📸 Quét chấm công ngay'}
        </Button>

        <Button
          variant="secondary"
          onClick={() => setAutoScanEnabled(!autoScanEnabled)}
        >
          {autoScanEnabled ? '⏸ Tạm dừng tự động' : '▶ Bật tự động quét (4s)'}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleUploadTest}
        />
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={scanning || cooldown}
        >
          📁 Tải ảnh quét thử
        </Button>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
