import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Đăng nhập không thành công. Vui lòng kiểm tra lại tên đăng nhập hoặc mật khẩu.'
      );
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (user: string) => {
    setUsername(user);
    setPassword('Admin@123');
  };

  const sampleAccounts = [
    { label: 'Admin', user: 'admin',           role: 'Quản trị viên',     color: '#f97316' },
    { label: 'Giám đốc', user: 'nguyen.giamdoc', role: 'Giám đốc',       color: '#3b82f6' },
    { label: 'P. Giám đốc', user: 'tran.phogd', role: 'Phó Giám đốc',    color: '#8b5cf6' },
    { label: 'Kế toán',  user: 'le.ketoan',    role: 'Kế toán trưởng',    color: '#10b981' },
    { label: 'Chỉ huy',  user: 'pham.chihuy',  role: 'Chỉ huy trưởng',   color: '#f59e0b' },
    { label: 'KS Dự toán', user: 'hoang.dutoan', role: 'Kỹ sư Dự toán',  color: '#06b6d4' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: `
        radial-gradient(ellipse 70% 70% at 20% 10%, rgba(59,130,246,0.08) 0%, transparent 50%),
        radial-gradient(ellipse 60% 60% at 80% 90%, rgba(249,115,22,0.07) 0%, transparent 50%),
        #060d1a
      `,
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Decorative background orbs */}
      <div style={{
        position: 'absolute', top: '-100px', right: '-100px',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-80px', left: '-80px',
        width: '350px', height: '350px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Login Card */}
      <div style={{
        width: '100%', maxWidth: '440px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-strong)',
        borderRadius: '24px',
        padding: '36px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset',
        position: 'relative',
        animation: 'modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>

        {/* Top shine */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '60%', height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.4), transparent)',
        }} />

        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '52px', height: '52px',
            background: 'linear-gradient(135deg, #f97316, #c2410c)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 8px 24px rgba(249,115,22,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            fontSize: '1rem', fontWeight: 900, color: 'white',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.5px',
          }}>
            BMC
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.02em' }}>
            Đăng Nhập Hệ Thống
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.5 }}>
            Hệ thống Quản trị Dự án, Dự toán &amp; Kiểm soát Chi phí
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="alert-strip error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tên đăng nhập</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ padding: '11px', marginTop: '8px', fontSize: '0.9rem' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px' }} />
                Đang xác thực...
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                Đăng nhập vào Hệ thống
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Quick login */}
        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-faint)' }}>
          <div style={{
            fontSize: '0.65rem', color: 'var(--text-dim)',
            marginBottom: '10px', textTransform: 'uppercase',
            fontWeight: 700, letterSpacing: '1.2px',
          }}>
            Chọn nhanh tài khoản kiểm thử
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
            {sampleAccounts.map((acc) => {
              const isActive = username === acc.user;
              return (
                <button
                  key={acc.user}
                  type="button"
                  onClick={() => quickLogin(acc.user)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '8px',
                    border: `1px solid ${isActive ? acc.color : 'var(--border-card)'}`,
                    background: isActive
                      ? `${acc.color}18`
                      : 'rgba(255,255,255,0.03)',
                    color: isActive ? acc.color : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    textAlign: 'center',
                    lineHeight: 1.3,
                  }}
                >
                  <div>{acc.label}</div>
                  <div style={{ fontSize: '0.6rem', opacity: 0.7, marginTop: '1px' }}>{acc.role}</div>
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-dim)' }}>
            Mật khẩu mặc định: <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Admin@123</span>
          </div>
        </div>
      </div>
    </div>
  );
};
