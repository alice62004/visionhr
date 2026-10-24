import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCog,
  ScanFace,
  Building2,
  Clock,
  CalendarCheck,
  Camera,
  CalendarOff,
  Timer,
  CircleDollarSign,
  Bot,
  BarChart3,
  ScrollText,
  Settings,
  Search,
  ExternalLink,
  ChevronRight,
  User,
  History,
  CalendarDays,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';

interface MenuItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  badge?: string;
  roles: UserRole[];
  section?: string;
}

const MENU: MenuItem[] = [
  // Tổng quan
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'hr', 'manager', 'employee'], section: 'TỔNG QUAN' },
  { label: 'AI HR Agent', path: '/ai-agent', icon: Bot, badge: 'AI', roles: ['admin', 'hr', 'manager', 'employee'], section: 'TỔNG QUAN' },

  // Cá nhân & Công tác
  { label: 'Hồ sơ của tôi', path: '/my-profile', icon: User, roles: ['admin', 'hr', 'manager', 'employee'], section: 'CÁ NHÂN' },
  { label: 'Lịch làm việc của tôi', path: '/my-schedule', icon: CalendarDays, roles: ['admin', 'hr', 'manager', 'employee'], section: 'CÁ NHÂN' },
  { label: 'Lịch sử làm việc', path: '/work-history', icon: History, roles: ['admin', 'hr', 'manager', 'employee'], section: 'CÁ NHÂN' },

  // Quản lý Nhân sự
  { label: 'Nhân viên', path: '/employees', icon: Users, roles: ['admin', 'hr', 'manager'], section: 'QUẢN LÝ NHÂN SỰ' },
  { label: 'Hợp đồng lao động', path: '/contracts', icon: FileText, roles: ['admin', 'hr', 'manager', 'employee'], section: 'QUẢN LÝ NHÂN SỰ' },
  { label: 'Quản lý tài khoản', path: '/users', icon: UserCog, roles: ['admin'], section: 'QUẢN LÝ NHÂN SỰ' },
  { label: 'Đăng ký khuôn mặt', path: '/employees/face-enrollment', icon: ScanFace, badge: 'AI', roles: ['admin', 'hr'], section: 'QUẢN LÝ NHÂN SỰ' },
  { label: 'Phòng ban', path: '/departments', icon: Building2, roles: ['admin', 'hr'], section: 'QUẢN LÝ NHÂN SỰ' },

  // Chấm công & Ca
  { label: 'Kiosk Chấm công AI', path: '/attendance/terminal', icon: Camera, badge: 'Kiosk', roles: ['admin', 'hr', 'manager', 'employee'], section: 'CHẤM CÔNG & CA' },
  { label: 'Chấm công', path: '/attendance', icon: CalendarCheck, roles: ['admin', 'hr', 'manager', 'employee'], section: 'CHẤM CÔNG & CA' },
  { label: 'Ca làm việc', path: '/shifts', icon: Clock, roles: ['admin', 'hr', 'manager'], section: 'CHẤM CÔNG & CA' },
  { label: 'Phân lịch làm việc', path: '/shift-scheduling', icon: CalendarDays, roles: ['admin', 'hr', 'manager'], section: 'CHẤM CÔNG & CA' },
  { label: 'Nghỉ phép', path: '/leave', icon: CalendarOff, roles: ['admin', 'hr', 'manager', 'employee'], section: 'CHẤM CÔNG & CA' },
  { label: 'Tăng ca (OT)', path: '/overtime', icon: Timer, roles: ['admin', 'hr', 'manager', 'employee'], section: 'CHẤM CÔNG & CA' },

  // Lương & Báo cáo
  { label: 'Tính lương', path: '/payroll', icon: CircleDollarSign, roles: ['admin', 'hr'], section: 'LƯƠNG & BÁO CÁO' },
  { label: 'Báo cáo', path: '/reports', icon: BarChart3, roles: ['admin', 'hr', 'manager'], section: 'LƯƠNG & BÁO CÁO' },
  { label: 'Audit Log', path: '/audit-log', icon: ScrollText, roles: ['admin'], section: 'LƯƠNG & BÁO CÁO' },
  { label: 'Cấu hình hệ thống', path: '/settings', icon: Settings, roles: ['admin'], section: 'LƯƠNG & BÁO CÁO' },
];

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const role: UserRole = user?.role || 'employee';
  const [filter, setFilter] = useState('');

  const items = MENU.filter(
    (item) =>
      item.roles.includes(role) &&
      (filter === '' || item.label.toLowerCase().includes(filter.toLowerCase()))
  );

  // Nhóm theo Section
  const sections = Array.from(new Set(items.map((i) => i.section || 'KHÁC')));

  return (
    <aside
      style={{
        width: 256,
        background: 'linear-gradient(180deg, #184a8c 0%, #153e77 100%)',
        color: '#e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        borderRight: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '3px 0 15px rgba(15, 45, 85, 0.12)',
        userSelect: 'none',
      }}
    >
      {/* Brand Header matching Base HRM style */}
      <div
        style={{
          padding: '18px 16px 14px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
          }}
          title="Về Cổng thông tin VisionHR"
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#ffffff',
              color: '#184a8c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 18,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              flexShrink: 0,
            }}
          >
            V
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: -0.3,
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              VisionHR
            </span>
            <span
              style={{
                fontSize: 11.5,
                color: 'rgba(255, 255, 255, 0.72)',
                fontWeight: 400,
              }}
            >
              Quản trị nhân sự AI
            </span>
          </div>
        </Link>

        {/* Quick Filter Search inside Sidebar */}
        <div
          style={{
            marginTop: 14,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 10,
              color: 'rgba(255, 255, 255, 0.6)',
              pointerEvents: 'none',
            }}
          />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Tìm chức năng..."
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: 7,
              padding: '6px 10px 6px 30px',
              color: '#ffffff',
              fontSize: 12.5,
              outline: 'none',
              transition: 'all 0.15s ease',
            }}
            onFocus={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.35)';
            }}
            onBlur={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.12)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.18)';
            }}
          />
        </div>
      </div>

      {/* Nav Menu */}
      <nav
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          padding: '14px 10px',
          flex: 1,
          overflowY: 'auto',
        }}
      >
        {sections.map((secName) => {
          const sectionItems = items.filter((i) => (i.section || 'KHÁC') === secName);
          if (sectionItems.length === 0) return null;

          return (
            <div key={secName} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.8px',
                  color: 'rgba(255, 255, 255, 0.55)',
                  padding: '4px 10px 2px 10px',
                }}
              >
                {secName}
              </div>

              {sectionItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    style={({ isActive }) => ({
                      padding: '8px 12px',
                      fontSize: 13,
                      borderRadius: 8,
                      background: isActive ? '#2563eb' : 'transparent',
                      color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
                      fontWeight: isActive ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                      boxShadow: isActive ? '0 2px 6px rgba(0, 0, 0, 0.2)' : 'none',
                    })}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.className.includes('active')) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.color = '#ffffff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.className.includes('active')) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <IconComponent
                        size={17}
                        style={{
                          opacity: 0.95,
                          flexShrink: 0,
                          strokeWidth: 1.9,
                        }}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: 4,
                          background:
                            item.badge === 'AI' || item.badge === 'Agent'
                              ? 'rgba(192, 132, 252, 0.25)'
                              : 'rgba(74, 222, 128, 0.25)',
                          color:
                            item.badge === 'AI' || item.badge === 'Agent'
                              ? '#e9d5ff'
                              : '#bbf7d0',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer link to public HomePage portal */}
      <div
        style={{
          padding: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(0, 0, 0, 0.1)',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.08)',
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: 12.5,
            fontWeight: 500,
            textDecoration: 'none',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExternalLink size={14} />
            <span>Cổng thông tin</span>
          </div>
          <ChevronRight size={14} style={{ opacity: 0.6 }} />
        </Link>
      </div>
    </aside>
  );
}
