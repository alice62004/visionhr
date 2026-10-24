const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const configFilePath = path.join(__dirname, '../config/smtp.json');

function getLocalIpAddress() {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254')) {
          return iface.address;
        }
      }
    }
  } catch (err) {
    console.warn('[EmailService] Error getting IP:', err);
  }
  return 'localhost';
}

function getBaseAppUrl() {
  if (process.env.APP_URL && !process.env.APP_URL.includes('trycloudflare.com')) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  const ip = getLocalIpAddress();
  return ip !== 'localhost' ? `http://${ip}:5173` : 'http://localhost:5173';
}

function loadStoredSmtpConfig() {
  try {
    if (fs.existsSync(configFilePath)) {
      const data = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
      return data;
    }
  } catch (err) {
    console.warn('[EmailService] Could not read smtp.json:', err.message);
  }
  return null;
}

function saveSmtpConfigToFile(cfg) {
  try {
    const dir = path.dirname(configFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(configFilePath, JSON.stringify(cfg, null, 2), 'utf8');
  } catch (err) {
    console.error('[EmailService] Failed to write smtp.json:', err.message);
  }
}

// Khởi tạo Transporter
async function getTransporter() {
  const stored = loadStoredSmtpConfig() || {};
  const user = (stored.user || process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  const pass = (stored.pass || process.env.EMAIL_PASS || process.env.SMTP_PASS || '').trim().replace(/\s+/g, '');
  const host = (stored.host || process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = Number(stored.port || process.env.SMTP_PORT) || 587;
  const secure = stored.secure === true || process.env.SMTP_SECURE === 'true' || port === 465;

  if (user && pass) {
    return {
      transporter: nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      }),
      isConfigured: true,
      senderEmail: user,
    };
  }

  // Nếu chưa cấu hình SMTP, sử dụng Ethereal Test Account để tạo preview email thực tế
  console.log('[EmailService] SMTP credentials not found. Creating Ethereal test inbox...');
  const testAccount = await nodemailer.createTestAccount();
  return {
    transporter: nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    }),
    isConfigured: false,
    senderEmail: 'no-reply@visionhr.vn',
  };
}

function getSmtpStatus() {
  const stored = loadStoredSmtpConfig() || {};
  const user = (stored.user || process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  const host = (stored.host || process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = Number(stored.port || process.env.SMTP_PORT) || 587;
  const isConfigured = Boolean(user && (stored.pass || process.env.EMAIL_PASS || process.env.SMTP_PASS));
  const networkIp = getLocalIpAddress();
  const baseAppUrl = getBaseAppUrl();
  return {
    isConfigured,
    user: user ? `${user.slice(0, 3)}***@${user.split('@')[1] || ''}` : '',
    rawUser: user,
    host,
    port,
    networkIp,
    appUrl: baseAppUrl,
  };
}

async function verifyAndSaveSmtp({ host = 'smtp.gmail.com', port = 587, user, pass }) {
  if (!user || !pass) {
    throw new Error('Vui lòng nhập đầy đủ Email gửi và Mật khẩu ứng dụng (App Password).');
  }
  const cleanUser = user.trim();
  const cleanPass = pass.trim().replace(/\s+/g, '');
  const numPort = Number(port) || 587;
  const secure = numPort === 465;

  const testTransporter = nodemailer.createTransport({
    host: host.trim(),
    port: numPort,
    secure,
    auth: { user: cleanUser, pass: cleanPass },
  });

  await testTransporter.verify();

  // Lưu vào file cấu hình
  saveSmtpConfigToFile({
    host: host.trim(),
    port: numPort,
    secure,
    user: cleanUser,
    pass: cleanPass,
    updatedAt: new Date().toISOString(),
  });

  process.env.EMAIL_USER = cleanUser;
  process.env.EMAIL_PASS = cleanPass;
  process.env.SMTP_HOST = host.trim();
  process.env.SMTP_PORT = String(numPort);

  return { success: true, message: `Kết nối máy chủ Gmail SMTP thành công với tài khoản ${cleanUser}!` };
}

// Gửi Email Onboarding (Chào mừng & Cấp tài khoản nhân viên mới)
async function sendOnboardingEmail({
  to,
  employeeName,
  employeeCode,
  position = 'Nhân viên',
  department = 'Công ty',
  tempPassword = 'VisionHR@2026',
  loginUrl,
}) {
  if (!to || !to.includes('@')) {
    throw new Error('Địa chỉ email nhận không hợp lệ.');
  }

  const baseAppUrl = getBaseAppUrl();
  let finalLoginUrl = loginUrl || `${baseAppUrl}/login`;

  const { transporter, isConfigured, senderEmail } = await getTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Thư mời nhận việc & Cấp tài khoản VisionHR</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #ffffff; padding: 28px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
        .header p { margin: 6px 0 0; opacity: 0.9; font-size: 13px; }
        .content { padding: 28px 24px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0; }
        .card-row { margin-bottom: 8px; font-size: 14px; }
        .card-row:last-child { margin-bottom: 0; }
        .label { font-weight: 600; color: #475569; width: 150px; display: inline-block; }
        .value { color: #0f172a; font-weight: 600; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 14px; text-align: center; }
        .steps { margin: 20px 0; padding-left: 20px; font-size: 13.5px; color: #334155; line-height: 1.6; }
        .footer { background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>VisionHR - Chào Mừng Nhân Viên Mới</h1>
          <p>Hệ thống Quản trị Nhân sự & Chấm công Thông minh Vision AI</p>
        </div>
        <div class="content">
          <p style="font-size: 15px; margin-top: 0;">Kính gửi <strong>${employeeName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Chúc mừng bạn đã chính thức gia nhập đội ngũ VisionHR với vai trò <strong>${position}</strong> thuộc phòng ban <strong>${department}</strong>.
            Dưới đây là thông tin tài khoản đăng nhập hệ thống nội bộ của bạn:
          </p>
          
          <div class="card">
            <div class="card-row"><span class="label">Mã nhân viên:</span> <span class="value" style="color: #2563eb;">${employeeCode}</span></div>
            <div class="card-row"><span class="label">Tên đăng nhập (Email):</span> <span class="value">${to}</span></div>
            <div class="card-row"><span class="label">Mật khẩu tạm thời:</span> <span class="value" style="color: #d97706; background: #fef3c7; padding: 2px 6px; border-radius: 4px;">${tempPassword}</span></div>
            <div class="card-row"><span class="label">Trang đăng nhập:</span> <span class="value"><a href="${finalLoginUrl}" target="_blank" style="color: #2563eb;">${finalLoginUrl}</a></span></div>
          </div>

          <div style="text-align: center;">
            <a href="${finalLoginUrl}" target="_blank" class="btn">Đăng nhập vào hệ thống ngay</a>
          </div>

          <h3 style="font-size: 14px; margin-top: 24px; margin-bottom: 8px; color: #0f172a;">Các bước cần thực hiện trong ngày làm việc đầu tiên:</h3>
          <ol class="steps">
            <li>Truy cập link đăng nhập, điền tài khoản và đổi lại mật khẩu cá nhân.</li>
            <li>Kiểm tra và hoàn thiện thông tin hồ sơ (CCCD, Địa chỉ, Số điện thoại liên hệ).</li>
            <li>Vào mục <strong>"Cá nhân -> Đăng ký khuôn mặt"</strong> để kích hoạt nhận diện khuôn mặt Vision AI phục vụ việc chấm công Kiosk hàng ngày.</li>
          </ol>
        </div>
        <div class="footer">
          <p style="margin: 0;">Email này được gửi tự động từ Hệ thống Quản lý Nhân sự VisionHR.</p>
          <p style="margin: 4px 0 0;">Nếu cần hỗ trợ kỹ thuật hoặc cấp lại thông tin, vui lòng liên hệ Bộ phận Nhân sự (HR).</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from: `"Phòng Nhân Sự VisionHR" <${senderEmail}>`,
    to: to.trim(),
    subject: `[VisionHR] Thư mời nhận việc & Cấp tài khoản nhân sự cho ${employeeName} (${employeeCode})`,
    text: `Chào mừng ${employeeName} gia nhập VisionHR. Tài khoản đăng nhập của bạn: Email: ${to}, Mật khẩu tạm: ${tempPassword}, Link đăng nhập: ${finalLoginUrl}`,
    html: htmlContent,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || null;

  console.log(`[EmailService] Sent onboarding email to ${to}. MessageId: ${info.messageId}`);
  if (previewUrl) {
    console.log(`[EmailService] Preview URL (Ethereal): ${previewUrl}`);
  }

  return {
    success: true,
    isConfigured,
    messageId: info.messageId,
    previewUrl,
    message: isConfigured
      ? `Đã gửi email chào mừng thành công tới hòm thư thật ${to}.`
      : `Email đã được gửi qua máy chủ thử nghiệm (Ethereal). Xem hộp thư ảo tại: ${previewUrl}`,
  };
}

module.exports = {
  sendOnboardingEmail,
  getTransporter,
  getSmtpStatus,
  verifyAndSaveSmtp,
};
