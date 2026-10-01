import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmployees, deleteEmployee } from '../../services/employeeApi';
import Table, { Column } from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import { useAuthStore } from '../../store/authStore';
import { Employee, EmployeeStatus } from '../../types';

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const canEdit = role === 'admin' || role === 'hr';

  const load = () => {
    getEmployees()
      .then(setEmployees)
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa nhân viên "${name}" không?`)) return;
    try {
      await deleteEmployee(id);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Xóa thất bại.');
    }
  };

  const columns: Column<Employee>[] = [
    { key: 'code', label: 'Mã NV' },
    { key: 'name', label: 'Họ tên' },
    { key: 'department', label: 'Phòng ban' },
    { key: 'position', label: 'Chức vụ' },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'account',
      label: 'Tài khoản',
      render: (row) =>
        row.accountId ? (
          <span
            style={{
              color: '#2563eb',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '2px 8px',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 12,
            }}
            title={row.accountEmail || ''}
          >
            {row.accountRole ? row.accountRole.toUpperCase() : 'ĐÃ CẤP'}
          </span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>Chưa cấp</span>
            {canEdit && (
              <button
                type="button"
                onClick={() => navigate(`/employees/${row.id}/edit`)}
                style={{
                  padding: '2px 8px',
                  fontSize: 11,
                  background: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
                title="Cấp hoặc liên kết tài khoản đăng nhập"
              >
                + Cấp TK
              </button>
            )}
          </div>
        ),
    },
    {
      key: 'hasFace',
      label: 'Khuôn mặt',
      render: (row) =>
        row.hasFace ? (
          <span
            style={{
              color: '#16a34a',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '2px 8px',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            ✓ Đã đăng ký
          </span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                color: '#d97706',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                padding: '2px 8px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              Chưa có
            </span>
            {canEdit && (
              <button
                type="button"
                onClick={() => navigate(`/employees/${row.id}/face-enrollment`)}
                style={{
                  padding: '2px 8px',
                  fontSize: 11,
                  background: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                + Đăng ký
              </button>
            )}
          </div>
        ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button variant="secondary" onClick={() => navigate(`/employees/${row.id}`)}>
            Xem
          </Button>
          {canEdit && (
            <>
              <Button variant="secondary" onClick={() => navigate(`/employees/${row.id}/edit`)}>
                Sửa
              </Button>
              <Button variant="danger" onClick={() => handleDelete(row.id, row.name)}>
                Xóa
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px 0', color: '#111827' }}>
            Danh sách nhân viên
          </h1>
          <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: 14 }}>
            Quản lý hồ sơ và thông tin nhân sự toàn công ty
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => navigate('/employees/new')}>+ Thêm nhân viên</Button>
        )}
      </div>

      {loading ? <p>Đang tải...</p> : <Table columns={columns} data={employees} />}
    </div>
  );
}

function StatusBadge({ status }: { status: EmployeeStatus }) {
  const isWorking = status === 'dang_lam_viec';
  const color = isWorking ? '#16a34a' : '#dc2626';
  const label = isWorking ? 'Đang làm việc' : 'Đã nghỉ việc';
  return (
    <span
      style={{
        color,
        background: isWorking ? '#f0fdf4' : '#fef2f2',
        border: `1px solid ${isWorking ? '#bbf7d0' : '#fecaca'}`,
        padding: '2px 8px',
        borderRadius: 6,
        fontWeight: 600,
        fontSize: 12,
      }}
    >
      {label}
    </span>
  );
}
