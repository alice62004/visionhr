import { useEffect, useState } from 'react';
import { getAuditLogs } from '../../services/authApi';
import Table, { Column } from '../../components/Table/Table';

interface AuditItem {
  id?: number;
  user?: string;
  userName?: string;
  action: string;
  module: string;
  timestamp?: string;
  createdAt?: string;
  created_at?: string;
}

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs()
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<AuditItem>[] = [
    { key: 'user', label: 'Người thực hiện', render: (r) => r.user || r.userName || 'Hệ thống' },
    { key: 'action', label: 'Hành động' },
    { key: 'module', label: 'Module' },
    {
      key: 'timestamp',
      label: 'Thời gian',
      render: (r) => {
        const time = r.timestamp || r.createdAt || r.created_at;
        return time ? new Date(time).toLocaleString('vi-VN') : '--:--';
      },
    },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px 0', color: '#111827' }}>
        Nhật ký Audit
      </h1>
      <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: 14 }}>
        Lịch sử thao tác trên toàn hệ thống (chỉ Quản trị viên xem được)
      </p>
      {loading ? <p>Đang tải dữ liệu...</p> : <Table columns={columns} data={logs} />}
    </div>
  );
}
