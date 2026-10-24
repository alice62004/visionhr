import React, { useState, useEffect } from 'react';
import {
  Mail,
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Camera,
  KeyRound,
  Send,
  Loader2,
  AlertCircle,
  Sparkles,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Button from '../Button/Button';
import { sendOnboardingEmail } from '../../services/employeeApi';
import { getSmtpStatus, saveSmtpConfig, SmtpStatus } from '../../services/settingsApi';

interface OnboardingEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    name: string;
    code: string;
    email: string;
    position?: string;
    department?: string;
    joinDate?: string;
    accountEmail?: string;
    accountRole?: string;
    emailDelivery?: { success: boolean; message: string; previewUrl?: string };
  };
  tempPassword?: string;
}

export default function OnboardingEmailModal({
  isOpen,
  onClose,
  employee,
  tempPassword = 'VisionHR@2026',
}: OnboardingEmailModalProps) {
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [sendingRealEmail, setSendingRealEmail] = useState(false);
  const [emailSendResult, setEmailSendResult] = useState<{ success: boolean; message: string; previewUrl?: string } | null>(null);

  // Trạng thái cấu hình SMTP
  const [smtpStatus, setSmtpStatus] = useState<SmtpStatus | null>(null);
  const [showSmtpConfig, setShowSmtpConfig] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [smtpError, setSmtpError] = useState('');

  const targetEmail = employee.accountEmail || employee.email;
  
  // Tạo link đăng nhập tối ưu cho cả máy tính lẫn điện thoại mở email
  const loginUrl = smtpStatus?.appUrl
    ? `${smtpStatus.appUrl}/login`
    : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? (smtpStatus?.networkIp && smtpStatus.networkIp !== 'localhost'
          ? `http://${smtpStatus.networkIp}:5173/login`
          : `${window.location.origin}/login`)
      : `${window.location.origin}/login`;

  useEffect(() => {
    if (isOpen) {
      getSmtpStatus()
        .then((s) => {
          setSmtpStatus(s);
          if (s.rawUser) setSmtpUser(s.rawUser);
        })
        .catch(() => {});

      if (employee.emailDelivery) {
        setEmailSendResult(employee.emailDelivery);
      }
    }
  }, [isOpen, employee]);

  if (!isOpen) return null;

  const emailTextContent = `[VisionHR] Thư mời nhận việc & Cấp tài khoản hệ thống cho ${employee.name}

Kính gửi ${employee.name},
Chúc mừng bạn đã chính thức gia nhập đội ngũ VisionHR với vai trò ${employee.position || 'Nhân viên'} trực thuộc ${employee.department || 'Công ty'}.

THÔNG TIN TÀI KHOẢN ĐĂNG NHẬP:
- Địa chỉ trang đăng nhập: ${loginUrl}
- Tên đăng nhập (Email): ${targetEmail}
- Mật khẩu khởi tạo: ${tempPassword}
- Mã nhân viên: ${employee.code}

CÁC BƯỚC CẦN THỰC HIỆN TRONG NGÀY ĐẦU TIÊN:
1. Đăng nhập vào hệ thống qua link ${loginUrl} và đổi mật khẩu cá nhân.
2. Kiểm tra thông tin hồ sơ cá nhân (CCCD, Bằng cấp, Địa chỉ liên hệ).
3. Truy cập mục "Đăng ký khuôn mặt" hoặc gặp bộ phận HR để kích hoạt nhận diện khuôn mặt AI cho việc chấm công Kiosk hàng ngày.

Trân trọng,
Phòng Nhân sự & Quản trị Tài năng VisionHR`;

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(
      `Trang đăng nhập: ${loginUrl}\nEmail: ${targetEmail}\nMật khẩu: ${tempPassword}\nMã NV: ${employee.code}`
    );
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2500);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(emailTextContent);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSmtp(true);
    setSmtpError('');
    try {
      const res = await saveSmtpConfig({
        user: smtpUser,
        pass: smtpPass,
        host: 'smtp.gmail.com',
        port: 587,
      });
      alert(res.message);
      setShowSmtpConfig(false);
      const s = await getSmtpStatus();
      setSmtpStatus(s);
    } catch (err: any) {
      setSmtpError(err?.response?.data?.message || 'Không thể xác thực Gmail SMTP. Vui lòng kiểm tra lại mật khẩu ứng dụng.');
    } finally {
      setSavingSmtp(false);
    }
  };

  // Gửi email thật qua SMTP Backend tới hòm thư thật của người nhận
  const handleSendRealEmail = async () => {
    setSendingRealEmail(true);
    setEmailSendResult(null);
    try {
      const res = await sendOnboardingEmail({
        to: targetEmail,
        employeeName: employee.name,
        employeeCode: employee.code,
        position: employee.position,
        department: employee.department,
        tempPassword,
        loginUrl,
      });
      setEmailSendResult({
        success: true,
        message: res.message || `Đã gửi email thật thành công tới hộp thư ${targetEmail}!`,
        previewUrl: res.previewUrl,
      });
    } catch (err: any) {
      setEmailSendResult({
        success: false,
        message: err?.response?.data?.message || 'Không thể gửi email thật. Vui lòng kiểm tra cấu hình SMTP.',
      });
    } finally {
      setSendingRealEmail(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 14,
          width: '100%',
          maxWidth: 740,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 22px',
            backgroundColor: '#184a8c',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mail size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                Gửi Email Cấp tài khoản tới Hòm thư thật nhân viên
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: '#93c5fd' }}>
                Gửi thông tin đăng nhập trực tiếp tới {targetEmail}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Thông báo SMTP & Hỗ trợ cấu hình nhanh */}
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: smtpStatus?.isConfigured ? '#f0fdf4' : '#fffbeb',
            borderBottom: `1px solid ${smtpStatus?.isConfigured ? '#bbf7d0' : '#fde68a'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12.5,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {smtpStatus?.isConfigured ? (
              <>
                <Check size={16} color="#16a34a" />
                <span style={{ color: '#166534', fontWeight: 600 }}>
                  Máy chủ Gmail SMTP đã kết nối ({smtpStatus.user}) - Thư sẽ gửi trực tiếp đến hộp thư thật!
                </span>
              </>
            ) : (
              <>
                <AlertCircle size={16} color="#d97706" />
                <span style={{ color: '#92400e' }}>
                  Chưa cài đặt Gmail SMTP gửi thư thật (EMAIL_USER / EMAIL_PASS).
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowSmtpConfig(!showSmtpConfig)}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '4px 10px',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              color: '#1e40af',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Settings size={13} />
            {showSmtpConfig ? 'Thu gọn' : 'Cấu hình Gmail SMTP'}
            {showSmtpConfig ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Accordion form cấu hình SMTP */}
        {showSmtpConfig && (
          <form
            onSubmit={handleSaveSmtp}
            style={{
              padding: '14px 20px',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              Thiết lập Gmail SMTP gửi thư thật:
            </div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
              Sử dụng tài khoản Gmail và <strong>Mật khẩu ứng dụng (App Password)</strong> gồm 16 ký tự của Google
              (Tạo tại: Google Account &gt; Bảo mật &gt; Mật khẩu ứng dụng).
            </div>
            {smtpError && (
              <div style={{ color: '#dc2626', fontSize: 12, fontWeight: 600 }}>⚠️ {smtpError}</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10 }}>
              <input
                type="email"
                placeholder="Địa chỉ Gmail gửi (vd: hr.company@gmail.com)"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                required
                style={{
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                }}
              />
              <input
                type="password"
                placeholder="Mật khẩu ứng dụng 16 ký tự (App Password)"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                required
                style={{
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                }}
              />
              <button
                type="submit"
                disabled={savingSmtp}
                style={{
                  padding: '7px 14px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {savingSmtp ? 'Đang kiểm tra...' : 'Lưu & Kết nối'}
              </button>
            </div>
          </form>
        )}

        {/* Thông báo kết quả gửi email thật */}
        {emailSendResult && (
          <div
            style={{
              padding: '12px 20px',
              backgroundColor: emailSendResult.success ? '#f0fdf4' : '#fef2f2',
              borderBottom: `1px solid ${emailSendResult.success ? '#bbf7d0' : '#fecaca'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              fontSize: 13,
              color: emailSendResult.success ? '#166534' : '#991b1b',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {emailSendResult.success ? <Check size={18} color="#16a34a" /> : <AlertCircle size={18} color="#dc2626" />}
              <span>{emailSendResult.message}</span>
            </div>
            {emailSendResult.previewUrl && (
              <a
                href={emailSendResult.previewUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#2563eb',
                  textDecoration: 'underline',
                  fontWeight: 600,
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                }}
              >
                Mở xem thư mẫu (Ethereal) ↗
              </a>
            )}
          </div>
        )}

        {/* Email Metadata Ribbon */}
        <div
          style={{
            padding: '10px 22px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            fontSize: 13,
            color: '#334155',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontWeight: 600, color: '#64748b', width: 90 }}>Người gửi:</span>
            <span>{smtpStatus?.rawUser || 'Phòng Nhân sự VisionHR &lt;hr-no-reply@visionhr.corp&gt;'}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontWeight: 600, color: '#64748b', width: 90 }}>Người nhận:</span>
            <span style={{ fontWeight: 700, color: '#184a8c' }}>
              {employee.name} &lt;{targetEmail}&gt;
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontWeight: 600, color: '#64748b', width: 90 }}>Tiêu đề:</span>
            <span style={{ fontWeight: 600 }}>
              [VisionHR] Thư mời nhận việc & Cấp tài khoản hệ thống cho {employee.name}
            </span>
          </div>
        </div>

        {/* Email Body Content (Scrollable) */}
        <div
          style={{
            padding: 24,
            overflowY: 'auto',
            flex: 1,
            backgroundColor: '#ffffff',
            fontSize: 14,
            lineHeight: 1.6,
            color: '#1e293b',
          }}
        >
          <div
            style={{
              borderBottom: '2px solid #184a8c',
              paddingBottom: 10,
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  backgroundColor: '#184a8c',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                V
              </div>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#184a8c', letterSpacing: -0.5 }}>
                VisionHR Platform
              </span>
            </div>
            <span
              style={{
                fontSize: 12,
                color: '#64748b',
                backgroundColor: '#f1f5f9',
                padding: '4px 10px',
                borderRadius: 20,
              }}
            >
              Onboarding Package
            </span>
          </div>

          <p style={{ marginTop: 0 }}>
            Kính gửi <strong>{employee.name}</strong>,
          </p>
          <p>
            Chúc mừng bạn đã chính thức gia nhập đội ngũ <strong>VisionHR</strong> với vai trò{' '}
            <strong style={{ color: '#184a8c' }}>{employee.position || 'Nhân viên'}</strong> thuộc bộ phận{' '}
            <strong>{employee.department || 'Công ty'}</strong>. Dưới đây là thông tin tài khoản đăng nhập hệ thống nội bộ của bạn:
          </p>

          {/* Account Details Box */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #bfdbfe',
              borderRadius: 10,
              padding: 16,
              margin: '16px 0',
              boxShadow: '0 2px 6px rgba(24, 74, 140, 0.04)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 700,
                color: '#184a8c',
                fontSize: 14,
                marginBottom: 10,
              }}
            >
              <KeyRound size={17} />
              <span>THÔNG TIN ĐĂNG NHẬP HỆ THỐNG</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
              <div>
                <span style={{ color: '#64748b' }}>Trang đăng nhập: </span>
                <br />
                <a
                  href={loginUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#184a8c', fontWeight: 600, textDecoration: 'none' }}
                >
                  {loginUrl} ↗
                </a>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Mã nhân viên: </span>
                <br />
                <strong>{employee.code}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Tên đăng nhập (Email): </span>
                <br />
                <strong>{targetEmail}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Mật khẩu khởi tạo: </span>
                <br />
                <span
                  style={{
                    backgroundColor: '#e2e8f0',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                >
                  {tempPassword}
                </span>
              </div>
            </div>

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={handleCopyAccount}>
                {copiedAccount ? (
                  <>
                    <Check size={14} color="#16a34a" style={{ marginRight: 6 }} /> Đã sao chép tài khoản!
                  </>
                ) : (
                  <>
                    <Copy size={14} style={{ marginRight: 6 }} /> Sao chép thông tin tài khoản
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Next Steps Box */}
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 10,
              padding: 14,
              margin: '16px 0',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 700,
                color: '#15803d',
                fontSize: 13.5,
                marginBottom: 6,
              }}
            >
              <Camera size={16} />
              <span>CÁC BƯỚC THỰC HIỆN TRONG NGÀY ĐẦU TIÊN:</span>
            </div>
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
              <li>Truy cập link đăng nhập, điền email và mật khẩu khởi tạo, sau đó đổi lại mật khẩu cá nhân.</li>
              <li>Kiểm tra thông tin hồ sơ cá nhân và cập nhật CCCD, địa chỉ, số điện thoại.</li>
              <li>Đăng ký khuôn mặt Vision AI để bắt đầu chấm công tự động tại Kiosk hàng ngày.</li>
            </ol>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div
          style={{
            padding: '14px 22px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={handleCopyAll}>
              {copiedAll ? (
                <>
                  <Check size={14} color="#16a34a" style={{ marginRight: 6 }} /> Đã chép nội dung!
                </>
              ) : (
                <>
                  <Copy size={14} style={{ marginRight: 6 }} /> Sao chép Email
                </>
              )}
            </Button>

            <Button
              onClick={handleSendRealEmail}
              disabled={sendingRealEmail}
              title="Gửi email HTML thực tế tới hòm thư thật của người nhận qua SMTP"
            >
              {sendingRealEmail ? (
                <>
                  <Loader2 size={14} className="spin-animation" style={{ marginRight: 6 }} /> Đang gửi thư thật...
                </>
              ) : (
                <>
                  <Send size={14} style={{ marginRight: 6 }} /> Gửi Email thật tới {targetEmail}
                </>
              )}
            </Button>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={loginUrl}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <Button variant="secondary">
                <ExternalLink size={14} style={{ marginRight: 6 }} /> Trang /login
              </Button>
            </a>
            <Button variant="primary" onClick={onClose}>
              <Check size={14} style={{ marginRight: 6 }} /> Hoàn tất
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
