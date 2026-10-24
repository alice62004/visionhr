import React, { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Camera,
  Upload,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  Info,
  ExternalLink,
  Users,
  ShieldCheck,
} from 'lucide-react';
import Button from '../../components/Button/Button';
import { getEmployees, getEmployeeById, getMyProfile, enrollFace } from '../../services/employeeApi';
import { useAuthStore } from '../../store/authStore';
import { Employee } from '../../types';
import { getCameraErrorMessage } from '../../utils/cameraUtils';

export default function FaceEnrollment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isEmployee = user?.role === 'employee';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedId, setSelectedId] = useState<string>(id || (isEmployee && user?.employeeId ? String(user.employeeId) : ''));
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const webcamRef = useRef<Webcam | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [useFallbackConstraint, setUseFallbackConstraint] = useState(false);

  // Load thông tin hồ sơ
  useEffect(() => {
    if (isEmployee) {
      // Nhân viên chỉ được xem & cập nhật hồ sơ của chính mình
      getMyProfile()
        .then((emp) => {
          setSelectedEmployee(emp);
          setSelectedId(String(emp.id));
        })
        .catch((err) => {
          console.error('[FaceEnrollment] getMyProfile error:', err);
        });
    } else {
      // Admin / HR / Manager có quyền chọn nhân viên bất kỳ
      getEmployees()
        .then((data) => {
          setEmployees(data);
          if (!selectedId && data.length > 0) {
            setSelectedId(String(data[0].id));
          }
        })
        .catch(() => {});
    }
  }, [isEmployee]);

  // Khi admin/manager thay đổi nhân viên trong dropdown
  useEffect(() => {
    if (!isEmployee && selectedId) {
      getEmployeeById(selectedId)
        .then((emp) => setSelectedEmployee(emp))
        .catch(() => setSelectedEmployee(null));
      setCapturedImage(null);
      setStatusMsg(null);
      setIsCameraActive(false);
    }
  }, [selectedId, isEmployee]);

  // Bắt lỗi camera từ react-webcam với phân loại cụ thể
  const onUserMediaError = useCallback(
    (error: string | DOMException) => {
      const errName = typeof error === 'object' && error.name ? error.name : String(error);

      if (errName === 'OverconstrainedError' && !useFallbackConstraint) {
        setUseFallbackConstraint(true);
        setStatusMsg({ text: 'Đang thử mở lại camera với cấu hình cơ bản...', type: 'info' });
        return;
      }

      setStatusMsg({ text: getCameraErrorMessage(error), type: 'error' });
      setIsCameraActive(false);
    },
    [useFallbackConstraint]
  );

  // Bật camera
  const startCamera = () => {
    setStatusMsg({ text: 'Đang kết nối camera webcam...', type: 'info' });
    setCapturedImage(null);
    setIsCameraActive(true);
  };

  // Tắt camera
  const stopCamera = () => {
    setIsCameraActive(false);
  };

  // Chụp ảnh qua react-webcam (1 dòng lệnh duy nhất)
  const handleCapture = useCallback(() => {
    if (!webcamRef.current) return;
    const screenshot = webcamRef.current.getScreenshot();
    if (screenshot) {
      setCapturedImage(screenshot);
      setIsCameraActive(false);
      setStatusMsg({ text: 'Đã chụp ảnh thành công! Bấm "Xác nhận & Lưu khuôn mặt" để hoàn tất.', type: 'info' });
    } else {
      setStatusMsg({ text: 'Chưa lấy được hình ảnh từ camera. Vui lòng thử lại.', type: 'error' });
    }
  }, [webcamRef]);

  // Tải ảnh từ máy tính (Upload file)
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
      setIsCameraActive(false);
      setStatusMsg({ text: 'Đã tải ảnh lên thành công. Bấm "Xác nhận & Lưu khuôn mặt" để hoàn tất.', type: 'info' });
    };
    reader.readAsDataURL(file);
  };

  // Gửi API lưu khuôn mặt
  const handleSaveFace = async () => {
    const empId = isEmployee ? (user?.employeeId || selectedEmployee?.id) : selectedId;
    if (!empId) {
      alert(isEmployee ? 'Không tìm thấy thông tin hồ sơ nhân viên của bạn.' : 'Vui lòng chọn nhân viên cần đăng ký khuôn mặt.');
      return;
    }
    if (!capturedImage) {
      alert('Vui lòng chụp ảnh hoặc tải ảnh khuôn mặt lên trước.');
      return;
    }

    setSaving(true);
    setStatusMsg({ text: 'Đang xử lý mô hình AI trích xuất vector khuôn mặt và kiểm tra chống giả mạo...', type: 'info' });

    try {
      const res = await enrollFace({
        employeeId: Number(empId),
        imageBase64: capturedImage,
      });

      setStatusMsg({
        text: res.message || 'Đăng ký khuôn mặt thành công!',
        type: 'success',
      });

      // Reload lại thông tin nhân viên
      if (isEmployee) {
        getMyProfile().then(setSelectedEmployee);
      } else {
        getEmployeeById(selectedId).then(setSelectedEmployee);
        getEmployees().then(setEmployees);
      }
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

  const videoConstraints = useFallbackConstraint
    ? true
    : {
        width: 640,
        height: 480,
        facingMode: 'user',
      };

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
          {!isEmployee && (
            <Button variant="secondary" onClick={() => navigate('/employees')}>
              Danh sách nhân viên
            </Button>
          )}
          <Button onClick={() => navigate('/attendance/terminal')}>
            Mở Terminal chấm công
          </Button>
        </div>
      </div>

      {/* Card chọn & xem thông tin nhân viên */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        {isEmployee ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {existingFaceImage ? (
                <img
                  src={existingFaceImage}
                  alt={selectedEmployee?.name || user?.name}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #10b981',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                  }}
                >
                  <Users size={28} />
                </div>
              )}
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {selectedEmployee?.name || user?.employeeName || user?.name}
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: 6, border: '1px solid #bfdbfe' }}>
                    {selectedEmployee?.code || user?.employeeCode || 'NV'}
                  </span>
                </div>
                <div style={{ color: '#475569', fontSize: 13, marginTop: 4 }}>
                  {selectedEmployee?.position || user?.employeePosition || 'Nhân viên'} · {selectedEmployee?.department || user?.departmentName || 'Toàn công ty'}
                </div>
                <div style={{ marginTop: 6 }}>
                  {existingFaceImage ? (
                    <span style={{ color: '#16a34a', fontWeight: 600, fontSize: 12, background: '#f0fdf4', padding: '3px 8px', borderRadius: 4, border: '1px solid #bbf7d0' }}>
                      ✓ Đã có dữ liệu khuôn mặt (Chụp hoặc tải ảnh mới để cập nhật)
                    </span>
                  ) : (
                    <span style={{ color: '#d97706', fontWeight: 600, fontSize: 12, background: '#fffbeb', padding: '3px 8px', borderRadius: 4, border: '1px solid #fde68a' }}>
                      ⚠ Chưa đăng ký khuôn mặt
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <ShieldCheck size={20} color="#3b82f6" />
              <div style={{ fontSize: 12, color: '#475569' }}>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>Hồ sơ cá nhân</div>
                Dữ liệu khuôn mặt dùng trực tiếp tại Kiosk chấm công
              </div>
            </div>
          </div>
        ) : (
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
                  padding: '12px 14px',
                  background: '#f8fafc',
                  borderRadius: 10,
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
                      border: '2.5px solid #10b981',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
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
                      color: '#64748b',
                    }}
                  >
                    <Users size={24} />
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
        )}
      </div>

      {/* Khu vực Camera react-webcam */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
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
            borderRadius: 14,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
          }}
        >
          {/* Webcam stream khi bật */}
          {isCameraActive && !capturedImage && (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.92}
              videoConstraints={videoConstraints}
              mirrored={true}
              onUserMedia={() => {
                setStatusMsg({
                  text: 'Camera đã bật thành công. Hãy căn khuôn mặt vào khung oval và bấm Chụp.',
                  type: 'info',
                });
              }}
              onUserMediaError={onUserMediaError}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )}

          {/* Ảnh đã chụp / tải lên */}
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Ảnh chân dung"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}

          {/* Khung căn chỉnh khuôn mặt oval */}
          {isCameraActive && !capturedImage && (
            <div
              style={{
                position: 'absolute',
                width: 210,
                height: 280,
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
                  background: 'rgba(0, 0, 0, 0.65)',
                  color: '#ffffff',
                  fontSize: 11,
                  padding: '3px 10px',
                  borderRadius: 4,
                  fontWeight: 600,
                }}
              >
                Giữ khuôn mặt trong khung
              </span>
            </div>
          )}

          {/* Placeholder khi camera tắt */}
          {!isCameraActive && !capturedImage && (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>
              <div
                style={{
                  display: 'inline-flex',
                  padding: 14,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  marginBottom: 12,
                }}
              >
                <Camera size={38} color="#94a3b8" />
              </div>
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
          {!capturedImage && !isCameraActive && (
            <Button onClick={startCamera}>
              <Camera size={15} />
              <span>Bật Camera Chụp</span>
            </Button>
          )}

          {isCameraActive && (
            <>
              <Button onClick={handleCapture}>
                <Camera size={15} />
                <span>Chụp Ảnh Ngay</span>
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
                <RefreshCw size={15} />
                <span>Chụp lại</span>
              </Button>
              <Button onClick={handleSaveFace} disabled={saving}>
                <Save size={15} />
                <span>{saving ? 'Đang lưu...' : 'Xác nhận & Lưu khuôn mặt'}</span>
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
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={15} />
            <span>Tải ảnh từ máy tính</span>
          </Button>
        </div>

        {/* Thông báo trạng thái */}
        {statusMsg && (
          <div
            style={{
              marginTop: 18,
              padding: '12px 18px',
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 500,
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
                  ? '#166534'
                  : statusMsg.type === 'error'
                  ? '#991b1b'
                  : '#1e40af',
              border: `1px solid ${
                statusMsg.type === 'success'
                  ? '#bbf7d0'
                  : statusMsg.type === 'error'
                  ? '#fecaca'
                  : '#bfdbfe'
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {statusMsg.type === 'success' && <CheckCircle2 size={16} />}
            {statusMsg.type === 'error' && <AlertCircle size={16} />}
            {statusMsg.type === 'info' && <Info size={16} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {statusMsg?.type === 'success' && (
          <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={() => navigate(`/employees/${selectedId}`)}>
              Xem hồ sơ nhân viên
            </Button>
            <Button onClick={() => navigate('/attendance/terminal')}>
              <ExternalLink size={14} />
              <span>Đến Terminal thử quét mặt</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
