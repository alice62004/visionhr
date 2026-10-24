import { formatNotificationTime } from '../../utils/notificationService';
import { AppNotification } from './NotificationBell';

export function getDefaultNotifications(user: any): AppNotification[] {
  const now = Date.now();

  // Dành cho vai trò Employee
  if (user?.role === 'employee') {
    const t1 = new Date(now - 10 * 60 * 1000).toISOString();
    const t2 = new Date(now - 3 * 3600 * 1000).toISOString();
    const t3 = new Date(now - 26 * 3600 * 1000).toISOString();
    return [
      {
        id: `notif-emp-${user.id}-1`,
        title: `Chào mừng ${user.name || 'bạn'} đến với VisionHR!`,
        message: 'Tài khoản nhân viên của bạn đã sẵn sàng. Hãy xem hồ sơ cá nhân và lịch sử làm việc của mình.',
        createdAt: t1,
        timestamp: formatNotificationTime(t1),
        type: 'welcome',
        link: '/my-profile',
        read: false,
      },
      {
        id: `notif-emp-${user.id}-2`,
        title: 'Đăng ký khuôn mặt chấm công AI',
        message: 'Đăng ký nhận diện khuôn mặt để điểm danh ca làm việc nhanh chóng qua camera Kiosk.',
        createdAt: t2,
        timestamp: formatNotificationTime(t2),
        type: 'face',
        link: '/employees/face-enrollment',
        read: false,
      },
      {
        id: `notif-emp-${user.id}-3`,
        title: 'Bảng công cá nhân của bạn',
        message: 'Bảng chấm công hiện chỉ hiển thị dữ liệu làm việc của riêng bạn, bảo mật tuyệt đối.',
        createdAt: t3,
        timestamp: formatNotificationTime(t3),
        type: 'attendance',
        link: '/attendance',
        read: true,
      },
    ];
  }

  // Dành cho vai trò Manager
  if (user?.role === 'manager') {
    const t1 = new Date(now - 15 * 60 * 1000).toISOString();
    const t2 = new Date(now - 2 * 3600 * 1000).toISOString();
    const t3 = new Date(now - 28 * 3600 * 1000).toISOString();
    return [
      {
        id: `notif-mgr-${user.id}-1`,
        title: `Cổng Quản lý VisionHR`,
        message: `Xin chào ${user.name || 'Quản lý'}! Bạn có thể xem bảng công, duyệt đơn nghỉ phép và duyệt tăng ca của phòng ban.`,
        createdAt: t1,
        timestamp: formatNotificationTime(t1),
        type: 'welcome',
        link: '/dashboard',
        read: false,
      },
      {
        id: `notif-mgr-${user.id}-2`,
        title: 'Quyền phê duyệt đơn từ phòng ban',
        message: 'Các đơn nghỉ phép và đơn đăng ký OT từ nhân viên sẽ được gửi trực tiếp đến bạn để phê duyệt.',
        createdAt: t2,
        timestamp: formatNotificationTime(t2),
        type: 'system',
        link: '/leave',
        read: false,
      },
      {
        id: `notif-mgr-${user.id}-3`,
        title: 'Kiosk Chấm công AI phòng ban',
        message: 'Theo dõi tình trạng chấm công và quét khuôn mặt theo ca của nhân viên phòng ban.',
        createdAt: t3,
        timestamp: formatNotificationTime(t3),
        type: 'attendance',
        link: '/attendance',
        read: true,
      },
    ];
  }

  // Dành cho Admin / HR
  const t1 = new Date(now - 15 * 60 * 1000).toISOString();
  const t2 = new Date(now - 3 * 3600 * 1000).toISOString();
  const t3 = new Date(now - 30 * 3600 * 1000).toISOString();
  return [
    {
      id: `notif-adm-${user?.id || 'admin'}-1`,
      title: 'Cổng Quản trị Nhân sự VisionHR',
      message: `Xin chào ${user?.name || 'Quản trị viên'}! Hệ thống quản lý toàn diện nhân sự và bảng chấm công sẵn sàng.`,
      createdAt: t1,
      timestamp: formatNotificationTime(t1),
      type: 'welcome',
      link: '/dashboard',
      read: false,
    },
    {
      id: `notif-adm-${user?.id || 'admin'}-2`,
      title: 'Hệ thống sinh mã NV tự động MySQL',
      message: 'Mã nhân viên (NV...) tự động tăng dần trong cơ sở dữ liệu đã được kích hoạt thành công.',
      createdAt: t2,
      timestamp: formatNotificationTime(t2),
      type: 'system',
      link: '/employees',
      read: false,
    },
    {
      id: `notif-adm-${user?.id || 'admin'}-3`,
      title: 'Chấm công ca làm việc & chống quét trùng',
      message: 'Quy chuẩn Ca sáng 8h-11h30, Ca chiều 13h30-17h và giới hạn 1 lần quét đã áp dụng.',
      createdAt: t3,
      timestamp: formatNotificationTime(t3),
      type: 'attendance',
      link: '/attendance',
      read: true,
    },
  ];
}
