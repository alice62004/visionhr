import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getEmployees,
  getDepartmentEmployees,
} from '../../services/employeeApi';
import Table, { Column } from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import { useAuthStore } from '../../store/authStore';
import { Department, Employee } from '../../types';

interface DeptForm {
  name: string;
  managerId: string | number;
}

const emptyForm: DeptForm = { name: '', managerId: '' };

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Sửa/Tạo phòng ban
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [form, setForm] = useState<DeptForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Modal / Drawer Xem chi tiết nhân viên trong phòng ban
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [deptEmployees, setDeptEmployees] = useState<Employee[]>([]);
  const [loadingDeptEmps, setLoadingDeptEmps] = useState(false);
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [faceFilter, setFaceFilter] = useState<'all' | 'enrolled' | 'pending'>('all');

  const role = useAuthStore((s) => s.user?.role);
  const canEdit = role === 'admin' || role === 'hr';
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const data = await getDepartments();
      setDepartments(data);
    } catch {
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    getEmployees().then(setEmployees).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditTarget(dept);
    setForm({ name: dept.name, managerId: dept.managerId || dept.manager_id || '' });
    setFormError('');
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditTarget(null);
    setForm(emptyForm);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim()) {
      setFormError('Tên phòng ban không được để trống.');
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      managerId: form.managerId ? Number(form.managerId) : null,
    };
    try {
      if (editTarget) {
        await updateDepartment(editTarget.id, payload);
      } else {
        await createDepartment(payload);
      }
      await load();
      handleClose();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dept: Department) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phòng ban "${dept.name}"?`)) return;
    try {
      await deleteDepartment(dept.id);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Xóa phòng ban thất bại.');
    }
  };

  // Mở danh sách nhân viên của phòng ban
  const handleViewEmployees = async (dept: Department) => {
    setSelectedDept(dept);
    setEmpModalOpen(true);
    setLoadingDeptEmps(true);
    setFaceFilter('all');
    try {
      const emps = await getDepartmentEmployees(dept.id);
      setDeptEmployees(emps);
    } catch (err: any) {
      console.error('Failed to load dept employees:', err);
      setDeptEmployees([]);
    } finally {
      setLoadingDeptEmps(false);
    }
  };

  // Tính toán thống kê tổng quát
  const totalHeadcount = departments.reduce((acc, d) => acc + (d.headcount || 0), 0);
  const totalFaceEnrolled = departments.reduce((acc, d) => acc + (d.faceEnrolledCount || 0), 0);

  const columns: Column<Department>[] = [
    {
      key: 'name',
      label: 'Tên phòng ban',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{r.name}</div>
          {r.positions && (
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.positions}>
              Chức vụ: {r.positions}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'manager',
      label: 'Trưởng phòng',
      render: (r) =>
        r.manager ? (
          <span style={{ fontWeight: 500, color: '#1e293b' }}>👤 {r.manager}</span>
        ) : (
          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 13 }}>Chưa phân công</span>
        ),
    },
    {
      key: 'positionCount',
      label: 'Số chức vụ',
      render: (r) => {
        const count = r.positionCount ?? 0;
        return (
          <span
            style={{
              background: '#f1f5f9',
              color: '#334155',
              padding: '3px 9px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              display: 'inline-block',
            }}
          >
            {count} chức vụ
          </span>
        );
      },
    },
    {
      key: 'headcount',
      label: 'Số nhân viên',
      render: (r) => {
        const count = r.headcount ?? 0;
        return (
          <span
            style={{
              fontWeight: 600,
              color: count > 0 ? '#0f172a' : '#94a3b8',
              fontSize: 13,
            }}
          >
            {count} nhân viên
          </span>
        );
      },
    },
    {
      key: 'faceRegistration',
      label: 'Trạng thái khuôn mặt',
      render: (r) => {
        const total = r.headcount ?? 0;
        const enrolled = r.faceEnrolledCount ?? 0;
        const pending = r.facePendingCount ?? (total - enrolled);

        if (total === 0) {
          return <span style={{ color: '#94a3b8', fontSize: 12 }}>Chưa có nhân viên</span>;
        }

        const percentage = Math.round((enrolled / total) * 100);
        const isComplete = enrolled === total;

        return (
          <div style={{ minWidth: 160 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: isComplete ? '#16a34a' : enrolled > 0 ? '#d97706' : '#dc2626',
                }}
              >
                {enrolled}/{total} đã đăng ký ({percentage}%)
              </span>
            </div>
            {/* Thanh tiến độ */}
            <div
              style={{
                height: 6,
                background: '#e2e8f0',
                borderRadius: 999,
                overflow: 'hidden',
                display: 'flex',
              }}
            >
              <div
                style={{
                  width: `${percentage}%`,
                  background: isComplete ? '#22c55e' : '#f59e0b',
                  borderRadius: 999,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            {pending > 0 && (
              <span style={{ fontSize: 11, color: '#64748b', marginTop: 2, display: 'block' }}>
                Còn {pending} NV chưa đăng ký
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: '',
      render: (row: Department) => (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Button variant="secondary" onClick={() => handleViewEmployees(row)}>
            👥 Xem nhân sự
          </Button>
          {canEdit && (
            <>
              <Button variant="secondary" onClick={() => openEdit(row)}>
                Sửa
              </Button>
              <Button variant="danger" onClick={() => handleDelete(row)}>
                Xóa
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  // Lọc danh sách nhân viên theo trạng thái khuôn mặt trong modal
  const filteredDeptEmployees = deptEmployees.filter((emp) => {
    if (faceFilter === 'enrolled') return Boolean(emp.hasFace);
    if (faceFilter === 'pending') return !emp.hasFace;
    return true;
  });

  return (
    <div>
      {/* Tiêu đề & Nút thêm mới */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px 0', color: '#111827' }}>
            Phòng ban & Cơ cấu tổ chức
          </h1>
          <p style={{ color: '#6b7280', margin: 0, fontSize: 14 }}>
            Quản lý cơ cấu phòng ban, chức vụ, nhân sự và theo dõi trạng thái đăng ký nhận diện khuôn mặt
          </p>
        </div>
        {canEdit && <Button onClick={openCreate}>+ Thêm phòng ban</Button>}
      </div>

      {/* Thẻ thống kê */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Tổng số phòng ban</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{departments.length}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Khối ban hoạt động</div>
        </div>

        <div style={statCardStyle}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Tổng nhân sự trực thuộc</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb', marginTop: 4 }}>{totalHeadcount}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Toàn công ty</div>
        </div>

        <div style={{ ...statCardStyle, borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>Đã đăng ký khuôn mặt AI</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a', marginTop: 4 }}>{totalFaceEnrolled}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            {totalHeadcount > 0 ? `${Math.round((totalFaceEnrolled / totalHeadcount) * 100)}% toàn bộ nhân sự` : '—'}
          </div>
        </div>

        <div style={{ ...statCardStyle, borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: 13, color: '#d97706', fontWeight: 600 }}>Chưa đăng ký khuôn mặt</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706', marginTop: 4 }}>
            {totalHeadcount - totalFaceEnrolled}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Cần tiến hành thu thập ảnh</div>
        </div>
      </div>

      {/* Bảng danh sách phòng ban */}
      {loading ? <p>Đang tải danh sách phòng ban...</p> : <Table columns={columns} data={departments} />}

      {/* Modal Thêm / Chỉnh sửa phòng ban */}
      <Modal
        open={modalOpen}
        title={editTarget ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới'}
        onClose={handleClose}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={handleClose}>
              Hủy
            </Button>
            <Button type="submit" form="dept-form" disabled={saving}>
              {saving ? 'Đang lưu...' : editTarget ? 'Cập nhật' : 'Tạo phòng ban'}
            </Button>
          </>
        }
      >
        <form id="dept-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {formError && (
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
              {formError}
            </div>
          )}

          <div>
            <label style={labelStyle}>Tên phòng ban *</label>
            <input
              style={inputStyle}
              placeholder="Ví dụ: Phòng Kỹ thuật Công nghệ..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <span style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'block' }}>
              💡 Hệ thống sẽ tự động kiểm tra chống trùng lặp tên phòng ban.
            </span>
          </div>

          <div>
            <label style={labelStyle}>Trưởng phòng phụ trách</label>
            <select
              style={inputStyle}
              value={form.managerId}
              onChange={(e) => setForm({ ...form, managerId: e.target.value })}
            >
              <option value="">-- Chưa chỉ định trưởng phòng --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.code}) - {emp.position || 'Nhân viên'}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* Modal Xem chi tiết nhân sự & Trạng thái đăng ký khuôn mặt của từng nhân viên */}
      <Modal
        open={empModalOpen}
        title={selectedDept ? `Danh sách nhân sự: ${selectedDept.name}` : 'Chi tiết nhân sự phòng ban'}
        onClose={() => setEmpModalOpen(false)}
        footer={
          <Button variant="secondary" onClick={() => setEmpModalOpen(false)}>
            Đóng
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selectedDept && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '12px 16px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: 12,
                fontSize: 13,
              }}
            >
              <div>
                <strong>Trưởng phòng:</strong> {selectedDept.manager || 'Chưa phân công'}
              </div>
              <div>
                <strong>Số chức vụ:</strong> {selectedDept.positionCount ?? 0} chức vụ
              </div>
              <div>
                <strong>Tổng nhân viên:</strong> {deptEmployees.length} người
              </div>
              <div>
                <strong>Đã có mặt AI:</strong>{' '}
                <span style={{ color: '#16a34a', fontWeight: 600 }}>
                  {deptEmployees.filter((e) => e.hasFace).length}/{deptEmployees.length}
                </span>
              </div>
            </div>
          )}

          {/* Lọc nhanh theo trạng thái khuôn mặt */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Lọc theo khuôn mặt:</span>
            <button
              type="button"
              onClick={() => setFaceFilter('all')}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                border: '1px solid',
                borderColor: faceFilter === 'all' ? '#2563eb' : '#cbd5e1',
                background: faceFilter === 'all' ? '#eff6ff' : '#ffffff',
                color: faceFilter === 'all' ? '#2563eb' : '#475569',
                cursor: 'pointer',
                fontWeight: faceFilter === 'all' ? 600 : 400,
              }}
            >
              Tất cả ({deptEmployees.length})
            </button>
            <button
              type="button"
              onClick={() => setFaceFilter('enrolled')}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                border: '1px solid',
                borderColor: faceFilter === 'enrolled' ? '#16a34a' : '#cbd5e1',
                background: faceFilter === 'enrolled' ? '#f0fdf4' : '#ffffff',
                color: faceFilter === 'enrolled' ? '#16a34a' : '#475569',
                cursor: 'pointer',
                fontWeight: faceFilter === 'enrolled' ? 600 : 400,
              }}
            >
              ✓ Đã đăng ký ({deptEmployees.filter((e) => e.hasFace).length})
            </button>
            <button
              type="button"
              onClick={() => setFaceFilter('pending')}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                border: '1px solid',
                borderColor: faceFilter === 'pending' ? '#d97706' : '#cbd5e1',
                background: faceFilter === 'pending' ? '#fffbeb' : '#ffffff',
                color: faceFilter === 'pending' ? '#d97706' : '#475569',
                cursor: 'pointer',
                fontWeight: faceFilter === 'pending' ? 600 : 400,
              }}
            >
              ⚠ Chưa đăng ký ({deptEmployees.filter((e) => !e.hasFace).length})
            </button>
          </div>

          {/* Bảng nhân sự trong phòng ban */}
          {loadingDeptEmps ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>Đang tải danh sách nhân viên...</div>
          ) : filteredDeptEmployees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontStyle: 'italic' }}>
              Không có nhân viên nào phù hợp bộ lọc trong phòng ban này.
            </div>
          ) : (
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', color: '#475569' }}>Mã NV</th>
                    <th style={{ padding: '8px 10px', color: '#475569' }}>Họ và tên</th>
                    <th style={{ padding: '8px 10px', color: '#475569' }}>Chức vụ</th>
                    <th style={{ padding: '8px 10px', color: '#475569' }}>Tài khoản</th>
                    <th style={{ padding: '8px 10px', color: '#475569' }}>Trạng thái khuôn mặt</th>
                    <th style={{ padding: '8px 10px', color: '#475569', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeptEmployees.map((emp) => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#2563eb' }}>{emp.code}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 500, color: '#0f172a' }}>{emp.name}</td>
                      <td style={{ padding: '8px 10px', color: '#475569' }}>{emp.position || 'Nhân viên'}</td>
                      <td style={{ padding: '8px 10px' }}>
                        {emp.accountId ? (
                          <span
                            style={{
                              background: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                            title={`Email: ${emp.accountEmail} - Quyền: ${emp.accountRole}`}
                          >
                            {emp.accountRole ? emp.accountRole.toUpperCase() : 'Có TK'}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 11 }}>Chưa có TK</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        {emp.hasFace ? (
                          <span
                            style={{
                              color: '#16a34a',
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontWeight: 600,
                              fontSize: 11,
                            }}
                          >
                            ✓ Đã đăng ký
                          </span>
                        ) : (
                          <span
                            style={{
                              color: '#d97706',
                              background: '#fffbeb',
                              border: '1px solid #fde68a',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontWeight: 600,
                              fontSize: 11,
                            }}
                          >
                            ⚠ Chưa có mặt
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          {!emp.hasFace && canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                setEmpModalOpen(false);
                                navigate(`/employees/${emp.id}/face-enrollment`);
                              }}
                              style={{
                                padding: '3px 8px',
                                fontSize: 11,
                                background: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontWeight: 500,
                              }}
                            >
                              + Đăng ký mặt
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEmpModalOpen(false);
                              navigate(`/employees/${emp.id}`);
                            }}
                            style={{
                              padding: '3px 8px',
                              fontSize: 11,
                              background: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              borderRadius: 4,
                              cursor: 'pointer',
                            }}
                          >
                            Xem hồ sơ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
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
  color: '#374151',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  padding: '9px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  fontSize: 14,
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
};
