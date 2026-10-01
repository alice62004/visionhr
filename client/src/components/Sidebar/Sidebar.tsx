import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';

interface MenuItem {
  label: string;
  path: string;
  roles: UserRole[];
}

const MENU: MenuItem[] = [
  { label: 'Dashboard', path: '/dashboard', roles: ['admin', 'hr', 'manager', 'employee'] },
  { label: 'Nhân viên', path: '/employees', roles: ['admin', 'hr', 'manager'] },
  { label: 'Quản lý tài khoản', path: '/users', roles: ['admin'] },
  { label: 'Đăng ký khuôn mặt', path: '/employees/face-enrollment', roles: ['admin', 'hr'] },
  { label: 'Phòng ban', path: '/departments', roles: ['admin', 'hr'] },
  { label: 'Ca làm việc', path: '/shifts', roles: ['admin', 'hr', 'manager'] },
  { label: 'Chấm công', path: '/attendance', roles: ['admin', 'hr', 'manager', 'employee'] },
  { label: 'Kiosk Chấm công AI', path: '/attendance/terminal', roles: ['admin', 'hr', 'manager', 'employee'] },
  { label: 'Nghỉ phép', path: '/leave', roles: ['admin', 'hr', 'manager', 'employee'] },
  { label: 'Tăng ca (OT)', path: '/overtime', roles: ['admin', 'hr', 'manager', 'employee'] },
  { label: 'Tính lương', path: '/payroll', roles: ['admin', 'hr'] },
  { label: 'AI HR Agent', path: '/ai-agent', roles: ['admin', 'hr', 'manager', 'employee'] },
  { label: 'Báo cáo', path: '/reports', roles: ['admin', 'hr', 'manager'] },
  { label: 'Audit Log', path: '/audit-log', roles: ['admin'] },
  { label: 'Cấu hình hệ thống', path: '/settings', roles: ['admin'] },
];

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const role: UserRole = user?.role || 'employee';

  const items = MENU.filter((item) => item.roles.includes(role));

  return (
    <aside
      style={{
        width: 240,
        background: '#0f172a',
        color: '#cbd5e1',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 0',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: '#ffffff',
          padding: '0 20px 20px 20px',
          letterSpacing: 0.5,
        }}
      >
        VisionHR
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              padding: '10px 20px',
              fontSize: 14,
              borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent',
              background: isActive ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
              color: isActive ? '#ffffff' : '#cbd5e1',
              fontWeight: isActive ? 600 : 400,
              display: 'block',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
