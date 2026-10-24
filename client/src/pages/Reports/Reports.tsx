import { useEffect, useState, useMemo } from 'react';
import {
  Award,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  Star,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import { getKpiOverview, KpiOverviewData, EmployeeKpiItem } from '../../services/reportApi';
import Table, { Column } from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';

export default function Reports() {
  const [data, setData] = useState<KpiOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'all' | 'A' | 'B' | 'C' | 'D'>('all');
  const [selectedKpi, setSelectedKpi] = useState<EmployeeKpiItem | null>(null);

  const fetchKpis = (month: string) => {
    setLoading(true);
    getKpiOverview({ month })
      .then((res) => setData(res))
      .catch((err) => {
        console.error('Failed to fetch KPI overview:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchKpis(selectedMonth);
  }, [selectedMonth]);

  // Lọc danh sách nhân viên
  const filteredEmployees = useMemo(() => {
    if (!data?.employeeKpis) return [];
    return data.employeeKpis.filter((emp) => {
      if (gradeFilter !== 'all' && emp.grade !== gradeFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = emp.name.toLowerCase().includes(term);
        const matchCode = emp.code.toLowerCase().includes(term);
        const matchDept = emp.department.toLowerCase().includes(term);
        if (!matchName && !matchCode && !matchDept) return false;
      }
      return true;
    });
  }, [data, gradeFilter, searchTerm]);

  // Top 3 nhân viên xuất sắc
  const topPerformers = useMemo(() => {
    if (!data?.employeeKpis) return [];
    return [...data.employeeKpis].sort((a, b) => b.overallKpi - a.overallKpi).slice(0, 3);
  }, [data]);

  // Các cột bảng KPI
  const columns: Column<EmployeeKpiItem>[] = [
    {
      key: 'stt',
      label: 'STT',
      render: (_, index) => (
        <span style={{ fontWeight: 600, color: '#64748b', fontSize: 12 }}>
          {index !== undefined ? index + 1 : '--'}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Nhân viên',
      render: (emp) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#184a8c',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {emp.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>{emp.name}</div>
            <div style={{ fontSize: 11.5, color: '#64748b' }}>
              <strong style={{ color: '#2563eb' }}>{emp.code}</strong> · {emp.department}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'taskCompletion',
      label: 'Tiến độ công việc',
      render: (emp) => (
        <div style={{ minWidth: 140 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: '#166534' }}>
              {emp.completedTasks}/{emp.totalTasks} việc
            </span>
            <strong style={{ color: '#0f172a' }}>{emp.taskCompletionRate}%</strong>
          </div>
          <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
            <div
              style={{
                width: `${emp.taskCompletionRate}%`,
                height: '100%',
                background: emp.taskCompletionRate >= 80 ? '#16a34a' : emp.taskCompletionRate >= 50 ? '#0284c7' : '#ea580c',
                borderRadius: 99,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'attendance',
      label: 'Chuyên cần',
      render: (emp) => (
        <div style={{ fontSize: 12.5 }}>
          <div>
            <strong style={{ color: '#0f172a' }}>{emp.workingDays}</strong> ngày công
          </div>
          <div style={{ color: '#16a34a', fontSize: 11, fontWeight: 600 }}>
            {emp.punctualityScore}% đúng giờ {emp.lateDays > 0 ? `(${emp.lateDays} trễ)` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'overtime',
      label: 'Làm thêm (OT)',
      render: (emp) => (
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: emp.totalOtHours > 0 ? '#b45309' : '#64748b',
          }}
        >
          {emp.totalOtHours > 0 ? `+${emp.totalOtHours}h` : '0h'}
        </span>
      ),
    },
    {
      key: 'overallKpi',
      label: 'Điểm KPI',
      render: (emp) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{emp.overallKpi}</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>/100</span>
        </div>
      ),
    },
    {
      key: 'grade',
      label: 'Xếp loại',
      render: (emp) => {
        const bgMap: Record<string, string> = {
          A: '#fef3c7',
          B: '#f0fdf4',
          C: '#eff6ff',
          D: '#fef2f2',
        };
        return (
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              background: bgMap[emp.grade] || '#f1f5f9',
              color: emp.gradeColor,
              border: `1px solid ${emp.gradeColor}40`,
            }}
          >
            {emp.grade === 'A' ? '🏆 ' : emp.grade === 'B' ? '🌟 ' : ''}
            Hạng {emp.grade} ({emp.gradeLabel})
          </span>
        );
      },
    },
    {
      key: 'action',
      label: 'Chi tiết',
      render: (emp) => (
        <Button
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedKpi(emp);
          }}
        >
          Xem KPI
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={24} color="#184a8c" />
            Thống kê công việc & Bảng đánh giá KPI nhân viên
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
            Theo dõi tỷ lệ hoàn thành nhiệm vụ, chuyên cần điểm danh và đánh giá hiệu suất tổng thể của từng nhân viên.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: 8 }}>
            <Calendar size={15} color="#64748b" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 13, fontWeight: 600, color: '#1e293b' }}
            />
          </div>
          <Button variant="secondary" onClick={() => fetchKpis(selectedMonth)}>
            <RefreshCw size={14} style={{ marginRight: 6 }} /> Làm mới
          </Button>
        </div>
      </div>

      {/* KPI Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {/* Card 1: Điểm KPI Trung bình */}
        <div style={{ background: '#ffffff', borderRadius: 12, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Điểm KPI Trung Bình</span>
            <div style={{ padding: 6, background: '#eff6ff', borderRadius: 8, color: '#184a8c' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>
            {data?.avgKpi ?? 0} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>/ 100 điểm</span>
          </div>
          <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4, fontWeight: 600 }}>
            Toàn bộ công ty tháng {selectedMonth}
          </div>
        </div>

        {/* Card 2: Tỷ lệ hoàn thành công việc */}
        <div style={{ background: '#ffffff', borderRadius: 12, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Tiến độ công việc TB</span>
            <div style={{ padding: 6, background: '#f0fdf4', borderRadius: 8, color: '#16a34a' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#166534' }}>
            {data?.avgTaskCompletion ?? 0}%
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Tỷ lệ nhiệm vụ bàn giao đã hoàn thành
          </div>
        </div>

        {/* Card 3: Phân bổ xếp loại */}
        <div style={{ background: '#ffffff', borderRadius: 12, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Xếp loại Hiệu suất</span>
            <div style={{ padding: 6, background: '#fef3c7', borderRadius: 8, color: '#b45309' }}>
              <Star size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#b45309' }}>
              A: <strong>{data?.gradeCounts?.A ?? 0}</strong>
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>
              B: <strong>{data?.gradeCounts?.B ?? 0}</strong>
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0369a1' }}>
              C: <strong>{data?.gradeCounts?.C ?? 0}</strong>
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>
              D: <strong>{data?.gradeCounts?.D ?? 0}</strong>
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
            Tổng số: {data?.totalEmployees ?? 0} nhân sự
          </div>
        </div>
      </div>

      {/* TOP 3 VINH DANH XUẤT SẮC */}
      {topPerformers.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
            border: '1px solid #bae6fd',
            borderRadius: 14,
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Trophy size={20} color="#0284c7" />
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#0369a1' }}>
              Bảng Vinh Danh Top Nhân Viên Xuất Sắc Tháng {selectedMonth}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {topPerformers.map((emp, rank) => (
              <div
                key={emp.id}
                style={{
                  background: '#ffffff',
                  borderRadius: 12,
                  padding: '14px 16px',
                  border: rank === 0 ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                  boxShadow: rank === 0 ? '0 4px 12px rgba(245, 158, 11, 0.15)' : '0 2px 6px rgba(0,0,0,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: rank === 0 ? '#fef3c7' : rank === 1 ? '#e2e8f0' : '#ffedd5',
                    color: rank === 0 ? '#b45309' : rank === 1 ? '#475569' : '#c2410c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{emp.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {emp.department} · {emp.position || 'Nhân viên'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: rank === 0 ? '#b45309' : '#184a8c' }}>
                    {emp.overallKpi}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: emp.gradeColor }}>
                    Hạng {emp.grade}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTER BAR FOR EMPLOYEE KPI TABLE */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: '12px 16px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
          <div style={{ position: 'relative', width: 260 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Tìm theo tên, mã NV, phòng ban..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} color="#64748b" />
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value as any)}
              style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, outline: 'none' }}
            >
              <option value="all">Tất cả xếp loại</option>
              <option value="A">Hạng A - Xuất sắc (≥ 90)</option>
              <option value="B">Hạng B - Tốt (75 - 89)</option>
              <option value="C">Hạng C - Hoàn thành (60 - 74)</option>
              <option value="D">Hạng D - Cần cải thiện (&lt; 60)</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
          Hiển thị: <strong>{filteredEmployees.length}</strong> nhân viên
        </div>
      </div>

      {/* MAIN KPI TABLE */}
      {loading ? (
        <p>Đang tải dữ liệu đánh giá KPI...</p>
      ) : (
        <Table
          columns={columns}
          data={filteredEmployees}
          onRowClick={(emp) => setSelectedKpi(emp)}
        />
      )}

      {/* MODAL CHI TIẾT ĐÁNH GIÁ KPI */}
      <Modal
        open={Boolean(selectedKpi)}
        title="Bảng phân tích đánh giá KPI chi tiết"
        onClose={() => setSelectedKpi(null)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={() => setSelectedKpi(null)}>
              Đóng
            </Button>
          </div>
        }
      >
        {selectedKpi && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Employee Profile Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: '#184a8c',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {selectedKpi.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{selectedKpi.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Mã: <strong>{selectedKpi.code}</strong> · {selectedKpi.department} · {selectedKpi.position || 'Nhân viên'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>{selectedKpi.overallKpi}</div>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    background: selectedKpi.gradeColor + '20',
                    color: selectedKpi.gradeColor,
                  }}
                >
                  Hạng {selectedKpi.grade}
                </span>
              </div>
            </div>

            {/* Score Breakdown (50% tasks, 40% punctuality, 10% OT) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11.5, color: '#166534', fontWeight: 600 }}>1. HOÀN THÀNH CÔNG VIỆC (50%)</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#166534', marginTop: 4 }}>
                  {selectedKpi.taskCompletionRate}%
                </div>
                <div style={{ fontSize: 11, color: '#15803d', marginTop: 2 }}>
                  {selectedKpi.completedTasks} / {selectedKpi.totalTasks} công việc được giao
                </div>
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11.5, color: '#1e40af', fontWeight: 600 }}>2. CHUYÊN CẦN ĐÚNG GIỜ (40%)</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#1e40af', marginTop: 4 }}>
                  {selectedKpi.punctualityScore}%
                </div>
                <div style={{ fontSize: 11, color: '#1d4ed8', marginTop: 2 }}>
                  {selectedKpi.workingDays} ngày công ({selectedKpi.lateDays} lần trễ)
                </div>
              </div>

              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11.5, color: '#b45309', fontWeight: 600 }}>3. CỐNG HIẾN LÀM THÊM (10%)</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#b45309', marginTop: 4 }}>
                  +{selectedKpi.totalOtHours}h OT
                </div>
                <div style={{ fontSize: 11, color: '#92400e', marginTop: 2 }}>
                  Điểm thưởng tăng ca thực tế
                </div>
              </div>
            </div>

            {/* Formula Explanation */}
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#475569', border: '1px solid #e2e8f0' }}>
              <strong>💡 Công thức tính KPI tự động:</strong>
              <div style={{ marginTop: 4 }}>
                <code>Điểm KPI = (Tỷ lệ hoàn thành CV × 50%) + (Tỷ lệ chuyên cần × 40%) + (Thưởng giờ OT × 10%)</code>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
