import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Camera, Globe, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import NotificationBell from '../NotificationBell/NotificationBell';

export default function Topbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    navigate(`/employees?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  const roleLabels: Record<string, string> = {
    admin: 'QUẢN TRỊ VIÊN',
    hr: 'NHÂN SỰ (HR)',
    manager: 'QUẢN LÝ',
    employee: 'NHÂN VIÊN',
  };

  const displayRole = user?.role ? (roleLabels[user.role] || user.role.toUpperCase()) : 'NGƯỜI DÙNG';
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header
      style={{
        height: 60,
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: 340 }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: searchFocused ? '#2563eb' : '#94a3b8',
            pointerEvents: 'none',
            transition: 'color 0.15s ease',
          }}
        />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          style={{
            width: '100%',
            padding: '7px 12px 7px 36px',
            border: searchFocused ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
            borderRadius: 8,
            fontSize: 13,
            background: searchFocused ? '#ffffff' : '#f8fafc',
            outline: 'none',
            color: '#1e293b',
            boxShadow: searchFocused ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'none',
            transition: 'all 0.15s ease',
          }}
          placeholder="Tìm kiếm nhân viên, mã NV, phòng ban..."
        />
      </form>

      {/* Right Actions & User Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
        {/* Quick Shortcut to Kiosk */}
        <Link
          to="/attendance/terminal"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 7,
            fontSize: 12.5,
            fontWeight: 600,
            background: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0',
            textDecoration: 'none',
            transition: 'all 0.15s ease',
          }}
          title="Mở Kiosk Chấm công khuôn mặt AI"
        >
          <Camera size={14} />
          <span>Kiosk AI</span>
        </Link>

        {/* Shortcut to Home Page */}
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 7,
            fontSize: 12.5,
            fontWeight: 600,
            background: '#eff6ff',
            color: '#2563eb',
            border: '1px solid #bfdbfe',
            textDecoration: 'none',
            transition: 'all 0.15s ease',
          }}
          title="Xem Cổng thông tin trang chủ"
        >
          <Globe size={14} />
          <span>Trang chủ</span>
        </Link>

        {/* Hệ thống thông báo mới */}
        <NotificationBell />

        <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />

        {/* User Pill matching HomePage style */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 10px 4px 6px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 999,
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: '#184a8c',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11.5,
              fontWeight: 700,
            }}
          >
            {initial}
          </div>
          <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>
            {user?.name || 'Người dùng'}
          </span>
          <span
            style={{
              background: '#e0e7ff',
              color: '#3730a3',
              padding: '2px 8px',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 10.5,
              border: '1px solid #c7d2fe',
              letterSpacing: 0.3,
            }}
          >
            {displayRole}
          </span>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          style={{
            background: 'transparent',
            color: '#64748b',
            border: '1px solid #e2e8f0',
            padding: '6px 11px',
            borderRadius: 7,
            fontSize: 12.5,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#dc2626';
            e.currentTarget.style.borderColor = '#fca5a5';
            e.currentTarget.style.background = '#fef2f2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#64748b';
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <LogOut size={13} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
