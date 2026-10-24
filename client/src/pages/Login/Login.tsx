import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, Camera, ArrowLeft } from 'lucide-react';
import { login as loginApi } from '../../services/authApi';
import { useAuthStore } from '../../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user, token } = await loginApi({ email, password });
      login(user, token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f4f9 0%, #f8fafc 50%, #edf2f8 100%)',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 10px 30px -5px rgba(24, 74, 140, 0.12), 0 4px 6px -2px rgba(24, 74, 140, 0.04)',
          border: '1px solid #e2e8f0',
          padding: '36px 32px',
        }}
      >
        {/* Brand header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#184a8c',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 20,
              boxShadow: '0 4px 10px rgba(24, 74, 140, 0.3)',
              flexShrink: 0,
            }}
          >
            V
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h1 style={{ margin: 0, color: '#184a8c', fontSize: 22, fontWeight: 800, letterSpacing: -0.4 }}>
                VisionHR
              </h1>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: '#eff6ff',
                  color: '#184a8c',
                  border: '1px solid #bfdbfe',
                }}
              >
                AI HRM
              </span>
            </div>
            <p style={{ color: '#64748b', margin: '2px 0 0 0', fontSize: 13 }}>
              Đăng nhập vào hệ thống quản trị nhân sự
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#334155' }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  pointerEvents: 'none',
                }}
              />
              <input
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px 10px 38px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 13.5,
                  outline: 'none',
                  background: '#f8fafc',
                  color: '#0f172a',
                  transition: 'all 0.15s ease',
                }}
                onFocus={(e) => {
                  e.target.style.background = '#ffffff';
                  e.target.style.borderColor = '#184a8c';
                  e.target.style.boxShadow = '0 0 0 3px rgba(24, 74, 140, 0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.background = '#f8fafc';
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
                type="email"
                placeholder="admin@visionhr.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#334155' }}>
              Mật khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  pointerEvents: 'none',
                }}
              />
              <input
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px 10px 38px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 13.5,
                  outline: 'none',
                  background: '#f8fafc',
                  color: '#0f172a',
                  transition: 'all 0.15s ease',
                }}
                onFocus={(e) => {
                  e.target.style.background = '#ffffff';
                  e.target.style.borderColor = '#184a8c';
                  e.target.style.boxShadow = '0 0 0 3px rgba(24, 74, 140, 0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.background = '#f8fafc';
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                color: '#b91c1c',
                background: '#fef2f2',
                border: '1px solid #fecdd3',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 12.5,
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              padding: '11px 16px',
              borderRadius: 8,
              background: '#184a8c',
              color: '#ffffff',
              border: 'none',
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 2px 6px rgba(24, 74, 140, 0.3)',
              transition: 'all 0.15s ease',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#153e77';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = '#184a8c';
            }}
          >
            <LogIn size={16} />
            <span>{loading ? 'Đang xác thực...' : 'Đăng nhập'}</span>
          </button>

          <div
            style={{
              marginTop: 10,
              paddingTop: 16,
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13,
            }}
          >
            <Link
              to="/"
              style={{
                color: '#184a8c',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <ArrowLeft size={14} />
              <span>Về trang chủ</span>
            </Link>
            <Link
              to="/attendance/terminal"
              style={{
                color: '#059669',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Camera size={14} />
              <span>Kiosk Chấm công</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
