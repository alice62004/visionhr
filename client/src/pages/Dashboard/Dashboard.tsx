import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  Users,
  Building2,
  UserX,
  Clock,
  Zap,
  RefreshCw,
  Camera,
  Bot,
  TrendingUp,
  PieChart as PieIcon,
  ArrowRight,
  Info,
} from 'lucide-react';
import { getDashboardOverview, DashboardOverview } from '../../services/dashboardApi';
import './Dashboard.css';

const DEPT_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#64748b', '#06b6d4'];

export default function Dashboard() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOverview = () => {
    setLoading(true);
    getDashboardOverview()
      .then(setData)
      .catch(() => setData(MOCK_DATA))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const d = data || MOCK_DATA;
  const attendanceRate = d.totalEmployees > 0 ? Math.round((d.workingToday / d.totalEmployees) * 100) : 0;

  return (
    <div className="vhr-dashboard-page">
      {/* Header section */}
      <div className="vhr-dash-header">
        <div className="vhr-dash-title-wrap">
          <div className="vhr-dash-pill">
            <Zap size={13} />
            <span>Giám sát Hiện diện • Thời gian thực</span>
          </div>
          <h1 className="vhr-dash-title">Tổng quan Quản trị Nhân sự</h1>
          <p className="vhr-dash-subtitle">
            Giám sát hiện diện, chấm công thời gian thực và chỉ số nhân sự toàn doanh nghiệp
          </p>
        </div>

        <div className="vhr-dash-actions">
          <button
            type="button"
            onClick={fetchOverview}
            disabled={loading}
            className="vhr-dash-btn vhr-dash-btn-outline"
            title="Tải lại chỉ số mới nhất"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
          <Link to="/attendance/terminal" className="vhr-dash-btn vhr-dash-btn-kiosk">
            <Camera size={14} />
            <span>Mở Kiosk Chấm công</span>
          </Link>
          <Link to="/ai-agent" className="vhr-dash-btn vhr-dash-btn-primary">
            <Bot size={14} />
            <span>Hỏi AI HR</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="vhr-dash-stats-grid">
        <StatCard
          label="Tổng số nhân viên"
          value={d.totalEmployees}
          icon={<Users size={20} />}
          iconBg="#eff6ff"
          iconColor="#2563eb"
          tag="Toàn công ty"
          tagBg="#eff6ff"
          tagColor="#2563eb"
          footerText="Dữ liệu nhân sự đã kích hoạt"
        />
        <StatCard
          label="Đang làm việc tại cty"
          value={d.workingToday}
          icon={<Building2 size={20} />}
          iconBg="#ecfdf5"
          iconColor="#10b981"
          tag={`Tỷ lệ: ${attendanceRate}%`}
          tagBg="#ecfdf5"
          tagColor="#059669"
          footerText="Đã check-in hợp lệ qua Kiosk"
        />
        <StatCard
          label="Vắng mặt hôm nay"
          value={d.absentToday}
          icon={<UserX size={20} />}
          iconBg="#fff1f2"
          iconColor="#f43f5e"
          tag={d.absentToday > 0 ? 'Cần đối soát' : 'Đầy đủ'}
          tagBg="#fff1f2"
          tagColor="#e11d48"
          footerText="Bao gồm nghỉ phép & chưa đến"
        />
        <StatCard
          label="Đi muộn hôm nay"
          value={d.lateToday}
          icon={<Clock size={20} />}
          iconBg="#fffbeb"
          iconColor="#f59e0b"
          tag="Sau giờ chuẩn"
          tagBg="#fffbeb"
          tagColor="#d97706"
          footerText="Check-in sau 08:30 sáng"
        />
      </div>

      {/* Charts Grid */}
      <div className="vhr-dash-charts-grid">
        {/* Trend Area Chart */}
        <div className="vhr-chart-card">
          <div className="vhr-chart-header">
            <div className="vhr-chart-title-wrap">
              <div className="vhr-chart-icon">
                <TrendingUp size={18} />
              </div>
              <div>
                <h3 className="vhr-chart-title">Xu hướng Chấm công & Đi muộn</h3>
                <p className="vhr-chart-desc">Phân bố lưu lượng điểm danh theo các mốc giờ sáng</p>
              </div>
            </div>
            <div className="vhr-chart-legend">
              <span className="vhr-legend-item">
                <span className="vhr-legend-dot" style={{ background: '#2563eb' }} />
                <span>Đúng giờ</span>
              </span>
              <span className="vhr-legend-item">
                <span className="vhr-legend-dot" style={{ background: '#f59e0b' }} />
                <span>Đi muộn</span>
              </span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={270}>
            <AreaChart data={d.attendanceTrend.length > 0 ? d.attendanceTrend : MOCK_DATA.attendanceTrend}>
              <defs>
                <linearGradient id="gradientOnTime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gradientLate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" fontSize={12} stroke="#94a3b8" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis fontSize={12} stroke="#94a3b8" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  fontSize: '12.5px',
                  fontWeight: 500,
                }}
              />
              <Area
                type="monotone"
                dataKey="onTime"
                name="Đúng giờ"
                stroke="#2563eb"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#gradientOnTime)"
              />
              <Area
                type="monotone"
                dataKey="late"
                name="Đi muộn"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#gradientLate)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Department Breakdown Donut */}
        <div className="vhr-chart-card">
          <div className="vhr-chart-header">
            <div className="vhr-chart-title-wrap">
              <div className="vhr-chart-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                <PieIcon size={18} />
              </div>
              <div>
                <h3 className="vhr-chart-title">Cơ cấu Phòng ban</h3>
                <p className="vhr-chart-desc">Tỷ trọng nhân sự phân bổ theo các khối bộ phận</p>
              </div>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 999,
                background: '#f1f5f9',
                color: '#475569',
              }}
            >
              {(d.departmentBreakdown.length > 0 ? d.departmentBreakdown : MOCK_DATA.departmentBreakdown).length} Phòng ban
            </span>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <RechartsPieChart>
              <Pie
                data={d.departmentBreakdown.length > 0 ? d.departmentBreakdown : MOCK_DATA.departmentBreakdown}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
              >
                {(d.departmentBreakdown.length > 0 ? d.departmentBreakdown : MOCK_DATA.departmentBreakdown).map(
                  (entry: any, i: number) => (
                    <Cell key={entry.name || i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                  )
                )}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  fontSize: '12px',
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>

          {/* Department Items Legend */}
          <div className="vhr-dept-legend-list">
            {(d.departmentBreakdown.length > 0 ? d.departmentBreakdown : MOCK_DATA.departmentBreakdown).map(
              (item: any, i: number) => (
                <div key={item.name || i} className="vhr-dept-legend-item">
                  <div className="vhr-dept-item-left">
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 3,
                        background: DEPT_COLORS[i % DEPT_COLORS.length],
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>
                      {item.name}
                    </span>
                  </div>
                  <span className="vhr-dept-item-val">{item.value}%</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Quick Access Portals */}
      <div className="vhr-dash-portals-grid">
        <div className="vhr-dash-portal-item">
          <div className="vhr-dash-portal-top">
            <div className="vhr-portal-icon-box" style={{ background: '#dcfce7', color: '#16a34a' }}>
              <Camera size={20} />
            </div>
            <div>
              <div className="vhr-portal-tag">Thị giác máy tính</div>
              <h4 className="vhr-portal-title">Kiosk Chấm công AI</h4>
            </div>
          </div>
          <p className="vhr-portal-desc">
            Điểm danh nhận diện khuôn mặt tự động với công nghệ chống giả mạo Face Liveness và cảnh báo trực tiếp.
          </p>
          <Link to="/attendance/terminal" className="vhr-portal-link">
            <span>Mở Kiosk Điểm Danh</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="vhr-dash-portal-item">
          <div className="vhr-dash-portal-top">
            <div className="vhr-portal-icon-box" style={{ background: '#dbeafe', color: '#2563eb' }}>
              <Users size={20} />
            </div>
            <div>
              <div className="vhr-portal-tag">Sinh trắc học</div>
              <h4 className="vhr-portal-title">Quản lý Nhân sự & Khuôn mặt</h4>
            </div>
          </div>
          <p className="vhr-portal-desc">
            Quản lý hồ sơ nhân viên, phân quyền ca kíp và đăng ký vector 128 chiều khuôn mặt cho camera AI.
          </p>
          <Link to="/employees" className="vhr-portal-link">
            <span>Danh sách Nhân viên</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="vhr-dash-portal-item">
          <div className="vhr-dash-portal-top">
            <div className="vhr-portal-icon-box" style={{ background: '#f3e8ff', color: '#9333ea' }}>
              <Bot size={20} />
            </div>
            <div>
              <div className="vhr-portal-tag">Gemini AI Assistant</div>
              <h4 className="vhr-portal-title">Trợ lý Nhân sự 24/7</h4>
            </div>
          </div>
          <p className="vhr-portal-desc">
            Hỏi đáp chính sách công ty, tra cứu ngày phép còn lại và hỗ trợ quy chế làm việc tức thì bằng mô hình AI.
          </p>
          <Link to="/ai-agent" className="vhr-portal-link">
            <span>Trò chuyện với AI</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  tag: string;
  tagBg: string;
  tagColor: string;
  footerText: string;
}

function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  tag,
  tagBg,
  tagColor,
  footerText,
}: StatCardProps) {
  return (
    <div className="vhr-stat-card">
      <div className="vhr-stat-top">
        <div className="vhr-stat-icon-wrap" style={{ background: iconBg, color: iconColor }}>
          {icon}
        </div>
        <span className="vhr-stat-tag" style={{ background: tagBg, color: tagColor }}>
          {tag}
        </span>
      </div>

      <div className="vhr-stat-body">
        <span className="vhr-stat-label">{label}</span>
        <span className="vhr-stat-val">{value}</span>
      </div>

      <div className="vhr-stat-footer">
        <Info size={13} style={{ opacity: 0.7 }} />
        <span>{footerText}</span>
      </div>
    </div>
  );
}

const MOCK_DATA: DashboardOverview = {
  totalEmployees: 1280,
  workingToday: 1142,
  absentToday: 48,
  lateToday: 26,
  attendanceTrend: [
    { time: '07:30', onTime: 10, late: 0 },
    { time: '07:50', onTime: 60, late: 2 },
    { time: '08:15', onTime: 95, late: 5 },
    { time: '08:30', onTime: 40, late: 30 },
    { time: '08:45', onTime: 10, late: 20 },
    { time: '09:30', onTime: 2, late: 4 },
  ],
  departmentBreakdown: [
    { name: 'Kỹ thuật Công nghệ', value: 38 },
    { name: 'Kinh doanh (Sales)', value: 25 },
    { name: 'Sản xuất (Factory)', value: 20 },
    { name: 'Marketing & Branding', value: 10 },
    { name: 'Khối văn phòng & HR', value: 7 },
  ],
};

