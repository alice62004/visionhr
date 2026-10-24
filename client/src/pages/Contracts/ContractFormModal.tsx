import React from 'react';
import Modal from '../../components/Modal/Modal';
import Button from '../../components/Button/Button';
import { Employee } from '../../types';
import { ContractType, ContractStatus } from '../../services/contractApi';

export interface ContractFormData {
  contractCode: string;
  employeeId: string;
  contractType: ContractType;
  signDate: string;
  effectiveDate: string;
  expireDate: string;
  baseSalary: string;
  insuranceSalary: string;
  standardWorkDays: string;
  annualLeaveDays: string;
  salaryPercentage: string;
  position: string;
  workLocation: string;
  note: string;
  status: ContractStatus;
}

interface ContractFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: ContractFormData;
  setFormData: React.Dispatch<React.SetStateAction<ContractFormData>>;
  employees: Employee[];
  saving: boolean;
  formError: string;
  onEmployeeSelect: (empId: string) => void;
  onTypeChange: (type: ContractType) => void;
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12.5,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid #d1d5db',
  fontSize: 13,
  boxSizing: 'border-box',
  outline: 'none',
};

export default function ContractFormModal({
  open,
  onClose,
  onSubmit,
  formData,
  setFormData,
  employees,
  saving,
  formError,
  onEmployeeSelect,
  onTypeChange,
}: ContractFormModalProps) {
  return (
    <Modal
      open={open}
      title="Soạn Thảo Hợp Đồng Lao Động Mới"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="create-contract-form" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu & Kích Hoạt'}
          </Button>
        </>
      }
    >
      <form id="create-contract-form" onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {formError && (
          <div style={{ padding: 10, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13 }}>
            {formError}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Số Hợp Đồng *</label>
            <input
              style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: 600 }}
              required
              value={formData.contractCode}
              onChange={(e) => setFormData((prev) => ({ ...prev, contractCode: e.target.value }))}
            />
          </div>

          <div>
            <label style={labelStyle}>Nhân Viên *</label>
            <select
              style={inputStyle}
              required
              value={formData.employeeId}
              onChange={(e) => onEmployeeSelect(e.target.value)}
            >
              <option value="">-- Chọn nhân viên --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.code} - {emp.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Loại Hợp Đồng *</label>
            <select
              style={inputStyle}
              value={formData.contractType}
              onChange={(e) => onTypeChange(e.target.value as ContractType)}
            >
              <option value="thu_viec">HĐ Thử việc (85% lương)</option>
              <option value="xac_dinh_thoi_han">HĐ Xác định thời hạn (1 năm)</option>
              <option value="khong_xac_dinh_thoi_han">Không xác định thời hạn</option>
              <option value="thoi_vu">Thời vụ / Cộng tác viên</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Chức Danh Công Việc</label>
            <input
              style={inputStyle}
              value={formData.position}
              onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
              placeholder="Lập trình viên, Chuyên viên..."
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Ngày Ký *</label>
            <input
              type="date"
              style={inputStyle}
              required
              value={formData.signDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, signDate: e.target.value }))}
            />
          </div>

          <div>
            <label style={labelStyle}>Ngày Hiệu Lực *</label>
            <input
              type="date"
              style={inputStyle}
              required
              value={formData.effectiveDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, effectiveDate: e.target.value }))}
            />
          </div>

          <div>
            <label style={labelStyle}>Ngày Hết Hạn</label>
            <input
              type="date"
              style={{ ...inputStyle, background: formData.contractType === 'khong_xac_dinh_thoi_han' ? '#f3f4f6' : '#fff' }}
              disabled={formData.contractType === 'khong_xac_dinh_thoi_han'}
              value={formData.expireDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, expireDate: e.target.value }))}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Lương Cơ Bản Thỏa Thuận (VNĐ) *</label>
            <input
              type="number"
              style={{ ...inputStyle, fontWeight: 700, color: '#1d4ed8' }}
              required
              value={formData.baseSalary}
              onChange={(e) => setFormData((prev) => ({ ...prev, baseSalary: e.target.value }))}
            />
          </div>

          <div>
            <label style={labelStyle}>Lương Đóng BHXH (VNĐ)</label>
            <input
              type="number"
              style={inputStyle}
              value={formData.insuranceSalary}
              onChange={(e) => setFormData((prev) => ({ ...prev, insuranceSalary: e.target.value }))}
            />
          </div>
        </div>

        {/* QUY CHUẨN 26 CÔNG & 12 PHÉP NĂM */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div>
            <label style={labelStyle}>Công Chuẩn (ngày/tháng)</label>
            <input
              type="number"
              style={{ ...inputStyle, fontWeight: 700, color: '#1e3a8a', background: '#eff6ff' }}
              value={formData.standardWorkDays}
              onChange={(e) => setFormData((prev) => ({ ...prev, standardWorkDays: e.target.value }))}
            />
            <span style={{ fontSize: 11, color: '#6b7280' }}>Mặc định 26 công</span>
          </div>

          <div>
            <label style={labelStyle}>Phép Năm (ngày/năm)</label>
            <input
              type="number"
              style={{ ...inputStyle, fontWeight: 700, color: '#047857', background: '#ecfdf5' }}
              value={formData.annualLeaveDays}
              onChange={(e) => setFormData((prev) => ({ ...prev, annualLeaveDays: e.target.value }))}
            />
            <span style={{ fontSize: 11, color: '#6b7280' }}>Mặc định 12 ngày</span>
          </div>

          <div>
            <label style={labelStyle}>% Lương Hưởng</label>
            <input
              type="number"
              style={{ ...inputStyle, fontWeight: 700 }}
              value={formData.salaryPercentage}
              onChange={(e) => setFormData((prev) => ({ ...prev, salaryPercentage: e.target.value }))}
            />
            <span style={{ fontSize: 11, color: '#6b7280' }}>85% hoặc 100%</span>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Địa Điểm Làm Việc</label>
          <input
            style={inputStyle}
            value={formData.workLocation}
            onChange={(e) => setFormData((prev) => ({ ...prev, workLocation: e.target.value }))}
          />
        </div>

        <div>
          <label style={labelStyle}>Ghi Chú</label>
          <textarea
            style={{ ...inputStyle, height: 60 }}
            value={formData.note}
            onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
            placeholder="Quy định bổ sung..."
          />
        </div>
      </form>
    </Modal>
  );
}
