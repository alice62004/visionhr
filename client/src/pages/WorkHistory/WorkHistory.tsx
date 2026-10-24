import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck2,
  FileText,
  Milestone,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  User,
  Camera,
  Briefcase,
  Calendar,
  Building2,
  ArrowRight,
  CalendarDays,
} from 'lucide-react';
import Button from '../../components/Button/Button';
import { getMyWorkHistory, WorkHistoryData } from '../../services/employeeApi';
import WorkHistoryTimeline from './WorkHistoryTimeline';

export default function WorkHistory() {
  const navigate = useNavigate();
  const [data, setData] = useState<WorkHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'attendance' | 'requests' | 'timeline'>('attendance');

  useEffect(() => {
    getMyWorkHistory()
      .then(setData)
      .catch((err) => {
        console.error('getMyWorkHistory error:', err);
        setErrorMsg(
          err?.response?.data?.message ||
            'Không thể tải lịch sử làm việc. Tài khoản của bạn có thể chưa được liên kết với hồ sơ nhân viên.'
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '40px auto', textAlign: 'center', color: '#64748b' }}>
        <p>Đang nạp dữ liệu lịch sử làm việc...</p>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div
        style={{
          maxWidth: 600,
          margin: '40px auto',
          background: '#ffffff',
          borderRadius: 14,
          padding: 32,
          textAlign: 'center',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}
        >
          <AlertCircle size={28} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px 0', color: '#0f172a' }}>
          Chưa tìm thấy dữ liệu công tác
        </h2>
        <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px 0' }}>{errorMsg}</p>
        <Button onClick={() => navigate('/attendance/terminal')}>Đến Kiosk Chấm công AI</Button>
      </div>
    );
  }

  const { employee, attendance = [], leaves = [], overtimes = [] } = data;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Overview Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          padding: 24,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#0f172a' }}>
              Lịch sử làm việc & Công tác
            </h1>
            <span
              style={{
                backgroundColor: '#eff6ff',
                color: '#184a8c',
                border: '1px solid #bfdbfe',
                padding: '2px 10px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Mã NV: {employee.code}
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748b' }}>
            Nhân viên: <strong style={{ color: '#0f172a' }}>{employee.name}</strong> ·{' '}
            {employee.position || 'Nhân viên'} · {employee.department || 'Văn phòng'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" onClick={() => navigate('/my-schedule')}>
            <CalendarDays size={15} style={{ marginRight: 6 }} /> Lịch làm việc tuần
          </Button>
          <Button variant="secondary" onClick={() => navigate('/my-profile')}>
            <User size={15} style={{ marginRight: 6 }} /> Hồ sơ của tôi
          </Button>
          <Button onClick={() => navigate('/attendance/terminal')}>
            <Camera size={15} style={{ marginRight: 6 }} /> Điểm danh Kiosk AI
          </Button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: 2,
        }}
      >
        <button
          onClick={() => setActiveTab('attendance')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'attendance' ? '3px solid #184a8c' : '3px solid transparent',
            color: activeTab === 'attendance' ? '#184a8c' : '#64748b',
            fontWeight: activeTab === 'attendance' ? 700 : 500,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CalendarCheck2 size={16} />
          Lịch sử Chấm công ({attendance.length})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'requests' ? '3px solid #184a8c' : '3px solid transparent',
            color: activeTab === 'requests' ? '#184a8c' : '#64748b',
            fontWeight: activeTab === 'requests' ? 700 : 500,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <FileText size={16} />
          Đơn từ & Phép ({leaves.length + overtimes.length})
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'timeline' ? '3px solid #184a8c' : '3px solid transparent',
            color: activeTab === 'timeline' ? '#184a8c' : '#64748b',
            fontWeight: activeTab === 'timeline' ? 700 : 500,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Milestone size={16} />
          Dòng thời gian công tác
        </button>
      </div>

      {/* TAB 1: ATTENDANCE HISTORY */}
      {activeTab === 'attendance' && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Ngày</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Giờ vào (Check-in)</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Giờ ra (Check-out)</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Phương thức</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                    Chưa có bản ghi chấm công nào. Hãy điểm danh tại Kiosk terminal!
                  </td>
                </tr>
              ) : (
                attendance.map((rec: any) => (
                  <tr key={rec.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                      {rec.date}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#16a34a', fontWeight: 600 }}>
                      {rec.checkIn || '--:--'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#2563eb', fontWeight: 600 }}>
                      {rec.checkOut || '--:--'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                      {rec.method === 'nhan_dien_khuon_mat' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#184a8c' }}>
                          <Camera size={14} /> AI Face Recognition
                        </span>
                      ) : (
                        'Thủ công'
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: 11,
                          backgroundColor:
                            rec.status === 'dung_gio'
                              ? '#dcfce7'
                              : rec.status === 'di_muon'
                              ? '#fef3c7'
                              : '#fee2e2',
                          color:
                            rec.status === 'dung_gio'
                              ? '#15803d'
                              : rec.status === 'di_muon'
                              ? '#b45309'
                              : '#b91c1c',
                        }}
                      >
                        {rec.status === 'dung_gio'
                          ? 'ĐÚNG GIỜ'
                          : rec.status === 'di_muon'
                          ? 'ĐI MUỘN'
                          : 'VẮNG MẶT'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: REQUESTS & LEAVES */}
      {activeTab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Section: Đơn xin nghỉ phép */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 14,
              border: '1px solid #e2e8f0',
              padding: 20,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
            }}
          >
            <h3 style={{ margin: '0 0 14px 0', fontSize: 15, fontWeight: 700, color: '#184a8c' }}>
              Danh sách Đơn xin nghỉ phép ({leaves.length})
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Loại phép</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Thời gian</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Lý do</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                      Chưa có đơn xin nghỉ phép nào.
                    </td>
                  </tr>
                ) : (
                  leaves.map((l: any) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{l.type}</td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>
                        {l.fromDate} đến {l.toDate}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>{l.reason || '--'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontWeight: 700,
                            fontSize: 11,
                            backgroundColor:
                              l.status === 'da_duyet'
                                ? '#dcfce7'
                                : l.status === 'tu_choi'
                                ? '#fee2e2'
                                : '#fef3c7',
                            color:
                              l.status === 'da_duyet'
                                ? '#15803d'
                                : l.status === 'tu_choi'
                                ? '#b91c1c'
                                : '#b45309',
                          }}
                        >
                          {l.status === 'da_duyet'
                            ? 'ĐÃ DUYỆT'
                            : l.status === 'tu_choi'
                            ? 'TỪ CHỐI'
                            : 'CHỜ DUYỆT'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Section: Đơn làm ngoài giờ OT */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 14,
              border: '1px solid #e2e8f0',
              padding: 20,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
            }}
          >
            <h3 style={{ margin: '0 0 14px 0', fontSize: 15, fontWeight: 700, color: '#184a8c' }}>
              Danh sách Đơn làm thêm giờ / Tăng ca OT ({overtimes.length})
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Ngày OT</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Số giờ làm thêm</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Lý do</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {overtimes.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                      Chưa có đơn đăng ký tăng ca OT nào.
                    </td>
                  </tr>
                ) : (
                  overtimes.map((o: any) => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{o.date}</td>
                      <td style={{ padding: '10px 14px', color: '#2563eb', fontWeight: 700 }}>
                        {o.hours} giờ
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>{o.reason || '--'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontWeight: 700,
                            fontSize: 11,
                            backgroundColor:
                              o.status === 'da_duyet'
                                ? '#dcfce7'
                                : o.status === 'tu_choi'
                                ? '#fee2e2'
                                : '#fef3c7',
                            color:
                              o.status === 'da_duyet'
                                ? '#15803d'
                                : o.status === 'tu_choi'
                                ? '#b91c1c'
                                : '#b45309',
                          }}
                        >
                          {o.status === 'da_duyet'
                            ? 'ĐÃ DUYỆT'
                            : o.status === 'tu_choi'
                            ? 'TỪ CHỐI'
                            : 'CHỜ DUYỆT'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CAREER TIMELINE */}
      {activeTab === 'timeline' && (
        <WorkHistoryTimeline employee={employee} attendanceCount={attendance.length} />
      )}
    </div>
  );
}
