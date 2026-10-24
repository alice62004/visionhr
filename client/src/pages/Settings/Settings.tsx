import { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Mail,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Loader2,
  Building,
  Camera,
} from 'lucide-react';
import { getSmtpStatus, saveSmtpConfig, sendTestEmail, SmtpConfig } from '../../services/settingsApi';
import Button from '../../components/Button/Button';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'smtp' | 'company' | 'kiosk'>('smtp');

  // SMTP State
  const [smtpStatus, setSmtpStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [smtpForm, setSmtpForm] = useState<SmtpConfig>({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    from: '',
  });
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [smtpMessage, setSmtpMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load SMTP config
  const fetchSmtp = async () => {
    try {
      setLoadingStatus(true);
      const res = await getSmtpStatus();
      setSmtpStatus(res);
      if (res.config) {
        setSmtpForm({
          host: res.config.host || 'smtp.gmail.com',
          port: res.config.port || 587,
          secure: res.config.secure || false,
          user: res.config.user || '',
          pass: res.config.pass || '',
          from: res.config.from || '',
        });
        if (res.config.user && !testRecipient) {
          setTestRecipient(res.config.user);
        }
      }
    } catch (err: any) {
      console.error('Failed to get SMTP status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchSmtp();
  }, []);

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSmtp(true);
    setSmtpMessage(null);
    try {
      const res = await saveSmtpConfig(smtpForm);
      if (res.success) {
        setSmtpMessage({ type: 'success', text: 'Cấu hình SMTP đã được lưu và kiểm tra kết nối thành công!' });
        fetchSmtp();
      } else {
        setSmtpMessage({ type: 'error', text: res.message || 'Lưu thất bại.' });
      }
    } catch (err: any) {
      setSmtpMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Không thể kết nối đến máy chủ email với thông tin đã nhập.',
      });
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testRecipient) {
      alert('Vui lòng nhập địa chỉ email người nhận để gửi thử.');
      return;
    }
    setTestingEmail(true);
    setSmtpMessage(null);
    try {
      const res = await sendTestEmail(testRecipient);
      if (res.success) {
        setSmtpMessage({
          type: 'success',
          text: `Đã gửi email thử nghiệm thành công tới ${testRecipient}! Vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam).`,
        });
      } else {
        setSmtpMessage({ type: 'error', text: res.message || 'Gửi thử thất bại.' });
      }
    } catch (err: any) {
      setSmtpMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Gửi email thử thất bại. Vui lòng kiểm tra lại mật khẩu ứng dụng Gmail.',
      });
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
          <SettingsIcon size={24} color="#184a8c" />
          Cấu hình hệ thống VisionHR
        </h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
          Quản lý máy chủ gửi Email cấp tài khoản, thông số camera Kiosk và tích hợp hệ thống.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
        <button
          type="button"
          onClick={() => setActiveTab('smtp')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            fontSize: 13.5,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: activeTab === 'smtp' ? '#184a8c' : 'transparent',
            color: activeTab === 'smtp' ? '#ffffff' : '#64748b',
          }}
        >
          <Mail size={16} /> Máy chủ gửi Email (SMTP)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('company')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            fontSize: 13.5,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: activeTab === 'company' ? '#184a8c' : 'transparent',
            color: activeTab === 'company' ? '#ffffff' : '#64748b',
          }}
        >
          <Building size={16} /> Thông tin doanh nghiệp
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('kiosk')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            fontSize: 13.5,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: activeTab === 'kiosk' ? '#184a8c' : 'transparent',
            color: activeTab === 'kiosk' ? '#ffffff' : '#64748b',
          }}
        >
          <Camera size={16} /> Cấu hình Kiosk AI & Ca làm việc
        </button>
      </div>

      {/* Tab 1: SMTP Settings */}
      {activeTab === 'smtp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 840 }}>
          {/* Status banner */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 12,
              background: smtpStatus?.connected ? '#f0fdf4' : '#fffbeb',
              border: `1px solid ${smtpStatus?.connected ? '#bbf7d0' : '#fde68a'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {smtpStatus?.connected ? (
                <CheckCircle2 size={22} color="#16a34a" />
              ) : (
                <AlertCircle size={22} color="#d97706" />
              )}
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: smtpStatus?.connected ? '#166534' : '#92400e' }}>
                  {smtpStatus?.connected
                    ? 'Máy chủ gửi email đang hoạt động bình thường'
                    : 'Chưa cấu hình máy chủ Email hoặc thông tin chưa chính xác'}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {smtpStatus?.connected
                    ? `Đang kết nối: ${smtpStatus.user} qua ${smtpStatus.host}:${smtpStatus.port}`
                    : 'Nhập thông tin Gmail App Password bên dưới để kích hoạt gửi email cấp tài khoản tự động.'}
                </div>
              </div>
            </div>
          </div>

          {smtpMessage && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                background: smtpMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${smtpMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                color: smtpMessage.type === 'success' ? '#166534' : '#dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {smtpMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{smtpMessage.text}</span>
            </div>
          )}

          {/* Form setup */}
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
            <form onSubmit={handleSaveSmtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Máy chủ SMTP (Host) *</label>
                  <input
                    type="text"
                    style={inputStyle}
                    value={smtpForm.host}
                    onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                    placeholder="smtp.gmail.com"
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Cổng kết nối (Port) *</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={smtpForm.port}
                    onChange={(e) => setSmtpForm({ ...smtpForm, port: Number(e.target.value) })}
                    placeholder="587"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Địa chỉ Email gửi (Gmail HR / Admin) *</label>
                  <input
                    type="email"
                    style={inputStyle}
                    value={smtpForm.user}
                    onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                    placeholder="visionhr.system@gmail.com"
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Mật khẩu ứng dụng Gmail (16 ký tự) *</label>
                  <input
                    type="password"
                    style={inputStyle}
                    value={smtpForm.pass}
                    onChange={(e) => setSmtpForm({ ...smtpForm, pass: e.target.value })}
                    placeholder="abcd efgh ijkl mnop"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Tên hiển thị người gửi (From Name)</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={smtpForm.from}
                  onChange={(e) => setSmtpForm({ ...smtpForm, from: e.target.value })}
                  placeholder='"VisionHR System" <hr@company.vn>'
                />
              </div>

              {/* Guide box */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '12px 14px',
                  fontSize: 12.5,
                  color: '#475569',
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ color: '#0f172a' }}>📌 Hướng dẫn tạo Mật khẩu ứng dụng Gmail (App Password):</strong>
                <ol style={{ margin: '6px 0 0 18px', padding: 0 }}>
                  <li>Đăng nhập tài khoản Google của bạn &gt; bật <strong>Xác minh 2 bước (2-Step Verification)</strong>.</li>
                  <li>Truy cập mục <strong>Bảo mật (Security)</strong> &gt; tìm <strong>Mật khẩu ứng dụng (App Passwords)</strong>.</li>
                  <li>Tạo mật khẩu ứng dụng mới với tên "VisionHR", copy chuỗi 16 ký tự và dán vào ô mật khẩu ở trên.</li>
                </ol>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <Button type="submit" disabled={savingSmtp}>
                  {savingSmtp ? <Loader2 size={16} className="spin-animation" style={{ marginRight: 6 }} /> : <Save size={16} style={{ marginRight: 6 }} />}
                  {savingSmtp ? 'Đang lưu & kiểm tra...' : 'Lưu cấu hình Email'}
                </Button>
              </div>
            </form>

            {/* Test Email Section */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px 0', color: '#0f172a' }}>
                Thử nghiệm gửi email thực tế
              </h3>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="email"
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="Nhập email của bạn để nhận thử (ví dụ: nguyenvanan@gmail.com)"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                />
                <Button variant="secondary" onClick={handleTestEmail} disabled={testingEmail || !testRecipient}>
                  {testingEmail ? <Loader2 size={16} className="spin-animation" style={{ marginRight: 6 }} /> : <Send size={15} style={{ marginRight: 6 }} />}
                  {testingEmail ? 'Đang gửi...' : 'Gửi thử ngay'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Company info */}
      {activeTab === 'company' && (
        <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, maxWidth: 840 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a' }}>
            Thông tin Doanh nghiệp & Hệ thống
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Tên công ty / Tổ chức</label>
              <input type="text" style={inputStyle} defaultValue="VisionHR Enterprise Corp." />
            </div>
            <div>
              <label style={labelStyle}>Mã số thuế</label>
              <input type="text" style={inputStyle} defaultValue="0109988776" />
            </div>
            <div>
              <label style={labelStyle}>Email liên hệ quản trị</label>
              <input type="email" style={inputStyle} defaultValue="admin@visionhr.corp" />
            </div>
            <div>
              <label style={labelStyle}>Số điện thoại hotline</label>
              <input type="text" style={inputStyle} defaultValue="0987 654 321" />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Địa chỉ trụ sở chính</label>
              <input type="text" style={inputStyle} defaultValue="Tòa nhà Công nghệ VisionHR, Quận Cầu Giấy, Hà Nội" />
            </div>
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => alert('Đã cập nhật thông tin doanh nghiệp.')}>
              <Save size={16} style={{ marginRight: 6 }} /> Lưu thông tin
            </Button>
          </div>
        </div>
      )}

      {/* Tab 3: Kiosk config */}
      {activeTab === 'kiosk' && (
        <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, maxWidth: 840 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a' }}>
            Cấu hình Kiosk AI Chấm công & Ca làm việc
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Khung giờ Ca Sáng</label>
              <input type="text" style={inputStyle} defaultValue="08:00 - 12:00" />
            </div>
            <div>
              <label style={labelStyle}>Khung giờ Ca Chiều</label>
              <input type="text" style={inputStyle} defaultValue="13:30 - 17:30" />
            </div>
            <div>
              <label style={labelStyle}>Ngưỡng tính đi muộn (phút)</label>
              <input type="number" style={inputStyle} defaultValue="15" />
            </div>
            <div>
              <label style={labelStyle}>Độ nhạy AI Face Liveness (0.0 - 1.0)</label>
              <input type="number" step="0.05" style={inputStyle} defaultValue="0.75" />
            </div>
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => alert('Đã lưu thiết lập Kiosk AI.')}>
              <Save size={16} style={{ marginRight: 6 }} /> Lưu thiết lập
            </Button>
          </div>
        </div>
      )}

      <style>{`
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inputStyle: React.CSSProperties = {
  padding: '9px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  fontSize: 13.5,
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
};
