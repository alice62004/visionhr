export interface NotificationPayload {
  title: string;
  message: string;
  createdAt?: string;
  type?: 'face' | 'account' | 'attendance' | 'system' | 'welcome' | 'leave';
  link?: string;
  targetUserId?: number | string | 'all';
  targetRole?: string[]; // Ví dụ: ['admin', 'hr', 'manager']
}

export function formatNotificationTime(createdAtStr?: string, fallbackText?: string): string {
  if (!createdAtStr) return fallbackText || 'Vừa xong';
  const date = new Date(createdAtStr);
  if (isNaN(date.getTime())) return fallbackText || createdAtStr;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);

  // Vừa mới tạo dưới 1 phút hoặc lệch mili-giây
  if (diffMinutes < 1) return 'Vừa xong';
  // Dưới 60 phút
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  // Kiểm tra cùng ngày (Hôm nay)
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');

  if (isToday) {
    if (diffHours < 4) return `${diffHours} giờ trước`;
    return `Hôm nay, ${hh}:${mm}`;
  }

  // Hôm qua
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return `Hôm qua, ${hh}:${mm}`;
  }

  // Khác ngày: DD/MM/YYYY, HH:mm
  const dd = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${month}/${yyyy}, ${hh}:${mm}`;
}

export function emitSystemNotification(payload: NotificationPayload) {
  try {
    const id = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const createdAt = payload.createdAt || new Date().toISOString();
    const newNotif = {
      id,
      title: payload.title,
      message: payload.message,
      createdAt,
      timestamp: formatNotificationTime(createdAt),
      type: payload.type || 'system',
      link: payload.link || '/dashboard',
      targetUserId: payload.targetUserId || 'all',
      targetRole: payload.targetRole,
      read: false,
    };

    // Lấy thông tin user hiện tại đang login để đối chiếu
    let currentAuthUser: any = null;
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        currentAuthUser = parsed.state?.user;
      }
    } catch {}

    // Lưu đúng vào key của tài khoản đích
    if (newNotif.targetUserId !== 'all') {
      const userKey = `visionhr_notifications_${newNotif.targetUserId}`;
      try {
        const list = JSON.parse(localStorage.getItem(userKey) || '[]');
        list.unshift(newNotif);
        localStorage.setItem(userKey, JSON.stringify(list.slice(0, 40)));
      } catch (e) {}
    } else {
      // Nếu là all, cập nhật vào tất cả các key user hiện có trong browser
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('visionhr_notifications_')) {
          try {
            const list = JSON.parse(localStorage.getItem(key) || '[]');
            list.unshift(newNotif);
            localStorage.setItem(key, JSON.stringify(list.slice(0, 40)));
          } catch (e) {}
        }
      }
    }

    // Phát sự kiện toàn cục để UI cập nhật thời gian thực
    window.dispatchEvent(
      new CustomEvent('visionhr_notification_event', { detail: newNotif })
    );

    // Chỉ hiển thị Toast nếu người đang đăng nhập thuộc đối tượng nhận thông báo
    const shouldShowToast =
      !currentAuthUser ||
      newNotif.targetUserId === 'all' ||
      String(newNotif.targetUserId) === String(currentAuthUser.id) ||
      (newNotif.targetRole && newNotif.targetRole.includes(currentAuthUser.role));

    if (shouldShowToast) {
      showFloatingToast(newNotif.title, newNotif.message);
    }
  } catch (err) {
    console.error('Lỗi khi phát thông báo:', err);
  }
}

function showFloatingToast(title: string, message: string) {
  const toastId = 'visionhr-toast-container';
  let container = document.getElementById(toastId);
  if (!container) {
    container = document.createElement('div');
    container.id = toastId;
    container.style.position = 'fixed';
    container.style.top = '72px';
    container.style.right = '24px';
    container.style.zIndex = '99999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '8px';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.background = '#ffffff';
  toast.style.color = '#0f172a';
  toast.style.border = '1px solid #bfdbfe';
  toast.style.borderLeft = '4px solid #2563eb';
  toast.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)';
  toast.style.borderRadius = '8px';
  toast.style.padding = '10px 16px';
  toast.style.maxWidth = '360px';
  toast.style.fontSize = '13px';
  toast.style.pointerEvents = 'auto';
  toast.style.transition = 'all 0.3s ease';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(-10px)';

  toast.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 8px;">
      <span style="font-size: 16px; line-height: 1.2;">🔔</span>
      <div>
        <div style="font-weight: 700; color: #1e3a8a; margin-bottom: 2px;">${title}</div>
        <div style="color: #475569; font-size: 12px; line-height: 1.4;">${message}</div>
      </div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 300);
  }, 4500);
}
