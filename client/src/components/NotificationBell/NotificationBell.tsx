import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ScanFace,
  KeyRound,
  CalendarCheck,
  CalendarOff,
  Sparkles,
  Info,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { formatNotificationTime } from '../../utils/notificationService';
import { getDefaultNotifications } from './defaultNotifications';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  timestamp?: string;
  type: 'face' | 'account' | 'attendance' | 'system' | 'welcome' | 'leave';
  link?: string;
  read: boolean;
}

export default function NotificationBell() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const storageKey = `visionhr_notifications_${user?.id || 'guest'}`;

  // Định kỳ re-render mỗi 30s để thời gian tương đối (ví dụ: X phút trước) luôn chính xác
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  // Tự động chuẩn hóa dữ liệu cũ trong localStorage nếu thiếu createdAt
  const sanitizeNotifications = (list: any[]): AppNotification[] => {
    if (!Array.isArray(list)) return [];
    const now = Date.now();
    return list.map((item, index) => {
      let createdAt = item.createdAt;
      if (!createdAt) {
        const hoursAgo = index === 0 ? 0.3 : index === 1 ? 2.5 : (index + 1) * 24;
        createdAt = new Date(now - hoursAgo * 3600 * 1000).toISOString();
      }
      return {
        ...item,
        createdAt,
        timestamp: formatNotificationTime(createdAt, item.timestamp),
      };
    });
  };

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return sanitizeNotifications(JSON.parse(saved));
    } catch (e) {}
    return getDefaultNotifications(user);
  });

  // Tự động load lại danh sách khi đổi tài khoản
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setNotifications(sanitizeNotifications(JSON.parse(saved)));
      } else {
        setNotifications(getDefaultNotifications(user));
      }
    } catch (e) {
      setNotifications(getDefaultNotifications(user));
    }
  }, [storageKey, user?.id, user?.role]);

  // Lưu vào localStorage theo tài khoản
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notifications));
    } catch (e) {}
  }, [notifications, storageKey]);

  // Lắng nghe sự kiện thông báo mới: CHỈ NHẬN NẾU ĐÚNG TÀI KHOẢN HOẶC VAI TRÒ
  useEffect(() => {
    const handleNewNotif = (e: any) => {
      const item = e.detail;
      if (!item) return;

      const isForMe =
        !item.targetUserId ||
        item.targetUserId === 'all' ||
        String(item.targetUserId) === String(user?.id) ||
        (item.targetRole && item.targetRole.includes(user?.role));

      if (isForMe) {
        setNotifications((prev) => [item, ...prev]);
      }
    };
    window.addEventListener('visionhr_notification_event', handleNewNotif);
    return () => window.removeEventListener('visionhr_notification_event', handleNewNotif);
  }, [user?.id, user?.role]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (item: AppNotification) => {
    markAsRead(item.id);
    setIsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const filteredNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => !n.read)
      : notifications;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'leave':
        return <CalendarOff size={16} color="#dc2626" />;
      case 'face':
        return <ScanFace size={16} color="#2563eb" />;
      case 'account':
        return <KeyRound size={16} color="#7c3aed" />;
      case 'attendance':
        return <CalendarCheck size={16} color="#16a34a" />;
      case 'system':
        return <Sparkles size={16} color="#ea580c" />;
      case 'welcome':
      default:
        return <Info size={16} color="#184a8c" />;
    }
  };

  const getIconBg = (type: AppNotification['type']) => {
    switch (type) {
      case 'leave':
        return '#fef2f2';
      case 'face':
        return '#eff6ff';
      case 'account':
        return '#f5f3ff';
      case 'attendance':
        return '#f0fdf4';
      case 'system':
        return '#fff7ed';
      case 'welcome':
      default:
        return '#f0f4fa';
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          position: 'relative',
          background: isOpen ? '#eff6ff' : '#f8fafc',
          border: isOpen ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
          borderRadius: 8,
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: isOpen ? '#184a8c' : '#475569',
          transition: 'all 0.15s ease',
        }}
        title="Thông báo hệ thống"
      >
        <Bell size={18} />

        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: '#ef4444',
              color: '#ffffff',
              fontSize: 10.5,
              fontWeight: 700,
              minWidth: 18,
              height: 18,
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #ffffff',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 44,
            right: 0,
            width: 380,
            maxHeight: 520,
            background: '#ffffff',
            borderRadius: 12,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px 10px 16px',
              borderBottom: '1px solid #f1f5f9',
              background: '#ffffff',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  Thông báo
                </span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      background: '#eff6ff',
                      color: '#2563eb',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 999,
                      border: '1px solid #bfdbfe',
                    }}
                  >
                    {unreadCount} mới
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                    title="Đánh dấu tất cả là đã đọc"
                  >
                    <CheckCheck size={14} />
                    <span>Đã đọc</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllNotifications}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      borderRadius: 4,
                    }}
                    title="Xóa tất cả thông báo"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeTab === 'all' ? '#184a8c' : '#f1f5f9',
                  color: activeTab === 'all' ? '#ffffff' : '#64748b',
                  transition: 'all 0.15s ease',
                }}
              >
                Tất cả ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeTab === 'unread' ? '#184a8c' : '#f1f5f9',
                  color: activeTab === 'unread' ? '#ffffff' : '#64748b',
                  transition: 'all 0.15s ease',
                }}
              >
                Chưa đọc ({unreadCount})
              </button>
            </div>
          </div>

          {/* List of Notifications */}
          <div style={{ maxHeight: 380, overflowY: 'auto', background: '#fafbfc' }}>
            {filteredNotifications.length === 0 ? (
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: 13,
                }}
              >
                <div style={{ marginBottom: 6, fontSize: 24 }}>🔔</div>
                <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 2 }}>
                  Không có thông báo nào
                </div>
                <div style={{ fontSize: 12 }}>Bạn đã xem hết các thông báo mới nhất!</div>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  style={{
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    cursor: 'pointer',
                    background: item.read ? '#ffffff' : '#f0f7ff',
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'background 0.15s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = item.read ? '#f8fafc' : '#e6f0fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = item.read ? '#ffffff' : '#f0f7ff';
                  }}
                >
                  {/* Icon Avatar */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: getIconBg(item.type),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {getIcon(item.type)}
                  </div>

                  {/* Notification Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        marginBottom: 3,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: item.read ? 600 : 700,
                          color: '#0f172a',
                          lineHeight: 1.3,
                        }}
                      >
                        {item.title}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
                        {formatNotificationTime(item.createdAt, item.timestamp)}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: 12,
                        color: '#64748b',
                        margin: '0 0 6px 0',
                        lineHeight: 1.4,
                      }}
                    >
                      {item.message}
                    </p>

                    {item.link && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 2,
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: '#2563eb',
                        }}
                      >
                        Xem chi tiết <ChevronRight size={12} />
                      </span>
                    )}
                  </div>

                  {/* Unread dot */}
                  {!item.read && (
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#2563eb',
                        marginTop: 6,
                        flexShrink: 0,
                      }}
                      title="Chưa đọc"
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '10px 16px',
              borderTop: '1px solid #f1f5f9',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11.5,
              color: '#94a3b8',
            }}
          >
            <span>VisionHR Notifications System</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 11.5,
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
