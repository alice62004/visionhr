import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button';
import { getEmployees, getEmployeeById, enrollFace } from '../../services/employeeApi';
import { Employee } from '../../types';

export default function FaceEnrollment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedId, setSelectedId] = useState<string>(id || '');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [streaming, setStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const streamRef = useRef<MediaStream | null>(null);

  // Load danh sách nhân viên để chọn nếu cần
  useEffect(() => {
    getEmployees()
      .then((data) => {
        setEmployees(data);
        if (!selectedId && data.length > 0) {
          setSelectedId(String(data[0].id));
        }
      })
      .catch(() => {});
  }, []);

  // Load thông tin nhân viên được chọn
  useEffect(() => {
    if (selectedId) {
      getEmployeeById(selectedId)
        .then((emp) => setSelectedEmployee(emp))
        .catch(() => setSelectedEmployee(null));
      // Reset ảnh đã chụp khi đổi nhân viên
      setCapturedImage(null);
      setStatusMsg(null);
    }
  }, [selectedId]);

  // Quản lý webcam
  const startCamera = async () => {
    try {
      setStatusMsg({ text: 'Đang mở camera...', type: 'info' });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play warning:', playErr);
        }
      }
      setStreaming(true);
      setCapturedImage(null);
      setStatusMsg({ text: 'Camera đã bật. Hãy căn khuôn mặt vào khung oval màu xanh.', type: 'info' });
    } catch (err: any) {
      console.error('Camera error:', err);
      setStatusMsg({
        text: 'Không thể mở camera. Vui lòng cấp quyền truy cập webcam trên trình duyệt hoặc kiểm tra thiết bị.',
        type: 'error',
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Chụp ảnh từ camera
  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      const imgBase64 = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedImage(imgBase64);
      stopCamera();
      setStatusMsg({ text: 'Đã chụp ảnh thành công! Bấm "Xác nhận & Lưu khuôn mặt" để hoàn tất.', type: 'info' });
    }
  };

  // Tải ảnh từ máy tính (Upload)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (JPG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCapturedImage(result);
      stopCamera();
      setStatusMsg({ text: 'Đã tải ảnh lên thành công. Bấm "Xác nhận & Lưu khuôn mặt" để hoàn tất.', type: 'info' });
    };
    reader.readAsDataURL(file);
  };

  // Gửi API lưu khuôn mặt
  const handleSaveFace = async () => {
    if (!selectedId) {
      alert('Vui lòng chọn nhân viên cần đăng ký khuôn mặt.');
      return;
    }
    if (!capturedImage) {
      alert('Vui lòng chụp ảnh hoặc tải ảnh khuôn mặt lên trước.');
      return;
    }

    setSaving(true);
    setStatusMsg({ text: 'Đang kiểm tra AI và lưu dữ liệu khuôn mặt...', type: 'info' });

    try {
      const res = await enrollFace({
        employeeId: Number(selectedId),
        imageBase64: capturedImage,
      });

      setStatusMsg({
        text: res.message || 'Đăng ký khuôn mặt thành công!',
        type: 'success',
      });

      // Reload lại thông tin nhân viên và danh sách
      getEmployeeById(selectedId).then(setSelectedEmployee);
      getEmployees().then(setEmployees);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Lỗi khi lưu khuôn mặt, vui lòng thử lại.';
      setStatusMsg({
        text: errorMsg,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Trích xuất ảnh khuôn mặt cũ nếu có
  let existingFaceImage: string | null = null;
  const rawFace = selectedEmployee?.faceData || (selectedEmployee as any)?.face_data;
  if (rawFace) {
    if (typeof rawFace === 'object') {
      existingFaceImage = rawFace.image || null;
    } else if (typeof rawFace === 'string') {
      try {
        existingFaceImage = JSON.parse(rawFace).image || null;
      } catch {}
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px 0', color: '#111827' }}>
            Đăng ký khuôn mặt nhân viên
          </h1>
          <p style={{ color: '#6b7280', margin: 0, fontSize: 14 }}>
            Thu thập và cập nhật dữ liệu khuôn mặt dùng cho Kiosk chấm công Vision AI
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={() => navigate('/employees')}>
            Danh sách nhân viên
          </Button>
          <Button onClick={() => navigate('/attendance/terminal')}>
            Mở Terminal chấm công
          </Button>
        </div>
      </div>

      {/* Card chọn & xem thông tin nhân viên */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          padding: 20,
          marginBottom: 20,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
          <div style={{ flex: '1 1 280px' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Chọn nhân viên đăng ký *
            </label>
            <select
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                background: '#ffffff',
              }}
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.code} - {emp.name} ({emp.department || 'Chưa phân phòng'}) {emp.hasFace ? '✓ [Đã có mặt]' : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedEmployee && (
            <div
              style={{
                flex: '2 1 340px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '10px 14px',
                background: '#f8fafc',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
              }}
            >
              {existingFaceImage ? (
                <img
                  src={existingFaceImage}
                  alt={selectedEmployee.name}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #16a34a',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                  }}
                >
                  👤
                </div>
              )}
              <div style={{ fontSize: 13 }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>
                  {selectedEmployee.name}{' '}
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>({selectedEmployee.code})</span>
                </div>
                <div style={{ color: '#475569' }}>
                  {selectedEmployee.position || 'Chưa cập nhật'} · {selectedEmployee.department || 'Toàn công ty'}
                </div>
                <div style={{ marginTop: 4 }}>
                  {existingFaceImage ? (
                    <span style={{ color: '#16a34a', fontWeight: 600, fontSize: 12 }}>
                      ✓ Đã có dữ liệu khuôn mặt (Có thể chụp lại để cập nhật)
                    </span>
                  ) : (
                    <span style={{ color: '#d97706', fontWeight: 600, fontSize: 12 }}>
                      ⚠ Chưa đăng ký khuôn mặt
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Khu vực chụp ảnh / Tải ảnh */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          padding: 24,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Khung hiển thị Camera / Ảnh chụp */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 480,
            height: 360,
            background: '#0f172a',
            borderRadius: 12,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {/* Luôn giữ thẻ video trong DOM để srcObject không bị mất */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: streaming && !capturedImage ? 'block' : 'none',
            }}
          />

          {/* Nếu có ảnh đã chụp / đã tải lên */}
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}

          {/* Khung hướng dẫn oval khi đang bật camera */}
          {streaming && !capturedImage && (
            <div
              style={{
                position: 'absolute',
                width: 220,
                height: 290,
                border: '2.5px dashed #38bdf8',
                borderRadius: '50%',
                pointerEvents: 'none',
                boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  bottom: 12,
                  background: 'rgba(0,0,0,0.6)',
                  color: '#ffffff',
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                Giữ khuôn mặt trong khung
              </span>
            </div>
          )}

          {/* Trạng thái khi tắt camera và chưa có ảnh */}
          {!streaming && !capturedImage && (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
              <p style={{ margin: '0 0 6px 0', fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>
                Camera hiện đang tắt
              </p>
              <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
                Bật camera để chụp ảnh trực tiếp hoặc tải ảnh chân dung từ máy tính
              </p>
            </div>
          )}
        </div>

        {/* Thanh công cụ thao tác */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            justifyContent: 'center',
            marginTop: 20,
          }}
        >
          {!capturedImage && !streaming && (
            <Button onClick={startCamera}>
              📷 Bật Camera Chụp
            </Button>
          )}

          {streaming && (
            <>
              <Button onClick={handleCapture}>
                📸 Chụp Ảnh Ngay
              </Button>
              <Button variant="secondary" onClick={stopCamera}>
                Tắt Camera
              </Button>
            </>
          )}

          {capturedImage && (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setCapturedImage(null);
                  startCamera();
                }}
              >
                🔄 Chụp lại
              </Button>
              <Button onClick={handleSaveFace} disabled={saving}>
                {saving ? 'Đang lưu...' : '💾 Xác nhận & Lưu khuôn mặt'}
              </Button>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            📁 Tải ảnh từ máy tính
          </Button>
        </div>

        {/* Thông báo trạng thái */}
        {statusMsg && (
          <div
            style={{
              marginTop: 18,
              padding: '12px 18px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textAlign: 'center',
              width: '100%',
              maxWidth: 480,
              background:
                statusMsg.type === 'success'
                  ? '#f0fdf4'
                  : statusMsg.type === 'error'
                  ? '#fef2f2'
                  : '#eff6ff',
              color:
                statusMsg.type === 'success'
                  ? '#16a34a'
                  : statusMsg.type === 'error'
                  ? '#dc2626'
                  : '#2563eb',
              border: `1px solid ${
                statusMsg.type === 'success'
                  ? '#bbf7d0'
                  : statusMsg.type === 'error'
                  ? '#fecaca'
                  : '#bfdbfe'
              }`,
            }}
          >
            {statusMsg.text}
          </div>
        )}

        {statusMsg?.type === 'success' && (
          <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={() => navigate(`/employees/${selectedId}`)}>
              Xem hồ sơ nhân viên
            </Button>
            <Button onClick={() => navigate('/attendance/terminal')}>
              👉 Đến Terminal thử quét mặt
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
