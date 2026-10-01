import React, { useEffect, useState } from 'react';
import {
  getOvertimeRequests, createOvertimeRequest, approveOvertimeRequest, rejectOvertimeRequest
} from '../../services/overtimeApi';
import Table, { Column } from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import { useAuthStore } from '../../store/authStore';
import { OvertimeRequest, OvertimeStatus } from '../../types';

const emptyForm = { date: '', hours: '', reason: '' };

export default function Overtime() {
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const role = useAuthStore((s) => s.user?.role);
  const canApprove = role === 'admin' || role === 'hr' || role === 'manager';

  const load = () => getOvertimeRequests().then(setRequests).catch(() => setRequests([]));

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: number) => {
    try {
      await approveOvertimeRequest(id);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Duyệt thất bại.');
    }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt('Lý do từ chối (tùy chọn):');
    if (reason === null) return;
    try {
      await rejectOvertimeRequest(id, reason);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Từ chối thất bại.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hoursNum = Number(form.hours);
    if (hoursNum <= 0 || hoursNum > 12) {
      alert('Số giờ OT phải từ 0.5 đến 12 giờ.');
      return;
    }
    setSaving(true);
    try {
      await createOvertimeRequest({ date: form.date, hours: hoursNum, reason: form.reason });
      load();
      setModalOpen(false);
      setForm(emptyForm);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<OvertimeRequest>[] = [
    { key: 'employeeName', label: 'Nhân viên' },
    { key: 'date', label: 'Ngày' },
    { key: 'hours', label: 'Số giờ OT' },
    { key: 'reason', label: 'Lý do' },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (row) => <StatusBadge status={row.status} />,
    },
    ...(canApprove ? [{
      key: 'actions',
      label: '',
      render: (row: OvertimeRequest) => row.status === 'cho_duyet' ? (
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
            Đăng ký Tăng ca (OT)
          </h1>
          <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: 14 }}>
            Theo dõi và duyệt các yêu cầu tăng ca
          </p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setModalOpen(true); }}>
          + Đăng ký OT
        </Button>
      </div>

      <Table columns={columns} data={requests} />

      <Modal
        open={modalOpen}
        title="Đăng ký tăng ca (OT)"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" form="ot-form" disabled={saving}>
              {saving ? 'Đang gửi...' : 'Gửi đơn OT'}
            </Button>
          </>
        }
      >
        <form id="ot-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>Ngày tăng ca *</label>
            <input
              type="date"
              style={inputStyle}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Số giờ OT *</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="12"
              style={inputStyle}
              placeholder="Ví dụ: 2 hoặc 2.5"
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Lý do tăng ca *</label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="Mô tả công việc cần tăng ca..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

function StatusBadge({ status }: { status: OvertimeStatus }) {
  const map: Record<OvertimeStatus, { color: string; bg: string; border: string; label: string }> = {
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
