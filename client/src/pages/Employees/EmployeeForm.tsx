import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createEmployee,
  updateEmployee,
  getEmployeeById,
  getDepartments,
  getUnlinkedAccounts,
} from '../../services/employeeApi';
import Button from '../../components/Button/Button';
import { Department, EmployeeStatus, UserRole } from '../../types';

interface UnlinkedAccount {
  id: number;
  name: string;
  email: string;
  role: string;
  employeeId?: number;
}

interface FormState {
  name: string;
  code: string;
  email: string;
  phone: string;
  departmentId: string | number;
  position: string;
  status: EmployeeStatus;

  // Trạng thái tài khoản
  accountId?: number | null;
  accountEmail?: string | null;
  accountRole?: UserRole | null;

  // Thao tác với tài khoản
  accountAction: 'keep' | 'link' | 'create' | 'unlink' | 'update' | 'none';
  linkAccountId: string | number;
  newAccountEmail: string;
  newAccountRole: UserRole;
  newAccountPassword: string;
  currentAccountRole: UserRole;
  currentAccountPassword: string;
}

const initialForm: FormState = {
  name: '',
  code: '',
  email: '',
  phone: '',
  departmentId: '',
  position: '',
  status: 'dang_lam_viec',

  accountId: null,
  accountEmail: null,
  accountRole: null,

  accountAction: 'none',
  linkAccountId: '',
  newAccountEmail: '',
  newAccountRole: 'employee',
  newAccountPassword: '',
  currentAccountRole: 'employee',
  currentAccountPassword: '',
};

export default function EmployeeForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const [form, setForm] = useState<FormState>(initialForm);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [unlinkedAccounts, setUnlinkedAccounts] = useState<UnlinkedAccount[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => {});
    getUnlinkedAccounts(id).then(setUnlinkedAccounts).catch(() => setUnlinkedAccounts([]));

    if (isEdit && id) {
      getEmployeeById(id)
        .then((emp) => {
          setForm({
            name: emp.name || '',
            code: emp.code || '',
            email: emp.email || '',
            phone: emp.phone || '',
            departmentId: emp.department_id || '',
            position: emp.position || '',
            status: emp.status || 'dang_lam_viec',

            accountId: emp.accountId || null,
            accountEmail: emp.accountEmail || null,
            accountRole: (emp.accountRole as UserRole) || 'employee',

            accountAction: emp.accountId ? 'keep' : 'none',
            linkAccountId: '',
            newAccountEmail: emp.email || '',
            newAccountRole: 'employee',
            newAccountPassword: '',
            currentAccountRole: (emp.accountRole as UserRole) || 'employee',
            currentAccountPassword: '',
          });
        })
        .catch(() => navigate('/employees'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, navigate]);

  const handleChange = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Nếu thay đổi email nhân viên mà đang tạo tài khoản mới thì tự động gợi ý email tài khoản
      if (field === 'email' && prev.accountAction === 'create' && !prev.newAccountEmail) {
        next.newAccountEmail = value;
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    // Kiểm tra tính hợp lệ của tài khoản tạo mới
    if (form.accountAction === 'create') {
      if (!form.newAccountPassword || !form.newAccountPassword.trim()) {
        setErrorMsg('Vui lòng nhập mật khẩu khởi tạo cho tài khoản mới.');
        setSaving(false);
        return;
      }
    }

    if (form.accountAction === 'link') {
      if (!form.linkAccountId) {
        setErrorMsg('Vui lòng chọn một tài khoản có sẵn trong danh sách để liên kết.');
        setSaving(false);
        return;
      }
    }

    try {
      if (isEdit && id) {
        await updateEmployee(id, form);
      } else {
        await createEmployee(form);
      }
      navigate('/employees');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Đang tải thông tin nhân viên...</p>;

  const hasExistingAccount = Boolean(form.accountId);

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 620,
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px 0', color: '#111827' }}>
          {isEdit ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
        </h1>
        <p style={{ color: '#6b7280', margin: 0, fontSize: 13 }}>
          Điền thông tin hồ sơ nhân sự và thiết lập tài khoản đăng nhập hệ thống
        </p>
      </div>

      {errorMsg && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Thông tin nhân sự cơ bản */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={labelStyle}>Họ và tên *</label>
          <input
            style={inputStyle}
            placeholder="Ví dụ: Nguyễn Thị Hồng Mai"
            value={form.name}
            onChange={handleChange('name')}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Mã nhân viên *</label>
            <input
              style={inputStyle}
              placeholder="NV004"
              value={form.code}
              onChange={handleChange('code')}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Số điện thoại</label>
            <input
              style={inputStyle}
              placeholder="0987 654 321"
              value={form.phone}
              onChange={handleChange('phone')}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Email nhân sự *</label>
          <input
            style={inputStyle}
            placeholder="mai@company.com"
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Phòng ban</label>
            <select style={inputStyle} value={form.departmentId} onChange={handleChange('departmentId')}>
              <option value="">-- Chọn phòng ban --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Chức vụ</label>
            <input
              style={inputStyle}
              placeholder="Nhân viên bán hàng..."
              value={form.position}
              onChange={handleChange('position')}
            />
          </div>
        </div>

        {isEdit && (
          <div>
            <label style={labelStyle}>Trạng thái làm việc</label>
            <select style={inputStyle} value={form.status} onChange={handleChange('status')}>
              <option value="dang_lam_viec">Đang làm việc</option>
              <option value="da_nghi_viec">Đã nghỉ việc</option>
            </select>
          </div>
        )}
      </div>

      {/* KHU VỰC THIẾT LẬP / LIÊN KẾT TÀI KHOẢN ĐĂNG NHẬP */}
      <div
        style={{
          marginTop: 10,
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: 10,
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🔐</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              Tài khoản đăng nhập hệ thống
            </span>
          </div>
          {hasExistingAccount && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#16a34a',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              ✓ ĐÃ CÓ TÀI KHOẢN
            </span>
          )}
        </div>

        {hasExistingAccount ? (
          // TRƯỜNG HỢP 1: NHÂN VIÊN ĐÃ CÓ TÀI KHOẢN
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 13,
                color: '#334155',
              }}
            >
              <div>
                <strong>Email đăng nhập:</strong>{' '}
                <span style={{ color: '#2563eb', fontWeight: 600 }}>{form.accountEmail}</span>
              </div>
              <div style={{ marginTop: 4 }}>
                <strong>Vai trò hiện tại:</strong>{' '}
                <span style={{ textTransform: 'uppercase', fontWeight: 600, color: '#475569' }}>
                  {form.accountRole}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="radio"
                  name="accAction"
                  checked={form.accountAction === 'keep' || form.accountAction === 'update'}
                  onChange={() => setForm({ ...form, accountAction: 'update' })}
                />
                Duy trì / Cập nhật quyền & mật khẩu
              </label>

              <label style={{ fontSize: 13, fontWeight: 500, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="radio"
                  name="accAction"
                  checked={form.accountAction === 'unlink'}
                  onChange={() => setForm({ ...form, accountAction: 'unlink' })}
                />
                Gỡ (Hủy liên kết) tài khoản khỏi nhân viên này
              </label>
            </div>

            {form.accountAction !== 'unlink' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
                <div>
                  <label style={labelStyle}>Vai trò tài khoản</label>
                  <select
                    style={inputStyle}
                    value={form.currentAccountRole}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        accountAction: 'update',
                        currentAccountRole: e.target.value as UserRole,
                      })
                    }
                  >
                    <option value="employee">Nhân viên (Employee)</option>
                    <option value="manager">Quản lý (Manager)</option>
                    <option value="hr">Nhân sự (HR)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Đổi mật khẩu mới</label>
                  <input
                    style={inputStyle}
                    type="password"
                    placeholder="Để trống nếu không đổi"
                    value={form.currentAccountPassword}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        accountAction: 'update',
                        currentAccountPassword: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          // TRƯỜNG HỢP 2: NHÂN VIÊN CHƯA CÓ TÀI KHOẢN
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="accActionNew"
                  checked={form.accountAction === 'none'}
                  onChange={() => setForm({ ...form, accountAction: 'none' })}
                />
                Chưa cấp tài khoản
              </label>

              {unlinkedAccounts.length > 0 && (
                <label style={{ fontSize: 13, fontWeight: 600, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="accActionNew"
                    checked={form.accountAction === 'link'}
                    onChange={() =>
                      setForm({
                        ...form,
                        accountAction: 'link',
                        linkAccountId: form.linkAccountId || unlinkedAccounts[0]?.id || '',
                      })
                    }
                  />
                  🔗 Liên kết với tài khoản có sẵn ({unlinkedAccounts.length} tài khoản chưa gắn NV)
                </label>
              )}

              <label style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="accActionNew"
                  checked={form.accountAction === 'create'}
                  onChange={() =>
                    setForm({
                      ...form,
                      accountAction: 'create',
                      newAccountEmail: form.newAccountEmail || form.email,
                    })
                  }
                />
                + Cấp tài khoản mới ngay
              </label>
            </div>

            {/* LỰA CHỌN A: LIÊN KẾT TÀI KHOẢN CÓ SẴN CHƯA GẮN NV */}
            {form.accountAction === 'link' && (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 8,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <label style={{ ...labelStyle, color: '#1e40af' }}>
                  Chọn tài khoản hệ thống để liên kết với nhân viên này:
                </label>
                <select
                  style={{ ...inputStyle, borderColor: '#3b82f6', background: '#eff6ff' }}
                  value={form.linkAccountId}
                  onChange={(e) => setForm({ ...form, linkAccountId: e.target.value })}
                >
                  <option value="">-- Chọn tài khoản cần liên kết --</option>
                  {unlinkedAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.email} ({acc.name} - Vai trò: {acc.role.toUpperCase()})
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: 12, color: '#3b82f6' }}>
                  💡 Tài khoản được chọn sẽ được gán độc quyền cho nhân viên này để đăng nhập vào VisionHR.
                </span>
              </div>
            )}

            {/* LỰA CHỌN B: TẠO TÀI KHOẢN MỚI */}
            {form.accountAction === 'create' && (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #bbf7d0',
                  borderRadius: 8,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div>
                  <label style={labelStyle}>Email đăng nhập *</label>
                  <input
                    style={inputStyle}
                    type="email"
                    placeholder="mai@gmail.com"
                    value={form.newAccountEmail}
                    onChange={(e) => setForm({ ...form, newAccountEmail: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Vai trò *</label>
                    <select
                      style={inputStyle}
                      value={form.newAccountRole}
                      onChange={(e) => setForm({ ...form, newAccountRole: e.target.value as UserRole })}
                    >
                      <option value="employee">Nhân viên (Employee)</option>
                      <option value="manager">Quản lý (Manager)</option>
                      <option value="hr">Nhân sự (HR)</option>
                      <option value="admin">Quản trị viên (Admin)</option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Mật khẩu đăng nhập *</label>
                    <input
                      style={inputStyle}
                      type="password"
                      placeholder="Mật khẩu tối thiểu 6 ký tự"
                      value={form.newAccountPassword}
                      onChange={(e) => setForm({ ...form, newAccountPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <Button type="submit" disabled={saving}>
          {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật nhân viên' : 'Lưu nhân viên'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate('/employees')}>
          Hủy
        </Button>
      </div>
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  padding: '9px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};
