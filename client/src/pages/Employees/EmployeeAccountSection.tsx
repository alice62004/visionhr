import React from 'react';
import { KeyRound, Sparkles, RefreshCw } from 'lucide-react';
import { UserRole } from '../../types';

export interface UnlinkedAccount {
  id: number;
  name: string;
  email: string;
  role: string;
  employeeId?: number;
}

interface EmployeeAccountSectionProps {
  form: {
    email: string;
    accountEmail?: string | null;
    accountRole?: UserRole | null;
    accountAction: 'keep' | 'link' | 'create' | 'unlink' | 'update' | 'none';
    linkAccountId: string | number;
    newAccountEmail: string;
    newAccountRole: UserRole;
    newAccountPassword: string;
    currentAccountRole: UserRole;
    currentAccountPassword: string;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  hasExistingAccount: boolean;
  unlinkedAccounts: UnlinkedAccount[];
  generateRandomPassword: () => string;
  labelStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;
}

export default function EmployeeAccountSection({
  form,
  setForm,
  hasExistingAccount,
  unlinkedAccounts,
  generateRandomPassword,
  labelStyle,
  inputStyle,
}: EmployeeAccountSectionProps) {
  return (
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <KeyRound size={17} color="#184a8c" />
          </div>
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              Tài khoản đăng nhập hệ thống
            </span>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
              Hệ thống tự động khởi tạo tài khoản và mật khẩu tạm thời cho nhân viên mới
            </p>
          </div>
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
                onChange={() => setForm((prev: any) => ({ ...prev, accountAction: 'update' }))}
              />
              Duy trì / Cập nhật quyền & mật khẩu
            </label>

            <label style={{ fontSize: 13, fontWeight: 500, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="radio"
                name="accAction"
                checked={form.accountAction === 'unlink'}
                onChange={() => setForm((prev: any) => ({ ...prev, accountAction: 'unlink' }))}
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
                    setForm((prev: any) => ({
                      ...prev,
                      accountAction: 'update',
                      currentAccountRole: e.target.value as UserRole,
                    }))
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
                    setForm((prev: any) => ({
                      ...prev,
                      accountAction: 'update',
                      currentAccountPassword: e.target.value,
                    }))
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
                onChange={() => setForm((prev: any) => ({ ...prev, accountAction: 'none' }))}
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
                    setForm((prev: any) => ({
                      ...prev,
                      accountAction: 'link',
                      linkAccountId: prev.linkAccountId || unlinkedAccounts[0]?.id || '',
                    }))
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
                  setForm((prev: any) => ({
                    ...prev,
                    accountAction: 'create',
                    newAccountEmail: prev.newAccountEmail || prev.email,
                  }))
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
                onChange={(e) => setForm((prev: any) => ({ ...prev, linkAccountId: e.target.value }))}
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

          {/* LỰA CHỌN B: TẠO TÀI KHOẢN MỚI TỰ ĐỘNG */}
          {form.accountAction === 'create' && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #bbf7d0',
                borderRadius: 10,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.05)',
              }}
            >
              {/* Banner tự động hóa */}
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 12,
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontWeight: 500,
                }}
              >
                <Sparkles size={16} color="#16a34a" />
                <span>
                  <strong>Cấp tài khoản tự động</strong>: Thông tin tài khoản và mật khẩu tạm thời đã được tạo sẵn bên dưới. Sau khi bấm <strong>Lưu nhân viên</strong>, hệ thống sẽ mở bảng Giả lập Email chào mừng để gửi cho nhân viên.
                </span>
              </div>

              <div>
                <label style={labelStyle}>Email đăng nhập (Tự động đồng bộ)</label>
                <input
                  style={{ ...inputStyle, backgroundColor: '#f8fafc' }}
                  type="email"
                  placeholder="mai@gmail.com"
                  value={form.newAccountEmail || form.email}
                  onChange={(e) => setForm((prev: any) => ({ ...prev, newAccountEmail: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Vai trò *</label>
                  <select
                    style={inputStyle}
                    value={form.newAccountRole}
                    onChange={(e) => setForm((prev: any) => ({ ...prev, newAccountRole: e.target.value as UserRole }))}
                  >
                    <option value="employee">Nhân viên (Employee)</option>
                    <option value="manager">Quản lý (Manager)</option>
                    <option value="hr">Nhân sự (HR)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Mật khẩu khởi tạo tạm thời *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: 600 }}
                      type="text"
                      placeholder="Mật khẩu khởi tạo"
                      value={form.newAccountPassword}
                      onChange={(e) => setForm((prev: any) => ({ ...prev, newAccountPassword: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev: any) => ({ ...prev, newAccountPassword: generateRandomPassword() }))
                      }
                      style={{
                        padding: '0 12px',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        color: '#184a8c',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        flexShrink: 0,
                      }}
                      title="Bấm để sinh mật khẩu ngẫu nhiên mới"
                    >
                      <RefreshCw size={13} /> Tạo lại
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
