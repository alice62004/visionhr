import React, { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Pause,
  Play,
  UserPlus,
  CalendarCheck2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sunrise,
  Sunset,
} from 'lucide-react';
import { checkInWithFace } from '../../services/attendanceApi';
import Button from '../../components/Button/Button';
import { useAuthStore } from '../../store/authStore';
import { getCameraErrorMessage } from '../../utils/cameraUtils';

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
  shiftName?: string;
  avatar?: string | null;
}

export default function AttendanceTerminal() {
  const webcamRef = useRef<Webcam | null>(null);
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const canEnroll = role === 'admin' || role === 'hr';

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('vi-VN'));
  const [currentDate, setCurrentDate] = useState(
    new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  );

  const [shiftMode, setShiftMode] = useState<'auto' | 'morning_in' | 'morning_out' | 'afternoon_in' | 'afternoon_out'>('auto');
  const [actionType, setActionType] = useState<'auto' | 'check_in' | 'check_out'>('auto');
  const [message, setMessage] = useState('Đưa khuôn mặt vào khung quét để nhận diện chấm công');
  const [statusType, setStatusType] = useState<'normal' | 'scanning' | 'success' | 'error'>('normal');
  const [scanning, setScanning] = useState(false);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [frozenImage, setFrozenImage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);

  // Cập nhật đồng hồ thời gian thực
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Bắt lỗi camera từ react-webcam
  const onUserMediaError = useCallback((error: string | DOMException) => {
    console.error('react-webcam terminal error:', error);
    setMessage(getCameraErrorMessage(error));
    setStatusType('error');
  }, []);

  // Hàm xử lý gửi ảnh lên backend để so khớp
  const processImageForCheckIn = async (imageBase64: string) => {
    if (scanning || cooldown) return;
    setScanning(true);
    setStatusType('scanning');
    setMessage('Đang quét khuôn mặt & xác thực AI FaceNet + Liveness...');

    try {
      const result: ScanResult = await checkInWithFace({ imageBase64, actionType, shiftMode });
      setLastResult(result);
      
      if ((result as any).action === 'already_checked_in') {
        setStatusType('error');
        setMessage((result as any).message || 'Bạn vừa điểm danh rồi, vui lòng không quét lại liên tiếp!');
        setCooldown(true);
        setTimeout(() => {
          setCooldown(false);
          setStatusType('normal');
          setMessage('Đưa khuôn mặt vào khung quét để nhận diện chấm công');
        }, 2500);
      } else if ((result as any).action === 'already_completed') {
        setFrozenImage(imageBase64);
        setStatusType('success');
        setMessage((result as any).message || 'Hôm nay bạn đã hoàn thành điểm danh cả ngày.');
        setCooldown(true);
        setTimeout(() => {
          setCooldown(false);
          setFrozenImage(null);
          setLastResult(null);
          setStatusType('normal');
          setMessage('Đưa khuôn mặt vào khung quét để nhận diện chấm công');
        }, 3500);
      } else {
        // Đóng băng khung hình camera đúng khoảnh khắc chụp được
        setFrozenImage(imageBase64);
        setStatusType('success');
        setMessage(
          `Xác thực thành công! ${result.employeeName} (${result.employeeCode}) - ${
            result.action === 'check_out' ? 'Ghi nhận Giờ Ra' : 'Ghi nhận Giờ Vào'
          } ${result.shiftName ? `[${result.shiftName}]` : ''} lúc ${result.time}`
        );

        // Cooldown 3.5 giây hiển thị ảnh chụp đóng băng & thông báo hoàn thành rồi tự động mở lại camera cho người tiếp theo
        setCooldown(true);
        setTimeout(() => {
          setCooldown(false);
          setFrozenImage(null);
          setLastResult(null);
          setStatusType('normal');
          setMessage('Đưa khuôn mặt vào khung quét để nhận diện chấm công');
        }, 3500);
      }
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

  // Chụp từ react-webcam
  const captureFromVideo = () => {
    if (!webcamRef.current || scanning || cooldown) return;
    const screenshot = webcamRef.current.getScreenshot();
    if (screenshot) {
      processImageForCheckIn(screenshot);
    }
  };

  // Tự động quét theo chu kỳ 4 giây (nếu bật auto scan và không trong cooldown)
  useEffect(() => {
    if (!autoScanEnabled || cooldown || scanning) return;
    const interval = setInterval(() => {
      if (webcamRef.current) {
        captureFromVideo();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [autoScanEnabled, cooldown, scanning]);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
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
          {canEnroll && (
            <Button variant="secondary" onClick={() => navigate('/employees/face-enrollment')}>
              <UserPlus size={15} style={{ marginRight: 6 }} />
              Đăng ký khuôn mặt
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate('/attendance')}>
            <CalendarCheck2 size={15} style={{ marginRight: 6 }} />
            Bảng chấm công
          </Button>
        </div>
      </div>

      {/* Đồng hồ điện tử Kiosk */}
      <div
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #184a8c 0%, #0d284f 100%)',
          color: '#ffffff',
          borderRadius: 12,
          padding: '14px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 14px rgba(24, 74, 140, 0.25)',
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
            Thời gian hệ thống
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0', marginTop: 2 }}>{currentDate}</div>
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: 2, fontFamily: 'monospace', color: '#67e8f9' }}>
          {currentTime}
        </div>
      </div>

      {/* Bộ chọn chế độ ca làm việc quét riêng sáng / chiều */}
      <div
        style={{
          width: '100%',
          background: '#ffffff',
          borderRadius: 14,
          padding: '12px 16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
            🎯 Chế độ quét ca ({shiftMode === 'auto' ? '⚡ Tự động theo giờ thực tế' : shiftMode === 'morning_in' ? '🌅 Ca Sáng - Vào ca' : shiftMode === 'morning_out' ? '☀️ Ca Sáng - Kết thúc ca' : shiftMode === 'afternoon_in' ? '🌇 Ca Chiều - Vào ca' : '🌙 Ca Chiều - Ra về'})
          </span>
          <button
            type="button"
            onClick={() => setShiftMode('auto')}
            style={{
              border: 'none',
              background: shiftMode === 'auto' ? '#184a8c' : '#f1f5f9',
              color: shiftMode === 'auto' ? '#ffffff' : '#475569',
              padding: '4px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            ⚡ Chế độ Tự động
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {/* Ca Sáng */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#0369a1', fontWeight: 700, fontSize: 13 }}>
              <Sunrise size={16} />
              <span>Ca Sáng (08:00 - 12:00)</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => setShiftMode('morning_in')}
                style={{
                  flex: 1,
                  padding: '7px 8px',
                  borderRadius: 6,
                  border: shiftMode === 'morning_in' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: shiftMode === 'morning_in' ? '#0284c7' : '#ffffff',
                  color: shiftMode === 'morning_in' ? '#ffffff' : '#1e293b',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                🟢 Vào ca sáng
              </button>
              <button
                type="button"
                onClick={() => setShiftMode('morning_out')}
                style={{
                  flex: 1,
                  padding: '7px 8px',
                  borderRadius: 6,
                  border: shiftMode === 'morning_out' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                  background: shiftMode === 'morning_out' ? '#ea580c' : '#ffffff',
                  color: shiftMode === 'morning_out' ? '#ffffff' : '#1e293b',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                🟠 Ra ca sáng
              </button>
            </div>
          </div>

          {/* Ca Chiều */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#b45309', fontWeight: 700, fontSize: 13 }}>
              <Sunset size={16} />
              <span>Ca Chiều (13:30 - 17:30)</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => setShiftMode('afternoon_in')}
                style={{
                  flex: 1,
                  padding: '7px 8px',
                  borderRadius: 6,
                  border: shiftMode === 'afternoon_in' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                  background: shiftMode === 'afternoon_in' ? '#16a34a' : '#ffffff',
                  color: shiftMode === 'afternoon_in' ? '#ffffff' : '#1e293b',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                🟢 Vào ca chiều
              </button>
              <button
                type="button"
                onClick={() => setShiftMode('afternoon_out')}
                style={{
                  flex: 1,
                  padding: '7px 8px',
                  borderRadius: 6,
                  border: shiftMode === 'afternoon_out' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                  background: shiftMode === 'afternoon_out' ? '#dc2626' : '#ffffff',
                  color: shiftMode === 'afternoon_out' ? '#ffffff' : '#1e293b',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                🔴 Ra về chiều
              </button>
            </div>
          </div>
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
              : '#184a8c'
          }`,
          transition: 'border-color 0.3s ease',
        }}
      >
        {/* Nếu đã điểm danh thành công, đóng băng hiển thị nguyên ảnh chụp snapshot đó */}
        {frozenImage ? (
          <img
            src={frozenImage}
            alt="Snapshot điểm danh"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user',
            }}
            onUserMediaError={onUserMediaError}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            mirrored={true}
          />
        )}

        {/* Huy hiệu "ĐÃ HOÀN THÀNH ĐIỂM DANH" khi ảnh đang đóng băng */}
        {frozenImage && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              background: 'rgba(21, 128, 61, 0.92)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
              border: '1.5px solid #86efac',
              zIndex: 10,
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <CheckCircle2 size={16} color="#86efac" />
            <span>✓ ĐÃ HOÀN THÀNH ĐIỂM DANH</span>
          </div>
        )}

        {/* Khung ngắm HUD công nghệ cao (ẩn khi đã đóng băng thành công) */}
        {!frozenImage && (
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
        )}

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
                <CheckCircle2 size={36} color="#16a34a" />
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
                ✓ {lastResult.action === 'check_out' ? 'Ghi nhận GIỜ RA' : 'Ghi nhận GIỜ VÀO'} {lastResult.shiftName ? `(${lastResult.shiftName})` : ''}:{' '}
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {statusType === 'scanning' && <Loader2 size={18} className="spin-animation" />}
        {statusType === 'success' && <CheckCircle2 size={18} />}
        {statusType === 'error' && <AlertCircle size={18} />}
        <span>{message}</span>
      </div>

      {/* Các nút bấm điều khiển */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button onClick={captureFromVideo} disabled={scanning || cooldown}>
          <Camera size={16} style={{ marginRight: 6 }} />
          {scanning ? 'Đang quét...' : 'Quét chấm công ngay'}
        </Button>

        <Button
          variant="secondary"
          onClick={() => setAutoScanEnabled(!autoScanEnabled)}
        >
          {autoScanEnabled ? (
            <>
              <Pause size={15} style={{ marginRight: 6 }} /> Tạm dừng tự động
            </>
          ) : (
            <>
              <Play size={15} style={{ marginRight: 6 }} /> Bật tự động quét (4s)
            </>
          )}
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
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
