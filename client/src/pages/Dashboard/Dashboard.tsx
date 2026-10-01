import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getDashboardOverview, DashboardOverview } from '../../services/dashboardApi';

const DEPT_COLORS = ['#2563eb', '#22c55e', '#f59e0b', '#a855f7', '#64748b'];

export default function Dashboard() {
  const [data, setData] = useState<DashboardOverview | null>(null);

  useEffect(() => {
    getDashboardOverview()
      .then(setData)
      .catch(() => setData(MOCK_DATA));
  }, []);

  const d = data || MOCK_DATA;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px 0', color: '#111827' }}>
        Tổng quan Quản trị Nhân sự
      </h1>
      <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: 14 }}>
        Giám sát hiện diện, chấm công thời gian thực và chỉ số nhân sự toàn doanh nghiệp
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <StatCard label="Tổng số nhân viên" value={d.totalEmployees} />
        <StatCard label="Đang làm việc tại cty" value={d.workingToday} />
        <StatCard label="Vắng mặt hôm nay" value={d.absentToday} />
        <StatCard label="Đi muộn hôm nay" value={d.lateToday} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 16,
        }}
      >
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
            padding: 20,
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>Xu hướng Chấm công & Đi muộn</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={d.attendanceTrend.length > 0 ? d.attendanceTrend : MOCK_DATA.attendanceTrend}>
              <XAxis dataKey="time" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="onTime" name="Đúng giờ" stroke="#2563eb" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="late" name="Đi muộn" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
            padding: 20,
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>Cơ cấu Phòng ban</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={d.departmentBreakdown.length > 0 ? d.departmentBreakdown : MOCK_DATA.departmentBreakdown}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
              >
                {(d.departmentBreakdown.length > 0 ? d.departmentBreakdown : MOCK_DATA.departmentBreakdown).map(
                  (entry: any, i: number) => (
                    <Cell key={entry.name || i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                  )
                )}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <span style={{ fontSize: 13, color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>{value}</span>
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
