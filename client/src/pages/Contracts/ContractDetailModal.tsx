import React from 'react';
import { Printer } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import Button from '../../components/Button/Button';
import { Contract, ContractType } from '../../services/contractApi';
import { formatVND } from '../../utils/formatters';

interface ContractDetailModalProps {
  open: boolean;
  onClose: () => void;
  contract: Contract | null;
  typeMap: Record<ContractType, { label: string; bg: string; color: string; border: string }>;
}

export default function ContractDetailModal({
  open,
  onClose,
  contract,
  typeMap,
}: ContractDetailModalProps) {
  return (
    <Modal
      open={open}
      title="Văn Bản Hợp Đồng Lao Động (Xem & In)"
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer size={15} style={{ marginRight: 6 }} />
            In Bản Hợp Đồng
          </Button>
          <Button onClick={onClose}>Đóng</Button>
        </div>
      }
    >
      {contract && (
        <div
          style={{
            padding: 20,
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            fontSize: 13,
            lineHeight: 1.6,
            color: '#1f2937',
            fontFamily: 'serif',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h4 style={{ margin: 0, fontSize: 13, textTransform: 'uppercase', fontWeight: 800 }}>
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </h4>
            <p style={{ margin: '2px 0 16px 0', fontSize: 12, fontStyle: 'italic', textDecoration: 'underline' }}>
              Độc lập - Tự do - Hạnh phúc
            </p>
            <h3 style={{ margin: 0, fontSize: 17, textTransform: 'uppercase', fontWeight: 800, color: '#1e3a8a', fontFamily: 'sans-serif' }}>
              HỢP ĐỒNG LAO ĐỘNG
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, fontFamily: 'monospace', color: '#6b7280' }}>
              Số: <strong>{contract.contractCode}</strong>
            </p>
          </div>

          <div style={{ fontFamily: 'sans-serif', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <strong>BÊN A (NGƯỜI SỬ DỤNG LAO ĐỘNG):</strong> CÔNG TY CỔ PHẦN CÔNG NGHỆ VISIONHR<br />
              Đại diện: <strong>Bà Trần Thị Bình</strong> - Chức vụ: Trưởng Phòng Nhân Sự (HR)
            </div>

            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <strong>BÊN B (NGƯỜI LAO ĐỘNG):</strong> Ông/Bà <strong>{contract.employeeName}</strong><br />
              Mã nhân viên: <strong>{contract.employeeCode}</strong> | Chức danh: <strong>{contract.position || 'Nhân viên'}</strong><br />
              Số CCCD: {contract.employeeIdCard || '07919800xxxx'} | Email: {contract.employeeEmail}
            </div>

            <div>
              <strong>ĐIỀU 1: THỜI HẠN LÀM VIỆC</strong><br />
              - Loại hợp đồng: <strong>{typeMap[contract.contractType]?.label || contract.contractType}</strong>.<br />
              - Hiệu lực: Từ ngày <strong>{contract.effectiveDate}</strong> đến ngày <strong>{contract.expireDate || 'Không xác định'}</strong>.
            </div>

            <div>
              <strong>ĐIỀU 2: CHẾ ĐỘ LÀM VIỆC & CHẤM CÔNG AI</strong><br />
              - <strong>Số ngày công tiêu chuẩn:</strong> <span style={{ color: '#2563eb', fontWeight: 700 }}>{contract.standardWorkDays} ngày công / tháng</span> (từ Thứ 2 đến Thứ 7, nghỉ Chủ Nhật).<br />
              - Thời gian làm việc: 08 giờ/ngày.<br />
              - Phương thức ghi nhận công: Chấm công nhận diện khuôn mặt tự động qua <strong>Kiosk Vision AI</strong> hàng ngày.
            </div>

            <div>
              <strong>ĐIỀU 3: CHẾ ĐỘ LƯƠNG & NGHỈ PHÉP NĂM</strong><br />
              - Mức lương cơ bản thỏa thuận: <strong style={{ color: '#16a34a' }}>{formatVND(contract.baseSalary)}</strong>/tháng (Hưởng {contract.salaryPercentage}% lương).<br />
              - Lương đóng bảo hiểm xã hội: {formatVND(contract.insuranceSalary)}/tháng.<br />
              - <strong>Chế độ nghỉ phép năm:</strong> Được hưởng <span style={{ color: '#2563eb', fontWeight: 700 }}>{contract.annualLeaveDays} ngày nghỉ phép năm hưởng nguyên lương</span>.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
              <div>
                <strong>NGƯỜI LAO ĐỘNG</strong><br />
                <span style={{ fontSize: 11, fontStyle: 'italic', color: '#9ca3af' }}>(Ký và ghi rõ họ tên)</span>
                <div style={{ height: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontWeight: 600 }}>
                  {contract.employeeName}
                </div>
              </div>
              <div>
                <strong>ĐẠI DIỆN VISIONHR</strong><br />
                <span style={{ fontSize: 11, fontStyle: 'italic', color: '#9ca3af' }}>(Ký tên và đóng dấu)</span>
                <div style={{ height: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontWeight: 600, color: '#1e3a8a' }}>
                  Trần Thị Bình
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
