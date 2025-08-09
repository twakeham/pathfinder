import React, { useState } from 'react';

const Register = ({ onRegistered, onShowLogin }) => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    inviteCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const hasInvite = form.inviteCode.trim().length > 0;
    const url = hasInvite ? '/api/auth/invite/register/' : '/api/auth/register/';
    const body = hasInvite
      ? { code: form.inviteCode.trim(), email: form.email.trim(), username: form.username.trim(), password: form.password }
      : {
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
        };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = Array.isArray(data?.detail) ? data.detail.join('\n') : (data?.detail || 'Registration failed');
        throw new Error(detail);
      }

      if (hasInvite) {
        const active = !!data?.is_active;
        setSuccess(active
          ? 'Registration successful. You can now sign in.'
          : 'Registration submitted. Await admin approval before signing in.');
      } else {
        setSuccess('Registration submitted. Await admin approval before signing in.');
      }

      onRegistered?.();
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const Title = () => (
    <h1 style={{ color: '#e5e7eb', letterSpacing: 4, fontWeight: 800, marginBottom: 16 }}>
      <span style={{ color: '#60a5fa' }}>PATH</span>FINDER
    </h1>
  );

  const Card = ({ children, title }) => (
    <div style={{ maxWidth: 480, width: '92%', background: '#111827', color: '#e5e7eb', margin: '12px auto', padding: 24, borderRadius: 14, border: '1px solid #1f2937', boxShadow: '0 10px 30px rgba(0,0,0,0.35)', textAlign: 'left' }}>
      <h2 style={{ marginBottom: 6 }}>{title}</h2>
      <p style={{ marginTop: 0, marginBottom: 16, color: '#9ca3af', fontSize: 12 }}>Provide an invite code if you received one.</p>
      {children}
    </div>
  );

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #374151', background: '#0b1220', color: '#e5e7eb', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, textAlign: 'left' };
  const buttonPrimary = { width: '100%', padding: '10px 12px', borderRadius: 8, background: '#2563eb', color: 'white', border: 'none' };
  const linkStyle = { background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer' };

  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: 16 }}>
      <Title />

      <Card title="Create an account">
        {error && <div style={{ color: '#fca5a5', marginBottom: 12 }}>{error}</div>}
        {success && <div style={{ color: '#6ee7b7', marginBottom: 12 }}>{success}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="inviteCode" style={labelStyle}>Invite code (optional)</label>
            <input id="inviteCode" type="text" value={form.inviteCode} onChange={update('inviteCode')} placeholder="Paste invite code" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label htmlFor="first_name" style={labelStyle}>First name</label>
              <input id="first_name" type="text" value={form.first_name} onChange={update('first_name')} placeholder="Jane" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="last_name" style={labelStyle}>Last name</label>
              <input id="last_name" type="text" value={form.last_name} onChange={update('last_name')} placeholder="Doe" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label htmlFor="username" style={labelStyle}>Username</label>
            <input id="username" type="text" value={form.username} onChange={update('username')} placeholder="janedoe" style={inputStyle} required />
          </div>
          <div style={{ marginTop: 12 }}>
            <label htmlFor="email" style={labelStyle}>Email</label>
            <input id="email" type="email" value={form.email} onChange={update('email')} placeholder="jane@example.com" style={inputStyle} required />
          </div>
          <div style={{ marginTop: 12, marginBottom: 16 }}>
            <label htmlFor="password" style={labelStyle}>Password</label>
            <input id="password" type="password" value={form.password} onChange={update('password')} placeholder="••••••••" style={inputStyle} required />
          </div>
          <button type="submit" disabled={loading} style={buttonPrimary}>
            {loading ? 'Submitting…' : 'Create account'}
          </button>
        </form>
        <div style={{ marginTop: 12, fontSize: 14 }}>
          <button type="button" onClick={onShowLogin} style={linkStyle}>
            Back to sign in
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Register;
