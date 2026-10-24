import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Sparkles,
  UserCheck,
  Building2,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import { useAuthStore } from '../../store/authStore';
import { getDepartments, getEmployees } from '../../services/employeeApi';
import { getShifts } from '../../services/attendanceApi';
import {
  getSchedules,
  assignSchedule,
  bulkAssignSchedule,
  deleteSchedule,
  ScheduleItem,
} from '../../services/scheduleApi';
import { emitSystemNotification } from '../../utils/notificationService';
import { Department, Employee, Shift } from '../../types';

const VIETNAMESE_DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

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
  return `${day}/${month}`;
}

export default function ShiftScheduling() {
  const user = useAuthStore((s) => s.user);
  const isManager = user?.role === 'manager';

  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMonday(new Date()));
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>(() => {
    if (user?.role === 'manager' && user?.departmentId) {
      return String(user.departmentId);
    }
    return '';
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Cập nhật selectedDeptId khi user profile được load
  useEffect(() => {
    if (user?.role === 'manager' && user?.departmentId && !selectedDeptId) {
      setSelectedDeptId(String(user.departmentId));
    }
  }, [user]);

  // Modal phân ca đơn lẻ
  const [cellModalOpen, setCellModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ emp: Employee; date: string; existing?: ScheduleItem } | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  const [cellNote, setCellNote] = useState('');
  const [savingCell, setSavingCell] = useState(false);

  // Modal phân ca hàng loạt
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkShiftId, setBulkShiftId] = useState<string>('');
  const [bulkEmpIds, setBulkEmpIds] = useState<number[]>([]);
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkEndDate, setBulkEndDate] = useState('');
  const [bulkNote, setBulkNote] = useState('');
  const [savingBulk, setSavingBulk] = useState(false);

  // 7 ngày trong tuần
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentMonday);
    d.setDate(currentMonday.getDate() + i);
    return d;
  });

  const startDateStr = formatDate(weekDays[0]);
  const endDateStr = formatDate(weekDays[6]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [deptList, empList, shiftList, schedList] = await Promise.all([
        getDepartments(),
        getEmployees(),
        getShifts(),
        getSchedules({
          departmentId: selectedDeptId || undefined,
          startDate: startDateStr,
          endDate: endDateStr,
        }),
      ]);

      setDepartments(deptList);
      setEmployees(empList);
      setShifts(shiftList);
      setSchedules(schedList);

      if (shiftList.length > 0 && !bulkShiftId) {
        setBulkShiftId(String(shiftList[0].id));
      }
    } catch (err) {
      console.error('loadAll scheduling error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [selectedDeptId, startDateStr, endDateStr]);

  // Lọc nhân viên theo phòng ban đã chọn
  const filteredEmployees = employees.filter((emp) => {
    if (!selectedDeptId) return true;
    return String(emp.department_id) === String(selectedDeptId);
  });

  // Tạo map tìm kiếm nhanh: [employeeId_date] => ScheduleItem
  const scheduleMap = new Map<string, ScheduleItem>();
  for (const s of schedules) {
    scheduleMap.set(`${s.employeeId}_${s.date}`, s);
  }

  const handleOpenCell = (emp: Employee, dateStr: string) => {
    const existing = scheduleMap.get(`${emp.id}_${dateStr}`);
    setSelectedCell({ emp, date: dateStr, existing });
    setSelectedShiftId(existing ? String(existing.shiftId) : shifts[0] ? String(shifts[0].id) : '');
    setCellNote(existing?.note || '');
    setCellModalOpen(true);
  };

  const handleSaveCell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCell || !selectedShiftId) return;
    setSavingCell(true);
    try {
      await assignSchedule({
        employeeId: selectedCell.emp.id,
        shiftId: Number(selectedShiftId),
        date: selectedCell.date,
        note: cellNote,
      });

      const assignedShift = shifts.find((s) => String(s.id) === String(selectedShiftId));
      emitSystemNotification({
        title: 'Cập nhật ca làm việc',
        message: `Bạn được phân ${assignedShift?.name || 'ca làm việc'} (${assignedShift?.startTime || ''} - ${assignedShift?.endTime || ''}) ngày ${selectedCell.date}.`,
        type: 'attendance',
        link: '/my-schedule',
        targetUserId: selectedCell.emp.accountId || selectedCell.emp.id,
      });

      setCellModalOpen(false);
      loadAll();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Phân ca thất bại.');
    } finally {
      setSavingCell(false);
    }
  };

  const handleDeleteCell = async () => {
    if (!selectedCell?.existing) return;
    if (!window.confirm('Bạn có chắc muốn hủy ca làm việc này?')) return;
    try {
      await deleteSchedule(selectedCell.existing.id);
      setCellModalOpen(false);
      loadAll();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Hủy ca thất bại.');
    }
  };

  const handleOpenBulkModal = () => {
    setBulkStartDate(startDateStr);
    // Mặc định kết thúc vào Thứ Bảy (weekDays[5]), vì Chủ Nhật nghỉ làm việc theo quy chế
    setBulkEndDate(formatDate(weekDays[5]));
    // Mặc định chọn tất cả nhân viên trong danh sách hiển thị
    setBulkEmpIds(filteredEmployees.map((e) => e.id));
    setBulkNote('Phân ca theo tuần (Thứ 2 - Thứ 7)');
    setBulkModalOpen(true);
  };

  const handleSaveBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkEmpIds.length || !bulkShiftId || !bulkStartDate || !bulkEndDate) {
      alert('Vui lòng chọn nhân viên, ca làm và khoảng ngày.');
      return;
    }
    setSavingBulk(true);
    try {
      const res = await bulkAssignSchedule({
        employeeIds: bulkEmpIds,
        shiftId: Number(bulkShiftId),
        startDate: bulkStartDate,
        endDate: bulkEndDate,
        note: bulkNote,
      });

      const assignedShift = shifts.find((s) => String(s.id) === String(bulkShiftId));
      emitSystemNotification({
        title: 'Lịch phân ca tuần mới',
        message: `Lịch làm việc từ ${bulkStartDate} đến ${bulkEndDate} (${assignedShift?.name || 'Ca làm'}) đã được phân công. Vui lòng kiểm tra lịch làm việc của bạn.`,
        type: 'attendance',
        link: '/my-schedule',
        targetRole: ['employee', 'manager', 'user'],
      });

      alert(res.message);
      setBulkModalOpen(false);
      loadAll();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Phân ca hàng loạt thất bại.');
    } finally {
      setSavingBulk(false);
    }
  };

  const toggleSelectAllEmp = () => {
    if (bulkEmpIds.length === filteredEmployees.length) {
      setBulkEmpIds([]);
    } else {
      setBulkEmpIds(filteredEmployees.map((e) => e.id));
    }
  };

  const toggleSelectEmp = (id: number) => {
    setBulkEmpIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div style={{ maxWidth: 1250, margin: '0 auto', paddingBottom: 40 }}>
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
            Phân Lịch Làm Việc (Shift Scheduling)
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: 0 }}>
            {isManager
              ? 'Xếp ca làm việc và phân công nhân sự trực thuộc phòng ban của bạn theo tuần.'
              : 'Quản trị và điều phối ca làm việc cho toàn bộ nhân sự công ty.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button onClick={handleOpenBulkModal} style={{ background: '#184a8c', color: '#ffffff' }}>
            <Sparkles size={15} />
            <span>Phân ca nhanh hàng loạt</span>
          </Button>
        </div>
      </div>

      {/* Control Bar: Tuần & Phòng ban */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: '14px 18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
          marginBottom: 18,
        }}
      >
        {/* Chọn tuần */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => {
              const p = new Date(currentMonday);
              p.setDate(currentMonday.getDate() - 7);
              setCurrentMonday(p);
            }}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>
            📅 Tuần: {formatDisplayDate(weekDays[0])} - {formatDisplayDate(weekDays[6])}
          </span>

          <button
            onClick={() => {
              const n = new Date(currentMonday);
              n.setDate(currentMonday.getDate() + 7);
              setCurrentMonday(n);
            }}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={() => setCurrentMonday(getMonday(new Date()))}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              cursor: 'pointer',
              fontSize: 12.5,
              fontWeight: 600,
              color: '#184a8c',
            }}
          >
            Hôm nay
          </button>
        </div>

        {/* Lọc phòng ban */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={15} color="#64748b" />
          <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>Phòng ban:</span>
          {isManager ? (
            <span
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                background: '#e0f2fe',
                color: '#0369a1',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid #bae6fd',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Building2 size={14} />
              {departments.find((d) => String(d.id) === String(selectedDeptId))?.name || user?.departmentName || 'Phòng ban của tôi'}
            </span>
          ) : (
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                color: '#0f172a',
                background: '#ffffff',
                outline: 'none',
                minWidth: 180,
              }}
            >
              <option value="">-- Tất cả phòng ban --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Ma trận phân ca tuần */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 900 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: '#475569', width: 220 }}>
                Nhân viên ({filteredEmployees.length})
              </th>
              {weekDays.map((d, idx) => {
                const dateKey = formatDate(d);
                const isToday = dateKey === formatDate(new Date());
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <th
                    key={dateKey}
                    style={{
                      padding: '12px 10px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: isToday ? '#1d4ed8' : isWeekend ? '#e11d48' : '#334155',
                      background: isToday ? '#eff6ff' : undefined,
                      borderLeft: '1px solid #e2e8f0',
                      textAlign: 'center',
                    }}
                  >
                    <div>{VIETNAMESE_DAYS[d.getDay()]}</div>
                    <div style={{ fontSize: 13, marginTop: 2 }}>{formatDisplayDate(d)}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                  Đang tải ma trận phân ca...
                </td>
              </tr>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  Không tìm thấy nhân viên nào trong phòng ban này.
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {/* Cột nhân viên */}
                  <td style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>{emp.name}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                      <span style={{ color: '#2563eb', fontWeight: 600 }}>{emp.code}</span> • {emp.position || 'Nhân viên'}
                    </div>
                  </td>

                  {/* 7 cột ngày */}
                  {weekDays.map((d) => {
                    const dateStr = formatDate(d);
                    const isToday = dateStr === formatDate(new Date());
                    const shiftItem = scheduleMap.get(`${emp.id}_${dateStr}`);

                    return (
                      <td
                        key={dateStr}
                        onClick={() => handleOpenCell(emp, dateStr)}
                        style={{
                          padding: 8,
                          borderLeft: '1px solid #f1f5f9',
                          background: isToday ? 'rgba(239, 246, 255, 0.4)' : undefined,
                          cursor: 'pointer',
                          verticalAlign: 'top',
                          transition: 'background 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f1f5f9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isToday
                            ? 'rgba(239, 246, 255, 0.4)'
                            : 'transparent';
                        }}
                      >
                        {shiftItem ? (
                          <div
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: 6,
                              padding: '6px 8px',
                              fontSize: 11,
                              color: '#1e40af',
                              minHeight: 46,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div style={{ fontWeight: 700, lineHeight: 1.2 }}>{shiftItem.shiftName}</div>
                            <div style={{ fontSize: 10, color: '#3b82f6', marginTop: 3 }}>
                              {shiftItem.startTime} - {shiftItem.endTime}
                            </div>
                          </div>
                        ) : d.getDay() === 0 ? (
                          <div
                            style={{
                              border: '1px dashed #e2e8f0',
                              background: '#fafafa',
                              borderRadius: 6,
                              minHeight: 46,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#94a3b8',
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                            title="Chủ Nhật nghỉ tuần (Bấm để xếp ca trực nếu cần)"
                          >
                            <span>Nghỉ tuần</span>
                          </div>
                        ) : (
                          <div
                            style={{
                              border: '1px dashed #cbd5e1',
                              borderRadius: 6,
                              minHeight: 46,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#94a3b8',
                              fontSize: 12,
                            }}
                          >
                            <Plus size={14} />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Phân ca đơn lẻ */}
      <Modal
        open={cellModalOpen}
        onClose={() => setCellModalOpen(false)}
        title={selectedCell?.existing ? 'Chỉnh sửa Ca Làm Việc' : 'Gán Ca Làm Việc'}
      >
        {selectedCell && (
          <form onSubmit={handleSaveCell} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 13, border: '1px solid #e2e8f0' }}>
              <div><strong>Nhân viên:</strong> {selectedCell.emp.name} ({selectedCell.emp.code})</div>
              <div style={{ marginTop: 4 }}><strong>Ngày:</strong> {selectedCell.date}</div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Chọn Ca Làm Việc:
              </label>
              <select
                value={selectedShiftId}
                onChange={(e) => setSelectedShiftId(e.target.value)}
                required
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
              >
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.startTime} - {s.endTime})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Ghi chú (tùy chọn):
              </label>
              <input
                placeholder="VD: Đổi ca trực, phân công theo dự án..."
                value={cellNote}
                onChange={(e) => setCellNote(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              {selectedCell.existing ? (
                <button
                  type="button"
                  onClick={handleDeleteCell}
                  style={{
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    padding: '8px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Trash2 size={14} /> Xóa ca
                </button>
              ) : <div />}

              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="secondary" onClick={() => setCellModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={savingCell}>
                  {savingCell ? 'Đang lưu...' : 'Lưu phân ca'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Phân ca nhanh hàng loạt */}
      <Modal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title="Phân Ca Hàng Loạt Cho Phòng Ban"
      >
        <form onSubmit={handleSaveBulk} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Từ ngày:
              </label>
              <input
                type="date"
                value={bulkStartDate}
                onChange={(e) => setBulkStartDate(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Đến ngày:
              </label>
              <input
                type="date"
                value={bulkEndDate}
                onChange={(e) => setBulkEndDate(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Chọn Ca Làm Việc:
            </label>
            <select
              value={bulkShiftId}
              onChange={(e) => setBulkShiftId(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
            >
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.startTime} - {s.endTime})
                </option>
              ))}
            </select>
          </div>

          {/* Chọn nhân viên */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
                Chọn nhân viên áp dụng ({bulkEmpIds.length}/{filteredEmployees.length}):
              </label>
              <button
                type="button"
                onClick={toggleSelectAllEmp}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {bulkEmpIds.length === filteredEmployees.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>

            <div
              style={{
                maxHeight: 180,
                overflowY: 'auto',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                background: '#f8fafc',
              }}
            >
              {filteredEmployees.map((emp) => (
                <label
                  key={emp.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    cursor: 'pointer',
                    padding: '3px 0',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={bulkEmpIds.includes(emp.id)}
                    onChange={() => toggleSelectEmp(emp.id)}
                  />
                  <span>
                    <strong>{emp.name}</strong> ({emp.code}) - {emp.position || 'Nhân viên'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Ghi chú chung:
            </label>
            <input
              placeholder="VD: Phân ca hành chính tháng này..."
              value={bulkNote}
              onChange={(e) => setBulkNote(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <Button variant="secondary" onClick={() => setBulkModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={savingBulk}>
              {savingBulk ? 'Đang phân ca...' : 'Áp dụng phân ca'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
