import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi } from '../../services/authApi';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/Button/Button';

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
      setError(err?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
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
        background: 'linear-gradient(135deg, #eef2ff, #f5f7fb)',
        padding: 16,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 380,
          background: '#ffffff',
          borderRadius: 12,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e5e7eb',
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h1 style={{ margin: 0, color: '#2563eb', fontSize: 26, fontWeight: 800 }}>VisionHR</h1>
        <p style={{ color: '#6b7280', margin: '4px 0 20px 0', fontSize: 14 }}>
          Đăng nhập vào hệ thống quản trị nhân sự
        </p>

        <label style={{ fontSize: 13, fontWeight: 600, margin: '12px 0 4px 0', color: '#374151' }}>
          Email
        </label>
        <input
          style={{
            padding: '10px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            fontSize: 14,
            outline: 'none',
          }}
          type="email"
          placeholder="admin@visionhr.vn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label style={{ fontSize: 13, fontWeight: 600, margin: '12px 0 4px 0', color: '#374151' }}>
          Mật khẩu
        </label>
        <input
          style={{
            padding: '10px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            fontSize: 14,
            outline: 'none',
          }}
          type="password"
          placeholder="••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p style={{ color: '#dc2626', fontSize: 13, margin: '10px 0 0 0', fontWeight: 500 }}>
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading} style={{ marginTop: 24, justifyContent: 'center' }}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>
    </div>
  );
}
