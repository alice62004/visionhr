import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  GraduationCap,
  Briefcase,
  Calendar,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  KeyRound,
  Camera,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowLeft,
  Edit,
  FileText,
  Download,
} from 'lucide-react';
import { getEmployeeById } from '../../services/employeeApi';
import Button from '../../components/Button/Button';
import OnboardingEmailModal from '../../components/OnboardingEmailModal/OnboardingEmailModal';
import { Employee } from '../../types';

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    if (id) {
      getEmployeeById(id)
        .then(setEmployee)
        .catch(() => setEmployee(null));
    }
  }, [id]);

  if (!employee) return <p style={{ padding: 20 }}>Đang tải hồ sơ nhân viên...</p>;

  const isWorking = employee.status === 'dang_lam_viec';

  let faceImage: string | null = null;
  const rawFace = employee.faceData || (employee as any).face_data;
  if (rawFace) {
    if (typeof rawFace === 'object') {
      faceImage = rawFace.image || null;
    } else if (typeof rawFace === 'string') {
      try {
        faceImage = JSON.parse(rawFace).image || null;
      } catch {}
    }
  }

  const hasFace = Boolean(employee.hasFace || faceImage);

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="secondary" onClick={() => navigate('/employees')}>
          <ArrowLeft size={16} style={{ marginRight: 6 }} /> Quay lại danh sách
        </Button>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" onClick={() => setShowEmailModal(true)}>
            <Eye size={15} style={{ marginRight: 6 }} /> Xem Email cấp tài khoản
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/employees/${employee.id}/edit`)}>
            <Edit size={15} style={{ marginRight: 6 }} /> Chỉnh sửa hồ sơ
          </Button>
          <Button onClick={() => navigate(`/employees/${employee.id}/face-enrollment`)}>
            <Camera size={15} style={{ marginRight: 6 }} />
            {hasFace ? 'Cập nhật khuôn mặt' : 'Đăng ký khuôn mặt'}
          </Button>
        </div>
      </div>

      {/* Header Profile Banner */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          padding: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {faceImage ? (
            <img
              src={faceImage}
              alt={employee.name}
              style={{
                width: 84,
                height: 84,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #184a8c',
                boxShadow: '0 4px 12px rgba(24, 74, 140, 0.25)',
              }}
            />
          ) : (
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: '50%',
                background: '#f1f5f9',
                border: '2px dashed #94a3b8',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                fontSize: 11,
                textAlign: 'center',
              }}
            >
              <Camera size={24} style={{ marginBottom: 4 }} />
              Chưa có mặt
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#0f172a' }}>
                {employee.name}
              </h1>
              <span
                style={{
                  color: isWorking ? '#15803d' : '#dc2626',
                  background: isWorking ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${isWorking ? '#bbf7d0' : '#fecaca'}`,
                  padding: '3px 10px',
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {isWorking ? 'Đang làm việc' : 'Đã nghỉ việc'}
              </span>
            </div>

            <div style={{ color: '#475569', fontSize: 14, marginTop: 4 }}>
              Mã NV: <strong style={{ color: '#184a8c' }}>{employee.code}</strong> ·{' '}
              {employee.position || 'Chưa cập nhật chức vụ'} ·{' '}
              <strong>{employee.department || 'Chưa phân phòng ban'}</strong>
            </div>

            <div style={{ marginTop: 8 }}>
              {hasFace ? (
                <span
                  style={{
                    color: '#15803d',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    padding: '3px 10px',
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <CheckCircle2 size={14} /> Đã đăng ký Vision AI Face (Chấm công Kiosk hợp lệ)
                </span>
              ) : (
                <span
                  style={{
                    color: '#b45309',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    padding: '3px 10px',
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <AlertCircle size={14} /> Chưa có dữ liệu khuôn mặt AI
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Profile Detail Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Card 1: Vị trí công tác & Học vấn */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            padding: 20,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#184a8c',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <GraduationCap size={18} />
            <span>HỌC VẤN & CÔNG TÁC</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#334155' }}>
            <div>
              <span style={{ color: '#64748b' }}>Trình độ / Bằng cấp: </span>
              <strong>{employee.education || 'Đại học'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Chuyên ngành đào tạo: </span>
              <strong>{employee.major || 'Chưa cập nhật'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Phòng ban trực thuộc: </span>
              <strong>{employee.department || 'Chưa có'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Vị trí chức vụ: </span>
              <strong>{employee.position || 'Nhân viên'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Ngày chính thức vào làm: </span>
              <strong>{employee.joinDate || 'Chưa có'}</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Thông tin định danh & Liên hệ */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            padding: 20,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#184a8c',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <User size={18} />
            <span>ĐỊNH DANH & LIÊN HỆ</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#334155' }}>
            <div>
              <span style={{ color: '#64748b' }}>Số CCCD / CMND: </span>
              <strong>{employee.idCard || 'Chưa cập nhật'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Ngày sinh: </span>
              <strong>{employee.dob ? employee.dob.slice(0, 10) : 'Chưa cập nhật'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Giới tính: </span>
              <strong style={{ textTransform: 'capitalize' }}>
                {employee.gender === 'nu' ? 'Nữ' : employee.gender === 'khac' ? 'Khác' : 'Nam'}
              </strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Email nhân sự: </span>
              <a href={`mailto:${employee.email}`} style={{ color: '#184a8c', fontWeight: 600 }}>
                {employee.email}
              </a>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Số điện thoại: </span>
              <strong>{employee.phone || 'Chưa cập nhật'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Địa chỉ: </span>
              <span>{employee.address || 'Chưa cập nhật'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Tài khoản hệ thống */}
      <div
        style={{
          background: '#f8fafc',
          borderRadius: 12,
          border: '1px solid #cbd5e1',
          padding: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: '#184a8c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <KeyRound size={22} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              Tài khoản đăng nhập hệ thống VisionHR
            </div>
            {employee.accountId ? (
              <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>
                Email: <strong style={{ color: '#184a8c' }}>{employee.accountEmail}</strong> · Vai trò:{' '}
                <span
                  style={{
                    backgroundColor: '#e2e8f0',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontWeight: 700,
                    fontSize: 11,
                    textTransform: 'uppercase',
                  }}
                >
                  {employee.accountRole}
                </span>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic', marginTop: 2 }}>
                Nhân viên này chưa được cấp hoặc liên kết tài khoản đăng nhập.
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" onClick={() => setShowEmailModal(true)}>
            <Mail size={15} style={{ marginRight: 6 }} /> Xem Email chào mừng
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/employees/${employee.id}/edit`)}>
            {employee.accountId ? 'Đổi mật khẩu / Quyền' : 'Cấp tài khoản ngay'}
          </Button>
        </div>
      </div>

      {/* Card CV Đính Kèm */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          padding: 20,
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb',
            }}
          >
            <FileText size={22} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              Hồ sơ ứng viên & CV đính kèm
            </div>
            {employee.cv ? (
              <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>
                Tệp: <strong>{employee.cv.name}</strong>{' '}
                {employee.cv.size && <span style={{ color: '#64748b' }}>({(employee.cv.size / 1024).toFixed(1)} KB)</span>}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic', marginTop: 2 }}>
                Chưa có tệp CV đính kèm trong hồ sơ nhân viên này.
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {employee.cv?.data ? (
            <a
              href={employee.cv.data}
              download={employee.cv.name}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Download size={15} /> Tải CV nhân viên
            </a>
          ) : (
            <Button variant="secondary" onClick={() => navigate(`/employees/${employee.id}/edit`)}>
              <FileText size={15} style={{ marginRight: 6 }} /> Tải lên CV
            </Button>
          )}
        </div>
      </div>

      {/* Modal Email Chào mừng */}
      <OnboardingEmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        employee={{
          name: employee.name,
          code: employee.code,
          email: employee.email,
          position: employee.position,
          department: employee.department,
          joinDate: employee.joinDate,
          accountEmail: employee.accountEmail || employee.email,
          accountRole: employee.accountRole || 'employee',
        }}
      />
    </div>
  );
}
