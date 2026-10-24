import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  UserCheck,
  Calendar,
  Users,
  Search,
  CheckCircle2,
  Camera,
  Sparkles,
  Sunrise,
  Sunset,
  Image as ImageIcon,
  Eye,
} from 'lucide-react';
import { getAttendanceRecords } from '../../services/attendanceApi';
import Table, { Column } from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import { useAuthStore } from '../../store/authStore';
import { AttendanceRecord, AttendanceStatus, AttendanceMethod } from '../../types';
import { formatDisplayDate, getDayOfWeek, calculateWorkDuration } from '../../utils/formatters';
import { AttendanceBadge, MethodBadge, EmployeeAvatar } from './AttendanceBadges';
import AttendancePhotoModal, { PhotoModalData } from './AttendancePhotoModal';
import AttendanceDetailModal from './AttendanceDetailModal';

export default function AttendanceList() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'detail' | 'summary' | 'gallery'>('detail');

  // Modal hiển thị chi tiết ngay trên cùng trang
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // Modal hiển thị khung ảnh chấm công khi click vào ca
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [activePhotoType, setActivePhotoType] = useState<'in' | 'out'>('in');
  const [photoModalData, setPhotoModalData] = useState<{
    name: string;
    code?: string;
    department?: string;
    date: string;
    time?: string;
    shiftName: string;
    imageUrl: string;
    inImage?: string | null;
    outImage?: string | null;
    avatar?: string | null;
    hasRealSnapshot?: boolean;
    status: AttendanceStatus;
    checkIn?: string | null;
    checkOut?: string | null;
  } | null>(null);

  const user = useAuthStore((s) => s.user);
  const isEmployeeRole = user?.role === 'employee';
  const navigate = useNavigate();

  useEffect(() => {
    getAttendanceRecords()
      .then((data) => {
        // Nếu là role employee, bảo đảm chỉ lọc đúng dữ liệu của mình
        if (isEmployeeRole && user?.employeeId) {
          const myRecords = data.filter((r) => Number(r.employeeId) === Number(user.employeeId));
          setRecords(myRecords);
        } else {
          setRecords(data);
        }
      })
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [isEmployeeRole, user?.employeeId]);

  // Danh sách các tháng có dữ liệu
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    records.forEach((r) => {
      if (r.date) {
        const clean = r.date.includes('T') ? r.date.split('T')[0] : r.date;
        const m = clean.slice(0, 7);
        months.add(m);
      }
    });
    return Array.from(months).sort().reverse();
  }, [records]);

  // Danh sách nhân viên duy nhất (cho Admin / HR)
  const uniqueEmployees = useMemo(() => {
    const map = new Map<number | string, string>();
    records.forEach((r) => {
      if (r.employeeId && r.employeeName) {
        map.set(r.employeeId, r.employeeName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [records]);

  // Bộ lọc dữ liệu
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const cleanDate = r.date ? (r.date.includes('T') ? r.date.split('T')[0] : r.date) : '';
      if (selectedMonth !== 'all' && !cleanDate.startsWith(selectedMonth)) {
        return false;
      }
      if (!isEmployeeRole && selectedEmployee !== 'all' && String(r.employeeId) !== selectedEmployee) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const nameMatch = r.employeeName?.toLowerCase().includes(term);
        const codeMatch = (r as any).employeeCode?.toLowerCase().includes(term);
        const dateMatch = cleanDate.includes(term) || formatDisplayDate(cleanDate).includes(term);
        if (!nameMatch && !codeMatch && !dateMatch) return false;
      }
      return true;
    });
  }, [records, selectedMonth, selectedEmployee, searchTerm, isEmployeeRole]);

  // Thống kê ngày đi làm
  const stats = useMemo(() => {
    let workingDaysCount = 0;
    let onTimeCount = 0;
    let lateCount = 0;
    let absentCount = 0;

    filteredRecords.forEach((r) => {
      if (r.status === 'dung_gio') {
        workingDaysCount++;
        onTimeCount++;
      } else if (r.status === 'di_muon') {
        workingDaysCount++;
        lateCount++;
      } else if (r.status === 'vang_mat') {
        absentCount++;
      }
    });

    const punctualityRate =
      workingDaysCount > 0 ? Math.round((onTimeCount / workingDaysCount) * 100) : 100;

    return {
      workingDaysCount,
      onTimeCount,
      lateCount,
      absentCount,
      punctualityRate,
    };
  }, [filteredRecords]);

  // Bảng tổng hợp công theo nhân viên
  const employeeSummaryList = useMemo(() => {
    const empMap = new Map<
      number | string,
      {
        id: number | string;
        name: string;
        code?: string;
        department?: string;
        avatar?: string | null;
        workingDays: number;
        onTime: number;
        late: number;
        absent: number;
      }
    >();

    filteredRecords.forEach((r) => {
      const empId = r.employeeId || r.employeeName || 'unknown';
      if (!empMap.has(empId)) {
        empMap.set(empId, {
          id: empId,
          name: r.employeeName || 'Nhân viên',
          code: (r as any).employeeCode,
          department: (r as any).department,
          avatar: r.avatar,
          workingDays: 0,
          onTime: 0,
          late: 0,
          absent: 0,
        });
      }
      const data = empMap.get(empId)!;
      if (!data.avatar && r.avatar) {
        data.avatar = r.avatar;
      }
      if (r.status === 'dung_gio') {
        data.workingDays++;
        data.onTime++;
      } else if (r.status === 'di_muon') {
        data.workingDays++;
        data.late++;
      } else if (r.status === 'vang_mat') {
        data.absent++;
      }
    });

    return Array.from(empMap.values());
  }, [filteredRecords]);

  // Mở popup chi tiết trên cùng trang
  const handleOpenDetail = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setDetailModalOpen(true);
  };

  // Mở khung ảnh chấm công khi bấm vào ca
  const handleOpenPhoto = (record: AttendanceRecord, fallbackShift?: string) => {
    const cleanShift =
      record.shiftName ||
      fallbackShift ||
      (record.checkIn && parseInt(record.checkIn.slice(0, 2)) < 12 ? 'Ca Sáng (08:00 - 11:30)' : 'Ca Chiều (13:30 - 17:00)');

    const initialType = record.inImage ? 'in' : record.outImage ? 'out' : 'in';
    setActivePhotoType(initialType);

    const photoUrl =
      (initialType === 'in' ? record.inImage : record.outImage) ||
      record.snapshotImage ||
      record.inImage ||
      record.outImage ||
      record.avatar ||
      '';

    setPhotoModalData({
      name: record.employeeName || 'Nhân viên',
      code: (record as any).employeeCode,
      department: (record as any).department,
      date: record.date,
      time: (initialType === 'in' ? record.checkIn : record.checkOut) || record.checkIn || record.checkOut || '--:--',
      shiftName: cleanShift,
      imageUrl: photoUrl,
      inImage: record.inImage,
      outImage: record.outImage,
      avatar: record.avatar,
      hasRealSnapshot: record.hasRealSnapshot,
      status: record.status,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
    });
    setPhotoModalOpen(true);
  };

  // CỘT BẢNG CHI TIẾT (KÈM CỘT STT ĐÁNH THỨ TỰ TĂNG DẦN)
  const detailColumns: Column<AttendanceRecord>[] = [
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
      key: 'employeeName',
      label: 'Nhân viên',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <EmployeeAvatar name={r.employeeName || 'Nhân viên'} avatarUrl={r.avatar} size={34} />
          <div>
            <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.employeeName || 'Nhân viên'}</div>
            {(r as any).employeeCode && (
              <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>{(r as any).employeeCode}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Ngày làm việc',
      render: (r) => {
        const formatted = formatDisplayDate(r.date);
        const dayOfWeek = getDayOfWeek(r.date);
        return (
          <div>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>{formatted}</span>
            {dayOfWeek && <div style={{ fontSize: 11, color: '#64748b' }}>{dayOfWeek}</div>}
          </div>
        );
      },
    },
    {
      key: 'shift',
      label: 'Ca làm việc (Bấm xem ảnh)',
      render: (r) => {
        const isMorning =
          r.shiftName?.toLowerCase().includes('sáng') ||
          (r.checkIn && parseInt(r.checkIn.slice(0, 2)) < 12);
        const shiftTitle = r.shiftName || (isMorning ? 'Ca Sáng' : 'Ca Chiều');

        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenPhoto(r, shiftTitle);
            }}
            title="Bấm vào ca để hiển thị khung ảnh chấm công lần này"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 20,
              border: isMorning ? '1px solid #bae6fd' : '1px solid #fed7aa',
              background: isMorning ? '#f0f9ff' : '#fff7ed',
              color: isMorning ? '#0369a1' : '#c2410c',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isMorning ? <Sunrise size={13} color="#0284c7" /> : <Sunset size={13} color="#ea580c" />}
            <span>{shiftTitle}</span>
            <Camera size={12} style={{ opacity: 0.8 }} />
          </button>
        );
      },
    },
    {
      key: 'checkIn',
      label: 'Giờ vào',
      render: (r) => (
        <span style={{ color: r.checkIn ? '#16a34a' : '#94a3b8', fontWeight: 600, fontSize: 13 }}>
          {r.checkIn ? r.checkIn.slice(0, 5) : '--:--'}
        </span>
      ),
    },
    {
      key: 'checkOut',
      label: 'Giờ ra',
      render: (r) => (
        <span style={{ color: r.checkOut ? '#2563eb' : '#94a3b8', fontWeight: 600, fontSize: 13 }}>
          {r.checkOut ? r.checkOut.slice(0, 5) : '--:--'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (r) => <AttendanceBadge status={r.status} />,
    },
    {
      key: 'method',
      label: 'Phương thức',
      render: (r) => <MethodBadge method={r.method} />,
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (r) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenPhoto(r);
            }}
            title="Xem ảnh chấm công"
          >
            <Camera size={13} style={{ marginRight: 4 }} />
            Ảnh
          </Button>
          <Button
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDetail(r);
            }}
          >
            Chi tiết
          </Button>
        </div>
      ),
    },
  ];

  // CỘT BẢNG TỔNG HỢP (KÈM CỘT STT)
  const summaryColumns: Column<any>[] = [
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
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <EmployeeAvatar name={row.name || 'Nhân viên'} avatarUrl={row.avatar} size={34} />
          <div>
            <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</div>
            {row.code && <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>{row.code}</div>}
          </div>
        </div>
      ),
    },
    {
      key: 'workingDays',
      label: 'Số ngày đi làm',
      render: (row) => (
        <span
          style={{
            fontWeight: 700,
            color: '#166534',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '3px 10px',
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          {row.workingDays} ngày công
        </span>
      ),
    },
    {
      key: 'onTime',
      label: 'Đúng giờ',
      render: (row) => <span style={{ color: '#16a34a', fontWeight: 600 }}>{row.onTime} ngày</span>,
    },
    {
      key: 'late',
      label: 'Đi muộn',
      render: (row) => (
        <span style={{ color: row.late > 0 ? '#d97706' : '#94a3b8', fontWeight: 600 }}>
          {row.late} ngày
        </span>
      ),
    },
    {
      key: 'absent',
      label: 'Vắng mặt',
      render: (row) => (
        <span style={{ color: row.absent > 0 ? '#dc2626' : '#94a3b8', fontWeight: 600 }}>
          {row.absent} ngày
        </span>
      ),
    },
    {
      key: 'rate',
      label: 'Tỷ lệ đúng giờ',
      render: (row) => {
        const rate =
          row.workingDays > 0 ? Math.round((row.onTime / row.workingDays) * 100) : 100;
        return (
          <span
            style={{
              fontWeight: 700,
              color: rate >= 80 ? '#16a34a' : '#d97706',
            }}
          >
            {rate}%
          </span>
        );
      },
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px 0', color: '#111827' }}>
            {isEmployeeRole ? 'Bảng chấm công cá nhân' : 'Bảng chấm công toàn công ty'}
          </h1>
          <p style={{ color: '#6b7280', margin: 0, fontSize: 14 }}>
            {isEmployeeRole
              ? `Theo dõi ngày công, giờ vào/ra và tỷ lệ chuyên cần của bạn (${user?.name})`
              : 'Thống kê số lượng ngày đi làm, đúng giờ, đi muộn và nhật ký chấm công AI'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={() => navigate('/attendance/terminal')}>
            <Camera size={15} style={{ marginRight: 6 }} />
            Mở Kiosk Chấm công AI
          </Button>
        </div>
      </div>

      {/* KPI STATS CARDS: THỐNG KÊ SỐ LƯỢNG NGÀY ĐI LÀM */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
          marginBottom: 18,
        }}
      >
        {/* Card 1: Tổng ngày đi làm */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '14px 16px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#64748b' }}>
              Tổng ngày đi làm
            </span>
            <div style={{ padding: 6, background: '#f0fdf4', borderRadius: 8, color: '#16a34a' }}>
              <UserCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#166534' }}>
            {stats.workingDaysCount}{' '}
            <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>ngày công</span>
          </div>
          <div style={{ fontSize: 11.5, color: '#16a34a', marginTop: 4, fontWeight: 600 }}>
            ✓ Có mặt tại công ty
          </div>
        </div>

        {/* Card 2: Đúng giờ */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '14px 16px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#64748b' }}>
              Đi làm đúng giờ
            </span>
            <div style={{ padding: 6, background: '#eff6ff', borderRadius: 8, color: '#2563eb' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1e40af' }}>
            {stats.onTimeCount}{' '}
            <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>ngày</span>
          </div>
          <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
            Chuẩn khung giờ làm việc
          </div>
        </div>

        {/* Card 3: Đi muộn */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '14px 16px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#64748b' }}>
              Số ngày đi muộn
            </span>
            <div style={{ padding: 6, background: '#fef3c7', borderRadius: 8, color: '#d97706' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#d97706' }}>
            {stats.lateCount}{' '}
            <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>ngày</span>
          </div>
          <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
            Quá 15 phút so với ca
          </div>
        </div>

        {/* Card 4: Tỷ lệ đúng giờ */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '14px 16px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#64748b' }}>
              Tỷ lệ chuyên cần
            </span>
            <div style={{ padding: 6, background: '#f5f3ff', borderRadius: 8, color: '#7c3aed' }}>
              <Sparkles size={16} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#7c3aed' }}>
            {stats.punctualityRate}%
          </div>
          <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
            Đúng giờ / Tổng ngày đi làm
          </div>
        </div>
      </div>

      {/* FILTER BAR & VIEW TOGGLE */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
          {/* Lọc theo tháng */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={15} color="#64748b" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={selectStyle}
            >
              <option value="all">Tất cả các tháng</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  Tháng {m.slice(5, 7)}/{m.slice(0, 4)}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo nhân viên (chỉ hiển thị nếu role là Admin/HR/Manager) */}
          {!isEmployeeRole && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={15} color="#64748b" />
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                style={selectStyle}
              >
                <option value="all">Tất cả nhân viên</option>
                {uniqueEmployees.map((emp) => (
                  <option key={emp.id} value={String(emp.id)}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tìm kiếm */}
          <div style={{ position: 'relative', width: 220 }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              placeholder="Tìm theo tên, ngày..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                ...selectStyle,
                paddingLeft: 30,
                width: '100%',
              }}
            />
          </div>
        </div>

        {/* View Mode Toggle (chỉ hiển thị tổng hợp nếu là Admin/HR xem nhiều người) */}
        {/* View Mode Toggle */}
        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 3, borderRadius: 8 }}>
          <button
            type="button"
            onClick={() => setViewMode('detail')}
            style={{
              padding: '5px 12px',
              borderRadius: 6,
              border: 'none',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              background: viewMode === 'detail' ? '#ffffff' : 'transparent',
              color: viewMode === 'detail' ? '#184a8c' : '#64748b',
              boxShadow: viewMode === 'detail' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Nhật ký chi tiết ({filteredRecords.length})
          </button>
          {!isEmployeeRole && (
            <button
              type="button"
              onClick={() => setViewMode('summary')}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                border: 'none',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                background: viewMode === 'summary' ? '#ffffff' : 'transparent',
                color: viewMode === 'summary' ? '#184a8c' : '#64748b',
                boxShadow: viewMode === 'summary' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Tổng hợp công ({employeeSummaryList.length} người)
            </button>
          )}
          <button
            type="button"
            onClick={() => setViewMode('gallery')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 12px',
              borderRadius: 6,
              border: 'none',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              background: viewMode === 'gallery' ? '#ffffff' : 'transparent',
              color: viewMode === 'gallery' ? '#184a8c' : '#64748b',
              boxShadow: viewMode === 'gallery' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <ImageIcon size={14} />
            Ảnh chấm công ({filteredRecords.filter(r => r.snapshotImage || r.inImage || (r as any).avatar).length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <p>Đang tải dữ liệu chấm công...</p>
      ) : viewMode === 'detail' ? (
        <Table
          columns={detailColumns}
          data={filteredRecords}
          onRowClick={(r) => handleOpenDetail(r)}
        />
      ) : viewMode === 'summary' ? (
        <Table
          columns={summaryColumns}
          data={employeeSummaryList}
          onRowClick={(row) => {
            setSelectedEmployee(String(row.id));
            setViewMode('detail');
          }}
        />
      ) : (
        /* THƯ VIỆN ẢNH CHẤM CÔNG AI (GALLERY VIEW) */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {filteredRecords.map((r, idx) => {
            const photoUrl = r.snapshotImage || r.inImage || r.outImage || (r as any).avatar || '/default-avatar.png';
            const isMorning = r.shiftName?.toLowerCase().includes('sáng') || (r.checkIn && parseInt(r.checkIn.slice(0, 2)) < 12);
            const shiftLabel = r.shiftName || (isMorning ? 'Ca Sáng' : 'Ca Chiều');

            return (
              <div
                key={r.id || idx}
                onClick={() => handleOpenPhoto(r, shiftLabel)}
                style={{
                  background: '#ffffff',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)';
                }}
              >
                {/* Photo Frame */}
                <div style={{ position: 'relative', height: 180, background: '#0f172a' }}>
                  <img
                    src={photoUrl}
                    alt={r.employeeName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/default-avatar.png';
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      background: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {r.checkIn ? `Vào: ${r.checkIn.slice(0, 5)}` : `Ra: ${r.checkOut?.slice(0, 5) || '--:--'}`}
                  </div>
                  <div style={{ position: 'absolute', top: 8, right: 8 }}>
                    <AttendanceBadge status={r.status} />
                  </div>
                </div>

                {/* Card Info */}
                <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                    {r.employeeName || 'Nhân viên'}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {(r as any).employeeCode ? `${(r as any).employeeCode} · ` : ''}{formatDisplayDate(r.date)}
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: 6, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: isMorning ? '#0284c7' : '#ea580c',
                        background: isMorning ? '#f0f9ff' : '#fff7ed',
                        padding: '2px 8px',
                        borderRadius: 12,
                      }}
                    >
                      {shiftLabel}
                    </span>
                    <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Eye size={12} /> Bấm xem
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: KHUNG ẢNH CHẤM CÔNG CỦA NHÂN VIÊN LẦN ĐÓ */}
      <AttendancePhotoModal
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        data={photoModalData}
        activeType={activePhotoType}
        setActiveType={setActivePhotoType}
      />

      {/* MODAL 2: CHI TIẾT BẢN GHI CHẤM CÔNG */}
      <AttendanceDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        record={selectedRecord}
        onOpenPhoto={handleOpenPhoto}
      />
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  fontSize: 13,
  color: '#1e293b',
  background: '#ffffff',
  outline: 'none',
};
