import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { Mail, Lock, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../api';

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await authApi.forgotPassword(email);
      setSuccess(response.data.message);
    } catch (err) {
      setError(err.response?.data?.detail || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await authApi.resetPassword(token, newPassword);
      setSuccess(response.data.message);
    } catch (err) {
      setError(err.response?.data?.detail || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, #1e1b4b, #020617)',
      padding: '1rem'
    }}>
      <Motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}
      >
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            color: '#6366f1', 
            fontSize: '0.875rem',
            textDecoration: 'none',
            marginBottom: '1.5rem'
          }}>
            <ArrowLeft size={16} />
            Kembali ke Login
          </Link>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            {token ? 'Reset Password' : 'Lupa Password'}
          </h2>
          <p style={{ color: '#94a3b8' }}>
            {token 
              ? 'Masukkan password baru di bawah' 
              : 'Masukkan email untuk menerima link reset'}
          </p>
        </div>

        {error && (
          <div style={{ 
            padding: '0.75rem', 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '0.875rem',
            marginBottom: '1.5rem'
          }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: '#10b981', fontWeight: '600', marginBottom: '1.5rem' }}>{success}</p>
            <Link to="/" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
              Ke Halaman Login
            </Link>
          </div>
        ) : (
          <form onSubmit={token ? handleResetPassword : handleRequestReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {!token ? (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Alamat Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input 
                    type="email" 
                    className="form-control" 
                    style={{ paddingLeft: '40px' }}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Password Baru</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input 
                      type="password" 
                      className="form-control" 
                      style={{ paddingLeft: '40px' }}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Konfirmasi Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input 
                      type="password" 
                      className="form-control" 
                      style={{ paddingLeft: '40px' }}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required 
                    />
                  </div>
                </div>
              </>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', marginTop: '1rem' }}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (token ? 'Perbarui Password' : 'Kirim Link Reset')}
            </button>
          </form>
        )}
      </Motion.div>
    </div>
  );
};

export default ForgotPassword;
