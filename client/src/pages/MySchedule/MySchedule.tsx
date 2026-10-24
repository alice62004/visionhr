import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CalendarDays,
  AlertCircle,
  AlertTriangle,
  Coffee,
  Sun,
  Sunset,
  Camera,
  CalendarOff,
} from 'lucide-react';
import Button from '../../components/Button/Button';
import { getMySchedule, MyScheduleResponse, ScheduleItem } from '../../services/scheduleApi';

const VIETNAMESE_DAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(d: Date) {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

export default function MySchedule() {
  const navigate = useNavigate();
  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMonday(new Date()));
  const [data, setData] = useState<MyScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // 7 ngày trong tuần: Thứ 2 (idx 0) đến Chủ Nhật (idx 6)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentMonday);
    d.setDate(currentMonday.getDate() + i);
    return d;
  });

  const startDateStr = formatDate(weekDays[0]);
  const endDateStr = formatDate(weekDays[6]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await getMySchedule({ startDate: startDateStr, endDate: endDateStr });
      setData(res);
    } catch (err: any) {
      console.error('getMySchedule error:', err);
      setErrorMsg(
        err?.response?.data?.message ||
          'Không thể tải lịch làm việc cá nhân. Vui lòng kiểm tra liên kết tài khoản nhân viên.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [startDateStr, endDateStr]);

  const handlePrevWeek = () => {
    const prev = new Date(currentMonday);
    prev.setDate(currentMonday.getDate() - 7);
    setCurrentMonday(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentMonday);
    next.setDate(currentMonday.getDate() + 7);
    setCurrentMonday(next);
  };

  const handleCurrentWeek = () => {
    setCurrentMonday(getMonday(new Date()));
  };

  const todayStr = formatDate(new Date());

  // Nhóm lịch theo ngày: [date] => ScheduleItem[]
  const scheduleByDate: Record<string, ScheduleItem[]> = {};
  if (data?.schedules) {
    for (const item of data.schedules) {
      if (!scheduleByDate[item.date]) scheduleByDate[item.date] = [];
      scheduleByDate[item.date].push(item);
    }
  }

  // Thống kê tiến độ tuần
  let completedCount = 0;
  let missedCount = 0;

  for (const dayDate of weekDays) {
    const dateKey = formatDate(dayDate);
    if (dayDate.getDay() === 0) continue; // Bỏ qua Chủ Nhật

    const shifts = scheduleByDate[dateKey] || [];
    const hasAtt = shifts.some((s) => s.checkInTime);
    if (hasAtt) {
      completedCount++;
    } else if (dateKey < todayStr && !shifts.some((s) => s.leaveType)) {
      missedCount++;
    }
  }

  // Render 1 khung ca làm việc thực tế được phân công
  const renderActualShiftBox = ({
    shift,
    dateKey,
    isToday,
  }: {
    shift: ScheduleItem;
    dateKey: string;
    isToday: boolean;
  }) => {
    const isPast = dateKey < todayStr;
    const label = shift.shiftName || 'Ca làm việc';
    const timeRange = `${shift.startTime} - ${shift.endTime}`;
    const hasCheckedIn = Boolean(shift.checkInTime);
    const hasLeave = Boolean(shift.leaveType);
    const isLate = shift.attendanceStatus === 'di_muon';

    let boxBg = '#f8fafc';
    let boxBorder = '1px solid #e2e8f0';
    let statusBadge = null;

    if (hasLeave) {
      boxBg = '#fdf4ff';
      boxBorder = '1px solid #f0abfc';
      statusBadge = (
        <span style={{ fontSize: 9.5, background: '#fae8ff', color: '#a21caf', padding: '2px 5px', borderRadius: 4, fontWeight: 700 }}>
          🏖️ NGHỈ PHÉP
        </span>
      );
    } else if (hasCheckedIn) {
      boxBg = '#f0fdf4';
      boxBorder = '1px solid #86efac';
      statusBadge = (
        <span
          style={{
            fontSize: 9.5,
            background: isLate ? '#fef3c7' : '#dcfce7',
            color: isLate ? '#b45309' : '#15803d',
            padding: '2px 5px',
            borderRadius: 4,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CheckCircle2 size={10} />
          {isLate ? 'ĐI MUỘN' : 'ĐÃ HOÀN THÀNH'}
        </span>
      );
    } else if (isPast) {
      boxBg = '#fff7ed';
      boxBorder = '1px solid #fed7aa';
      statusBadge = (
        <span
          style={{
            fontSize: 9.5,
            background: '#fee2e2',
            color: '#b91c1c',
            padding: '2px 5px',
            borderRadius: 4,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <AlertTriangle size={10} />
          CHƯA CHẤM
        </span>
      );
    } else if (isToday) {
      boxBg = '#eff6ff';
      boxBorder = '1px solid #bfdbfe';
      statusBadge = (
        <span
          style={{
            fontSize: 9.5,
            background: '#dbeafe',
            color: '#1d4ed8',
            padding: '2px 5px',
            borderRadius: 4,
            fontWeight: 700,
          }}
        >
          CHỜ CHẤM
        </span>
      );
    } else {
      boxBg = '#ffffff';
      boxBorder = '1px solid #e2e8f0';
      statusBadge = (
        <span style={{ fontSize: 9.5, background: '#f1f5f9', color: '#475569', padding: '2px 5px', borderRadius: 4, fontWeight: 600 }}>
          SẮP TỚI
        </span>
      );
    }

    return (
      <div
        key={shift.id || `${shift.shiftId}_${dateKey}`}
        style={{
          background: boxBg,
          border: boxBorder,
          borderRadius: 8,
          padding: '10px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          minHeight: 82,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: '#1e40af',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Clock size={12} color="#2563eb" />
            {label}
          </span>
          {statusBadge}
        </div>

        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <span>{timeRange}</span>
        </div>

        {hasCheckedIn && shift.checkInTime && (
          <div
            style={{
              fontSize: 10,
              color: '#15803d',
              background: 'rgba(255, 255, 255, 0.8)',
              padding: '2px 5px',
              borderRadius: 4,
              fontWeight: 600,
              border: '1px solid rgba(134, 239, 172, 0.6)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={`Check-in: ${shift.checkInTime} ${shift.checkOutTime ? '| Out: ' + shift.checkOutTime : ''}`}
          >
            ✓ In: {shift.checkInTime} {shift.checkOutTime ? `| Out: ${shift.checkOutTime}` : ''}
          </div>
        )}

        {hasLeave && (
          <div style={{ fontSize: 9.5, color: '#86198f', fontWeight: 600 }}>
            {shift.leaveType || 'Đã duyệt nghỉ phép'}
          </div>
        )}

        {isPast && !hasCheckedIn && !hasLeave && (
          <div style={{ fontSize: 9.5, color: '#dc2626', fontWeight: 500 }}>
            Quá hạn điểm danh
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 1220, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #184a8c 0%, #1e3a8a 100%)',
          borderRadius: 16,
          padding: '24px 28px',
          color: '#ffffff',
          marginBottom: 20,
          boxShadow: '0 8px 24px rgba(24, 74, 140, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.18)',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <CalendarDays size={14} />
              Lịch làm việc ca Sáng & Chiều (Thứ 2 - Thứ 7)
            </span>
            {data?.employee && (
              <span
                style={{
                  background: '#fef08a',
                  color: '#854d0e',
                  padding: '3px 9px',
                  borderRadius: 12,
                  fontSize: 11.5,
                  fontWeight: 700,
                }}
              >
                Mã NV: {data.employee.code}
              </span>
            )}
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>
            {data?.employee ? `Lịch công tác của ${data.employee.name}` : 'Lịch làm việc của tôi'}
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'rgba(255, 255, 255, 0.85)' }}>
            {data?.employee
              ? `Bộ phận: ${data.employee.department || 'Công ty'} • Chức vụ: ${data.employee.position || 'Nhân viên'} • Ca Sáng (08:00 - 11:30) & Ca Chiều (13:30 - 17:00)`
              : 'Theo dõi ca làm việc được phân công hàng tuần và chấm công đúng giờ.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            variant="secondary"
            onClick={() => navigate('/leave')}
            style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.25)' }}
          >
            <CalendarOff size={15} />
            <span>Xin nghỉ phép</span>
          </Button>
          <Button
            onClick={() => navigate('/attendance/terminal')}
            style={{ background: '#ffffff', color: '#184a8c', fontWeight: 600 }}
          >
            <Camera size={15} />
            <span>Điểm danh Kiosk AI</span>
          </Button>
        </div>
      </div>

      {/* Week Navigator & Thống kê tiến độ chấm công */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '16px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        {/* Điều hướng tuần */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handlePrevWeek}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 13,
              fontWeight: 600,
              color: '#334155',
            }}
          >
            <ChevronLeft size={16} /> Tuần trước
          </button>
          <button
            onClick={handleCurrentWeek}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              color: '#184a8c',
            }}
          >
            Tuần này
          </button>
          <button
            onClick={handleNextWeek}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 13,
              fontWeight: 600,
              color: '#334155',
            }}
          >
            Tuần sau <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
          📅 {formatDisplayDate(weekDays[0])} — {formatDisplayDate(weekDays[6])}
        </div>

        {/* Thống kê tiến độ chấm công trong tuần */}
        <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#16a34a', fontWeight: 600 }}>
            <CheckCircle2 size={14} />
            Đã hoàn thành: <strong>{completedCount} ngày</strong>
          </span>
          {missedCount > 0 && (
            <>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#dc2626', fontWeight: 600 }}>
                <AlertTriangle size={14} />
                Chưa chấm: <strong>{missedCount} ngày</strong>
              </span>
            </>
          )}
          <span>•</span>
          <span style={{ color: '#64748b', fontWeight: 600 }}>Chủ Nhật nghỉ</span>
        </div>
      </div>

      {/* Grid 7 ngày: Thứ 2 -> Thứ 7 (Mỗi ngày duy nhất 2 ca Sáng & Chiều) + Chủ Nhật (Nghỉ) */}
      {errorMsg ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: 32,
            textAlign: 'center',
            border: '1px solid #fed7aa',
          }}
        >
          <AlertCircle size={36} color="#ea580c" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ margin: 0, color: '#9a3412', fontSize: 16 }}>{errorMsg}</h3>
          <p style={{ color: '#7c2d12', fontSize: 13, marginTop: 6 }}>
            Nếu bạn là quản trị viên hoặc tài khoản chưa liên kết mã nhân viên, vui lòng liên hệ HR.
          </p>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: 50, color: '#64748b' }}>Đang nạp lịch làm việc và dữ liệu chấm công...</div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 10,
          }}
        >
          {weekDays.map((dayDate) => {
            const dateKey = formatDate(dayDate);
            const isToday = dateKey === todayStr;
            const dayOfWeekIdx = dayDate.getDay(); // 0: Chủ Nhật, 1: T2, 2: T3 ... 6: T7
            const isSunday = dayOfWeekIdx === 0;

            const shiftsInDay = scheduleByDate[dateKey] || [];
            // Lấy dữ liệu chấm công và nghỉ phép của ngày này
            const attItem = shiftsInDay.find((s) => s.checkInTime);
            const leaveItem = shiftsInDay.find((s) => s.leaveType);

            const hasDayCheckIn = Boolean(attItem?.checkInTime);
            const checkInTime = attItem?.checkInTime;
            const checkOutTime = attItem?.checkOutTime;
            const isLate = attItem?.attendanceStatus === 'di_muon';

            const hasLeave = Boolean(leaveItem?.leaveType);
            const leaveType = leaveItem?.leaveType;

            // Xác định lượt check-in thuộc buổi sáng hay buổi chiều
            let morningChecked = false;
            let afternoonChecked = false;

            if (hasDayCheckIn && checkInTime) {
              const hour = parseInt(checkInTime.split(':')[0], 10);
              if (hour < 12) {
                // Check-in buổi sáng
                morningChecked = true;
                // Nếu có checkout buổi chiều (>12h) thì cả chiều cũng đã hoàn thành
                if (checkOutTime) {
                  const outHour = parseInt(checkOutTime.split(':')[0], 10);
                  if (outHour >= 12) afternoonChecked = true;
                }
              } else {
                // Check-in buổi chiều / tối
                afternoonChecked = true;
              }
            }

            return (
              <div
                key={dateKey}
                style={{
                  background: isSunday ? '#fafafa' : isToday ? '#f0f7ff' : '#ffffff',
                  border: isToday
                    ? '2px solid #2563eb'
                    : isSunday
                    ? '1px dashed #cbd5e1'
                    : '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 270,
                  boxShadow: isToday ? '0 4px 14px rgba(37, 99, 235, 0.16)' : '0 2px 4px rgba(0,0,0,0.02)',
                  position: 'relative',
                }}
              >
                {/* Header Ngày & Thứ */}
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 10 }}>
                  <div
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: isSunday ? '#dc2626' : '#64748b',
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{VIETNAMESE_DAYS[dayOfWeekIdx]}</span>
                    {isToday && (
                      <span
                        style={{
                          background: '#2563eb',
                          color: '#ffffff',
                          padding: '1px 5px',
                          borderRadius: 999,
                          fontSize: 9,
                          fontWeight: 700,
                        }}
                      >
                        HÔM NAY
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 3 }}>
                    <span
                      style={{
                        fontSize: 17,
                        fontWeight: 800,
                        color: isSunday ? '#dc2626' : isToday ? '#1d4ed8' : '#0f172a',
                      }}
                    >
                      {dayDate.getDate()}
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      Thg {dayDate.getMonth() + 1}
                    </span>
                  </div>
                </div>

                {/* Nội dung ca làm việc */}
                {isSunday ? (
                  /* CỘT CHỦ NHẬT: NGHỈ LÀM */
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94a3b8',
                      textAlign: 'center',
                      padding: '12px 4px',
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: '#fef2f2',
                        color: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <Coffee size={22} />
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#475569' }}>Nghỉ Chủ Nhật</span>
                    <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                      Ngày nghỉ tuần cố định
                    </span>
                  </div>
                ) : shiftsInDay.length > 0 ? (
                  /* CÁC CA ĐƯỢC HR PHÂN CÔNG THỰC TẾ */
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {shiftsInDay.map((s) =>
                      renderActualShiftBox({
                        shift: s,
                        dateKey,
                        isToday,
                      })
                    )}
                  </div>
                ) : (
                  /* NẾU NGÀY THƯỜNG MÀ CHƯA PHÂN CA */
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94a3b8',
                      textAlign: 'center',
                      padding: '12px 4px',
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Không có ca làm</span>
                    <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                      Chưa được phân công
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
