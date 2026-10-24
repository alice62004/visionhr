import React, { useEffect, useState } from 'react';
import {
  CalendarOff,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Sparkles,
  Info,
  ShieldAlert,
} from 'lucide-react';
import {
  getLeaveRequests,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
} from '../../services/leaveApi';
import Table, { Column } from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import { useAuthStore } from '../../store/authStore';
import { LeaveRequest, LeaveStatus } from '../../types';
import { emitSystemNotification } from '../../utils/notificationService';

const LEAVE_TYPES = ['Nghỉ việc riêng', 'Nghỉ phép năm', 'Nghỉ bệnh', 'Nghỉ thai sản', 'Nghỉ không lương'];

const emptyForm = { type: 'Nghỉ việc riêng', fromDate: '', toDate: '', reason: '' };

export default function Leave() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const canApprove = role === 'admin' || role === 'hr' || role === 'manager';

  const load = () => getLeaveRequests().then(setRequests).catch(() => setRequests([]));

  useEffect(() => {
    load();
  }, []);

  // QUY ĐỊNH HẠN MỨC: Nghỉ việc riêng tối đa 3 lượt/tháng
  const MAX_PERSONAL_LEAVE_PER_MONTH = 3;
  const currentMonthStr = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const currentMonthName = `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`;

  // Thống kê các đơn nghỉ việc riêng trong tháng hiện tại
  const personalLeavesThisMonth = requests.filter((r) => {
    const isPersonal = r.type === 'Nghỉ việc riêng' || r.type?.toLowerCase().includes('việc riêng');
    const inCurrentMonth = r.fromDate && r.fromDate.slice(0, 7) === currentMonthStr;
    return isPersonal && inCurrentMonth;
  });

  const usedPersonalLeavesCount = personalLeavesThisMonth.length;
  const remainingPersonalLeaves = Math.max(0, MAX_PERSONAL_LEAVE_PER_MONTH - usedPersonalLeavesCount);

  // Tổng số đơn chờ duyệt
  const pendingRequestsCount = requests.filter((r) => r.status === 'cho_duyet').length;

  // Tính số ngày của form đang tạo
  const formLeaveDays =
    form.fromDate && form.toDate && new Date(form.toDate) >= new Date(form.fromDate)
      ? Math.round(
          (new Date(form.toDate).getTime() - new Date(form.fromDate).getTime()) /
            (1000 * 3600 * 24)
        ) + 1
      : 0;

  const isPersonalLeaveType =
    form.type === 'Nghỉ việc riêng' || form.type?.toLowerCase().includes('việc riêng');
  const isExceedingQuota = isPersonalLeaveType && remainingPersonalLeaves <= 0;

  const handleApprove = async (id: number) => {
    try {
      const targetReq = requests.find((r) => r.id === id);
      await approveLeaveRequest(id);
      emitSystemNotification({
        title: 'Đã PHÊ DUYỆT đơn nghỉ phép',
        message: `Đơn xin nghỉ của ${targetReq?.employeeName || 'nhân viên'} (${targetReq?.type || 'Nghỉ phép'}) đã được phê duyệt thành công.`,
        type: 'leave',
        link: '/leave',
      });
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Duyệt thất bại.');
    }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt('Lý do từ chối (tùy chọn):');
    if (reason === null) return;
    try {
      const targetReq = requests.find((r) => r.id === id);
      await rejectLeaveRequest(id, reason);
      emitSystemNotification({
        title: 'Đã TỪ CHỐI đơn nghỉ phép',
        message: `Đơn xin nghỉ của ${targetReq?.employeeName || 'nhân viên'} đã bị từ chối.${reason ? ' Lý do: ' + reason : ''}`,
        type: 'leave',
        link: '/leave',
      });
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Từ chối thất bại.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(form.fromDate) > new Date(form.toDate)) {
      alert('Ngày bắt đầu phải trước ngày kết thúc.');
      return;
    }

    let finalReason = form.reason || '';
    if (isExceedingQuota) {
      finalReason = `[VƯỢT ĐỊNH MỨC THÁNG: Đã dùng ${usedPersonalLeavesCount}/${MAX_PERSONAL_LEAVE_PER_MONTH} lượt] ${finalReason}`.trim();
    }

    setSaving(true);
    try {
      await createLeaveRequest({ ...form, reason: finalReason });
      emitSystemNotification({
        title: 'Đã tạo đơn xin nghỉ phép mới',
        message: `Đơn xin ${form.type} (${form.fromDate} đến ${form.toDate}, ${formLeaveDays} ngày) đã được gửi và đang chờ duyệt.${isExceedingQuota ? ' (Lưu ý: Vượt định mức việc riêng tháng)' : ''}`,
        type: 'leave',
        link: '/leave',
      });
      load();
      setModalOpen(false);
      setForm(emptyForm);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<LeaveRequest>[] = [
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
      render: (row) => (
        <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.employeeName || 'Nhân viên'}</span>
      ),
    },
    {
      key: 'type',
      label: 'Loại nghỉ',
      render: (row) => (
        <span
          style={{
            background: row.type.includes('việc riêng') ? '#fef3c7' : '#eff6ff',
            color: row.type.includes('việc riêng') ? '#92400e' : '#1e40af',
            border: `1px solid ${row.type.includes('việc riêng') ? '#fde68a' : '#bfdbfe'}`,
            padding: '2px 8px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {row.type}
        </span>
      ),
    },
    { key: 'fromDate', label: 'Từ ngày' },
    { key: 'toDate', label: 'Đến ngày' },
    {
      key: 'reason',
      label: 'Lý do / Ghi chú',
      render: (row) => (
        <div style={{ maxWidth: 260, fontSize: 12.5, color: '#475569' }} title={row.reason || ''}>
          {row.reason?.includes('[VƯỢT ĐỊNH MỨC') ? (
            <div>
              <span
                style={{
                  color: '#dc2626',
                  fontWeight: 700,
                  background: '#fef2f2',
                  padding: '1px 5px',
                  borderRadius: 4,
                  fontSize: 11,
                  display: 'inline-block',
                  marginBottom: 3,
                }}
              >
                ⚠️ Vượt định mức tháng
              </span>
              <div>{row.reason.replace(/\[VƯỢT ĐỊNH MỨC.*?\]/, '').trim()}</div>
            </div>
          ) : (
            row.reason || '--'
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (row) => <StatusBadge status={row.status} />,
    },
    ...(canApprove
      ? [
          {
            key: 'actions',
            label: 'Thao tác',
            render: (row: LeaveRequest) =>
              row.status === 'cho_duyet' ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApprove(row.id);
                    }}
                  >
                    ✓ Duyệt
                  </Button>
                  <Button
                    variant="danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReject(row.id);
                    }}
                  >
                    ✗ Từ chối
                  </Button>
                </div>
              ) : null,
          },
        ]
      : []),
  ];

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px 0', color: '#111827' }}>
            Nghỉ phép & Nghỉ việc riêng
          </h1>
          <p style={{ color: '#6b7280', margin: '0 0 4px 0', fontSize: 14 }}>
            Theo dõi định mức số lượt được nghỉ, đăng ký và phê duyệt đơn xin nghỉ
          </p>
        </div>
        <Button
          onClick={() => {
            setForm(emptyForm);
            setModalOpen(true);
          }}
        >
          + Tạo đơn nghỉ phép
        </Button>
      </div>

      {/* KPI STATS: XÁC ĐỊNH ĐỊNH MỨC SỐ LƯỢT ĐƯỢC NGHỈ TRONG THÁNG */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}
      >
        {/* Card 1: Định mức tháng */}
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
              Định mức việc riêng ({currentMonthName})
            </span>
            <div style={{ padding: 6, background: '#eff6ff', borderRadius: 8, color: '#2563eb' }}>
              <Calendar size={16} />
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
            {MAX_PERSONAL_LEAVE_PER_MONTH} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>lượt / tháng</span>
          </div>
          <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
            Quy định nghỉ việc riêng tiêu chuẩn
          </div>
        </div>

        {/* Card 2: Đã sử dụng */}
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
              Đã dùng trong tháng
            </span>
            <div style={{ padding: 6, background: '#fef3c7', borderRadius: 8, color: '#d97706' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#d97706' }}>
            {usedPersonalLeavesCount} / {MAX_PERSONAL_LEAVE_PER_MONTH}{' '}
            <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>lượt</span>
          </div>
          <div
            style={{
              height: 6,
              background: '#f1f5f9',
              borderRadius: 999,
              marginTop: 8,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, (usedPersonalLeavesCount / MAX_PERSONAL_LEAVE_PER_MONTH) * 100)}%`,
                background: usedPersonalLeavesCount >= MAX_PERSONAL_LEAVE_PER_MONTH ? '#ef4444' : '#f59e0b',
                borderRadius: 999,
              }}
            />
          </div>
        </div>

        {/* Card 3: Số lượt còn lại */}
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
              Số lượt còn lại
            </span>
            <div
              style={{
                padding: 6,
                background: remainingPersonalLeaves > 0 ? '#f0fdf4' : '#fef2f2',
                borderRadius: 8,
                color: remainingPersonalLeaves > 0 ? '#16a34a' : '#dc2626',
              }}
            >
              {remainingPersonalLeaves > 0 ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            </div>
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: remainingPersonalLeaves > 0 ? '#16a34a' : '#dc2626',
            }}
          >
            {remainingPersonalLeaves}{' '}
            <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>lượt</span>
          </div>
          <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
            {remainingPersonalLeaves > 0 ? 'Đủ điều kiện tạo đơn tự do' : '⚠️ Đã chạm ngưỡng định mức'}
          </div>
        </div>

        {/* Card 4: Đơn chờ duyệt */}
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
              Đơn đang chờ duyệt
            </span>
            <div style={{ padding: 6, background: '#f5f3ff', borderRadius: 8, color: '#7c3aed' }}>
              <Sparkles size={16} />
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#7c3aed' }}>
            {pendingRequestsCount} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>đơn</span>
          </div>
          <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
            {canApprove ? 'Cần bạn phê duyệt' : 'Đang chờ Quản lý duyệt'}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <Table columns={columns} data={requests} />

      {/* Modal Tạo đơn xin nghỉ */}
      <Modal
        open={modalOpen}
        title="Tạo đơn xin nghỉ phép / việc riêng"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" form="leave-form" disabled={saving}>
              {saving ? 'Đang gửi...' : 'Gửi đơn xin nghỉ'}
            </Button>
          </>
        }
      >
        <form
          id="leave-form"
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {/* Thông báo định mức số lượt */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: isExceedingQuota ? '#fef2f2' : '#eff6ff',
              border: `1px solid ${isExceedingQuota ? '#fecaca' : '#bfdbfe'}`,
              color: isExceedingQuota ? '#b91c1c' : '#1e40af',
              fontSize: 12.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}
          >
            {isExceedingQuota ? (
              <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            ) : (
              <Info size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            )}
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>
                Định mức nghỉ việc riêng {currentMonthName}: {MAX_PERSONAL_LEAVE_PER_MONTH} lượt/tháng
              </div>
              <div>
                Bạn đã sử dụng <strong>{usedPersonalLeavesCount}/{MAX_PERSONAL_LEAVE_PER_MONTH} lượt</strong>.
                {isExceedingQuota ? (
                  <span style={{ display: 'block', marginTop: 4, color: '#dc2626', fontWeight: 600 }}>
                    ⚠️ Bạn đã hết hạn mức việc riêng tháng này. Đơn này sẽ được chuyển sang diện phê duyệt đặc biệt!
                  </span>
                ) : (
                  <span> Còn lại <strong>{remainingPersonalLeaves} lượt</strong> trong tháng này.</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Loại nghỉ phép *</label>
            <select
              style={inputStyle}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              required
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Từ ngày *</label>
              <input
                type="date"
                style={inputStyle}
                value={form.fromDate}
                onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Đến ngày *</label>
              <input
                type="date"
                style={inputStyle}
                value={form.toDate}
                onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                required
              />
            </div>
          </div>

          {formLeaveDays > 0 && (
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: '#2563eb',
                background: '#f8fafc',
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid #e2e8f0',
              }}
            >
              📅 Thời gian xin nghỉ: <strong>{formLeaveDays} ngày</strong>
            </div>
          )}

          <div>
            <label style={labelStyle}>Lý do xin nghỉ</label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="Nêu rõ lý do xin nghỉ việc riêng hoặc nghỉ phép..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

function StatusBadge({ status }: { status: LeaveStatus }) {
  const map: Record<LeaveStatus, { color: string; bg: string; border: string; label: string }> = {
    cho_duyet: { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Chờ duyệt' },
    da_duyet: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Đã duyệt' },
    tu_choi: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Từ chối' },
  };
  const item = map[status] || { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', label: status };
  return (
    <span
      style={{
        color: item.color,
        background: item.bg,
        border: `1px solid ${item.border}`,
        padding: '2px 8px',
        borderRadius: 6,
        fontWeight: 600,
        fontSize: 12,
      }}
    >
      {item.label}
    </span>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  padding: '9px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  fontSize: 14,
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
};
