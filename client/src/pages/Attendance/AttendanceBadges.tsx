import React, { useState } from 'react';
import { AttendanceStatus, AttendanceMethod } from '../../types';

export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  const map: Record<AttendanceStatus, { color: string; bg: string; border: string; label: string }> = {
    dung_gio: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Đúng giờ' },
    di_muon: { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Đi muộn' },
    vang_mat: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Vắng mặt' },
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

export function MethodBadge({ method }: { method: AttendanceMethod }) {
  const isFace = method === 'nhan_dien_khuon_mat';
  return (
    <span
      style={{
        color: isFace ? '#2563eb' : '#6b7280',
        background: isFace ? '#eff6ff' : '#f3f4f6',
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 500,
        border: `1px solid ${isFace ? '#bfdbfe' : '#e5e7eb'}`,
      }}
    >
      {isFace ? 'AI Khuôn mặt' : 'Thủ công'}
    </span>
  );
}

export function EmployeeAvatar({ name, avatarUrl, size = 32 }: { name: string; avatarUrl?: string | null; size?: number }) {
  const [error, setError] = useState(false);
  const firstLetter = (name || 'U').charAt(0).toUpperCase();

  if (avatarUrl && !error) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setError(true)}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '1.5px solid #3b82f6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#e0e7ff',
        color: '#3730a3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size > 30 ? 12 : 11,
        flexShrink: 0,
        border: '1px solid #c7d2fe',
      }}
    >
      {firstLetter}
    </div>
  );
}
