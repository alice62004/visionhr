import { useEffect, useState } from 'react';
import {
  getOvertimeRequests,
  createOvertimeRequest,
  approveOvertimeRequest,
  rejectOvertimeRequest,
} from '../../services/overtimeApi';
import { getEmployees } from '../../services/employeeApi';
import Table, { Column } from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import { useAuthStore } from '../../store/authStore';
import { OvertimeRequest, OvertimeStatus, Employee } from '../../types';
import { emitSystemNotification } from '../../utils/notificationService';
import { Timer, Plus, CheckCircle2, XCircle, Search } from 'lucide-react';

const emptyForm = { employeeId: '', date: '', hours: '', reason: '' };

export default function Overtime() {
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const role = useAuthStore((s) => s.user?.role);
  const canApprove = role === 'admin' || role === 'hr' || role === 'manager';

  const loadData = () => {
    getOvertimeRequests().then(setRequests).catch(() => setRequests([]));
    getEmployees().then(setEmployees).catch(() => setEmployees([]));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      const target = requests.find((r) => r.id === id);
      await approveOvertimeRequest(id);
      emitSystemNotification({
        title: 'Đã PHÊ DUYỆT đơn tăng ca (OT)',
        message: `Đơn xin tăng ca của ${target?.employeeName || 'nhân viên'} (${target?.hours || ''} giờ ngày ${target?.date || ''}) đã được phê duyệt.`,
        type: 'attendance',
        link: '/overtime',
      });
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Duyệt thất bại.');
    }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt('Lý do từ chối (tùy chọn):');
    if (reason === null) return;
    try {
      const target = requests.find((r) => r.id === id);
      await rejectOvertimeRequest(id, reason);
      emitSystemNotification({
        title: 'Đã TỪ CHỐI đơn tăng ca (OT)',
        message: `Đơn xin tăng ca của ${target?.employeeName || 'nhân viên'} đã bị từ chối.${reason ? ' Lý do: ' + reason : ''}`,
        type: 'attendance',
        link: '/overtime',
      });
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Từ chối thất bại.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hoursNum = Number(form.hours);
    if (!form.employeeId) {
      alert('Vui lòng chọn nhân viên tăng ca.');
      return;
    }
    if (hoursNum <= 0 || hoursNum > 12) {
      alert('Số giờ OT phải từ 0.5 đến 12 giờ.');
      return;
    }

    const selectedEmp = employees.find((emp) => String(emp.id) === String(form.employeeId));

    setSaving(true);
    try {
      await createOvertimeRequest({
        employeeId: Number(form.employeeId),
        date: form.date,
        hours: hoursNum,
        reason: form.reason,
      });

      emitSystemNotification({
        title: 'Đã ghi nhận tăng ca thực tế (OT)',
        message: `Ghi nhận thành công ${hoursNum}h OT cho nhân viên ${selectedEmp?.name || ''} vào ngày ${form.date}.`,
        type: 'attendance',
        link: '/overtime',
      });

      loadData();
      setModalOpen(false);
      setForm(emptyForm);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setSaving(false);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.employeeName?.toLowerCase().includes(term) ||
      (r as any).employeeCode?.toLowerCase().includes(term) ||
      r.date.includes(term) ||
      r.reason.toLowerCase().includes(term)
    );
  });

  const columns: Column<OvertimeRequest>[] = [
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#184a8c',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            {r.employeeName ? r.employeeName.charAt(0).toUpperCase() : 'U'}
          </div>
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
      label: 'Ngày tăng ca',
      render: (r) => {
        const clean = r.date.includes('T') ? r.date.split('T')[0] : r.date;
        const [y, m, d] = clean.split('-');
        return <span style={{ fontWeight: 600, color: '#1e293b' }}>{d && m && y ? `${d}/${m}/${y}` : clean}</span>;
      },
    },
    {
      key: 'hours',
      label: 'Số giờ OT',
      render: (r) => (
        <span style={{ fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '3px 8px', borderRadius: 6 }}>
          +{r.hours} giờ
        </span>
      ),
    },
    {
      key: 'reason',
      label: 'Lý do / Công việc',
      render: (r) => <span style={{ fontSize: 13, color: '#475569' }}>{r.reason || '--'}</span>,
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
            render: (row: OvertimeRequest) =>
              row.status === 'cho_duyet' ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button variant="secondary" onClick={() => handleApprove(row.id)}>
                    <CheckCircle2 size={13} style={{ marginRight: 4 }} /> Duyệt
                  </Button>
                  <Button variant="danger" onClick={() => handleReject(row.id)}>
                    <XCircle size={13} style={{ marginRight: 4 }} /> Từ chối
                  </Button>
                </div>
              ) : null,
          },
        ]
      : []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px 0', color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Timer size={22} color="#184a8c" />
            Quản lý & Ghi nhận Tăng ca (OT)
          </h1>
          <p style={{ color: '#6b7280', margin: 0, fontSize: 14 }}>
            Ghi nhận và phê duyệt giờ làm thêm thực tế cho nhân viên theo phân công của Quản lý / HR
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 220 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Tìm theo nhân viên, ngày..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 30px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <Button onClick={() => { setForm(emptyForm); setModalOpen(true); }}>
            <Plus size={16} style={{ marginRight: 6 }} /> Ghi nhận OT mới
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <Table columns={columns} data={filteredRequests} />

      {/* Modal Ghi nhận OT theo nhân viên */}
      <Modal
        open={modalOpen}
        title="Ghi nhận giờ tăng ca (OT) cho nhân viên"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" form="ot-form" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu bản ghi OT'}
            </Button>
          </>
        }
      >
        <form id="ot-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Chọn nhân viên tăng ca *</label>
            <select
              style={inputStyle}
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              required
            >
              <option value="">-- Chọn nhân viên thực hiện OT --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.code}) - {emp.department || 'Phòng ban'}
                </option>
              ))}
            </select>
          </div>

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
            <label style={labelStyle}>Số giờ làm thêm (OT) *</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="12"
              style={inputStyle}
              placeholder="Ví dụ: 1.5, 2, 3..."
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Lý do / Công việc phát sinh *</label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="Mô tả công việc hoàn thành trong ca làm thêm..."
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
    da_duyet: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Đã duyệt thực tế' },
    tu_choi: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Từ chối' },
  };
  const item = map[status] || { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', label: status };
  return (
    <span
      style={{
        color: item.color,
        background: item.bg,
        border: `1px solid ${item.border}`,
        padding: '3px 10px',
        borderRadius: 20,
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
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  fontSize: 13.5,
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
};
