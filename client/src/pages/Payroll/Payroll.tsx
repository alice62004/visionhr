import { useEffect, useState } from 'react';
import { getPayrolls } from '../../services/payrollApi';
import Table, { Column } from '../../components/Table/Table';
import { PayrollRecord } from '../../types';
import { formatVND } from '../../utils/formatters';

export default function Payroll() {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPayrolls()
      .then(setPayrolls)
      .catch(() => setPayrolls([]))
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<PayrollRecord>[] = [
    { key: 'employeeName', label: 'Nhân viên' },
    { key: 'month', label: 'Tháng' },
    { key: 'baseSalary', label: 'Lương cơ bản', render: (r) => formatVND(r.baseSalary) },
    { key: 'otPay', label: 'Lương OT', render: (r) => formatVND(r.otPay) },
    {
      key: 'netSalary',
      label: 'Thực lãnh',
      render: (r) => <span style={{ fontWeight: 700, color: '#16a34a' }}>{formatVND(r.netSalary)}</span>,
    },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px 0', color: '#111827' }}>
        Tính lương (Payroll)
      </h1>
      <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: 14 }}>
        Bảng lương tổng hợp theo tháng
      </p>
      {loading ? <p>Đang tải dữ liệu...</p> : <Table columns={columns} data={payrolls} />}
    </div>
  );
}
