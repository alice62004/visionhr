import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Camera,
  LayoutDashboard,
  Bot,
  ArrowRight,
  Zap,
  ShieldCheck,
  CalendarCheck,
  CircleDollarSign,
  Users,
  Clock,
  FileText,
  BarChart3,
  User,
  Briefcase,
  Shield,
  LogIn,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import './HomePage.css';

export default function HomePage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeRoleTab, setActiveRoleTab] = useState<'employee' | 'hr' | 'admin'>('employee');

  useEffect(() => {
    document.title = 'VisionHR — Hệ thống Quản trị Nhân sự & Chấm công AI';
  }, []);

  const roleLabels: Record<string, string> = {
    admin: 'Quản trị viên',
    hr: 'Nhân sự (HR)',
    manager: 'Quản lý',
    employee: 'Nhân viên',
  };

  const userRoleText = user?.role ? (roleLabels[user.role] || user.role) : '';

  return (
    <div className="vhr-simple-page">
      {/* ================= Top Navigation ================= */}
      <header className="vhr-simple-nav">
        <div className="vhr-nav-inner">
          <Link to="/" className="vhr-brand">
            <div className="vhr-brand-logo-sq">V</div>
            <div className="vhr-brand-info">
              <span className="vhr-brand-name">VisionHR</span>
              <span className="vhr-brand-tag">AI HRM System</span>
            </div>
          </Link>

          <nav className="vhr-nav-menu">
            <a href="#portals" className="vhr-menu-item">Cổng truy cập</a>
            <a href="#modules" className="vhr-menu-item">Chức năng</a>
            <a href="#workflow" className="vhr-menu-item">Quy trình</a>
            <a href="#tech" className="vhr-menu-item">Công nghệ</a>
          </nav>

          <div className="vhr-nav-right">
            <Link to="/attendance/terminal" className="vhr-nav-btn kiosk-btn">
              <Camera size={14} />
              <span>Kiosk</span>
            </Link>

            {isAuthenticated && user ? (
              <>
                <div className="vhr-user-pill">
                  <span className="vhr-user-name">{user.name}</span>
                  {userRoleText && <span className="vhr-user-role">{userRoleText}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="vhr-nav-btn primary-btn"
                >
                  <LayoutDashboard size={14} />
                  <span>Dashboard</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="vhr-nav-btn outline-btn"
                  title="Đăng xuất"
                >
                  <LogOut size={14} />
                  <span>Đăng xuất</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="vhr-nav-btn primary-btn">
                <LogIn size={14} />
                <span>Đăng nhập</span>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ================= Main Content Area ================= */}
      <main className="vhr-simple-main">
        {/* Hero Section */}
        <section className="vhr-welcome-header">
          {/* <div className="vhr-pill">Đồ án Tốt nghiệp • Nền tảng Quản trị Nhân sự & Chấm công Sinh trắc học AI</div> */}
          <h1 className="vhr-title">
            Giải Pháp Quản Trị Nhân Sự & Điểm Danh <br />
            <span className="vhr-gradient">Nhận Diện Khuôn Mặt AI Toàn Diện</span>
          </h1>
          <p className="vhr-subtitle">
            Hệ thống kết hợp thị giác máy tính chống giả mạo khuôn mặt (Liveness Detection), tự động hóa toàn chu trình
            xếp ca - duyệt phép - tính lương và tích hợp Trợ lý Trí tuệ Nhân tạo hỗ trợ chính sách 24/7.
          </p>
        </section>

        {/* 3 Main Quick Access Portals */}
        <section id="portals" className="vhr-portal-grid">
          {/* Card 1: Kiosk Attendance */}
          <div className="vhr-portal-card kiosk-card">
            <div className="vhr-card-icon-wrap kiosk-bg">
              <Camera size={26} />
            </div>
            <div className="vhr-card-tag">Điểm danh nhanh</div>
            <h2 className="vhr-card-title">Kiosk Chấm Công AI</h2>
            <p className="vhr-card-desc">
              Máy quét khuôn mặt trực tiếp qua camera, nhận diện tự động trong 0.3s, phát hiện người thật chống ảnh chụp/video và ghi nhận thời gian thực.
            </p>
            <div className="vhr-card-action">
              <Link to="/attendance/terminal" className="vhr-card-btn kiosk-action-btn">
                <span>Mở máy quét Kiosk</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Card 2: Management Portal */}
          <div className="vhr-portal-card dashboard-card">
            <div className="vhr-card-icon-wrap dashboard-bg">
              <LayoutDashboard size={26} />
            </div>
            <div className="vhr-card-tag">Quản trị & Nghiệp vụ</div>
            <h2 className="vhr-card-title">Cổng Quản Trị & Hồ Sơ</h2>
            <p className="vhr-card-desc">
              Bảng điều khiển tập trung: Quản lý hồ sơ nhân sự, phân bổ ca kíp, phê duyệt đơn nghỉ phép - tăng ca (OT), xuất báo cáo và chốt bảng lương.
            </p>
            <div className="vhr-card-action">
              {isAuthenticated ? (
                <Link to="/dashboard" className="vhr-card-btn primary-action-btn">
                  <span>Vào Bảng điều khiển</span>
                  <ArrowRight size={14} />
                </Link>
              ) : (
                <Link to="/login" className="vhr-card-btn primary-action-btn">
                  <span>Đăng nhập Quản trị</span>
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>

          {/* Card 3: AI HR Assistant */}
          <div className="vhr-portal-card ai-card">
            <div className="vhr-card-icon-wrap ai-bg">
              <Bot size={26} />
            </div>
            <div className="vhr-card-tag">Trợ lý ảo 24/7</div>
            <h2 className="vhr-card-title">Trợ Lý AI HR Agent</h2>
            <p className="vhr-card-desc">
              Mô hình AI RAG thông minh am hiểu quy chế làm việc công ty, chế độ thai sản, chính sách bảo hiểm và giải đáp thắc mắc lương thưởng tức thời.
            </p>
            <div className="vhr-card-action">
              <Link to={isAuthenticated ? "/ai-agent" : "/login"} className="vhr-card-btn ai-action-btn">
                <span>{isAuthenticated ? 'Mở Trợ lý AI HR' : 'Đăng nhập để chat AI'}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Highlights Strip */}
        <div className="vhr-feature-strip">
          <div className="vhr-feature-pill">
            <span className="vhr-feat-icon">
              <Zap size={20} color="#184a8c" />
            </span>
            <div>
              <strong>Nhận diện dưới 0.3s</strong>
              <small>Mã hóa Vector ArcFace 512-d</small>
            </div>
          </div>
          <div className="vhr-feature-pill">
            <span className="vhr-feat-icon">
              <ShieldCheck size={20} color="#10b981" />
            </span>
            <div>
              <strong>Chống giả mạo Liveness</strong>
              <small>Ngăn chặn ảnh điện thoại & video</small>
            </div>
          </div>
          <div className="vhr-feature-pill">
            <span className="vhr-feat-icon">
              <CalendarCheck size={20} color="#2563eb" />
            </span>
            <div>
              <strong>Tự động xếp ca & duyệt đơn</strong>
              <small>Đồng bộ thời gian thực vào bảng công</small>
            </div>
          </div>
          <div className="vhr-feature-pill">
            <span className="vhr-feat-icon">
              <CircleDollarSign size={20} color="#f59e0b" />
            </span>
            <div>
              <strong>Bảng lương minh bạch</strong>
              <small>Tính toán ngày công, OT chuẩn xác</small>
            </div>
          </div>
        </div>

        {/* ================= Core System Modules ================= */}
        <section id="modules" className="vhr-section-box">
          <div className="vhr-section-title-wrap">
            <span className="vhr-section-badge">HỆ THỐNG CHỨC NĂNG</span>
            <h2 className="vhr-section-h2">6 Phân Hệ Nghiệp Vụ Cốt Lõi Của VisionHR</h2>
            <p className="vhr-section-desc">
              Thiết kế theo chuẩn vận hành doanh nghiệp thực tế, khép kín từ khâu thu thập sinh trắc học đến hạch toán lương cuối tháng.
            </p>
          </div>

          <div className="vhr-modules-grid">
            <div className="vhr-module-item">
              <div className="vhr-module-head">
                <span className="vhr-module-icon">
                  <Users size={20} color="#184a8c" />
                </span>
                <h3>Quản Lý Nhân Sự & Sinh Trắc Học</h3>
              </div>
              <p>
                Quản lý hồ sơ nhân viên, sơ đồ phòng ban, chức vụ, hợp đồng. Tích hợp chức năng <strong>Face Enrollment</strong> chụp ảnh gốc trực tiếp và kiểm tra không trùng lặp khuôn mặt.
              </p>
              <ul className="vhr-module-bullets">
                <li>Đăng ký và lưu trữ vector khuôn mặt bảo mật</li>
                <li>Phân quyền theo phòng ban & chức danh</li>
                <li>Tạo tài khoản và gửi liên kết kích hoạt qua email</li>
              </ul>
            </div>

            <div className="vhr-module-item">
              <div className="vhr-module-head">
                <span className="vhr-module-icon">
                  <Clock size={20} color="#184a8c" />
                </span>
                <h3>Quản Lý Ca Làm & Lịch Trực</h3>
              </div>
              <p>
                Định nghĩa linh hoạt các loại ca (Ca sáng, Ca chiều, Ca đêm, Ca hành chính). Cho phép phân bổ ca làm việc theo tuần cho từng phòng ban hoặc cá nhân.
              </p>
              <ul className="vhr-module-bullets">
                <li>Cấu hình khung giờ vào/ra và dung sai đi trễ</li>
                <li>Hỗ trợ xoay ca và đổi ca linh hoạt</li>
                <li>Tự động đối soát ca khi nhân viên điểm danh</li>
              </ul>
            </div>

            <div className="vhr-module-item">
              <div className="vhr-module-head">
                <span className="vhr-module-icon">
                  <Camera size={20} color="#184a8c" />
                </span>
                <h3>Chấm Công AI & Điểm Danh Realtime</h3>
              </div>
              <p>
                Kiosk điểm danh độc lập: Nhân viên chỉ cần nhìn vào camera để xác thực. Tự động phân loại trạng thái đúng giờ, đi muộn, về sớm hoặc vắng mặt.
              </p>
              <ul className="vhr-module-bullets">
                <li>Nhận diện khuôn mặt 1:N tức thì dưới 0.3s</li>
                <li>Thuật toán Liveness chống gian lận ảnh/video</li>
                <li>Hỗ trợ chấm công bổ sung cho HR khi có sự cố</li>
              </ul>
            </div>

            <div className="vhr-module-item">
              <div className="vhr-module-head">
                <span className="vhr-module-icon">
                  <FileText size={20} color="#184a8c" />
                </span>
                <h3>Nghỉ Phép & Làm Thêm Giờ (OT)</h3>
              </div>
              <p>
                Số hóa 100% quy trình giấy tờ: Nhân viên tạo đơn nghỉ phép hoặc đăng ký làm thêm giờ trực tuyến; Quản lý/HR phê duyệt tức thì kèm lý do.
              </p>
              <ul className="vhr-module-bullets">
                <li>Theo dõi quỹ ngày phép năm còn lại</li>
                <li>Phê duyệt đơn 2 cấp minh bạch, cập nhật tức thì</li>
                <li>Tự động ghi nhận giờ OT được duyệt vào bảng lương</li>
              </ul>
            </div>

            <div className="vhr-module-item">
              <div className="vhr-module-head">
                <span className="vhr-module-icon">
                  <CircleDollarSign size={20} color="#184a8c" />
                </span>
                <h3>Bảng Công & Tự Động Tính Lương</h3>
              </div>
              <p>
                Hệ thống tự động liên kết dữ liệu chấm công thực tế, đơn nghỉ phép hợp lệ và số giờ OT được duyệt để lập bảng lương tháng chi tiết.
              </p>
              <ul className="vhr-module-bullets">
                <li>Công thức tính minh bạch: Lương cơ bản + Phụ cấp + Tiền OT</li>
                <li>Trừ công đi muộn/về sớm theo đúng quy chế</li>
                <li>Xem chi tiết phiếu lương cá nhân và xuất báo cáo</li>
              </ul>
            </div>

            <div className="vhr-module-item">
              <div className="vhr-module-head">
                <span className="vhr-module-icon">
                  <BarChart3 size={20} color="#184a8c" />
                </span>
                <h3>Báo Cáo Thống Kê & Nhật Ký Kiểm Toán</h3>
              </div>
              <p>
                Dashboard phân tích chỉ số nhân sự: Tỷ lệ chuyên cần, biểu đồ đi muộn theo phòng ban và hệ thống <strong>Audit Log</strong> theo dõi mọi thao tác dữ liệu.
              </p>
              <ul className="vhr-module-bullets">
                <li>Biểu đồ trực quan tỷ lệ đi làm theo ngày/tháng</li>
                <li>Lưu vết thao tác người dùng (Audit Trail) chống gian lận</li>
                <li>Hỗ trợ xuất file báo cáo phục vụ kiểm toán nội bộ</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ================= Workflow & Roles ================= */}
        <section id="workflow" className="vhr-section-box">
          <div className="vhr-section-title-wrap">
            <span className="vhr-section-badge">QUY TRÌNH VẬN HÀNH</span>
            <h2 className="vhr-section-h2">Quy Trình Hoạt Động Theo Từng Vai Trò</h2>
            <p className="vhr-section-desc">
              Phân quyền thông minh 4 cấp bậc giúp tối ưu hóa trách nhiệm và quyền hạn trong vận hành thực tế.
            </p>
          </div>

          {/* Role selector tabs */}
          <div className="vhr-role-tabs">
            <button
              type="button"
              className={`vhr-role-tab ${activeRoleTab === 'employee' ? 'active' : ''}`}
              onClick={() => setActiveRoleTab('employee')}
            >
              <User size={15} /> <span>Dành cho Nhân viên</span>
            </button>
            <button
              type="button"
              className={`vhr-role-tab ${activeRoleTab === 'hr' ? 'active' : ''}`}
              onClick={() => setActiveRoleTab('hr')}
            >
              <Briefcase size={15} /> <span>Dành cho Quản lý & HR</span>
            </button>
            <button
              type="button"
              className={`vhr-role-tab ${activeRoleTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveRoleTab('admin')}
            >
              <Shield size={15} /> <span>Dành cho Quản trị viên (Admin)</span>
            </button>
          </div>

          <div className="vhr-role-content">
            {activeRoleTab === 'employee' && (
              <div className="vhr-role-panel">
                <div className="vhr-flow-steps">
                  <div className="vhr-flow-step">
                    <span className="vhr-flow-num">1</span>
                    <h4>Đăng ký khuôn mặt gốc</h4>
                    <p>HR hỗ trợ chụp khuôn mặt gốc ban đầu, hệ thống tạo mã nhận dạng sinh trắc học duy nhất.</p>
                  </div>
                  <div className="vhr-flow-step">
                    <span className="vhr-flow-num">2</span>
                    <h4>Quét mặt Kiosk mỗi ngày</h4>
                    <p>Đứng trước camera Kiosk để check-in ca sáng và check-out ca chiều, xác thực thành công trong 0.3s.</p>
                  </div>
                  <div className="vhr-flow-step">
                    <span className="vhr-flow-num">3</span>
                    <h4>Xem bảng công & Gửi đơn online</h4>
                    <p>Đăng nhập vào hệ thống để tra cứu giờ làm, nộp đơn xin nghỉ phép hoặc đăng ký tăng ca (OT).</p>
                  </div>
                  <div className="vhr-flow-step">
                    <span className="vhr-flow-num">4</span>
                    <h4>Hỏi đáp Trợ lý AI HR</h4>
                    <p>Trò chuyện với AI để tra cứu ngày phép còn lại, chính sách thai sản, bảo hiểm và nội quy làm việc.</p>
                  </div>
                </div>
              </div>
            )}

            {activeRoleTab === 'hr' && (
              <div className="vhr-role-panel">
                <div className="vhr-flow-steps">
                  <div className="vhr-flow-step">
                    <span className="vhr-flow-num">1</span>
                    <h4>Tiếp nhận nhân sự & Xếp ca</h4>
                    <p>Thêm thông tin nhân viên mới, phân bổ vào phòng ban và sắp xếp ca làm việc hàng tuần.</p>
                  </div>
                  <div className="vhr-flow-step">
                    <span className="vhr-flow-num">2</span>
                    <h4>Giám sát chấm công thời gian thực</h4>
                    <p>Theo dõi danh sách ai đã đến đúng giờ, ai đi muộn hoặc vắng mặt trên Dashboard trực tiếp.</p>
                  </div>
                  <div className="vhr-flow-step">
                    <span className="vhr-flow-num">3</span>
                    <h4>Phê duyệt đơn phép & Tăng ca</h4>
                    <p>Xem xét và bấm duyệt hoặc từ chối các yêu cầu nghỉ phép, làm thêm giờ kèm lý do rõ ràng.</p>
                  </div>
                  <div className="vhr-flow-step">
                    <span className="vhr-flow-num">4</span>
                    <h4>Tổng hợp & Kết toán bảng lương</h4>
                    <p>Tự động hóa tính công và tiền lương cuối tháng, xuất báo cáo đối soát nhanh chóng, chính xác.</p>
                  </div>
                </div>
              </div>
            )}

            {activeRoleTab === 'admin' && (
              <div className="vhr-role-panel">
                <div className="vhr-flow-steps">
                  <div className="vhr-flow-step">
                    <span className="vhr-flow-num">1</span>
                    <h4>Quản lý tài khoản & Phân quyền</h4>
                    <p>Tạo tài khoản người dùng, cấp quyền truy cập theo 4 vai trò (Admin, HR, Manager, Employee).</p>
                  </div>
                  <div className="vhr-flow-step">
                    <span className="vhr-flow-num">2</span>
                    <h4>Cấu hình phòng ban & Tham số</h4>
                    <p>Thiết lập danh mục phòng ban, chức vụ, quy định giờ làm việc và quy chế phạt đi trễ/thưởng OT.</p>
                  </div>
                  <div className="vhr-flow-step">
                    <span className="vhr-flow-num">3</span>
                    <h4>Giám sát an ninh qua Audit Log</h4>
                    <p>Truy vết toàn bộ nhật ký hệ thống: Ai đã đăng nhập, ai sửa đổi giờ công, ai xóa hoặc duyệt đơn.</p>
                  </div>
                  <div className="vhr-flow-step">
                    <span className="vhr-flow-num">4</span>
                    <h4>Vận hành & Sao lưu dữ liệu</h4>
                    <p>Đảm bảo dịch vụ AI Python và máy chủ cơ sở dữ liệu hoạt động ổn định và sẵn sàng cao.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ================= Core Tech Stack ================= */}
        <section id="tech" className="vhr-section-box">
          <div className="vhr-section-title-wrap">
            <span className="vhr-section-badge">CÔNG NGHỆ ÁP DỤNG</span>
            <h2 className="vhr-section-h2">Kiến Trúc Công Nghệ & Trí Tuệ Nhân Tạo</h2>
            <p className="vhr-section-desc">
              Xây dựng trên nền tảng hiện đại, đảm bảo tốc độ phản hồi cao, tính chịu tải và độ chính xác sinh trắc học vượt trội.
            </p>
          </div>

          <div className="vhr-tech-grid">
            <div className="vhr-tech-card">
              <div className="vhr-tech-header">
                <span className="vhr-tech-badge">Deep Learning</span>
                <h3>FaceNet — Trích Xuất Vector Khuôn Mặt</h3>
              </div>
              <p>
                Sử dụng mạng nơ-ron sâu <strong>FaceNet</strong> để trích xuất đặc trưng hình học bất biến của khuôn mặt thành vector 128/512 chiều chuẩn hóa, ghi nhận chính xác danh tính nhân viên.
              </p>
            </div>

            <div className="vhr-tech-card">
              <div className="vhr-tech-header">
                <span className="vhr-tech-badge">Vector Matching</span>
                <h3>Face Matching — So Khớp Danh Tính 1:N</h3>
              </div>
              <p>
                So khớp vector đặc trưng theo độ tương đồng <strong>Cosine Similarity</strong> giữa khuôn mặt quét tại Kiosk và hồ sơ nhân viên trong cơ sở dữ liệu, tự động cảnh báo trùng lặp và xác thực dưới 0.5 giây.
              </p>
            </div>

            <div className="vhr-tech-card">
              <div className="vhr-tech-header">
                <span className="vhr-tech-badge">Anti-Spoofing</span>
                <h3>Liveness Detection — Kiểm Tra Thực Thể Sống</h3>
              </div>
              <p>
                Thuật toán chống giả mạo sinh trắc học phân tích kết cấu vi mô và chuyển động tự nhiên để ngăn chặn gian lận qua ảnh in, màn hình điện thoại hay video phát lại khi điểm danh.
              </p>
            </div>

            <div className="vhr-tech-card">
              <div className="vhr-tech-header">
                <span className="vhr-tech-badge">Full-Stack Architecture</span>
                <h3>Kiến Trúc Microservice Đa Tầng</h3>
              </div>
              <p>
                Frontend xây dựng bằng <strong>React 18 + Vite + TypeScript</strong>. Backend gồm <strong>Node.js/Express</strong> xử lý nghiệp vụ HRM, kết hợp service <strong>Python/FastAPI</strong> chuyên xử lý ảnh AI và cơ sở dữ liệu <strong>MySQL</strong> an toàn.
              </p>
            </div>
          </div>
        </section>

        {/* Project Metadata Banner */}
        <div className="vhr-project-banner">
          <div className="vhr-project-info">
            <span className="vhr-project-tag">ĐỒ ÁN TỐT NGHIỆP CÔNG NGHỆ THÔNG TIN</span>
            <h3>Hệ Thống Quản Trị Nhân Sự & Chấm Công Sinh Trắc Học VisionHR</h3>
            <p>
              Đồ án nghiên cứu và phát triển giải pháp số hóa quản trị nhân lực kết hợp Trí tuệ Nhân tạo & Thị giác Máy tính thời gian thực.
            </p>
          </div>
          <div className="vhr-project-actions">
            <Link to="/attendance/terminal" className="vhr-btn-project-kiosk">
              <Camera size={15} />
              <span>Mở Kiosk Điểm Danh</span>
            </Link>
            {isAuthenticated ? (
              <Link to="/dashboard" className="vhr-btn-project-dash">
                <span>Vào Dashboard Quản Trị</span>
                <ArrowRight size={15} />
              </Link>
            ) : (
              <Link to="/login" className="vhr-btn-project-dash">
                <span>Đăng Nhập Hệ Thống</span>
                <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </div>
      </main>

      {/* ================= Simple Footer ================= */}
      <footer className="vhr-simple-footer">
        <div className="vhr-footer-inner">
          <div className="vhr-footer-left">
            <span>© {new Date().getFullYear()} <strong>VisionHR</strong> — Đồ án Tốt nghiệp Hệ thống Quản trị Nhân sự & Chấm công AI.</span>
          </div>
          <div className="vhr-footer-links">
            <a href="#portals">Cổng truy cập</a>
            <span className="vhr-divider">•</span>
            <a href="#modules">Phân hệ chức năng</a>
            <span className="vhr-divider">•</span>
            <a href="#workflow">Quy trình</a>
            <span className="vhr-divider">•</span>
            <a href="#tech">Công nghệ AI</a>
            <span className="vhr-divider">•</span>
            <Link to="/attendance/terminal">Kiosk Chấm công</Link>
            <span className="vhr-divider">•</span>
            {isAuthenticated ? (
              <Link to="/dashboard">Dashboard</Link>
            ) : (
              <Link to="/login">Đăng nhập</Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
