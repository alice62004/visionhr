import React from 'react';
import Modal from '../../components/Modal/Modal';
import Button from '../../components/Button/Button';
import { Contract, ContractType } from '../../services/contractApi';

export interface RenewFormData {
  newContractCode: string;
  newContractType: ContractType;
  newEffectiveDate: string;
  newExpireDate: string;
  newBaseSalary: string;
  note: string;
}

interface ContractRenewModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  contract: Contract | null;
  renewForm: RenewFormData;
  setRenewForm: React.Dispatch<React.SetStateAction<RenewFormData>>;
  saving: boolean;
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

export default function ContractRenewModal({
  open,
  onClose,
  onSubmit,
  contract,
  renewForm,
  setRenewForm,
  saving,
}: ContractRenewModalProps) {
  return (
    <Modal
      open={open}
      title={`Gia Hạn Hợp Đồng: ${contract?.employeeName || ''}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="renew-contract-form" disabled={saving}>
            {saving ? 'Đang xử lý...' : 'Xác Nhận Gia Hạn'}
          </Button>
        </>
      }
    >
      <form id="renew-contract-form" onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ padding: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
          Hệ thống sẽ tạo một hợp đồng mới tiếp nối hợp đồng cũ (<strong>{contract?.contractCode}</strong>).
        </div>

        <div>
          <label style={labelStyle}>Số Hợp Đồng Mới *</label>
          <input
            style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: 600 }}
            required
            value={renewForm.newContractCode}
            onChange={(e) => setRenewForm((prev) => ({ ...prev, newContractCode: e.target.value }))}
          />
        </div>

        <div>
          <label style={labelStyle}>Loại Hợp Đồng Mới</label>
          <select
            style={inputStyle}
            value={renewForm.newContractType}
            onChange={(e) => setRenewForm((prev) => ({ ...prev, newContractType: e.target.value as ContractType }))}
          >
            <option value="xac_dinh_thoi_han">Xác định thời hạn (1 - 3 năm)</option>
            <option value="khong_xac_dinh_thoi_han">Không xác định thời hạn</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Ngày Hiệu Lực Mới *</label>
            <input
              type="date"
              style={inputStyle}
              required
              value={renewForm.newEffectiveDate}
              onChange={(e) => setRenewForm((prev) => ({ ...prev, newEffectiveDate: e.target.value }))}
            />
          </div>

          <div>
            <label style={labelStyle}>Ngày Hết Hạn Mới</label>
            <input
              type="date"
              style={{ ...inputStyle, background: renewForm.newContractType === 'khong_xac_dinh_thoi_han' ? '#f3f4f6' : '#fff' }}
              disabled={renewForm.newContractType === 'khong_xac_dinh_thoi_han'}
              value={renewForm.newExpireDate}
              onChange={(e) => setRenewForm((prev) => ({ ...prev, newExpireDate: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Mức Lương Mới Sau Khi Gia Hạn (VNĐ) *</label>
          <input
            type="number"
            style={{ ...inputStyle, fontWeight: 700, color: '#15803d' }}
            required
            value={renewForm.newBaseSalary}
            onChange={(e) => setRenewForm((prev) => ({ ...prev, newBaseSalary: e.target.value }))}
          />
        </div>

        <div>
          <label style={labelStyle}>Ghi Chú</label>
          <textarea
            style={{ ...inputStyle, height: 60 }}
            value={renewForm.note}
            onChange={(e) => setRenewForm((prev) => ({ ...prev, note: e.target.value }))}
          />
        </div>
      </form>
    </Modal>
  );
}
