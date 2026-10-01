import React, { useEffect, useState } from 'react';
import { getShifts, createShift, updateShift, deleteShift } from '../../services/attendanceApi';
import { getDepartments } from '../../services/employeeApi';
import Table, { Column } from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import { useAuthStore } from '../../store/authStore';
import { Department, Shift } from '../../types';

interface ShiftForm {
  name: string;
  startTime: string;
  endTime: string;
  departmentId: string | number;
}

const emptyForm: ShiftForm = { name: '', startTime: '', endTime: '', departmentId: '' };

export default function Shifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Shift | null>(null);
  const [form, setForm] = useState<ShiftForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const role = useAuthStore((s) => s.user?.role);
  const canEdit = role === 'admin' || role === 'hr';

  const load = () => {
    getShifts().then(setShifts).catch(() => setShifts([]));
  };

  useEffect(() => {
    load();
    getDepartments().then(setDepartments).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (shift: any) => {
    setEditTarget(shift);
    setForm({
      name: shift.name,
      startTime: shift.startTime || shift.start_time,
      endTime: shift.endTime || shift.end_time,
      departmentId: shift.departmentId || shift.department_id || '',
    });
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditTarget(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      start_time: form.startTime,
      end_time: form.endTime,
      department_id: form.departmentId ? Number(form.departmentId) : null,
    };
    try {
      if (editTarget) {
        await updateShift(editTarget.id, payload);
      } else {
        await createShift(payload);
      }
      load();
      handleClose();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (shift: Shift) => {
    if (!window.confirm(`Xóa ca "${shift.name}"?`)) return;
    try {
      await deleteShift(shift.id);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Xóa thất bại.');
    }
  };

  const columns: Column<Shift>[] = [
    { key: 'name', label: 'Tên ca' },
    { key: 'startTime', label: 'Giờ bắt đầu', render: (r: any) => r.startTime || r.start_time },
    { key: 'endTime', label: 'Giờ kết thúc', render: (r: any) => r.endTime || r.end_time },
    { key: 'department', label: 'Áp dụng cho', render: (r: any) => r.department || r.departmentName || 'Toàn công ty' },
    ...(canEdit ? [{
      key: 'actions',
      label: '',
      render: (row: Shift) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button variant="secondary" onClick={() => openEdit(row)}>Sửa</Button>
          <Button variant="danger" onClick={() => handleDelete(row)}>Xóa</Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px 0', color: '#111827' }}>
            Phân ca làm việc
          </h1>
          <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: 14 }}>
            Thiết lập và phân bổ ca làm cho từng phòng ban
          </p>
        </div>
        {canEdit && <Button onClick={openCreate}>+ Thêm ca làm</Button>}
      </div>

      <Table columns={columns} data={shifts} />

      <Modal
        open={modalOpen}
        title={editTarget ? 'Chỉnh sửa ca làm việc' : 'Thêm ca làm việc mới'}
        onClose={handleClose}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={handleClose}>Hủy</Button>
            <Button type="submit" form="shift-form" disabled={saving}>
              {saving ? 'Đang lưu...' : (editTarget ? 'Cập nhật' : 'Tạo ca')}
            </Button>
          </>
        }
      >
        <form id="shift-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>Tên ca *</label>
            <input
              style={inputStyle}
              placeholder="Ca sáng, Ca tối..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Giờ bắt đầu *</label>
              <input
                type="time"
                style={inputStyle}
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Giờ kết thúc *</label>
              <input
                type="time"
                style={inputStyle}
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Phòng ban áp dụng</label>
            <select
              style={inputStyle}
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            >
              <option value="">-- Tất cả phòng ban --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
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
