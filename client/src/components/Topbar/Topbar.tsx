import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Button from '../Button/Button';

export default function Topbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabels: Record<string, string> = {
    admin: 'QUẢN TRỊ VIÊN',
    hr: 'NHÂN SỰ (HR)',
    manager: 'QUẢN LÝ',
    employee: 'NHÂN VIÊN',
  };

  const displayRole = user?.role ? (roleLabels[user.role] || user.role.toUpperCase()) : 'NGƯỜI DÙNG';

  return (
    <header
      style={{
        height: 64,
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
    >
      <input
        style={{
          width: 320,
          padding: '8px 12px',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          fontSize: 13,
          outline: 'none',
        }}
        placeholder="Tìm kiếm nhân viên, mã NV, phòng ban..."
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
        <span
          style={{
            background: '#eef2ff',
            color: '#1e40af',
            padding: '4px 8px',
            borderRadius: 6,
            fontWeight: 700,
            fontSize: 11,
          }}
        >
          {displayRole}
        </span>
        <span style={{ fontWeight: 600, color: '#111827' }}>{user?.name || 'Người dùng'}</span>
        <Button variant="ghost" onClick={handleLogout}>Đăng xuất</Button>
      </div>
    </header>
  );
}
