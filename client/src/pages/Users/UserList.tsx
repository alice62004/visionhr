import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, getAvailableEmployees, createUser, updateUser, deleteUser } from '../../services/userApi';
import Table, { Column } from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import { useAuthStore } from '../../store/authStore';
import { User, Employee, UserRole } from '../../types';

interface UserFormState {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  employeeId: string | number;
}

const emptyForm: UserFormState = {
  name: '',
  email: '',
  password: '',
  role: 'employee',
  employeeId: '',
};

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [faceFilter, setFaceFilter] = useState<string>('all');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const currentUser = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = async () => {
    setEditTarget(null);
    setForm(emptyForm);
    setErrorMsg('');
    try {
      const emps = await getAvailableEmployees();
      setAvailableEmployees(emps);
    } catch {
      setAvailableEmployees([]);
    }
    setModalOpen(true);
  };

  const openEditModal = async (targetUser: User) => {
    setEditTarget(targetUser);
    setForm({
      name: targetUser.name,
      email: targetUser.email,
      password: '', // để trống nếu không đổi
      role: targetUser.role,
      employeeId: targetUser.employeeId || '',
    });
    setErrorMsg('');
    try {
      const emps = await getAvailableEmployees(targetUser.id);
      // Nếu user này đã có employeeId, đảm bảo employee đó hiển thị trong danh sách chọn
      if (targetUser.employeeId && !emps.some((e) => e.id === targetUser.employeeId)) {
        emps.unshift({
          id: targetUser.employeeId,
          code: targetUser.employeeCode || '',
          name: targetUser.employeeName || targetUser.name,
          email: targetUser.email,
          position: targetUser.employeePosition || '',
          status: 'dang_lam_viec',
          hasFace: targetUser.hasFace,
          department: targetUser.departmentName || '',
        });
      }
      setAvailableEmployees(emps);
    } catch {
      setAvailableEmployees([]);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setForm(emptyForm);
    setErrorMsg('');
  };

  const handleEmployeeSelect = (empIdStr: string) => {
    if (!empIdStr) {
      setForm((prev) => ({ ...prev, employeeId: '' }));
      return;
    }
    const empId = Number(empIdStr);
    const selectedEmp = availableEmployees.find((e) => e.id === empId);
    if (selectedEmp) {
      setForm((prev) => ({
        ...prev,
        employeeId: empId,
        // Tự động điền họ tên và email nếu form đang trống hoặc đang tạo mới
        name: !editTarget ? selectedEmp.name : prev.name,
        email: !editTarget ? selectedEmp.email : prev.email,
      }));
    } else {
      setForm((prev) => ({ ...prev, employeeId: empId }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.name.trim() || !form.email.trim()) {
      setErrorMsg('Vui lòng điền họ tên và email tài khoản.');
      return;
    }

    if (!editTarget && !form.password) {
      setErrorMsg('Vui lòng nhập mật khẩu khởi tạo cho tài khoản mới.');
      return;
    }

    setSaving(true);
    try {
      if (editTarget) {
        await updateUser(editTarget.id, {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          role: form.role,
          employeeId: form.employeeId ? Number(form.employeeId) : null,
          password: form.password.trim() ? form.password.trim() : undefined,
        });
      } else {
        await createUser({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password.trim(),
          role: form.role,
          employeeId: form.employeeId ? Number(form.employeeId) : null,
        });
      }
      handleCloseModal();
      await loadData();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu tài khoản.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: User) => {
    if (u.id === currentUser?.id) {
      alert('Bạn không thể tự xóa tài khoản của chính mình.');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${u.email}" (${u.name})?`)) return;

    try {
      await deleteUser(u.id);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Xóa tài khoản thất bại.');
    }
  };

  // Lọc dữ liệu
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.employeeCode && u.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.employeeName && u.employeeName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchRole = roleFilter === 'all' || u.role === roleFilter;

    let matchFace = true;
    if (faceFilter === 'enrolled') {
      matchFace = Boolean(u.employeeId && u.hasFace);
    } else if (faceFilter === 'pending') {
      matchFace = Boolean(u.employeeId && !u.hasFace);
    } else if (faceFilter === 'system') {
      matchFace = !u.employeeId;
    }

    return matchSearch && matchRole && matchFace;
  });

  // Thống kê nhanh
  const totalUsers = users.length;
  const linkedUsers = users.filter((u) => u.employeeId).length;
  const faceEnrolledUsers = users.filter((u) => u.employeeId && u.hasFace).length;
  const facePendingUsers = users.filter((u) => u.employeeId && !u.hasFace).length;

  const columns: Column<User>[] = [
    {
      key: 'user',
      label: 'Tài khoản đăng nhập',
      render: (u) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e293b' }}>{u.name}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{u.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Vai trò (Role)',
      render: (u) => <RoleBadge role={u.role} />,
    },
    {
      key: 'employee',
      label: 'Nhân viên liên kết',
      render: (u) => {
        if (!u.employeeId) {
          return (
            <span
              style={{
                fontSize: 12,
                color: '#64748b',
                background: '#f1f5f9',
                padding: '3px 8px',
                borderRadius: 4,
                fontStyle: 'italic',
              }}
            >
              Tài khoản hệ thống (Không gắn NV)
            </span>
          );
        }
        return (
          <div>
            <div style={{ fontWeight: 500, color: '#0f172a' }}>
              <span style={{ color: '#2563eb', fontWeight: 600, marginRight: 6 }}>[{u.employeeCode}]</span>
              {u.employeeName}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {u.employeePosition || 'Nhân viên'} · {u.departmentName || 'Chưa phân phòng'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'faceStatus',
      label: 'Trạng thái khuôn mặt',
      render: (u) => {
        if (!u.employeeId) {
          return <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>;
        }
        if (u.hasFace) {
          return (
            <span
              style={{
                color: '#16a34a',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: '3px 10px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              ✓ Đã đăng ký
            </span>
          );
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                color: '#d97706',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                padding: '3px 8px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              ⚠ Chưa đăng ký
            </span>
            <button
              type="button"
              onClick={() => navigate(`/employees/${u.employeeId}/face-enrollment`)}
              style={{
                padding: '3px 8px',
                fontSize: 11,
                background: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 600,
              }}
              title="Đăng ký khuôn mặt ngay"
            >
              + Đăng ký
            </button>
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Ngày tạo',
      render: (u) => (
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (u) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button variant="secondary" onClick={() => openEditModal(u)}>
            Sửa
          </Button>
          {u.id !== currentUser?.id && (
            <Button variant="danger" onClick={() => handleDelete(u)}>
              Xóa
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px 0', color: '#0f172a' }}>
            Quản lý tài khoản hệ thống
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
            Quản trị tài khoản đăng nhập gắn với từng nhân viên và theo dõi trạng thái đăng ký nhận diện khuôn mặt
          </p>
        </div>
        <Button onClick={openCreateModal}>+ Thêm tài khoản mới</Button>
      </div>

      {/* Thẻ thống kê tổng quan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Tổng số tài khoản</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{totalUsers}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{linkedUsers} tài khoản đã gắn NV</div>
        </div>

        <div style={{ ...statCardStyle, borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>Khuôn mặt đã đăng ký</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a', marginTop: 4 }}>{faceEnrolledUsers}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Sẵn sàng chấm công AI</div>
        </div>

        <div style={{ ...statCardStyle, borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: 13, color: '#d97706', fontWeight: 600 }}>Chưa đăng ký khuôn mặt</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706', marginTop: 4 }}>{facePendingUsers}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Cần chụp ảnh bổ sung</div>
        </div>

        <div style={statCardStyle}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Tài khoản độc lập (Admin)</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6', marginTop: 4 }}>{totalUsers - linkedUsers}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Không ràng buộc nhân sự</div>
        </div>
      </div>

      {/* Bộ lọc & Tìm kiếm */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '14px 16px',
          marginBottom: 16,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 260 }}>
          <input
            style={{ ...inputStyle, width: '100%', maxWidth: 320 }}
            placeholder="🔍 Tìm kiếm theo tên, email, mã NV..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Vai trò:</span>
            <select
              style={{ ...inputStyle, width: 'auto', padding: '6px 12px' }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Admin</option>
              <option value="hr">HR</option>
              <option value="manager">Quản lý (Manager)</option>
              <option value="employee">Nhân viên (Employee)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Khuôn mặt:</span>
            <select
              style={{ ...inputStyle, width: 'auto', padding: '6px 12px' }}
              value={faceFilter}
              onChange={(e) => setFaceFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="enrolled">✓ Đã đăng ký</option>
              <option value="pending">⚠ Chưa đăng ký</option>
              <option value="system">Tài khoản hệ thống</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bảng danh sách tài khoản */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Đang tải danh sách tài khoản...</div>
      ) : (
        <Table columns={columns} data={filteredUsers} />
      )}

      {/* Modal Thêm / Chỉnh sửa tài khoản */}
      <Modal
        open={modalOpen}
        title={editTarget ? `Chỉnh sửa tài khoản: ${editTarget.email}` : 'Cấp tài khoản mới'}
        onClose={handleCloseModal}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Hủy
            </Button>
            <Button type="submit" form="user-form" disabled={saving}>
              {saving ? 'Đang lưu...' : editTarget ? 'Cập nhật' : 'Tạo tài khoản'}
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

          <div>
            <label style={labelStyle}>Liên kết với nhân viên</label>
            <select
              style={inputStyle}
              value={form.employeeId}
              onChange={(e) => handleEmployeeSelect(e.target.value)}
            >
              <option value="">-- Không gắn nhân viên (Tài khoản quản trị độc lập) --</option>
              {availableEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.code} - {emp.name} ({emp.department || 'Chưa phân phòng'} - {emp.position || 'Nhân viên'})
                  {emp.hasFace ? ' [✓ Đã có mặt AI]' : ' [⚠ Chưa có mặt AI]'}
                </option>
              ))}
            </select>
            <span style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'block' }}>
              💡 Chọn nhân viên sẽ tự động điền họ tên & email. Hệ thống kiểm soát 1 nhân viên chỉ có DUY NHẤT 1 tài khoản.
            </span>
          </div>

          <div>
            <label style={labelStyle}>Họ và tên *</label>
            <input
              style={inputStyle}
              placeholder="Nguyễn Văn A"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Email đăng nhập *</label>
            <input
              style={inputStyle}
              type="email"
              placeholder="user@visionhr.vn"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Vai trò hệ thống *</label>
            <select
              style={inputStyle}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
            >
              <option value="employee">Nhân viên (Employee) - Chỉ xem chấm công, làm đơn</option>
              <option value="manager">Quản lý (Manager) - Xem báo cáo, duyệt đơn phòng ban</option>
              <option value="hr">Nhân sự (HR) - Quản lý hồ sơ, chấm công, ca làm, bảng lương</option>
              <option value="admin">Quản trị viên (Admin) - Toàn quyền cấu hình, tài khoản, audit log</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>
              {editTarget ? 'Đổi mật khẩu mới (Bỏ trống nếu không thay đổi)' : 'Mật khẩu khởi tạo *'}
            </label>
            <input
              style={inputStyle}
              type="password"
              placeholder={editTarget ? 'Để trống nếu giữ mật khẩu cũ' : 'Nhập mật khẩu (tối thiểu 6 ký tự)'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editTarget}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const styles: Record<UserRole, { label: string; bg: string; color: string; border: string }> = {
    admin: { label: 'Admin', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    hr: { label: 'HR', bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
    manager: { label: 'Quản lý', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
    employee: { label: 'Nhân viên', bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  };
  const conf = styles[role] || styles.employee;
  return (
    <span
      style={{
        background: conf.bg,
        color: conf.color,
        border: `1px solid ${conf.border}`,
        padding: '3px 10px',
        borderRadius: 6,
        fontWeight: 600,
        fontSize: 12,
        display: 'inline-block',
      }}
    >
      {conf.label}
    </span>
  );
}

const statCardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  padding: '16px 20px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#334155',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  padding: '9px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  fontSize: 14,
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};
