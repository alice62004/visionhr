import React from 'react';

export interface Column<T = any> {
  key: string;
  label: string;
  render?: (row: T, index?: number) => React.ReactNode;
}

export interface TableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  emptyText?: string;
  onRowClick?: (row: T) => void;
  rowHoverBg?: string;
}

export default function Table<T extends Record<string, any>>({
  columns,
  data,
  emptyText = 'Không có dữ liệu',
  onRowClick,
  rowHoverBg = '#f8fafc',
}: TableProps<T>) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
        padding: 0,
        overflowX: 'auto',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  background: '#f9fafb',
                  color: '#6b7280',
                  fontWeight: 600,
                  borderBottom: '1px solid #e5e7eb',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  textAlign: 'center',
                  color: '#6b7280',
                  padding: 24,
                  fontSize: 13,
                }}
              >
                {emptyText}
              </td>
            </tr>
          )}
          {data.map((row, idx) => (
            <tr
              key={row.id ?? idx}
              onClick={(e) => {
                if (onRowClick) {
                  onRowClick(row);
                }
              }}
              style={{
                borderBottom: idx === data.length - 1 ? 'none' : '1px solid #e5e7eb',
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (onRowClick) {
                  e.currentTarget.style.backgroundColor = rowHoverBg;
                }
              }}
              onMouseLeave={(e) => {
                if (onRowClick) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: '12px 16px',
                    verticalAlign: 'middle',
                  }}
                >
                  {col.render ? col.render(row, idx) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
