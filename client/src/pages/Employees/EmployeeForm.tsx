import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  User,
  GraduationCap,
  Calendar,
  CreditCard,
  MapPin,
  Briefcase,
  Eye,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  createEmployee,
  updateEmployee,
  getEmployeeById,
  getDepartments,
  getUnlinkedAccounts,
  getNextEmployeeCode,
} from '../../services/employeeApi';
import Button from '../../components/Button/Button';
import OnboardingEmailModal from '../../components/OnboardingEmailModal/OnboardingEmailModal';
import { Department, EmployeeStatus, UserRole } from '../../types';
import EmployeeCvSection from './EmployeeCvSection';
import EmployeeAccountSection from './EmployeeAccountSection';

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

  // Thông tin mở rộng hồ sơ
  joinDate: string;
  education: string;
  major: string;
  dob: string;
  gender: 'nam' | 'nu' | 'khac';
  idCard: string;
  address: string;
  cv?: {
    name: string;
    size?: number;
    type?: string;
    data?: string;
    url?: string;
    uploadedAt?: string;
  } | null;

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

const generateRandomPassword = () => `VisionHR@${Math.floor(1000 + Math.random() * 9000)}`;

const initialForm: FormState = {
  name: '',
  code: '',
  email: '',
  phone: '',
  departmentId: '',
  position: '',
  status: 'dang_lam_viec',

  joinDate: new Date().toISOString().slice(0, 10),
  education: 'Đại học',
  major: '',
  dob: '',
  gender: 'nam',
  idCard: '',
  address: '',
  cv: null,

  accountId: null,
  accountEmail: null,
  accountRole: null,

  // Mặc định tự động bật cấp tài khoản khi thêm nhân sự mới
  accountAction: 'create',
  linkAccountId: '',
  newAccountEmail: '',
  newAccountRole: 'employee',
  newAccountPassword: 'VisionHR@2026',
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
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [createdEmpData, setCreatedEmpData] = useState<any | null>(null);
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

            joinDate: emp.joinDate ? emp.joinDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
            education: emp.education || 'Đại học',
            major: emp.major || '',
            dob: emp.dob ? emp.dob.slice(0, 10) : '',
            gender: (emp.gender as 'nam' | 'nu' | 'khac') || 'nam',
            idCard: emp.idCard || '',
            address: emp.address || '',
            cv: emp.cv || null,

            accountId: emp.accountId || null,
            accountEmail: emp.accountEmail || null,
            accountRole: (emp.accountRole as UserRole) || 'employee',

            accountAction: emp.accountId ? 'keep' : 'create',
            linkAccountId: '',
            newAccountEmail: emp.email || '',
            newAccountRole: 'employee',
            newAccountPassword: 'VisionHR@2026',
            currentAccountRole: (emp.accountRole as UserRole) || 'employee',
            currentAccountPassword: '',
          });
        })
        .catch(() => navigate('/employees'))
        .finally(() => setLoading(false));
    } else {
      // Khi thêm mới: Tự động lấy mã nhân viên tăng dần tiếp theo từ database
      getNextEmployeeCode()
        .then((res) => {
          if (res?.nextCode) {
            setForm((prev) => ({ ...prev, code: res.nextCode }));
          }
        })
        .catch(() => {});
    }
  }, [id, isEdit, navigate]);

  const handleChange = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'email' && prev.accountAction === 'create') {
        next.newAccountEmail = value;
      }
      return next;
    });
  };

  const handleCvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Dung lượng tệp CV không được vượt quá 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        cv: {
          name: file.name,
          size: file.size,
          type: file.type,
          data: reader.result as string,
          uploadedAt: new Date().toISOString(),
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCv = () => {
    setForm((prev) => ({ ...prev, cv: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

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
        alert(`Cập nhật thông tin nhân viên "${form.name}" thành công!`);
        navigate('/employees');
      } else {
        const res = await createEmployee(form);
        setCreatedEmpData(res);
        if (res?.emailDelivery?.success) {
          alert(`Thêm nhân viên "${form.name}" thành công! Đã tự động gửi email cấp tài khoản đến ${form.newAccountEmail || form.email}!`);
        } else {
          alert(`Thêm nhân viên "${form.name}" (${res?.code || form.code || ''}) thành công!`);
        }
        setShowEmailModal(true);
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Đang tải thông tin nhân viên...</p>;

  const hasExistingAccount = Boolean(form.accountId);

  return (
    <>
      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: 680,
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px 0', color: '#111827' }}>
              {isEdit ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
            </h1>
            <p style={{ color: '#6b7280', margin: 0, fontSize: 13 }}>
              Điền thông tin hồ sơ nhân sự, học vấn và thiết lập tài khoản đăng nhập
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setCreatedEmpData(form);
              setShowEmailModal(true);
            }}
          >
            <Eye size={14} style={{ marginRight: 6 }} />
            Xem trước Email cấp TK
          </Button>
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
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* NHÓM 1: THÔNG TIN CƠ BẢN VÀ CÔNG TÁC */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#184a8c',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Briefcase size={16} />
            <span>THÔNG TIN VỊ TRÍ & LIÊN HỆ</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Họ và tên *</label>
              <input
                style={inputStyle}
                placeholder="Ví dụ: Nguyễn Văn An"
                value={form.name}
                onChange={handleChange('name')}
                required
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Mã nhân viên *</label>
                {!isEdit && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await getNextEmployeeCode();
                        if (res?.nextCode) {
                          setForm((prev) => ({ ...prev, code: res.nextCode }));
                        }
                      } catch (e) {}
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      color: '#2563eb',
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: 4,
                      padding: '2px 7px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                    title="Hệ thống tự động tăng dần mã nhân viên tiếp theo"
                  >
                    <Sparkles size={11} />
                    <span>Tự động tăng ({form.code || '...'})</span>
                  </button>
                )}
              </div>
              <input
                style={{
                  ...inputStyle,
                  background: !isEdit && form.code ? '#f8fafc' : '#ffffff',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  color: '#1e40af',
                }}
                placeholder="Tự động sinh (ví dụ: NV010)"
                value={form.code}
                onChange={handleChange('code')}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Email nhân sự *</label>
              <input
                style={inputStyle}
                placeholder="an.nguyen@visionhr.corp"
                type="email"
                value={form.email}
                onChange={handleChange('email')}
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
                placeholder="Kỹ sư phần mềm, Chuyên viên HR..."
                value={form.position}
                onChange={handleChange('position')}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Ngày vào làm *</label>
              <input
                style={inputStyle}
                type="date"
                value={form.joinDate}
                onChange={handleChange('joinDate')}
                required
              />
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
        </div>

        {/* NHÓM 2: HỌC VẤN & THÔNG TIN CÁ NHÂN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#184a8c',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GraduationCap size={16} />
            <span>HỌC VẤN, BẰNG CẤP & ĐỊNH DANH CÁ NHÂN</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Bằng cấp / Trình độ</label>
              <select style={inputStyle} value={form.education} onChange={handleChange('education')}>
                <option value="Đại học">Đại học</option>
                <option value="Thạc sĩ">Thạc sĩ</option>
                <option value="Tiến sĩ">Tiến sĩ</option>
                <option value="Cao đẳng">Cao đẳng</option>
                <option value="Trung cấp">Trung cấp</option>
                <option value="Chứng chỉ nghề">Chứng chỉ nghề</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Chuyên ngành đào tạo</label>
              <input
                style={inputStyle}
                placeholder="Công nghệ thông tin, Quản trị..."
                value={form.major}
                onChange={handleChange('major')}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Ngày sinh</label>
              <input
                style={inputStyle}
                type="date"
                value={form.dob}
                onChange={handleChange('dob')}
              />
            </div>
            <div>
              <label style={labelStyle}>Giới tính</label>
              <select style={inputStyle} value={form.gender} onChange={handleChange('gender')}>
                <option value="nam">Nam</option>
                <option value="nu">Nữ</option>
                <option value="khac">Khác</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Số CCCD / CMND</label>
              <input
                style={inputStyle}
                placeholder="012345678901"
                value={form.idCard}
                onChange={handleChange('idCard')}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Địa chỉ thường trú / Nơi ở hiện tại</label>
            <input
              style={inputStyle}
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP..."
              value={form.address}
              onChange={handleChange('address')}
            />
          </div>

          {/* KHU VỰC TẢI HỒ SƠ ỨNG VIÊN & CV */}
          <EmployeeCvSection
            cv={form.cv}
            onFileChange={handleCvFileChange}
            onRemoveCv={handleRemoveCv}
          />

        </div>

      {/* KHU VỰC THIẾT LẬP / LIÊN KẾT TÀI KHOẢN ĐĂNG NHẬP */}
      <EmployeeAccountSection
        form={form}
        setForm={setForm}
        hasExistingAccount={hasExistingAccount}
        unlinkedAccounts={unlinkedAccounts}
        generateRandomPassword={generateRandomPassword}
        labelStyle={labelStyle}
        inputStyle={inputStyle}
      />

      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <Button type="submit" disabled={saving}>
          {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật nhân viên' : 'Lưu nhân viên'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate('/employees')}>
          Hủy
        </Button>
      </div>
    </form>

    <OnboardingEmailModal
      isOpen={showEmailModal}
      onClose={() => {
        setShowEmailModal(false);
        if (!isEdit && createdEmpData) {
          navigate('/employees');
        }
      }}
      employee={{
        name: createdEmpData?.name || form.name || 'Nhân viên mới',
        code: createdEmpData?.code || form.code || 'NV---',
        email: createdEmpData?.email || form.email || 'employee@visionhr.corp',
        position: createdEmpData?.position || form.position,
        department:
          departments.find((d) => String(d.id) === String(form.departmentId))?.name || undefined,
        joinDate: form.joinDate,
        accountEmail: form.accountAction === 'create' ? form.newAccountEmail : form.email,
        accountRole: form.accountAction === 'create' ? form.newAccountRole : form.accountRole || 'employee',
      }}
      tempPassword={form.newAccountPassword || 'VisionHR@2026'}
    />
  </>
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
