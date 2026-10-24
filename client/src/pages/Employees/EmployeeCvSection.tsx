import React from 'react';
import { FileText, Download, Trash2, UploadCloud } from 'lucide-react';

export interface EmployeeCvData {
  name: string;
  size?: number;
  type?: string;
  data?: string;
  url?: string;
  uploadedAt?: string;
}

interface EmployeeCvSectionProps {
  cv?: EmployeeCvData | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveCv: () => void;
}

export default function EmployeeCvSection({
  cv,
  onFileChange,
  onRemoveCv,
}: EmployeeCvSectionProps) {
  return (
    <div
      style={{
        borderTop: '1px dashed #cbd5e1',
        paddingTop: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#184a8c', fontWeight: 700, fontSize: 14 }}>
        <FileText size={18} />
        <span>HỒ SƠ ỨNG VIÊN & TỆP CV ĐÍNH KÈM</span>
      </div>

      {cv ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: '#f8fafc',
            border: '1px solid #bfdbfe',
            borderRadius: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                {cv.name}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {cv.size ? `${(cv.size / 1024).toFixed(1)} KB` : 'Tệp CV đã tải lên'}
                {cv.uploadedAt && ` · Cập nhật: ${new Date(cv.uploadedAt).toLocaleDateString('vi-VN')}`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {cv.data && (
              <a
                href={cv.data}
                download={cv.name}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 12px',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: '1px solid #bfdbfe',
                }}
              >
                <Download size={13} /> Tải CV
              </a>
            )}
            <button
              type="button"
              onClick={onRemoveCv}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                background: '#fef2f2',
                color: '#dc2626',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                border: '1px solid #fecaca',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={13} /> Gỡ bỏ
            </button>
          </div>
        </div>
      ) : (
        <label
          style={{
            border: '2px dashed #cbd5e1',
            borderRadius: 10,
            padding: '20px 16px',
            textAlign: 'center',
            backgroundColor: '#f8fafc',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.backgroundColor = '#eff6ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.backgroundColor = '#f8fafc';
          }}
        >
          <UploadCloud size={28} color="#2563eb" />
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
            Bấm vào đây để tải CV lên (hoặc kéo thả tệp vào khung)
          </div>
          <div style={{ fontSize: 11.5, color: '#64748b' }}>
            Hỗ trợ tệp định dạng PDF, DOCX, DOC hoặc Ảnh (tối đa 10MB)
          </div>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            onChange={onFileChange}
            style={{ display: 'none' }}
          />
        </label>
      )}
    </div>
  );
}
