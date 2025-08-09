import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Extracted out to keep stable identities across renders
const Title = () => (
  <h1 style={{ color: '#e5e7eb', letterSpacing: 4, fontWeight: 800, marginBottom: 16 }}>
    <span style={{ color: '#60a5fa' }}>PATH</span>FINDER
  </h1>
);

const Card = ({ children, title, titleAlign = 'left' }) => (
  <div style={{ maxWidth: 420, width: '92%', background: '#111827', color: '#e5e7eb', margin: '12px auto', padding: 24, borderRadius: 14, border: '1px solid #1f2937', boxShadow: '0 10px 30px rgba(0,0,0,0.35)', textAlign: 'left' }}>
    <h2 style={{ marginBottom: 16, textAlign: titleAlign }}>{title}</h2>
    {children}
  </div>
);

const Login = ({ onLogin, onShowRegister }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'requestReset' | 'performReset'

  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Reset request state
  const [email, setEmail] = useState('');
  const [devCode, setDevCode] = useState('');

  // Reset perform state
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail = data?.detail || 'Invalid credentials';
        throw new Error(detail);
      }

      const tokens = await res.json();
      if (typeof onLogin === 'function') {
        onLogin(tokens);
        navigate('/');
      } else {
        try {
          localStorage.setItem('access', tokens.access);
          localStorage.setItem('refresh', tokens.refresh);
        } catch {}
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset/request/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: (email || '').trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.detail || 'Unable to request reset');
      }
      setSuccess(data?.detail || 'If the email exists, a reset link has been sent.');
      if (data?.code) {
        setDevCode(data.code); // helpful for local dev/testing
        setResetCode(data.code);
      }
    } catch (err) {
      setError(err.message || 'Unable to request reset');
    } finally {
      setLoading(false);
    }
  };

  const handlePerformReset = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset/perform/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: (resetCode || '').trim(), password: newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(Array.isArray(data?.detail) ? data.detail.join('\n') : (data?.detail || 'Unable to reset password'));
      }
      setSuccess(data?.detail || 'Password has been reset. You can now sign in.');
      // After success, clear fields and switch to login after a short delay
      setTimeout(() => {
        setMode('login');
        setPassword('');
        setNewPassword('');
        setResetCode('');
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #374151', background: '#0b1220', color: '#e5e7eb', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, textAlign: 'left' };
  const buttonPrimary = { width: '100%', padding: '10px 12px', borderRadius: 8, background: '#2563eb', color: 'white', border: 'none' };
  const linkStyle = { background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer' };

  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: 16 }}>
      <Title />

      {mode === 'login' && (
        <Card title="Sign in" titleAlign="center">
          {error && (<div style={{ color: '#fca5a5', marginBottom: 12 }}>{error}</div>)}
          {success && (<div style={{ color: '#6ee7b7', marginBottom: 12 }}>{success}</div>)}
          <form onSubmit={handleSubmitLogin}>
            <div style={{ marginBottom: 12 }}>
              <label htmlFor="username" style={labelStyle}>Username</label>
              <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your username" style={inputStyle} autoComplete="username" required />
            </div>

            {/* Password label row with right-aligned forgot link */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
              <label htmlFor="password" style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
              <button
                type="button"
                onClick={() => { resetMessages(); setMode('requestReset'); }}
                style={{ ...linkStyle, fontSize: 12 }}
              >
                Forgot password?
              </button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} autoComplete="current-password" required />
            </div>

            <button type="submit" disabled={loading} style={buttonPrimary}>{loading ? 'Signing in…' : 'Sign in'}</button>

            {/* Centered create account link under button */}
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', fontSize: 14 }}>
              <button type="button" onClick={onShowRegister} style={linkStyle}>Create an account</button>
            </div>
          </form>
        </Card>
      )}

      {mode === 'requestReset' && (
        <Card title="Reset password">
          {error && (<div style={{ color: '#fca5a5', marginBottom: 12 }}>{error}</div>)}
          {success && (
            <div style={{ color: '#6ee7b7', marginBottom: 12 }}>
              {success}
              {devCode && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#93c5fd' }}>
                  Dev code: <code>{devCode}</code>
                </div>
              )}
            </div>
          )}
          <form onSubmit={handleRequestReset}>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="email" style={labelStyle}>Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} required />
            </div>
            <button type="submit" disabled={loading} style={buttonPrimary}>{loading ? 'Sending…' : 'Send reset link'}</button>
          </form>
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <button type="button" onClick={() => setMode('performReset')} style={linkStyle}>Have a reset code?</button>
            <button type="button" onClick={() => setMode('login')} style={linkStyle}>Back to sign in</button>
          </div>
        </Card>
      )}

      {mode === 'performReset' && (
        <Card title="Enter reset code">
          {error && (<div style={{ color: '#fca5a5', marginBottom: 12 }}>{error}</div>)}
          {success && (<div style={{ color: '#6ee7b7', marginBottom: 12 }}>{success}</div>)}
          <form onSubmit={handlePerformReset}>
            <div style={{ marginBottom: 12 }}>
              <label htmlFor="resetCode" style={labelStyle}>Reset code</label>
              <input id="resetCode" type="text" value={resetCode} onChange={(e) => setResetCode(e.target.value)} placeholder="Paste code" style={inputStyle} required />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="newPassword" style={labelStyle}>New password</label>
              <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" style={inputStyle} required />
            </div>
            <button type="submit" disabled={loading} style={buttonPrimary}>{loading ? 'Updating…' : 'Reset password'}</button>
          </form>
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <button type="button" onClick={() => setMode('requestReset')} style={linkStyle}>Request a code</button>
            <button type="button" onClick={() => setMode('login')} style={linkStyle}>Back to sign in</button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Login;
