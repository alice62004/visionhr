import React, { useEffect, useState } from 'react';
import {
  getLeaveRequests, createLeaveRequest, approveLeaveRequest, rejectLeaveRequest
} from '../../services/leaveApi';
import Table, { Column } from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import { useAuthStore } from '../../store/authStore';
import { LeaveRequest, LeaveStatus } from '../../types';

const LEAVE_TYPES = ['Nghỉ phép năm', 'Nghỉ bệnh', 'Nghỉ thai sản', 'Nghỉ không lương', 'Nghỉ việc riêng'];

const emptyForm = { type: '', fromDate: '', toDate: '', reason: '' };

export default function Leave() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const canApprove = role === 'admin' || role === 'hr' || role === 'manager';

  const load = () => getLeaveRequests().then(setRequests).catch(() => setRequests([]));

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: number) => {
    try {
      await approveLeaveRequest(id);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Duyệt thất bại.');
    }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt('Lý do từ chối (tùy chọn):');
    if (reason === null) return;
    try {
      await rejectLeaveRequest(id, reason);
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
    setSaving(true);
    try {
      await createLeaveRequest(form);
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
    { key: 'employeeName', label: 'Nhân viên' },
    { key: 'type', label: 'Loại nghỉ' },
    { key: 'fromDate', label: 'Từ ngày' },
    { key: 'toDate', label: 'Đến ngày' },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (row) => <StatusBadge status={row.status} />,
    },
    ...(canApprove ? [{
      key: 'actions',
      label: '',
      render: (row: LeaveRequest) => row.status === 'cho_duyet' ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button variant="secondary" onClick={() => handleApprove(row.id)}>✓ Duyệt</Button>
          <Button variant="danger" onClick={() => handleReject(row.id)}>✗ Từ chối</Button>
        </div>
      ) : null,
    }] : []),
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px 0', color: '#111827' }}>
            Nghỉ phép
          </h1>
          <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: 14 }}>
            Đăng ký và duyệt đơn nghỉ phép
          </p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setModalOpen(true); }}>
          + Tạo đơn nghỉ phép
        </Button>
      </div>

      <Table columns={columns} data={requests} />

      <Modal
        open={modalOpen}
        title="Tạo đơn xin nghỉ phép"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" form="leave-form" disabled={saving}>
              {saving ? 'Đang gửi...' : 'Gửi đơn'}
            </Button>
          </>
        }
      >
        <form id="leave-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>Loại nghỉ phép *</label>
            <select
              style={inputStyle}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              required
            >
              <option value="">-- Chọn loại nghỉ --</option>
              {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
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
          <div>
            <label style={labelStyle}>Lý do</label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="Nêu lý do xin nghỉ..."
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

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inputStyle: React.CSSProperties = {
  padding: '9px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  fontSize: 14,
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
};
