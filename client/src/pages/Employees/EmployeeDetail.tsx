import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEmployeeById } from '../../services/employeeApi';
import Button from '../../components/Button/Button';
import { Employee } from '../../types';

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (id) {
      getEmployeeById(id)
        .then(setEmployee)
        .catch(() => setEmployee(null));
    }
  }, [id]);

  if (!employee) return <p>Đang tải hồ sơ nhân viên...</p>;

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
    <div
      style={{
        maxWidth: 580,
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
        padding: 24,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {faceImage ? (
            <img
              src={faceImage}
              alt={employee.name}
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #2563eb',
                boxShadow: '0 2px 6px rgba(37,99,235,0.2)',
              }}
            />
          ) : (
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: '#f1f5f9',
                border: '2px dashed #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                fontSize: 12,
                textAlign: 'center',
                padding: 4,
              }}
            >
              Chưa có ảnh mặt
            </div>
          )}
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px 0', color: '#111827' }}>
              {employee.name}
            </h1>
            <p style={{ color: '#6b7280', margin: '0 0 4px 0', fontSize: 14 }}>
              {employee.position || 'Chưa cập nhật'} · {employee.department || 'Chưa phân phòng ban'}
            </p>
            <div>
              {hasFace ? (
                <span
                  style={{
                    color: '#16a34a',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 11,
                  }}
                >
                  ✓ Đã đăng ký Vision AI Face
                </span>
              ) : (
                <span
                  style={{
                    color: '#d97706',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 11,
                  }}
                >
                  ⚠ Chưa có dữ liệu khuôn mặt
                </span>
              )}
            </div>
          </div>
        </div>

        <span
          style={{
            color: isWorking ? '#16a34a' : '#dc2626',
            background: isWorking ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${isWorking ? '#bbf7d0' : '#fecaca'}`,
            padding: '4px 10px',
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          {isWorking ? 'Đang làm việc' : 'Đã nghỉ việc'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: '#374151', margin: '20px 0' }}>
        <p style={{ margin: 0 }}><strong>Mã NV:</strong> {employee.code}</p>
        <p style={{ margin: 0 }}><strong>Email:</strong> {employee.email}</p>
        <p style={{ margin: 0 }}><strong>Số điện thoại:</strong> {employee.phone || 'Chưa có'}</p>
        <p style={{ margin: 0 }}><strong>Ngày vào làm:</strong> {employee.joinDate || 'Chưa có'}</p>
        <div style={{ marginTop: 8, padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Tài khoản đăng nhập:</strong>{' '}
            {employee.accountId ? (
              <span style={{ color: '#2563eb', fontWeight: 600 }}>
                {employee.accountEmail} ({employee.accountRole ? employee.accountRole.toUpperCase() : 'USER'})
              </span>
            ) : (
              <span style={{ color: '#64748b', fontStyle: 'italic' }}>
                Chưa cấp tài khoản đăng nhập cho nhân viên này.
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate(`/employees/${employee.id}/edit`)}
            style={{
              padding: '4px 10px',
              fontSize: 12,
              background: employee.accountId ? '#f1f5f9' : '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {employee.accountId ? '⚙️ Quản lý TK' : '🔗 Cấp / Liên kết TK'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <Button variant="secondary" onClick={() => navigate('/employees')}>Quay lại danh sách</Button>
        <Button variant="secondary" onClick={() => navigate(`/employees/${employee.id}/edit`)}>Chỉnh sửa</Button>
        <Button onClick={() => navigate(`/employees/${employee.id}/face-enrollment`)}>
          {hasFace ? 'Cập nhật lại khuôn mặt' : 'Đăng ký khuôn mặt'}
        </Button>
      </div>
    </div>
  );
}
